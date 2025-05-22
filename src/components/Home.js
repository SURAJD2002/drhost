
// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch, FaHome, FaList, FaUser } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching user role. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch user role.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [session]);

//   // Fetch nearby products (without login dependency)
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access or log in.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         stock: product.stock || 0,
//       }));
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch products.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching banner images. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to load banner images.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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
//       // Simplified SELECT query to avoid potential issues
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .maybeSingle();

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//           autoClose: 2000,
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
//           autoClose: 2000,
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else if (err.code === '406') {
//         toast.error('Unable to check cart due to a server error. Please try again.', {
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
//   }, [navigate, session]);

//   // Buy now (add to cart and navigate to cart page)
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 2000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [navigate, session]);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
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
//               autoClose: 5000,
//             });
//             setLoadingProducts(false);
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//         setLoadingProducts(false);
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners) return (
//     <div className="loading-container">
//       <div className="loading-animation">
//         <div className="loading-box">
//           <FaShoppingCart className="loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="home">
//       <ToastContainer />
      
//       {/* Sticky Search Bar */}
//       <div className="search-bar sticky">
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           aria-label="Search products"
//         />
//       </div>

//       {/* Banner Slider */}
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <Link key={banner.name} to={`/product/${banner.name}`} aria-label={`Banner ${banner.name}`}>
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//               </Link>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="product-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-buttons">
//                   <div className="skeleton-btn" />
//                   <div className="skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className="product-grid">
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
//               >
//                 <div className="product-image-wrapper">
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-name">{product.name}</h3>
//                   <p className="product-price">
//                     ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                   <div className="product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="add-to-cart-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="buy-now-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch, FaHome, FaList, FaUser } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching user role. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch user role.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [session]);

//   // Fetch nearby products (without login dependency)
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access or log in.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//       }));
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch products.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching banner images. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to load banner images.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//           autoClose: 2000,
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
//           autoClose: 2000,
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else if (err.code === '406') {
//         toast.error('Unable to check cart due to a server error. Please try again.', {
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
//   }, [navigate, session]);

//   // Buy now (add to cart and navigate to cart page)
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 2000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [navigate, session]);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
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
//               autoClose: 5000,
//             });
//             setLoadingProducts(false);
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//         setLoadingProducts(false);
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners) return (
//     <div className="loading-container">
//       <div className="loading-animation">
//         <div className="loading-box">
//           <FaShoppingCart className="loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="home">
//       <ToastContainer />
      
//       {/* Sticky Search Bar */}
//       <div className="search-bar sticky">
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           aria-label="Search products"
//         />
//       </div>

//       {/* Banner Slider */}
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <Link key={banner.name} to={`/product/${banner.name}`} aria-label={`Banner ${banner.name}`}>
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//               </Link>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="product-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-buttons">
//                   <div className="skeleton-btn" />
//                   <div className="skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className="product-grid">
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
//               >
//                 <div className="product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="offer-badge">Save ₹{product.discountAmount.toFixed(2)}</span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="add-to-cart-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="buy-now-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch, FaHome, FaList, FaUser } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching user role. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch user role.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [session]);

//   // Fetch nearby products (without login dependency)
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access or log in.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//       }));
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch products.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching banner images. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to load banner images.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//           autoClose: 2000,
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
//           autoClose: 2000,
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else if (err.code === '406') {
//         toast.error('Unable to check cart due to a server error. Please try again.', {
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
//   }, [navigate, session]);

//   // Buy now (add to cart and navigate to cart page)
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 2000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [navigate, session]);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
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
//               autoClose: 5000,
//             });
//             setLoadingProducts(false);
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//         setLoadingProducts(false);
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners) return (
//     <div className="loading-container">
//       <div className="loading-animation">
//         <div className="loading-box">
//           <FaShoppingCart className="loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="home">
//       <ToastContainer />
      
//       {/* Sticky Search Bar */}
//       <div className="search-bar sticky">
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           aria-label="Search products"
//         />
//       </div>

//       {/* Banner Slider */}
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name}>
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="product-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-buttons">
//                   <div className="skeleton-btn" />
//                   <div className="skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className="product-grid">
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
//               >
//                 <div className="product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="offer-badge">
//                       <span className="offer-label"> Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="add-to-cart-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="buy-now-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);




// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch, FaHome, FaList, FaUser } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching user role. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch user role.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(4);
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching categories. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch categories.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access or log in.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//       }));
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch products.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching banner images. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to load banner images.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//           autoClose: 2000,
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
//           autoClose: 2000,
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else if (err.code === '406') {
//         toast.error('Unable to check cart due to a server error. Please try again.', {
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
//   }, [navigate, session]);

//   // Buy now (add to cart and navigate to cart page)
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 2000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [navigate, session]);

//   // Logout handler
//   const handleLogout = async () => {
//     try {
//       const { error } = await supabase.auth.signOut();
//       if (error) throw error;
//       toast.success('Logged out successfully!', {
//         position: "top-center",
//         autoClose: 2000,
//       });
//       navigate('/auth');
//     } catch (err) {
//       console.error('Error logging out:', err);
//       toast.error('Failed to log out.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     }
//   };

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
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
//               autoClose: 5000,
//             });
//             setLoadingProducts(false);
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//         setLoadingProducts(false);
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="loading-container">
//       <div className="loading-animation">
//         <div className="loading-box">
//           <FaShoppingCart className="loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="home">
//       <ToastContainer />
      
//       {/* Header */}
//       <header className="header">
//         <h1>FastOrder</h1>
//         {session?.user ? (
//           <div className="header-user">
//             <p>Welcome, {session.user.email}</p>
//             <button onClick={handleLogout} className="logout-btn">Logout</button>
//           </div>
//         ) : (
//           <button onClick={() => navigate('/auth')} className="logout-btn">Login</button>
//         )}
//       </header>

//       {/* Sticky Search Bar */}
//       <div className="search-bar sticky">
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           aria-label="Search products"
//         />
//       </div>

//       {/* Banner Slider */}
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="banner-wrapper">
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//                 <button
//                   className="view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="categories-section">
//         <div className="categories-header">
//           <h2 className="section-title">Explore Categories</h2>
//           <Link to="/categories" className="view-all-link">View All</Link>
//         </div>
//         {loadingCategories ? (
//           <div className="category-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="category-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//               </div>
//             ))}
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="no-categories">No categories available.</p>
//         ) : (
//           <div className="category-grid">
//             {categories.map((category) => (
//               <Link
//                 to={`/products?category=${category.id}`}
//                 key={category.id}
//                 className="category-card"
//                 aria-label={`View products in ${category.name} category`}
//               >
//                 <div className="category-image-wrapper">
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={category.name}
//                     className="category-image"
//                   />
//                 </div>
//                 <h3 className="category-name">{category.name.trim()}</h3>
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="product-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-buttons">
//                   <div className="skeleton-btn" />
//                   <div className="skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className="product-grid">
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
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
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="add-to-cart-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="buy-now-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);




// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching user role. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch user role.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching categories. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch categories.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access or log in.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//       }));
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch products.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching banner images. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to load banner images.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//           autoClose: 2000,
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
//           autoClose: 2000,
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else if (err.code === '406') {
//         toast.error('Unable to check cart due to a server error. Please try again.', {
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
//   }, [navigate, session]);

//   // Buy now (add to cart and navigate to cart page)
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 2000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [navigate, session]);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
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
//               autoClose: 5000,
//             });
//             setLoadingProducts(false);
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//         setLoadingProducts(false);
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="loading-container">
//       <div className="loading-animation">
//         <div className="loading-box">
//           <FaShoppingCart className="loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="home">
//       <ToastContainer />

//       {/* Sticky Search Bar */}
//       <div className="search-bar sticky">
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           aria-label="Search products"
//         />
//       </div>

//       {/* Banner Slider */}
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="banner-wrapper">
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//                 <button
//                   className="view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="categories-section">
//         <div className="categories-header">
//           <h2 className="section-title">Explore Categories</h2>
//           <Link to="/categories" className="view-all-link">View All</Link>
//         </div>
//         {loadingCategories ? (
//           <div className="category-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="category-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//               </div>
//             ))}
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="no-categories">No categories available.</p>
//         ) : (
//           <div className="category-grid">
//             {categories.map((category) => (
//               <Link
//                 to={`/products?category=${category.id}`}
//                 key={category.id}
//                 className="category-card"
//                 aria-label={`View products in ${category.name} category`}
//               >
//                 <div className="category-image-wrapper">
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={category.name}
//                     className="category-image"
//                   />
//                 </div>
//                 <h3 className="category-name">{category.name.trim()}</h3>
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="product-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-buttons">
//                   <div className="skeleton-btn" />
//                   <div className ="skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className="product-grid">
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
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
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="add-to-cart-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="buy-now-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);


// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching user role. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch user role.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching categories. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch categories.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access or log in.', {
//         position: "top-center",
//         autoClose: 5000,
//       });
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//       }));
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to fetch products.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching banner images. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error('Failed to load banner images.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//           autoClose: 2000,
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
//           autoClose: 2000,
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else if (err.code === '406') {
//         toast.error('Unable to check cart due to a server error. Please try again.', {
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
//   }, [navigate, session]);

//   // Buy now (add to cart and navigate to cart page)
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 2000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5); // Limit to 5 suggestions
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar to hide suggestions
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
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
//               autoClose: 5000,
//             });
//             setLoadingProducts(false);
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 5000,
//         });
//         setLoadingProducts(false);
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="loading-container">
//       <div className="loading-animation">
//         <div className="loading-box">
//           <FaShoppingCart className="loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="home">
//       <ToastContainer />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="search-bar sticky" ref={searchRef}>
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="banner-wrapper">
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//                 <button
//                   className="view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="categories-section">
//         <div className="categories-header">
//           <h2 className="section-title">Explore Categories</h2>
//           <Link to="/categories" className="view-all-link">View All</Link>
//         </div>
//         {loadingCategories ? (
//           <div className="category-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="category-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//               </div>
//             ))}
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="no-categories">No categories available.</p>
//         ) : (
//           <div className="category-grid">
//             {categories.map((category) => (
//               <Link
//                 to={`/products?category=${category.id}`}
//                 key={category.id}
//                 className="category-card"
//                 aria-label={`View products in ${category.name} category`}
//               >
//                 <div className="category-image-wrapper">
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={category.name}
//                     className="category-image"
//                   />
//                 </div>
//                 <h3 className="category-name">{category.name.trim()}</h3>
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="product-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-buttons">
//                   <div className="skeleton-btn" />
//                   <div className="skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
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
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="add-to-cart-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="buy-now-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);


// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 3000, // Standardized to 3000ms
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching user role. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch user role.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching categories. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch categories.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access or log in.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
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
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching banner images. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to load banner images.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       } else if (err.code === '406') {
//         toast.error('Unable to check cart due to a server error. Please try again.', {
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
//   }, [navigate, session]);

//   // Buy now (add to cart and navigate to cart page)
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
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
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar to hide suggestions
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
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
//             setLoadingProducts(false);
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         setLoadingProducts(false);
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="loading-container">
//       <div className="loading-animation">
//         <div className="loading-box">
//           <FaShoppingCart className="loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="home">
//       <ToastContainer position="top-center" autoClose={3000} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="search-bar sticky" ref={searchRef}>
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="banner-wrapper">
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//                 <button
//                   className="view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="categories-section">
//         <div className="categories-header">
//           <h2 className="section-title">Explore Categories</h2>
//           <Link to="/categories" className="view-all-link">View All</Link>
//         </div>
//         {loadingCategories ? (
//           <div className="category-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="category-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//               </div>
//             ))}
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="no-categories">No categories available.</p>
//         ) : (
//           <div className="category-grid">
//             {categories.map((category) => (
//               <Link
//                 to={`/products?category=${category.id}`}
//                 key={category.id}
//                 className="category-card"
//                 aria-label={`View products in ${category.name} category`}
//               >
//                 <div className="category-image-wrapper">
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={category.name}
//                     className="category-image"
//                   />
//                 </div>
//                 <h3 className="category-name">{category.name.trim()}</h3>
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="product-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-buttons">
//                   <div className="skeleton-btn" />
//                   <div className="skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
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
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="add-to-cart-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="buy-now-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);





// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching user role. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch user role.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching categories. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch categories.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access or log in.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
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
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching banner images. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to load banner images.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       } else if (err.code === '406') {
//         toast.error('Unable to check cart due to a server error. Please try again.', {
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
//   }, [navigate, session]);

//   // Buy now (add to cart and navigate to cart page)
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
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
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar to hide suggestions
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
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
//             setLoadingProducts(false);
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         setLoadingProducts(false);
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="loading-container">
//       <div className="loading-animation">
//         <div className="loading-box">
//           <FaShoppingCart className="loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="home">
//       <ToastContainer position="top-center" autoClose={3000} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="search-bar sticky" ref={searchRef}>
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="banner-wrapper">
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//                 <button
//                   className="view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="home-categories-section">
//         <header className="home-cat-header">
//           <h2 className="home-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="home-cat-view-all">View All</Link>
//         </header>
//         {loadingCategories ? (
//           <div className="home-cat-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="home-cat-card-skeleton">
//                 <div className="home-cat-skeleton-image" />
//                 <div className="home-cat-skeleton-text" />
//               </div>
//             ))}
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="home-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="home-cat-grid">
//             {categories.map((category) => (
//               <Link
//                 to={`/products?category=${category.id}`}
//                 key={category.id}
//                 className="home-cat-card"
//                 aria-label={`View products in ${category.name} category`}
//               >
//                 <div className="home-cat-image-wrapper">
//                   <div className="home-cat-image-border"></div>
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={category.name}
//                     className="home-cat-image"
//                   />
//                 </div>
//                 <h3 className="home-cat-name">{category.name.trim()}</h3>
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="product-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-buttons">
//                   <div className="skeleton-btn" />
//                   <div className="skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
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
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="add-to-cart-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="buy-now-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);



// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching user role. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch user role.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching categories. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch categories.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access or log in.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
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
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching banner images. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to load banner images.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       } else if (err.code === '406') {
//         toast.error('Unable to check cart due to a server error. Please try again.', {
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
//   }, [navigate, session]);

//   // Buy now (add to cart and navigate to cart page)
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
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
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar to hide suggestions
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
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
//             setLoadingProducts(false);
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         setLoadingProducts(false);
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="loading-container">
//       <div className="loading-animation">
//         <div className="loading-box">
//           <FaShoppingCart className="loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="home">
//       <ToastContainer position="top-center" autoClose={3000} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="search-bar sticky" ref={searchRef}>
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="banner-wrapper">
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//                 <button
//                   className="view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="home-categories-section">
//         <header className="home-cat-header">
//           <h2 className="home-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="home-cat-view-all">View All</Link>
//         </header>
//         {loadingCategories ? (
//           <div className="home-cat-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="home-cat-card-skeleton">
//                 <div className="home-cat-skeleton-image" />
//                 <div className="home-cat-skeleton-text" />
//               </div>
//             ))}
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="home-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="home-cat-grid">
//             {categories.map((category) => (
//               <Link
//                 to={`/products?category=${category.id}`}
//                 key={category.id}
//                 className="home-cat-card"
//                 aria-label={`View products in ${category.name} category`}
//               >
//                 <div className="home-cat-image-wrapper">
//                   <div className="home-cat-image-border"></div>
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={category.name}
//                     className="home-cat-image"
//                   />
//                 </div>
//                 <h3 className="home-cat-name">{category.name.trim()}</h3>
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="product-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-buttons">
//                   <div className="skeleton-btn" />
//                   <div className="skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
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
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="add-to-cart-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="buy-now-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);



// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching user role. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch user role.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching categories. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch categories.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access or log in.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
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
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching banner images. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to load banner images.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       } else if (err.code === '406') {
//         toast.error('Unable to check cart due to a server error. Please try again.', {
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
//   }, [navigate, session]);

//   // Buy now (add to cart and navigate to cart page)
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError) {
//         if (fetchError.code === 'PGRST116') {
//           // No rows found, proceed with insert
//         } else {
//           throw fetchError;
//         }
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
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
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar to hide suggestions
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
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
//             setLoadingProducts(false);
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         setLoadingProducts(false);
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="loading-container">
//       <div className="loading-animation">
//         <div className="loading-box">
//           <FaShoppingCart className="loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="home">
//       <ToastContainer position="top-center" autoClose={3000} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="search-bar sticky" ref={searchRef}>
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="banner-wrapper">
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//                 <button
//                   className="view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="home-categories-section">
//         <header className="home-cat-header">
//           <h2 className="home-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="home-cat-view-all">View All</Link>
//         </header>
//         {loadingCategories ? (
//           <div className="home-cat-grid-wrapper">
//             <div className="home-cat-grid">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="home-cat-card-skeleton">
//                   <div className="home-cat-skeleton-image" />
//                   <div className="home-cat-skeleton-text" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="home-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="home-cat-grid-wrapper">
//             <div className="home-cat-grid">
//               {categories.map((category) => (
//                 <Link
//                   to={`/products?category=${category.id}`}
//                   key={category.id}
//                   className="home-cat-card"
//                   aria-label={`View products in ${category.name} category`}
//                 >
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={category.name}
//                     className="home-cat-image"
//                   />
//                   <h3 className="home-cat-name">{category.name.trim()}</h3>
//                 </Link>
//               ))}
//             </div>
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="product-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-buttons">
//                   <div className="skeleton-btn" />
//                   <div className="skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
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
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="add-to-cart-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="buy-now-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);


// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       toast.error('Failed to fetch user role.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//       }));
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
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
//       toast.error('Failed to add to cart.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     }
//   }, [navigate, session]);

//   // Buy now
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 2000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       toast.error('Failed to add to cart.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     }
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             fetchNearbyProducts(); // Still attempt to fetch products if location fails
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         fetchNearbyProducts(); // Fallback if geolocation is not supported
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="loading-container">
//       <div className="loading-animation">
//         <div className="loading-box">
//           <FaShoppingCart className="loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="home">
//       <ToastContainer position="top-center" autoClose={3000} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="search-bar sticky" ref={searchRef}>
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])}
//                 aria-label={`Select ${suggestion.name}`}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="banner-wrapper">
//                 <img src={banner.url} alt={`Banner ${banner.name}`} loading="lazy" />
//                 <button
//                   className="view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                   aria-label="View Offers"
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="home-categories-section">
//         <header className="home-cat-header">
//           <h2 className="home-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="home-cat-view-all" aria-label="View All Categories">
//             View All
//           </Link>
//         </header>
//         {error && <p className="home-cat-error">{error}</p>}
//         {loadingCategories ? (
//           <div className="home-cat-grid-wrapper">
//             <div className="home-cat-grid">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="home-cat-card-skeleton">
//                   <div className="home-cat-skeleton-image" />
//                   <div className="home-cat-skeleton-text" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="home-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="home-cat-grid-wrapper">
//             <div className="home-cat-grid">
//               {categories.map((category) => (
//                 <Link
//                   to={`/products?category=${category.id}`}
//                   key={category.id}
//                   className="home-cat-card"
//                   aria-label={`View products in ${category.name} category`}
//                 >
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={category.name}
//                     className="home-cat-image"
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image')}
//                     loading="lazy"
//                   />
//                   <h3 className="home-cat-name">{category.name.trim()}</h3>
//                 </Link>
//               ))}
//             </div>
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="product-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-buttons">
//                   <div className="skeleton-btn" />
//                   <div className="skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
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
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="product-info">
//                   <h3 className="product-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="product-buttons">
//   <button
//     onClick={(e) => {
//       e.stopPropagation();
//       addToCart(product);
//     }}
//     className="cart-action-btn"
//     disabled={product.stock <= 0}
//     aria-label={`Add ${product.name} to cart`}
//   >
//     <FaShoppingCart /> Add to Cart
//   </button>
//   <button
//     onClick={(e) => {
//       e.stopPropagation();
//       buyNow(product);
//     }}
//     className="buy-action-btn"
//     disabled={product.stock <= 0}
//     aria-label={`Buy ${product.name} now`}
//   >
//     Buy Now
//   </button>
// </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);





// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       toast.error('Failed to fetch user role.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//       }));
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
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
//       toast.error('Failed to add to cart.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     }
//   }, [navigate, session]);

//   // Buy now
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 2000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       toast.error('Failed to add to cart.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     }
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             fetchNearbyProducts(); // Still attempt to fetch products if location fails
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         fetchNearbyProducts(); // Fallback if geolocation is not supported
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="td-loading-container">
//       <div className="td-loading-animation">
//         <div className="td-loading-box">
//           <FaShoppingCart className="td-loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="td-loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="td-home">
//       <ToastContainer position="top-center" autoClose={3000} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="td-search-bar sticky" ref={searchRef}>
//         <FaSearch className="td-search-icon" />
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="td-search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="td-suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])}
//                 aria-label={`Select ${suggestion.name}`}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="td-banner-slider">
//         {loadingBanners ? (
//           <div className="td-banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="td-banner-wrapper">
//                 <img src={banner.url} alt={`Banner ${banner.name}`} loading="lazy" />
//                 <button
//                   className="td-view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                   aria-label="View Offers"
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="td-categories-section">
//         <header className="td-cat-header">
//           <h2 className="td-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="td-cat-view-all" aria-label="View All Categories">
//             View All
//           </Link>
//         </header>
//         {error && <p className="td-cat-error">{error}</p>}
//         {loadingCategories ? (
//           <div className="td-cat-grid-wrapper">
//             <div className="td-cat-grid">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="td-cat-card-skeleton">
//                   <div className="td-cat-skeleton-image" />
//                   <div className="td-cat-skeleton-text" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="td-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="td-cat-grid-wrapper">
//             <div className="td-cat-grid">
//               {categories.map((category) => (
//                 <Link
//                   to={`/products?category=${category.id}`}
//                   key={category.id}
//                   className="td-cat-card"
//                   aria-label={`View products in ${category.name} category`}
//                 >
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={category.name}
//                     className="td-cat-image"
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image')}
//                     loading="lazy"
//                   />
//                   <h3 className="td-cat-name">{category.name.trim()}</h3>
//                 </Link>
//               ))}
//             </div>
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Fast Delivery, Just Order!</h2>
//         {loadingProducts ? (
//           <div className="td-product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="td-product-card-skeleton">
//                 <div className="td-skeleton-image" />
//                 <div className="td-skeleton-text" />
//                 <div className="td-skeleton-text short" />
//                 <div className="td-skeleton-buttons">
//                   <div className="td-skeleton-btn" />
//                   <div className="td-skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="td-no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`td-product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="td-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
//               >
//                 <div className="td-product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="td-offer-badge">
//                       <span className="td-offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="td-product-info">
//                   <h3 className="td-product-name">{product.name}</h3>
//                   <div className="td-price-section">
//                     <p className="td-product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="td-original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="td-product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="td-cart-action-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="td-buy-action-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);




// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Home.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       toast.error('Failed to fetch user role.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     }
//   }, [session]);

//   // Fetch categories (Restored from commented code)
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock, category_id')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//         categoryId: product.category_id,
//       }));
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
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

//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
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
//       toast.error('Failed to add to cart.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     }
//   }, [navigate, session]);

//   // Buy now
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.warn('Out of stock.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to cart.', {
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

//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         position: "top-center",
//         autoClose: 2000,
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       toast.error('Failed to add to cart.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     }
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             fetchNearbyProducts();
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         fetchNearbyProducts();
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="td-loading-container">
//       <div className="td-loading-animation">
//         <div className="td-loading-box">
//           <FaShoppingCart className="td-loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="td-loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, gifts, and home decoration on Markeet. Fast delivery within 40km in India."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, local shopping"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/" />
//       </Helmet>
//       <ToastContainer position="top-center" autoClose={3000} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="td-search-bar sticky" ref={searchRef}>
//         <FaSearch className="td-search-icon" />
//         <input
//           type="text"
//           placeholder="Search electronics, fashion, jewellery..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="td-search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="td-suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])}
//                 aria-label={`Select ${suggestion.name}`}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="td-banner-slider">
//         {loadingBanners ? (
//           <div className="td-banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="td-banner-wrapper">
//                 <img src={banner.url} alt={`Markeet ${banner.name} Offer`} loading="lazy" />
//                 <button
//                   className="td-view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                   aria-label="View Offers"
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="td-categories-section">
//         <header className="td-cat-header">
//           <h2 className="td-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="td-cat-view-all" aria-label="View All Categories">
//             View All
//           </Link>
//         </header>
//         {error && <p className="td-cat-error">{error}</p>}
//         {loadingCategories ? (
//           <div className="td-cat-grid-wrapper">
//             <div className="td-cat-grid">
//               {[...Array(6)].map((_, i) => (
//                 <div key={i} className="td-cat-card-skeleton">
//                   <div className="td-cat-skeleton-image" />
//                   <div className="td-cat-skeleton-text" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="td-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="td-cat-grid-wrapper">
//             <div className="td-cat-grid">
//               {categories.map((category) => (
//                 <Link
//                   to={`/products?category=${category.id}`}
//                   key={category.id}
//                   className="td-cat-card"
//                   aria-label={`View ${category.name} products`}
//                 >
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={`${category.name} category`}
//                     className="td-cat-image"
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image')}
//                     loading="lazy"
//                   />
//                   <h3 className="td-cat-name">{category.name.trim()}</h3>
//                 </Link>
//               ))}
//             </div>
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="td-product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="td-product-card-skeleton">
//                 <div className="td-skeleton-image" />
//                 <div className="td-skeleton-text" />
//                 <div className="td-skeleton-text short" />
//                 <div className="td-skeleton-buttons">
//                   <div className="td-skeleton-btn" />
//                   <div className="td-skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="td-no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`td-product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="td-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
//               >
//                 <div className="td-product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="td-offer-badge">
//                       <span className="td-offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={`${product.name} product`}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="td-product-info">
//                   <h3 className="td-product-name">{product.name}</h3>
//                   <div className="td-price-section">
//                     <p className="td-product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="td-original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="td-product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="td-cart-action-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="td-buy-action-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);


// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/Home.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       toast.error('Failed to fetch user role.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock, category_id')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//         categoryId: product.category_id,
//       }));
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.error('Out of stock.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', {
//         duration: 3000,
//         position: 'top-center',
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

//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         if (newQuantity > product.stock) {
//           toast.error('Exceeds stock.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//         toast.success(`${product.name} quantity updated in cart!`, {
//           duration: 3000,
//           position: 'top-center',
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
//           duration: 3000,
//           position: 'top-center',
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       toast.error('Failed to add to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [navigate, session]);

//   // Buy now
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       toast.error('Invalid product.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (product.stock <= 0) {
//       toast.error('Out of stock.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to proceed to cart.', {
//         duration: 3000,
//         position: 'top-center',
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

//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         if (newQuantity > product.stock) {
//           toast.error('Exceeds stock.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
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
//       }

//       toast.success('Added to cart! Redirecting...', {
//         duration: 2000,
//         position: 'top-center',
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       toast.error('Failed to add to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             fetchNearbyProducts();
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         fetchNearbyProducts();
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="td-loading-container">
//       <div className="td-loading-animation">
//         <div className="td-loading-box">
//           <FaShoppingCart className="td-loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="td-loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, gifts, and home decoration on Markeet. Fast delivery within 40km in India."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, local shopping"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/" />
//       </Helmet>
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="td-search-bar sticky" ref={searchRef}>
//         <FaSearch className="td-search-icon" />
//         <input
//           type="text"
//           placeholder="Search electronics, fashion, jewellery..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="td-search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="td-suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])}
//                 aria-label={`Select ${suggestion.name}`}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="td-banner-slider">
//         {loadingBanners ? (
//           <div className="td-banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="td-banner-wrapper">
//                 <img src={banner.url} alt={`Markeet ${banner.name} Offer`} loading="lazy" />
//                 <button
//                   className="td-view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                   aria-label="View Offers"
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="td-categories-section">
//         <header className="td-cat-header">
//           <h2 className="td-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="td-cat-view-all" aria-label="View All Categories">
//             View All
//           </Link>
//         </header>
//         {error && <p className="td-cat-error">{error}</p>}
//         {loadingCategories ? (
//           <div className="td-cat-grid-wrapper">
//             <div className="td-cat-grid">
//               {[...Array(6)].map((_, i) => (
//                 <div key={i} className="td-cat-card-skeleton">
//                   <div className="td-cat-skeleton-image" />
//                   <div className="td-cat-skeleton-text" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="td-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="td-cat-grid-wrapper">
//             <div className="td-cat-grid">
//               {categories.map((category) => (
//                 <Link
//                   to={`/products?category=${category.id}`}
//                   key={category.id}
//                   className="td-cat-card"
//                   aria-label={`View ${category.name} products`}
//                 >
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={`${category.name} category`}
//                     className="td-cat-image"
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image')}
//                     loading="lazy"
//                   />
//                   <h3 className="td-cat-name">{category.name.trim()}</h3>
//                 </Link>
//               ))}
//             </div>
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="td-product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="td-product-card-skeleton">
//                 <div className="td-skeleton-image" />
//                 <div className="td-skeleton-text" />
//                 <div className="td-skeleton-text short" />
//                 <div className="td-skeleton-buttons">
//                   <div className="td-skeleton-btn" />
//                   <div className="td-skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="td-no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`td-product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="td-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
//               >
//                 <div className="td-product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="td-offer-badge">
//                       <span className="td-offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={`${product.name} product`}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="td-product-info">
//                   <h3 className="td-product-name">{product.name}</h3>
//                   <div className="td-price-section">
//                     <p className="td-product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="td-original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="td-product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="td-cart-action-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="td-buy-action-btn"
//                       disabled={product.stock <= 0}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);



// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/Home.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       toast.error('Failed to fetch user role.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products and their variants
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         return;
//       }

//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock, category_id')
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .in('seller_id', nearbySellerIds);
//       if (productError) throw productError;

//       const productIds = productData.map((p) => p.id);
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', productIds);
//       if (variantError) throw variantError;

//       const mappedProducts = productData.map((product) => {
//         const variants = variantData.filter((v) => v.product_id === product.id).map((v) => ({
//           id: v.id,
//           price: parseFloat(v.price) || 0,
//           originalPrice: v.original_price ? parseFloat(v.original_price) : null,
//           stock: v.stock || 0,
//           attributes: v.attributes || {},
//           images: v.images && v.images.length > 0 ? v.images : product.images,
//         }));
//         return {
//           id: product.id,
//           name: product.title || 'Unnamed Product',
//           images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//           price: parseFloat(product.price) || 0,
//           originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//           discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//           stock: product.stock || 0,
//           categoryId: product.category_id,
//           variants,
//           // Use lowest variant price for display if variants exist, else product price
//           displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//           displayOriginalPrice:
//             variants.length > 0
//               ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                 product.original_price
//               : product.original_price,
//         };
//       });
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError('Failed to load products. Please try again.');
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Use cheapest variant if available, else product
//       const itemToAdd = product.variants.length > 0
//         ? product.variants.find((v) => v.price === product.displayPrice && v.stock > 0)
//         : product;

//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity, variant_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .eq('variant_id', itemToAdd.id || null)
//         .maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         const stockLimit = itemToAdd.stock || product.stock;
//         if (newQuantity > stockLimit) {
//           toast.error('Exceeds stock.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//         toast.success(`${product.name} quantity updated in cart!`, {
//           duration: 3000,
//           position: 'top-center',
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             variant_id: itemToAdd.id || null,
//             quantity: 1,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//           });
//         if (insertError) throw insertError;
//         toast.success(`${product.name} added to cart!`, {
//           duration: 3000,
//           position: 'top-center',
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       toast.error('Failed to add to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [navigate, session]);

//   // Buy now
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to proceed to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       const itemToAdd = product.variants.length > 0
//         ? product.variants.find((v) => v.price === product.displayPrice && v.stock > 0)
//         : product;

//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity, variant_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .eq('variant_id', itemToAdd.id || null)
//         .maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         const stockLimit = itemToAdd.stock || product.stock;
//         if (newQuantity > stockLimit) {
//           toast.error('Exceeds stock.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             variant_id: itemToAdd.id || null,
//             quantity: 1,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//           });
//         if (insertError) throw insertError;
//       }

//       toast.success('Added to cart! Redirecting...', {
//         duration: 2000,
//         position: 'top-center',
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       toast.error('Failed to add to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             fetchNearbyProducts();
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         fetchNearbyProducts();
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="td-loading-container">
//       <div className="td-loading-animation">
//         <div className="td-loading-box">
//           <FaShoppingCart className="td-loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="td-loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, gifts, and home decoration on Markeet. Fast delivery within 40km in India."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, local shopping"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/" />
//       </Helmet>
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="td-search-bar sticky" ref={searchRef}>
//         <FaSearch className="td-search-icon" />
//         <input
//           type="text"
//           placeholder="Search electronics, fashion, jewellery..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="td-search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="td-suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])}
//                 aria-label={`Select ${suggestion.name}`}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="td-banner-slider">
//         {loadingBanners ? (
//           <div className="td-banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="td-banner-wrapper">
//                 <img src={banner.url} alt={`Markeet ${banner.name} Offer`} loading="lazy" />
//                 <button
//                   className="td-view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                   aria-label="View Offers"
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="td-categories-section">
//         <header className="td-cat-header">
//           <h2 className="td-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="td-cat-view-all" aria-label="View All Categories">
//             View All
//           </Link>
//         </header>
//         {error && <p className="td-cat-error">{error}</p>}
//         {loadingCategories ? (
//           <div className="td-cat-grid-wrapper">
//             <div className="td-cat-grid">
//               {[...Array(6)].map((_, i) => (
//                 <div key={i} className="td-cat-card-skeleton">
//                   <div className="td-cat-skeleton-image" />
//                   <div className="td-cat-skeleton-text" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="td-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="td-cat-grid-wrapper">
//             <div className="td-cat-grid">
//               {categories.map((category) => (
//                 <Link
//                   to={`/products?category=${category.id}`}
//                   key={category.id}
//                   className="td-cat-card"
//                   aria-label={`View ${category.name} products`}
//                 >
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={`${category.name} category`}
//                     className="td-cat-image"
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image')}
//                     loading="lazy"
//                   />
//                   <h3 className="td-cat-name">{category.name.trim()}</h3>
//                 </Link>
//               ))}
//             </div>
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="td-product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="td-product-card-skeleton">
//                 <div className="td-skeleton-image" />
//                 <div className="td-skeleton-text" />
//                 <div className="td-skeleton-text short" />
//                 <div className="td-skeleton-buttons">
//                   <div className="td-skeleton-btn" />
//                   <div className="td-skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="td-no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`td-product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="td-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
//               >
//                 <div className="td-product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="td-offer-badge">
//                       <span className="td-offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={`${product.name} product`}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="td-product-info">
//                   <h3 className="td-product-name">{product.name}</h3>
//                   <div className="td-price-section">
//                     <p className="td-product-price">
//                       ₹{product.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                       <p className="td-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   {product.variants.length > 0 && (
//                     <p className="td-variant-info">
//                       Starting at ₹{product.displayPrice.toLocaleString('en-IN')} ({product.variants.length} variants)
//                     </p>
//                   )}
//                   <div className="td-product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="td-cart-action-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="td-buy-action-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);




// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/Home.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       toast.error('Failed to fetch user role.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products and their variants
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         return;
//       }

//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock, category_id')
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .in('seller_id', nearbySellerIds);
//       if (productError) throw productError;

//       const productIds = productData.map((p) => p.id);
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', productIds);
//       if (variantError) throw variantError;

//       const mappedProducts = productData.map((product) => {
//         const variants = variantData.filter((v) => v.product_id === product.id).map((v) => ({
//           id: v.id,
//           price: parseFloat(v.price) || 0,
//           originalPrice: v.original_price ? parseFloat(v.original_price) : null,
//           stock: v.stock || 0,
//           attributes: v.attributes || {},
//           images: v.images && v.images.length > 0 ? v.images : product.images,
//         }));
//         return {
//           id: product.id,
//           name: product.title || 'Unnamed Product',
//           images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//           price: parseFloat(product.price) || 0,
//           originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//           discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//           stock: product.stock || 0,
//           categoryId: product.category_id,
//           variants,
//           displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//           displayOriginalPrice:
//             variants.length > 0
//               ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                 product.original_price
//               : product.original_price,
//         };
//       });
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError('Failed to load products. Please try again.');
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Validate variant ID exists in product_variants table
//   const validateVariant = async (variantId) => {
//     if (!variantId) return true; // No variant_id, so valid for non-variant products
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

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Select the cheapest variant with stock if variants exist
//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         // Validate variant exists in database
//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//       }

//       // Build the query to check for existing cart item
//       let query = supabase
//         .from('cart')
//         .select('id, quantity, variant_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id);

//       // Handle NULL variant_id correctly
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
//             duration: 3000,
//             position: 'top-center',
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
//           duration: 3000,
//           position: 'top-center',
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             variant_id: variantId,
//             quantity: 1,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//           });
//         if (insertError) {
//           console.error('Insert cart error:', insertError);
//           throw new Error(insertError.message || 'Failed to add to cart');
//         }
//         toast.success(`${product.name} added to cart!`, {
//           duration: 3000,
//           position: 'top-center',
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       const errorMessage = err.message || 'An unexpected error occurred while adding to cart';
//       toast.error(`Failed to add to cart: ${errorMessage}`, {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [navigate, session]);

//   // Buy now
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to proceed to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Select the cheapest variant with stock if variants exist
//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         // Validate variant exists in database
//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//       }

//       // Build the query to check for existing cart item
//       let query = supabase
//         .from('cart')
//         .select('id, quantity, variant_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id);

//       // Handle NULL variant_id correctly
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
//             duration: 3000,
//             position: 'top-center',
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
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             variant_id: variantId,
//             quantity: 1,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//           });
//         if (insertError) {
//           console.error('Insert cart error:', insertError);
//           throw new Error(insertError.message || 'Failed to add to cart');
//         }
//       }

//       toast.success('Added to cart! Redirecting...', {
//         duration: 2000,
//         position: 'top-center',
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       const errorMessage = err.message || 'An unexpected error occurred while adding to cart';
//       toast.error(`Failed to add to cart: ${errorMessage}`, {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             fetchNearbyProducts();
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         fetchNearbyProducts();
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="td-loading-container">
//       <div className="td-loading-animation">
//         <div className="td-loading-box">
//           <FaShoppingCart className="td-loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="td-loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, gifts, and home decoration on Markeet. Fast delivery within 40km in India."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, local shopping"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/" />
//       </Helmet>
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="td-search-bar sticky" ref={searchRef}>
//         <FaSearch className="td-search-icon" />
//         <input
//           type="text"
//           placeholder="Search electronics, fashion, jewellery..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="td-search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="td-suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])}
//                 aria-label={`Select ${suggestion.name}`}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="td-banner-slider">
//         {loadingBanners ? (
//           <div className="td-banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="td-banner-wrapper">
//                 <img src={banner.url} alt={`Markeet ${banner.name} Offer`} loading="lazy" />
//                 <button
//                   className="td-view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                   aria-label="View Offers"
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="td-categories-section">
//         <header className="td-cat-header">
//           <h2 className="td-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="td-cat-view-all" aria-label="View All Categories">
//             View All
//           </Link>
//         </header>
//         {error && <p className="td-cat-error">{error}</p>}
//         {loadingCategories ? (
//           <div className="td-cat-grid-wrapper">
//             <div className="td-cat-grid">
//               {[...Array(6)].map((_, i) => (
//                 <div key={i} className="td-cat-card-skeleton">
//                   <div className="td-cat-skeleton-image" />
//                   <div className="td-cat-skeleton-text" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="td-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="td-cat-grid-wrapper">
//             <div className="td-cat-grid">
//               {categories.map((category) => (
//                 <Link
//                   to={`/products?category=${category.id}`}
//                   key={category.id}
//                   className="td-cat-card"
//                   aria-label={`View ${category.name} products`}
//                 >
//                   <img
//                     src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                     alt={`${category.name} category`}
//                     className="td-cat-image"
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image')}
//                     loading="lazy"
//                   />
//                   <h3 className="td-cat-name">{category.name.trim()}</h3>
//                 </Link>
//               ))}
//             </div>
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="td-product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="td-product-card-skeleton">
//                 <div className="td-skeleton-image" />
//                 <div className="td-skeleton-text" />
//                 <div className="td-skeleton-text short" />
//                 <div className="td-skeleton-buttons">
//                   <div className="td-skeleton-btn" />
//                   <div className="td-skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="td-no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`td-product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="td-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
//               >
//                 <div className="td-product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="td-offer-badge">
//                       <span className="td-offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={`${product.name} product`}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="td-product-info">
//                   <h3 className="td-product-name">{product.name}</h3>
//                   <div className="td-price-section">
//                     <p className="td-product-price">
//                       ₹{product.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                       <p className="td-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   {product.variants.length > 0 && (
//                     <p className="td-variant-info">
//                       Starting at ₹{product.displayPrice.toLocaleString('en-IN')} ({product.variants.length} variants)
//                     </p>
//                   )}
//                   <div className="td-product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="td-cart-action-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="td-buy-action-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);



// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/Home.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// const calculateDistance = (userLoc, sellerLoc) => {
//     if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.latitude || !sellerLoc?.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//     const R = 6371; // Earth's radius in km
//     const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//     const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//     const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c; // Correct usage of 'c'
//   };

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState({ products: true, banners: true, categories: true });
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(debounce(setSearchTerm, 300), []);

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', { duration: 3000 });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) return setIsSeller(false);
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (error) throw error;
//       setIsSeller(data?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       toast.error('Failed to fetch user role.', { duration: 3000 });
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) return setLoading((prev) => ({ ...prev, categories: false }));
//     try {
//       const { data, error } = await supabase.from('categories').select('*').order('name').limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories.');
//     } finally {
//       setLoading((prev) => ({ ...prev, categories: false }));
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation?.lat || !buyerLocation?.lon) return setLoading((prev) => ({ ...prev, products: false }));
//     if (!checkNetworkStatus()) return setLoading((prev) => ({ ...prev, products: false }));
//     try {
//       const { data: sellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = sellers
//         .filter((seller) => calculateDistance(buyerLocation, seller) <= 40)
//         .map((seller) => seller.id);

//       if (!nearbySellerIds.length) return setProducts([]);

//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock, category_id')
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .in('seller_id', nearbySellerIds);
//       if (productError) throw productError;

//       const productIds = productData.map((p) => p.id);
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', productIds);
//       if (variantError) throw variantError;

//       const mappedProducts = productData.map((product) => {
//         const variants = variantData
//           .filter((v) => v.product_id === product.id)
//           .map((v) => ({
//             id: v.id,
//             price: parseFloat(v.price) || 0,
//             originalPrice: v.original_price ? parseFloat(v.original_price) : null,
//             stock: v.stock || 0,
//             attributes: v.attributes || {},
//             images: v.images?.length ? v.images : product.images,
//           }));
//         return {
//           id: product.id,
//           name: product.title || 'Unnamed Product',
//           images: product.images?.length ? product.images : ['https://dummyimage.com/150'],
//           price: parseFloat(product.price) || 0,
//           originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//           discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//           stock: product.stock || 0,
//           categoryId: product.category_id,
//           variants,
//           displayPrice: variants.length ? Math.min(...variants.map((v) => v.price)) : product.price,
//           displayOriginalPrice: variants.length
//             ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice || product.original_price
//             : product.original_price,
//         };
//       });
//       setProducts(mappedProducts);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError('Failed to load products.');
//       setProducts([]);
//     } finally {
//       setLoading((prev) => ({ ...prev, products: false }));
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) return setLoading((prev) => ({ ...prev, banners: false }));
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => ({
//             url: (await supabase.storage.from('banner-images').getPublicUrl(file.name)).data.publicUrl,
//             name: file.name,
//           }))
//       );
//       setBannerImages(banners.length ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banners:', err);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoading((prev) => ({ ...prev, banners: false }));
//     }
//   }, []);

//   // Validate variant
//   const validateVariant = async (variantId) => {
//     if (!variantId) return true;
//     const { data, error } = await supabase
//       .from('product_variants')
//       .select('id')
//       .eq('id', variantId)
//       .eq('status', 'active')
//       .single();
//     return !error && data;
//   };

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product?.id || !product.name || product.displayPrice === undefined) return toast.error('Invalid product.');
//       if (product.stock <= 0 || (product.variants.length && product.variants.every((v) => v.stock <= 0)))
//         return toast.error('Out of stock.');
//       if (!session?.user) {
//         toast.error('Please log in to add items to cart.');
//         return navigate('/auth');
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         const itemToAdd = product.variants.length
//           ? product.variants.filter((v) => v.stock > 0 && v.price !== null).reduce((a, b) => (a.price < b.price ? a : b))
//           : product;
//         const variantId = product.variants.length ? itemToAdd.id : null;

//         if (product.variants.length && !(await validateVariant(variantId))) return toast.error('Selected variant is not available.');

//         let query = supabase.from('cart').select('id, quantity, variant_id').eq('user_id', session.user.id).eq('product_id', product.id);
//         query = variantId ? query.eq('variant_id', variantId) : query.is('variant_id', null);

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();
//         if (fetchError && fetchError.code !== 'PGRST116') throw new Error(fetchError.message);

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           if (newQuantity > (itemToAdd.stock || product.stock)) return toast.error('Exceeds stock.');
//           const { error } = await supabase.from('cart').update({ quantity: newQuantity }).eq('id', existingCartItem.id);
//           if (error) throw error;
//           toast.success(`${product.name} quantity updated in cart!`);
//         } else {
//           const { error } = await supabase.from('cart').insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             variant_id: variantId,
//             quantity: 1,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//           });
//           if (error) throw error;
//           toast.success(`${product.name} added to cart!`);
//         }
//       } catch (err) {
//         console.error('Error adding to cart:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unexpected error'}`);
//       }
//     },
//     [navigate, session]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       await addToCart(product);
//       if (session?.user) setTimeout(() => navigate('/cart'), 2000);
//     },
//     [addToCart, navigate, session]
//   );

//   // Search suggestions
//   useEffect(() => {
//     setSuggestions(
//       isSearchFocused && searchTerm
//         ? products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
//         : []
//     );
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside search
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Fetch data on mount
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             setBuyerLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
//             fetchNearbyProducts();
//           },
//           (err) => {
//             console.error('Geolocation error:', err);
//             fetchNearbyProducts();
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         fetchNearbyProducts();
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     return searchTerm ? products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())) : products;
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//     pauseOnHover: true,
//   };

//   // Format variant attributes for display
//   const formatVariantAttributes = (variants) => {
//     if (!variants.length) return null;
//     const cheapestVariant = variants.reduce((a, b) => (a.price < b.price ? a : b));
//     const attributes = cheapestVariant.attributes;
//     if (!attributes || !Object.keys(attributes).length) return 'Multiple variants available';
//     return Object.entries(attributes)
//       .slice(0, 2)
//       .map(([key, value]) => `${key}: ${value}`)
//       .join(', ');
//   };

//   if (loading.products && loading.banners && loading.categories) {
//     return (
//       <div className="td-loading-container">
//         <div className="td-loading-animation">
//           <FaShoppingCart className="td-loading-icon" />
//           <span>Finding the best deals...</span>
//           <div className="td-loading-dots">
//             <span>.</span><span>.</span><span>.</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta name="description" content="Discover electronics, fashion, jewellery, and more on Markeet. Fast delivery within 40km in India." />
//         <meta name="keywords" content="ecommerce, electronics, fashion, jewellery, Markeet, local shopping" />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/" />
//       </Helmet>
//       <Toaster />

//       {/* Search Bar */}
//       <div className="td-search-bar sticky" ref={searchRef}>
//         <FaSearch className="td-search-icon" />
//         <input
//           type="text"
//           placeholder="Search electronics, fashion, jewellery..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="td-search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="td-suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                   navigate(`/product/${suggestion.id}`);
//                 }}
//                 role="option"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${suggestion.id}`)}
//                 aria-label={`Select ${suggestion.name}`}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="td-banner-slider">
//         {loading.banners ? (
//           <div className="td-banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="td-banner-wrapper">
//                 <img src={banner.url} alt={`Offer ${banner.name}`} loading="lazy" />
//                 <button
//                   className="td-view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                   aria-label="View Offers"
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Categories Section */}
//       <section className="td-categories-section">
//         <header className="td-cat-header">
//           <h2 className="td-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="td-cat-view-all" aria-label="View All Categories">
//             View All
//           </Link>
//         </header>
//         {error && <p className="td-cat-error">{error}</p>}
//         {loading.categories ? (
//           <div className="td-cat-grid">
//             {[...Array(6)].map((_, i) => (
//               <div key={i} className="td-cat-card-skeleton">
//                 <div className="td-cat-skeleton-image" />
//                 <div className="td-cat-skeleton-text" />
//               </div>
//             ))}
//           </div>
//         ) : !categories.length ? (
//           <p className="td-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="td-cat-grid">
//             {categories.map((category) => (
//               <Link
//                 to={`/products?category=${category.id}`}
//                 key={category.id}
//                 className="td-cat-card"
//                 aria-label={`View ${category.name} products`}
//               >
//                 <img
//                   src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                   alt={`${category.name} category`}
//                   className="td-cat-image"
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image')}
//                   loading="lazy"
//                 />
//                 <h3 className="td-cat-name">{category.name.trim()}</h3>
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More</h2>
//         {loading.products ? (
//           <div className="td-product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="td-product-card-skeleton">
//                 <div className="td-skeleton-image" />
//                 <div className="td-skeleton-text" />
//                 <div className="td-skeleton-text short" />
//                 <div className="td-skeleton-buttons">
//                   <div className="td-skeleton-btn" />
//                   <div className="td-skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : !filteredProducts.length ? (
//           <p className="td-no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className="td-product-grid">
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="td-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
//               >
//                 <div className="td-product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="td-offer-badge">Save ₹{product.discountAmount.toFixed(2)}</span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={`${product.name}`}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="td-product-info">
//                   <h3 className="td-product-name">{product.name}</h3>
//                   <p className="td-variant-info">{formatVariantAttributes(product.variants)}</p>
//                   <div className="td-price-section">
//                     <span className="td-product-price">
//                       ₹{product.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
//                     </span>
//                     {product.displayOriginalPrice > product.displayPrice && (
//                       <span className="td-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
//                       </span>
//                     )}
//                   </div>
//                   <div className="td-product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="td-cart-action-btn"
//                       disabled={product.stock <= 0 || (product.variants.length && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="td-buy-action-btn"
//                       disabled={product.stock <= 0 || (product.variants.length && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);



// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/Home.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       toast.error('Failed to fetch user role.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products and their variants
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         return;
//       }

//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock, category_id')
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .in('seller_id', nearbySellerIds);
//       if (productError) throw productError;

//       const productIds = productData.map((p) => p.id);
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', productIds);
//       if (variantError) throw variantError;

//       const mappedProducts = productData.map((product) => {
//         const variants = variantData.filter((v) => v.product_id === product.id).map((v) => ({
//           id: v.id,
//           price: parseFloat(v.price) || 0,
//           originalPrice: v.original_price ? parseFloat(v.original_price) : null,
//           stock: v.stock || 0,
//           attributes: v.attributes || {},
//           images: v.images && v.images.length > 0 ? v.images : product.images,
//         }));
//         return {
//           id: product.id,
//           name: product.title || 'Unnamed Product',
//           images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//           price: parseFloat(product.price) || 0,
//           originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//           discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//           stock: product.stock || 0,
//           categoryId: product.category_id,
//           variants,
//           displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//           displayOriginalPrice:
//             variants.length > 0
//               ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                 product.original_price
//               : product.original_price,
//         };
//       });
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError('Failed to load products. Please try again.');
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Validate variant ID exists in product_variants table
//   const validateVariant = async (variantId) => {
//     if (!variantId) return true; // No variant_id, so valid for non-variant products
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

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Select the cheapest variant with stock if variants exist
//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         // Validate variant exists in database
//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//       }

//       // Build the query to check for existing cart item
//       let query = supabase
//         .from('cart')
//         .select('id, quantity, variant_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id);

//       // Handle NULL variant_id correctly
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
//             duration: 3000,
//             position: 'top-center',
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
//           duration: 3000,
//           position: 'top-center',
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             variant_id: variantId,
//             quantity: 1,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//           });
//         if (insertError) {
//           console.error('Insert cart error:', insertError);
//           throw new Error(insertError.message || 'Failed to add to cart');
//         }
//         toast.success(`${product.name} added to cart!`, {
//           duration: 3000,
//           position: 'top-center',
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       const errorMessage = err.message || 'An unexpected error occurred while adding to cart';
//       toast.error(`Failed to add to cart: ${errorMessage}`, {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [navigate, session]);

//   // Buy now
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to proceed to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Select the cheapest variant with stock if variants exist
//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         // Validate variant exists in database
//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//       }

//       // Build the query to check for existing cart item
//       let query = supabase
//         .from('cart')
//         .select('id, quantity, variant_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id);

//       // Handle NULL variant_id correctly
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
//             duration: 3000,
//             position: 'top-center',
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
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             variant_id: variantId,
//             quantity: 1,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//           });
//         if (insertError) {
//           console.error('Insert cart error:', insertError);
//           throw new Error(insertError.message || 'Failed to add to cart');
//         }
//       }

//       toast.success('Added to cart! Redirecting...', {
//         duration: 2000,
//         position: 'top-center',
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       const errorMessage = err.message || 'An unexpected error occurred while adding to cart';
//       toast.error(`Failed to add to cart: ${errorMessage}`, {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [navigate, session]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             fetchNearbyProducts();
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         fetchNearbyProducts();
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="td-loading-container">
//       <div className="td-loading-animation">
//         <div className="td-loading-box">
//           <FaShoppingCart className="td-loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="td-loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, gifts, and home decoration on Markeet. Fast delivery within 40km in India."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, local shopping"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/" />
//       </Helmet>
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="td-search-bar sticky" ref={searchRef}>
//         <FaSearch className="td-search-icon" />
//         <input
//           type="text"
//           placeholder="Search electronics, fashion, jewellery..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="td-search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="td-suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])}
//                 aria-label={`Select ${suggestion.name}`}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="td-banner-slider">
//         {loadingBanners ? (
//           <div className="td-banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="td-banner-wrapper">
//                 <img src={banner.url} alt={`Markeet ${banner.name} Offer`} loading="lazy" />
//                 <button
//                   className="td-view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                   aria-label="View Offers"
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="td-categories-section">
//         <header className="td-cat-header">
//           <h2 className="td-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="td-cat-view-all" aria-label="View All Categories">
//             View All
//           </Link>
//         </header>
//         {error && <p className="td-cat-error">{error}</p>}
//         {loadingCategories ? (
//           <div className="td-cat-scroll">
//             {[...Array(6)].map((_, i) => (
//               <div key={i} className="td-cat-card-skeleton" />
//             ))}
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="td-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="td-cat-scroll">
//             {categories.map((category) => (
//               <Link
//                 to={`/products?category=${category.id}`}
//                 key={category.id}
//                 className="td-cat-card"
//                 aria-label={`View ${category.name} products`}
//               >
//                 <img
//                   src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                   alt={`${category.name} category`}
//                   className="td-cat-image"
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image')}
//                   loading="lazy"
//                 />
//                 <h3 className="td-cat-name">{category.name.trim()}</h3>
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="td-product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="td-product-card-skeleton">
//                 <div className="td-skeleton-image" />
//                 <div className="td-skeleton-text" />
//                 <div className="td-skeleton-text short" />
//                 <div className="td-skeleton-buttons">
//                   <div className="td-skeleton-btn" />
//                   <div className="td-skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="td-no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`td-product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="td-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
//               >
//                 <div className="td-product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="td-offer-badge">
//                       <span className="td-offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={`${product.name} product`}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="td-product-info">
//                   <h3 className="td-product-name">{product.name}</h3>
//                   <div className="td-price-section">
//                     <p className="td-product-price">
//                       ₹{product.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                       <p className="td-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="td-product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="td-cart-action-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="td-buy-action-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);


// import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/Home.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session, cartCount, setCartCount } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const searchRef = useRef(null);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
//     if (!checkNetworkStatus()) return;
//     try {
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setIsSeller(profileData?.is_seller || false);
//     } catch (err) {
//       console.error('Error fetching user role:', err);
//       toast.error('Failed to fetch user role.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [session]);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products and their variants
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setLoadingProducts(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         return;
//       }

//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, title, price, original_price, discount_amount, images, seller_id, stock, category_id')
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .in('seller_id', nearbySellerIds);
//       if (productError) throw productError;

//       const productIds = productData.map((p) => p.id);
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', productIds);
//       if (variantError) throw variantError;

//       const mappedProducts = productData.map((product) => {
//         const variants = variantData.filter((v) => v.product_id === product.id).map((v) => ({
//           id: v.id,
//           price: parseFloat(v.price) || 0,
//           originalPrice: v.original_price ? parseFloat(v.original_price) : null,
//           stock: v.stock || 0,
//           attributes: v.attributes || {},
//           images: v.images && v.images.length > 0 ? v.images : product.images,
//         }));
//         return {
//           id: product.id,
//           name: product.title || 'Unnamed Product',
//           images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//           price: parseFloat(product.price) || 0,
//           originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//           discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//           stock: product.stock || 0,
//           categoryId: product.category_id,
//           variants,
//           displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//           displayOriginalPrice:
//             variants.length > 0
//               ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                 product.original_price
//               : product.original_price,
//         };
//       });
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError('Failed to load products. Please try again.');
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingBanners(false);
//       return;
//     }
//     setLoadingBanners(true);
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Validate variant ID exists in product_variants table
//   const validateVariant = async (variantId) => {
//     if (!variantId) return true; // No variant_id, so valid for non-variant products
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

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Select the cheapest variant with stock if variants exist
//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         // Validate variant exists in database
//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//       }

//       // Build the query to check for existing cart item
//       let query = supabase
//         .from('cart')
//         .select('id, quantity, variant_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id);

//       // Handle NULL variant_id correctly
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
//             duration: 3000,
//             position: 'top-center',
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
//           duration: 3000,
//           position: 'top-center',
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
//         // Increment cart count for new item
//         setCartCount((prev) => prev + 1);
//         // Update local storage
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
//           duration: 3000,
//           position: 'top-center',
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       const errorMessage = err.message || 'An unexpected error occurred while adding to cart';
//       toast.error(`Failed to add to cart: ${errorMessage}`, {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [navigate, session, setCartCount]);

//   // Buy now
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to proceed to cart.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Select the cheapest variant with stock if variants exist
//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         // Validate variant exists in database
//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           return;
//         }
//       }

//       // Build the query to check for existing cart item
//       let query = supabase
//         .from('cart')
//         .select('id, quantity, variant_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id);

//       // Handle NULL variant_id correctly
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
//             duration: 3000,
//             position: 'top-center',
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
//         // Increment cart count for new item
//         setCartCount((prev) => prev + 1);
//         // Update local storage
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

//       toast.success('Added to cart! Redirecting...', {
//         duration: 2000,
//         position: 'top-center',
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       const errorMessage = err.message || 'An unexpected error occurred while adding to cart';
//       toast.error(`Failed to add to cart: ${errorMessage}`, {
//         duration: 3000,
//         position: 'top-center',
//       });
//     }
//   }, [navigate, session, setCartCount]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Handle clicks outside the search bar
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//     fetchCategories();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchNearbyProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             fetchNearbyProducts();
//           },
//           { timeout: 10000 }
//         );
//       } else {
//         fetchNearbyProducts();
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
//   }, [products, searchTerm]);

//   // Slider settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//     arrows: true,
//   };

//   if (loadingProducts && loadingBanners && loadingCategories) return (
//     <div className="td-loading-container">
//       <div className="td-loading-animation">
//         <div className="td-loading-box">
//           <FaShoppingCart className="td-loading-icon" />
//           <span>Finding the best deals for you...</span>
//         </div>
//         <div className="td-loading-dots">
//           <span>.</span><span>.</span><span>.</span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, gifts, and home decoration on Markeet. Fast delivery within 40km in India."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, local shopping"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/" />
//       </Helmet>
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

//       {/* Sticky Search Bar with Suggestions */}
//       <div className="td-search-bar sticky" ref={searchRef}>
//         <FaSearch className="td-search-icon" />
//         <input
//           type="text"
//           placeholder="Search electronics, fashion, jewellery..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search products"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="td-search-suggestions">
//             {suggestions.map((suggestion) => (
//               <li
//                 key={suggestion.id}
//                 className="td-suggestion-item"
//                 onClick={() => {
//                   setSearchTerm(suggestion.name);
//                   setIsSearchFocused(false);
//                   setSuggestions([]);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])}
//                 aria-label={`Select ${suggestion.name}`}
//               >
//                 {suggestion.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Banner Slider */}
//       <div className="td-banner-slider">
//         {loadingBanners ? (
//           <div className="td-banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner) => (
//               <div key={banner.name} className="td-banner-wrapper">
//                 <img src={banner.url} alt={`Markeet ${banner.name} Offer`} loading="lazy" />
//                 <button
//                   className="td-view-offers-btn"
//                   onClick={() => navigate('/categories')}
//                   aria-label="View Offers"
//                 >
//                   View Offers
//                 </button>
//               </div>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Featured Categories Section */}
//       <section className="td-categories-section">
//         <header className="td-cat-header">
//           <h2 className="td-cat-title">Explore Categories</h2>
//           <Link to="/categories" className="td-cat-view-all" aria-label="View All Categories">
//             View All
//           </Link>
//         </header>
//         {error && <p className="td-cat-error">{error}</p>}
//         {loadingCategories ? (
//           <div className="td-cat-scroll">
//             {[...Array(6)].map((_, i) => (
//               <div key={i} className="td-cat-card-skeleton" />
//             ))}
//           </div>
//         ) : categories.length === 0 ? (
//           <p className="td-cat-no-categories">No categories available.</p>
//         ) : (
//           <div className="td-cat-scroll">
//             {categories.map((category) => (
//               <Link
//                 to={`/products?category=${category.id}`}
//                 key={category.id}
//                 className="td-cat-card"
//                 aria-label={`View ${category.name} products`}
//               >
//                 <img
//                   src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                   alt={`${category.name} category`}
//                   className="td-cat-image"
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image')}
//                   loading="lazy"
//                 />
//                 <h3 className="td-cat-name">{category.name.trim()}</h3>
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="td-product-grid">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="td-product-card-skeleton">
//                 <div className="td-skeleton-image" />
//                 <div className="td-skeleton-text" />
//                 <div className="td-skeleton-text short" />
//                 <div className="td-skeleton-buttons">
//                   <div className="td-skeleton-btn" />
//                   <div className="td-skeleton-btn" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <p className="td-no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
//         ) : (
//           <div className={`td-product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="td-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name}`}
//               >
//                 <div className="td-product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="td-offer-badge">
//                       <span className="td-offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={`${product.name} product`}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="td-product-info">
//                   <h3 className="td-product-name">{product.name}</h3>
//                   <div className="td-price-section">
//                     <p className="td-product-price">
//                       ₹{product.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                       <p className="td-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </p>
//                     )}
//                   </div>
//                   <div className="td-product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="td-cart-action-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       <FaShoppingCart /> Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         buyNow(product);
//                       }}
//                       className="td-buy-action-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Home);



import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LocationContext } from '../App';
import { FaShoppingCart, FaSearch } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';
import { Toaster, toast } from 'react-hot-toast';
import '../style/Home.css';
import Footer from './Footer';
import { Helmet } from 'react-helmet-async';

// Utility to debounce a function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Distance calculation
function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
  const R = 6371;
  const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
  const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
  const a = Math.sin(latDiff / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function Home() {
  const { buyerLocation, setBuyerLocation, session, cartCount, setCartCount } = useContext(LocationContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [bannerImages, setBannerImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeller, setIsSeller] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);

  // Debounced search handler
  const debouncedSetSearchTerm = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Check network connectivity
  const checkNetworkStatus = () => {
    if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network and try again.', {
        duration: 3000,
        position: 'top-center',
      });
      return false;
    }
    return true;
  };

  // Fetch user role
  const fetchUserRole = useCallback(async () => {
    if (!session?.user) {
      setIsSeller(false);
      return;
    }
    if (!checkNetworkStatus()) return;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', session.user.id)
        .single();
      if (profileError) throw profileError;
      setIsSeller(profileData?.is_seller || false);
    } catch (err) {
      console.error('Error fetching user role:', err);
      toast.error('Failed to fetch user role.', {
        duration: 3000,
        position: 'top-center',
      });
    }
  }, [session]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!checkNetworkStatus()) {
      setLoadingCategories(false);
      return;
    }
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
        .limit(6);
      if (error) throw error;
      setCategories(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch nearby products and their variants
  const fetchNearbyProducts = useCallback(async () => {
    if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
      setLoadingProducts(false);
      return;
    }
    if (!checkNetworkStatus()) {
      setLoadingProducts(false);
      return;
    }
    setLoadingProducts(true);
    try {
      const { data: allSellers, error: sellersError } = await supabase
        .from('sellers')
        .select('id, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (sellersError) throw sellersError;

      const nearbySellerIds = allSellers
        .filter((seller) => {
          const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
          return distance !== null && distance <= 40;
        })
        .map((seller) => seller.id);

      if (nearbySellerIds.length === 0) {
        setProducts([]);
        return;
      }

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, title, price, original_price, discount_amount, images, seller_id, stock, category_id')
        .eq('is_approved', true)
        .eq('status', 'active')
        .in('seller_id', nearbySellerIds);
      if (productError) throw productError;

      const productIds = productData.map((p) => p.id);
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('id, product_id, price, original_price, stock, attributes, images')
        .eq('status', 'active')
        .in('product_id', productIds);
      if (variantError) throw variantError;

      const mappedProducts = productData.map((product) => {
        const variants = variantData.filter((v) => v.product_id === product.id).map((v) => ({
          id: v.id,
          price: parseFloat(v.price) || 0,
          originalPrice: v.original_price ? parseFloat(v.original_price) : null,
          stock: v.stock || 0,
          attributes: v.attributes || {},
          images: v.images && v.images.length > 0 ? v.images : product.images,
        }));
        return {
          id: product.id,
          name: product.title || 'Unnamed Product',
          images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
          price: parseFloat(product.price) || 0,
          originalPrice: product.original_price ? parseFloat(product.original_price) : null,
          discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
          stock: product.stock || 0,
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
      setProducts(mappedProducts);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [buyerLocation]);

  // Fetch banner images
  const fetchBannerImages = useCallback(async () => {
    if (!checkNetworkStatus()) {
      setLoadingBanners(false);
      return;
    }
    setLoadingBanners(true);
    try {
      const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
      const banners = await Promise.all(
        data
          .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
          .map(async (file) => {
            const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
            return { url: publicUrl, name: file.name };
          })
      );
      setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
    } catch (err) {
      console.error('Error fetching banner images:', err);
      setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
    } finally {
      setLoadingBanners(false);
    }
  }, []);

  // Validate variant ID exists in product_variants table
  const validateVariant = async (variantId) => {
    if (!variantId) return true;
    const { data, error } = await supabase
      .from('product_variants')
      .select('id')
      .eq('id', variantId)
      .eq('status', 'active')
      .single();
    if (error || !data) {
      console.error('Variant validation failed:', error);
      return false;
    }
    return true;
  };

  // Add to cart
  const addToCart = useCallback(async (product) => {
    if (!product || !product.id || !product.name || product.displayPrice === undefined) {
      toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
      return;
    }
    if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
      toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
      return;
    }
    if (!session?.user) {
      toast.error('Please log in to add items to cart.', { duration: 3000, position: 'top-center' });
      navigate('/auth');
      return;
    }
    if (!checkNetworkStatus()) return;

    try {
      // Validate product exists and is active
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, seller_id')
        .eq('id', product.id)
        .eq('is_approved', true)
        .eq('status', 'active')
        .single();
      if (productError || !productData) {
        toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
        return;
      }

      // Validate seller distance
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('id, latitude, longitude')
        .eq('id', productData.seller_id)
        .single();
      if (sellerError || !sellerData || calculateDistance(buyerLocation, sellerData) > 40) {
        toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
        return;
      }

      // Select the cheapest variant with stock if variants exist
      let itemToAdd = product;
      let variantId = null;

      if (product.variants.length > 0) {
        const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
        if (validVariants.length === 0) {
          toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
          return;
        }
        itemToAdd = validVariants.reduce((cheapest, variant) =>
          variant.price < cheapest.price ? variant : cheapest
        );
        variantId = itemToAdd.id;

        // Validate variant exists in database
        const isValidVariant = await validateVariant(variantId);
        if (!isValidVariant) {
          toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
          return;
        }
      }

      // Build the query to check for existing cart item
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
        console.error('Fetch cart item error:', fetchError);
        throw new Error(fetchError.message || 'Failed to check cart');
      }

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + 1;
        const stockLimit = itemToAdd.stock || product.stock;
        if (newQuantity > stockLimit) {
          toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
          return;
        }
        const { error: updateError } = await supabase
          .from('cart')
          .update({ quantity: newQuantity })
          .eq('id', existingCartItem.id);
        if (updateError) {
          console.error('Update cart error:', updateError);
          throw new Error(updateError.message || 'Failed to update cart');
        }
        toast.success(`${product.name} quantity updated in cart!`, { duration: 3000, position: 'top-center' });
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
          console.error('Insert cart error:', insertError);
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
        toast.success(`${product.name} added to cart!`, { duration: 3000, position: 'top-center' });
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
    }
  }, [navigate, session, setCartCount, buyerLocation]);

  // Buy now
  const buyNow = useCallback(async (product) => {
    if (!product || !product.id || !product.name || product.displayPrice === undefined) {
      toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
      return;
    }
    if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
      toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
      return;
    }
    if (!session?.user) {
      toast.error('Please log in to proceed to cart.', { duration: 3000, position: 'top-center' });
      navigate('/auth');
      return;
    }
    if (!checkNetworkStatus()) return;

    try {
      // Validate product exists and is active
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, seller_id')
        .eq('id', product.id)
        .eq('is_approved', true)
        .eq('status', 'active')
        .single();
      if (productError || !productData) {
        toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
        return;
      }

      // Validate seller distance
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('id, latitude, longitude')
        .eq('id', productData.seller_id)
        .single();
      if (sellerError || !sellerData || calculateDistance(buyerLocation, sellerData) > 40) {
        toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
        return;
      }

      // Select the cheapest variant with stock if variants exist
      let itemToAdd = product;
      let variantId = null;

      if (product.variants.length > 0) {
        const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
        if (validVariants.length === 0) {
          toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
          return;
        }
        itemToAdd = validVariants.reduce((cheapest, variant) =>
          variant.price < cheapest.price ? variant : cheapest
        );
        variantId = itemToAdd.id;

        // Validate variant exists in database
        const isValidVariant = await validateVariant(variantId);
        if (!isValidVariant) {
          toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
          return;
        }
      }

      // Build the query to check for existing cart item
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
        console.error('Fetch cart item error:', fetchError);
        throw new Error(fetchError.message || 'Failed to check cart');
      }

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + 1;
        const stockLimit = itemToAdd.stock || product.stock;
        if (newQuantity > stockLimit) {
          toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
          return;
        }
        const { error: updateError } = await supabase
          .from('cart')
          .update({ quantity: newQuantity })
          .eq('id', existingCartItem.id);
        if (updateError) {
          console.error('Update cart error:', updateError);
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
          console.error('Insert cart error:', insertError);
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

      toast.success('Added to cart! Redirecting...', { duration: 2000, position: 'top-center' });
      setTimeout(() => navigate('/cart'), 2000);
    } catch (err) {
      console.error('Error in Buy Now:', err);
      toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
    }
  }, [navigate, session, setCartCount, buyerLocation]);

  // Compute search suggestions
  useEffect(() => {
    if (!searchTerm || !isSearchFocused) {
      setSuggestions([]);
      return;
    }

    const filteredSuggestions = products
      .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 5);
    setSuggestions(filteredSuggestions);
  }, [searchTerm, products, isSearchFocused]);

  // Handle clicks outside the search bar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch data on mount and handle location
  useEffect(() => {
    fetchUserRole();
    fetchBannerImages();
    fetchCategories();

    if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            };
            setBuyerLocation(newLocation);
            fetchNearbyProducts();
          },
          (error) => {
            console.error('Geolocation error:', error);
            fetchNearbyProducts();
          },
          { timeout: 10000 }
        );
      } else {
        fetchNearbyProducts();
      }
    } else {
      fetchNearbyProducts();
    }
  }, [fetchUserRole, fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
  };

  if (loadingProducts && loadingBanners && loadingCategories) return (
    <div className="td-loading-container">
      <div className="td-loading-animation">
        <div className="td-loading-box">
          <FaShoppingCart className="td-loading-icon" />
          <span>Finding the best deals for you...</span>
        </div>
        <div className="td-loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="td-home">
      <Helmet>
        <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
        <meta
          name="description"
          content="Discover electronics, appliances, fashion, jewellery, gifts, and home decoration on Markeet. Fast delivery within 40km in India."
        />
        <meta
          name="keywords"
          content="ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, local shopping"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.markeet.com/" />
      </Helmet>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      {/* Sticky Search Bar with Suggestions */}
      <div className="td-search-bar sticky" ref={searchRef}>
        <FaSearch className="td-search-icon" />
        <input
          type="text"
          placeholder="Search electronics, fashion, jewellery..."
          onChange={(e) => debouncedSetSearchTerm(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          aria-label="Search products"
        />
        {suggestions.length > 0 && isSearchFocused && (
          <ul className="td-search-suggestions">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                className="td-suggestion-item"
                onClick={() => {
                  setSearchTerm(suggestion.name);
                  setIsSearchFocused(false);
                  setSuggestions([]);
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])}
                aria-label={`Select ${suggestion.name}`}
              >
                {suggestion.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Banner Slider */}
      <div className="td-banner-slider">
        {loadingBanners ? (
          <div className="td-banner-skeleton" />
        ) : (
          <Slider {...sliderSettings}>
            {bannerImages.map((banner) => (
              <div key={banner.name} className="td-banner-wrapper">
                <img src={banner.url} alt={`Markeet ${banner.name} Offer`} loading="lazy" />
                <button
                  className="td-view-offers-btn"
                  onClick={() => navigate('/categories')}
                  aria-label="View Offers"
                >
                  View Offers
                </button>
              </div>
            ))}
          </Slider>
        )}
      </div>

      {/* Featured Categories Section */}
      <section className="td-categories-section">
        <header className="td-cat-header">
          <h2 className="td-cat-title">Explore Categories</h2>
          <Link to="/categories" className="td-cat-view-all" aria-label="View All Categories">
            View All
          </Link>
        </header>
        {error && <p className="td-cat-error">{error}</p>}
        {loadingCategories ? (
          <div className="td-cat-scroll">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="td-cat-card-skeleton" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="td-cat-no-categories">No categories available.</p>
        ) : (
          <div className="td-cat-scroll">
            {categories.map((category) => (
              <Link
                to={`/products?category=${category.id}`}
                key={category.id}
                className="td-cat-card"
                aria-label={`View ${category.name} products`}
              >
                <img
                  src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
                  alt={`${category.name} category`}
                  className="td-cat-image"
                  onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image')}
                  loading="lazy"
                />
                <h3 className="td-cat-name">{category.name.trim()}</h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Products Section */}
      <section className="td-products-section">
        <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
        {loadingProducts ? (
          <div className="td-product-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="td-product-card-skeleton">
                <div className="td-skeleton-image" />
                <div className="td-skeleton-text" />
                <div className="td-skeleton-text short" />
                <div className="td-skeleton-buttons">
                  <div className="td-skeleton-btn" />
                  <div className="td-skeleton-btn" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="td-no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
        ) : (
          <div className={`td-product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="td-product-card"
                onClick={() => navigate(`/product/${product.id}`)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
                aria-label={`View ${product.name}`}
              >
                <div className="td-product-image-wrapper">
                  {product.discountAmount > 0 && (
                    <span className="td-offer-badge">
                      <span className="td-offer-label">Offer!</span>
                      Save ₹{product.discountAmount.toFixed(2)}
                    </span>
                  )}
                  <img
                    src={product.images[0]}
                    alt={`${product.name} product`}
                    onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
                    loading="lazy"
                  />
                </div>
                <div className="td-product-info">
                  <h3 className="td-product-name">{product.name}</h3>
                  <div className="td-price-section">
                    <p className="td-product-price">
                      ₹{product.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
                      <p className="td-original-price">
                        ₹{product.displayOriginalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  <div className="td-product-buttons">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="td-cart-action-btn"
                      disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <FaShoppingCart /> Add to Cart
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        buyNow(product);
                      }}
                      className="td-buy-action-btn"
                      disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
                      aria-label={`Buy ${product.name} now`}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default React.memo(Home);