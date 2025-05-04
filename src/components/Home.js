
// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// // Debounce utility function for geolocation
// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }

// // Custom retry function for Supabase requests
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// function Home() {
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]); // State for banner images
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState(''); // State for search
//   const navigate = useNavigate();

//   // Fetch nearby products, prioritizing products.images first, then variants
//   const fetchNearbyProducts = useCallback(async (userLocation) => {
//     if (!userLocation) {
//       console.warn('No user location available, using default Bengaluru location.');
//       userLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//     }

//     setLoading(true);
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id, title, price, images,
//             product_variants (id, attributes, price, stock, images)
//           `)
//           .eq('is_approved', true)
//       );
//       if (error) throw error;

//       if (data) {
//         setProducts(data.map(product => {
//           const hasProductImages = Array.isArray(product.images) && product.images.length > 0;
//           const variantWithImages = product.product_variants?.find(
//             (variant) => Array.isArray(variant.images) && variant.images.length > 0
//           );
//           const finalImages = hasProductImages
//             ? product.images
//             : (variantWithImages ? variantWithImages.images : ['https://dummyimage.com/150']);
//           const finalPrice = variantWithImages?.price ?? product.product_variants?.[0]?.price ?? product.price ?? 0;

//           // Debug log to verify image and price data
//           console.log(`Product ID ${product.id} (${product.title}):`, {
//             productImages: product.images,
//             variantImages: variantWithImages?.images,
//             finalImages,
//             finalPrice,
//           });

//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: finalImages,
//             price: finalPrice,
//           };
//         }));
//       }
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       setError(`Error: ${error.message || 'Failed to fetch products.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Fetch banner images from Supabase storage
//   const fetchBannerImages = useCallback(async () => {
//     try {
//       console.log('Attempting to list files in banner-images bucket...');
//       const { data, error } = await retryRequest(() =>
//         supabase.storage
//           .from('banner-images')
//           .list('', {
//             limit: 100,
//             sortBy: { column: 'name', order: 'asc' },
//           })
//       );

//       if (error) {
//         console.error('Error listing files:', error);
//         setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//         return;
//       }

//       if (!data || data.length === 0) {
//         console.warn('No files found in banner-images bucket');
//         setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//         return;
//       }

//       const imageFiles = data.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name) && file.name !== '.emptyFolderPlaceholder');
//       if (imageFiles.length === 0) {
//         setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//         return;
//       }

//       const bannerPromises = imageFiles.map(async (file) => {
//         const { data: { publicUrl }, error: urlError } = await retryRequest(() =>
//           supabase.storage.from('banner-images').getPublicUrl(file.name)
//         );
//         if (urlError) {
//           console.error(`Error fetching URL for ${file.name}:`, urlError);
//           return { url: 'https://dummyimage.com/1200x300?text=Banner+Image', name: file.name };
//         }
//         return { url: publicUrl, name: file.name };
//       });

//       const bannerImagesResult = await Promise.all(bannerPromises);
//       setBannerImages(bannerImagesResult);
//     } catch (error) {
//       console.error('Error fetching banner images:', error);
//       setError(`Error fetching banner images: ${error.message}`);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//     }
//   }, []);

//   // Add product to cart (simplified)
//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       console.error('Invalid product:', product);
//       setError('Cannot add invalid product to cart.');
//       return;
//     }

//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         return;
//       }

//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existingItem = storedCart.find(item => item.id === product.id);

//       if (existingItem) {
//         const updatedCart = storedCart.map(item =>
//           item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
//         );
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       } else {
//         const newCartItem = {
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//         };
//         localStorage.setItem('cart', JSON.stringify([...storedCart, newCartItem]));
//       }
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       setError(`Error: ${error.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   // Handle product click to show details (simplified modal for now)
//   const handleProductClick = (product) => {
//     navigate(`/product/${product.id}`);
//   };

//   // Debounced geolocation handler (for future location-based filtering)
//   const handleGeolocation = useCallback(debounce((position) => {
//     const { latitude, longitude } = position.coords;
//     setLocation({ lat: latitude, lon: longitude });
//     console.log('Detected location:', { lat: latitude, lon: longitude });
//   }, 1000), []);

//   // Slider settings for the banner carousel
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//   };

//   useEffect(() => {
//     fetchNearbyProducts(location);
//     fetchBannerImages();

//     if (navigator.geolocation) {
//       const watchId = navigator.geolocation.watchPosition(
//         handleGeolocation,
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError('Location access denied. Using default Bengaluru location.');
//           setLocation({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: false, timeout: 3000, maximumAge: 0 }
//       );
//       return () => navigator.geolocation.clearWatch(watchId);
//     } else {
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       setLocation({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchNearbyProducts, fetchBannerImages, handleGeolocation]);

//   // Filter products based on search term
//   const filteredProducts = products.filter(product =>
//     product.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="home">
//       {/* Header with "FreshCart" */}
//       <h1 style={{ color: '#007bff', textAlign: 'center', padding: '20px' }}>FreshCart</h1>

//       {/* Search Bar */}
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           style={{ padding: '10px', width: '80%', margin: '0 auto', display: 'block', borderRadius: '5px', border: '1px solid #007bff' }}
//         />
//       </div>

//       {/* Slide Banner (Carousel) */}
//       <div className="banner-slider">
//         {bannerImages.length > 0 ? (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, index) => (
//               <Link key={index} to={`/product/${index + 1}`} style={{ display: 'block', textDecoration: 'none' }}>
//                 <div style={{ textAlign: 'center' }}>
//                   <img 
//                     src={banner.url} 
//                     alt={`Banner ${banner.name}`} 
//                     onError={(e) => { 
//                       console.error('Banner image load failed:', banner.url);
//                       e.target.src = 'https://dummyimage.com/1200x300?text=Default+Banner'; 
//                     }}
//                     style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '5px' }}
//                   />
//                   <p style={{ color: '#007bff', padding: '10px' }}>Featured Product {index + 1}</p>
//                 </div>
//               </Link>
//             ))}
//           </Slider>
//         ) : (
//           <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
//             No banner images available. Please upload image files (e.g., .jpg, .png) to the banner-images bucket in Supabase.
//           </p>
//         )}
//       </div>

//       {error && <p style={{ color: '#ff0000', textAlign: 'center', padding: '10px' }}>{error}</p>}
//       {loading ? (
//         <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Loading...</p>
//       ) : (
//         <div className="product-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', padding: '20px', gap: '20px' }}>
//           {filteredProducts.map((product) => (
//             <div 
//               key={product.id} 
//               className="product-card" 
//               onClick={() => handleProductClick(product)}
//               style={{ 
//                 cursor: 'pointer', 
//                 border: '1px solid #ccc', 
//                 borderRadius: '8px', 
//                 padding: '15px', 
//                 width: '250px', 
//                 backgroundColor: '#fff', 
//                 boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' 
//               }}
//             >
//               <img 
//                 src={product.images[0] || 'https://dummyimage.com/150'} 
//                 alt={product.name || 'Unnamed Product'} 
//                 onError={(e) => { 
//                   console.error('Product image load failed for:', product.name, 'URL:', product.images[0] || 'N/A');
//                   e.target.src = 'https://dummyimage.com/150'; 
//                 }}
//                 style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
//               />
//               <h3 style={{ color: '#007bff', margin: '10px 0' }}>{product.name}</h3>
//               <p style={{ color: '#000', margin: '5px 0' }}>
//                 ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//               </p>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
//                 style={{ 
//                   backgroundColor: '#007bff', 
//                   color: 'white', 
//                   border: 'none', 
//                   padding: '8px 16px', 
//                   borderRadius: '5px', 
//                   cursor: 'pointer', 
//                   marginRight: '10px' 
//                 }}
//               >
//                 Add to Cart
//               </button>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); navigate('/cart', { state: { product } }); }} 
//                 style={{ 
//                   backgroundColor: '#28a745', 
//                   color: 'white', 
//                   border: 'none', 
//                   padding: '8px 16px', 
//                   borderRadius: '5px', 
//                   cursor: 'pointer' 
//                 }}
//               >
//                 Buy Now
//               </button>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Cart Icon */}
//       <div className="cart-icon" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
//         <Link to="/cart" style={{ textDecoration: 'none' }}>
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>

//       {/* Footer */}
//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff', marginTop: '10px' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Home;


//up code working


// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// // Debounce utility function for geolocation
// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }

// // Custom retry function for Supabase requests
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// function Home() {
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const navigate = useNavigate();

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async (userLocation) => {
//     if (!userLocation) {
//       console.warn('No user location available, using default Bengaluru location.');
//       userLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//     }

//     setLoading(true);
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id, title, price, images,
//             product_variants (id, attributes, price, stock, images)
//           `)
//           .eq('is_approved', true)
//       );
//       if (error) throw error;

//       if (data) {
//         const mappedProducts = data.map(product => {
//           const hasProductImages = Array.isArray(product.images) && product.images.length > 0;
//           const variantWithImages = product.product_variants?.find(
//             (variant) => Array.isArray(variant.images) && variant.images.length > 0
//           );
//           const finalImages = hasProductImages
//             ? product.images
//             : (variantWithImages ? variantWithImages.images : ['https://dummyimage.com/150']);
//           const finalPrice = variantWithImages?.price ?? product.product_variants?.[0]?.price ?? product.price ?? 0;

//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: finalImages,
//             price: finalPrice,
//           };
//         });
//         setProducts(mappedProducts);
//         console.log('Fetched products:', mappedProducts); // Debug log
//       } else {
//         setProducts([]);
//         console.log('No products returned from Supabase.');
//       }
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       setError(`Error: ${error.message || 'Failed to fetch products.'}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Fetch banner images from Supabase storage
//   const fetchBannerImages = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.storage
//           .from('banner-images')
//           .list('', {
//             limit: 100,
//             sortBy: { column: 'name', order: 'asc' },
//           })
//       );

//       if (error) {
//         setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//         return;
//       }

//       if (!data || data.length === 0) {
//         setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//         return;
//       }

//       const imageFiles = data.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name) && file.name !== '.emptyFolderPlaceholder');
//       if (imageFiles.length === 0) {
//         setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//         return;
//       }

//       const bannerPromises = imageFiles.map(async (file) => {
//         const { data: { publicUrl }, error: urlError } = await retryRequest(() =>
//           supabase.storage.from('banner-images').getPublicUrl(file.name)
//         );
//         if (urlError) {
//           return { url: 'https://dummyimage.com/1200x300?text=Banner+Image', name: file.name };
//         }
//         return { url: publicUrl, name: file.name };
//       });

//       const bannerImagesResult = await Promise.all(bannerPromises);
//       setBannerImages(bannerImagesResult);
//     } catch (error) {
//       console.error('Error fetching banner images:', error);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//     }
//   }, []);

//   // Add product to cart
//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       console.error('Invalid product:', product);
//       setError('Cannot add invalid product to cart.');
//       return;
//     }

//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }

//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existingItem = storedCart.find(item => item.id === product.id);

//       if (existingItem) {
//         const updatedCart = storedCart.map(item =>
//           item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
//         );
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       } else {
//         const newCartItem = {
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//         };
//         localStorage.setItem('cart', JSON.stringify([...storedCart, newCartItem]));
//       }
//       setError(null);
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       setError(`Error: ${error.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   // Handle product click to show details
//   const handleProductClick = (product) => {
//     navigate(`/product/${product.id}`);
//   };

//   // Debounced geolocation handler
//   const handleGeolocation = useCallback(debounce((position) => {
//     const { latitude, longitude } = position.coords;
//     setLocation({ lat: latitude, lon: longitude });
//     console.log('Detected location:', { lat: latitude, lon: longitude });
//     fetchNearbyProducts({ lat: latitude, lon: longitude });
//   }, 1000), [fetchNearbyProducts]);

//   // Slider settings for the banner carousel
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//   };

//   useEffect(() => {
//     fetchBannerImages();

//     if (navigator.geolocation) {
//       const watchId = navigator.geolocation.watchPosition(
//         handleGeolocation,
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError('Location access denied. Using default Bengaluru location.');
//           setLocation({ lat: 12.9753, lon: 77.591 });
//           fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: false, timeout: 3000, maximumAge: 0 }
//       );
//       return () => navigator.geolocation.clearWatch(watchId);
//     } else {
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       setLocation({ lat: 12.9753, lon: 77.591 });
//       fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchBannerImages, handleGeolocation, fetchNearbyProducts]);

//   // Filter products based on search term
//   const filteredProducts = products.filter(product => {
//     const matches = product.name.toLowerCase().includes(searchTerm.toLowerCase());
//     if (!matches && searchTerm) {
//       console.log(`Product "${product.name}" does not match search term "${searchTerm}"`);
//     }
//     return matches;
//   });

//   return (
//     <div className="home">
//       <h1 style={{ color: '#007bff', textAlign: 'center', padding: '20px' }}>FreshCart</h1>

//       {/* Search Bar */}
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           style={{ padding: '10px', width: '80%', margin: '0 auto', display: 'block', borderRadius: '5px', border: '1px solid #007bff' }}
//         />
//       </div>

//       {/* Slide Banner (Carousel) */}
//       <div className="banner-slider">
//         {bannerImages.length > 0 ? (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, index) => (
//               <Link key={index} to={`/product/${index + 1}`} style={{ display: 'block', textDecoration: 'none' }}>
//                 <div style={{ textAlign: 'center' }}>
//                   <img 
//                     src={banner.url} 
//                     alt={`Banner ${banner.name}`} 
//                     onError={(e) => { 
//                       console.error('Banner image load failed:', banner.url);
//                       e.target.src = 'https://dummyimage.com/1200x300?text=Default+Banner'; 
//                     }}
//                     style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '5px' }}
//                   />
//                   <p style={{ color: '#007bff', padding: '10px' }}>Featured Product {index + 1}</p>
//                 </div>
//               </Link>
//             ))}
//           </Slider>
//         ) : (
//           <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
//             No banner images available.
//           </p>
//         )}
//       </div>

//       {error && <p style={{ color: '#ff0000', textAlign: 'center', padding: '10px' }}>{error}</p>}
//       {loading ? (
//         <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Loading...</p>
//       ) : (
//         <div className="product-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', padding: '20px', gap: '20px' }}>
//           {filteredProducts.length > 0 ? (
//             filteredProducts.map((product) => (
//               <div 
//                 key={product.id} 
//                 className="product-card" 
//                 onClick={() => handleProductClick(product)}
//                 style={{ 
//                   cursor: 'pointer', 
//                   border: '1px solid #ccc', 
//                   borderRadius: '8px', 
//                   padding: '15px', 
//                   width: '250px', 
//                   backgroundColor: '#fff', 
//                   boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' 
//                 }}
//               >
//                 <img 
//                   src={product.images[0] || 'https://dummyimage.com/150'} 
//                   alt={product.name || 'Unnamed Product'} 
//                   onError={(e) => { 
//                     console.error('Product image load failed for:', product.name, 'URL:', product.images[0] || 'N/A');
//                     e.target.src = 'https://dummyimage.com/150'; 
//                   }}
//                   style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
//                 />
//                 <h3 style={{ color: '#007bff', margin: '10px 0' }}>{product.name}</h3>
//                 <p style={{ color: '#000', margin: '5px 0' }}>
//                   ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                 </p>
//                 <button 
//                   onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
//                   style={{ 
//                     backgroundColor: '#007bff', 
//                     color: 'white', 
//                     border: 'none', 
//                     padding: '8px 16px', 
//                     borderRadius: '5px', 
//                     cursor: 'pointer', 
//                     marginRight: '10px' 
//                   }}
//                 >
//                   Add to Cart
//                 </button>
//                 <button 
//                   onClick={(e) => { e.stopPropagation(); navigate('/cart', { state: { product } }); }} 
//                   style={{ 
//                     backgroundColor: '#28a745', 
//                     color: 'white', 
//                     border: 'none', 
//                     padding: '8px 16px', 
//                     borderRadius: '5px', 
//                     cursor: 'pointer' 
//                   }}
//                 >
//                   Buy Now
//                 </button>
//               </div>
//             ))
//           ) : (
//             <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
//               {searchTerm 
//                 ? 'No products found matching your search.' 
//                 : 'No products available at the moment.'}
//             </p>
//           )}
//         </div>
//       )}

//       {/* Cart Icon */}
//       <div className="cart-icon" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
//         <Link to="/cart" style={{ textDecoration: 'none' }}>
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>

//       {/* Footer */}
//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff', marginTop: '10px' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Home;




// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// // Debounce utility function for geolocation
// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }

// // Custom retry function for Supabase requests
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// function Home() {
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const navigate = useNavigate();

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async (userLocation) => {
//     if (!userLocation) {
//       console.warn('No user location available, using default Bengaluru location.');
//       userLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//     }

//     setLoading(true);
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id, title, price, images,
//             product_variants (id, attributes, price, stock, images)
//           `)
//           .eq('is_approved', true)
//       );
//       if (error) throw error;

//       if (data) {
//         const mappedProducts = data.map(product => {
//           const hasProductImages = Array.isArray(product.images) && product.images.length > 0;
//           const variantWithImages = product.product_variants?.find(
//             (variant) => Array.isArray(variant.images) && variant.images.length > 0
//           );
//           const finalImages = hasProductImages
//             ? product.images
//             : (variantWithImages ? variantWithImages.images : ['https://dummyimage.com/150']);

//           // Prioritize product.price, then variant price, with better logging
//           const productPrice = product.price !== null && product.price !== undefined ? product.price : null;
//           const variantPrice = variantWithImages?.price ?? product.product_variants?.[0]?.price;
//           const finalPrice = productPrice ?? variantPrice ?? 0; // Default to 0 only if no price exists

//           console.log(`Product ID ${product.id} (${product.title}):`, {
//             productPrice,
//             variantPrice,
//             finalPrice,
//             product_variants: product.product_variants,
//           });

//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: finalImages,
//             price: finalPrice,
//           };
//         });
//         setProducts(mappedProducts);
//         console.log('Fetched products:', mappedProducts);
//       } else {
//         setProducts([]);
//         console.log('No products returned from Supabase.');
//       }
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       setError(`Error: ${error.message || 'Failed to fetch products.'}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Fetch banner images from Supabase storage
//   const fetchBannerImages = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.storage
//           .from('banner-images')
//           .list('', {
//             limit: 100,
//             sortBy: { column: 'name', order: 'asc' },
//           })
//       );

//       if (error) {
//         setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//         return;
//       }

//       if (!data || data.length === 0) {
//         setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//         return;
//       }

//       const imageFiles = data.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name) && file.name !== '.emptyFolderPlaceholder');
//       if (imageFiles.length === 0) {
//         setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//         return;
//       }

//       const bannerPromises = imageFiles.map(async (file) => {
//         const { data: { publicUrl }, error: urlError } = await retryRequest(() =>
//           supabase.storage.from('banner-images').getPublicUrl(file.name)
//         );
//         if (urlError) {
//           return { url: 'https://dummyimage.com/1200x300?text=Banner+Image', name: file.name };
//         }
//         return { url: publicUrl, name: file.name };
//       });

//       const bannerImagesResult = await Promise.all(bannerPromises);
//       setBannerImages(bannerImagesResult);
//     } catch (error) {
//       console.error('Error fetching banner images:', error);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
//     }
//   }, []);

//   // Add product to cart
//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       console.error('Invalid product:', product);
//       setError('Cannot add invalid product to cart.');
//       return;
//     }

//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }

//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existingItem = storedCart.find(item => item.id === product.id);

//       if (existingItem) {
//         const updatedCart = storedCart.map(item =>
//           item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
//         );
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       } else {
//         const newCartItem = {
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//         };
//         localStorage.setItem('cart', JSON.stringify([...storedCart, newCartItem]));
//       }
//       setError(null);
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       setError(`Error: ${error.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   // Handle product click to show details
//   const handleProductClick = (product) => {
//     navigate(`/product/${product.id}`);
//   };

//   // Debounced geolocation handler
//   const handleGeolocation = useCallback(debounce((position) => {
//     const { latitude, longitude } = position.coords;
//     setLocation({ lat: latitude, lon: longitude });
//     console.log('Detected location:', { lat: latitude, lon: longitude });
//     fetchNearbyProducts({ lat: latitude, lon: longitude });
//   }, 1000), [fetchNearbyProducts]);

//   // Slider settings for the banner carousel
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//   };

//   useEffect(() => {
//     fetchBannerImages();

//     if (navigator.geolocation) {
//       const watchId = navigator.geolocation.watchPosition(
//         handleGeolocation,
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError('Location access denied. Using default Bengaluru location.');
//           setLocation({ lat: 12.9753, lon: 77.591 });
//           fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: false, timeout: 3000, maximumAge: 0 }
//       );
//       return () => navigator.geolocation.clearWatch(watchId);
//     } else {
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       setLocation({ lat: 12.9753, lon: 77.591 });
//       fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchBannerImages, handleGeolocation, fetchNearbyProducts]);

//   // Filter products based on search term
//   const filteredProducts = products.filter(product => {
//     const matches = product.name.toLowerCase().includes(searchTerm.toLowerCase());
//     if (!matches && searchTerm) {
//       console.log(`Product "${product.name}" does not match search term "${searchTerm}"`);
//     }
//     return matches;
//   });

//   return (
//     <div className="home">
//       <h1 style={{ color: '#007bff', textAlign: 'center', padding: '20px' }}>FreshCart</h1>

//       {/* Search Bar */}
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           style={{ padding: '10px', width: '80%', margin: '0 auto', display: 'block', borderRadius: '5px', border: '1px solid #007bff' }}
//         />
//       </div>

//       {/* Slide Banner (Carousel) */}
//       <div className="banner-slider">
//         {bannerImages.length > 0 ? (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, index) => (
//               <Link key={index} to={`/product/${index + 1}`} style={{ display: 'block', textDecoration: 'none' }}>
//                 <div style={{ textAlign: 'center' }}>
//                   <img 
//                     src={banner.url} 
//                     alt={`Banner ${banner.name}`} 
//                     onError={(e) => { 
//                       console.error('Banner image load failed:', banner.url);
//                       e.target.src = 'https://dummyimage.com/1200x300?text=Default+Banner'; 
//                     }}
//                     style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '5px' }}
//                   />
//                   <p style={{ color: '#007bff', padding: '10px' }}>Featured Product {index + 1}</p>
//                 </div>
//               </Link>
//             ))}
//           </Slider>
//         ) : (
//           <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
//             No banner images available.
//           </p>
//         )}
//       </div>

//       {error && <p style={{ color: '#ff0000', textAlign: 'center', padding: '10px' }}>{error}</p>}
//       {loading ? (
//         <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Loading...</p>
//       ) : (
//         <div className="product-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', padding: '20px', gap: '20px' }}>
//           {filteredProducts.length > 0 ? (
//             filteredProducts.map((product) => (
//               <div 
//                 key={product.id} 
//                 className="product-card" 
//                 onClick={() => handleProductClick(product)}
//                 style={{ 
//                   cursor: 'pointer', 
//                   border: '1px solid #ccc', 
//                   borderRadius: '8px', 
//                   padding: '15px', 
//                   width: '250px', 
//                   backgroundColor: '#fff', 
//                   boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' 
//                 }}
//               >
//                 <img 
//                   src={product.images[0] || 'https://dummyimage.com/150'} 
//                   alt={product.name || 'Unnamed Product'} 
//                   onError={(e) => { 
//                     console.error('Product image load failed for:', product.name, 'URL:', product.images[0] || 'N/A');
//                     e.target.src = 'https://dummyimage.com/150'; 
//                   }}
//                   style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
//                 />
//                 <h3 style={{ color: '#007bff', margin: '10px 0' }}>{product.name}</h3>
//                 <p style={{ color: '#000', margin: '5px 0' }}>
//                   ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                 </p>
//                 <button 
//                   onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
//                   style={{ 
//                     backgroundColor: '#007bff', 
//                     color: 'white', 
//                     border: 'none', 
//                     padding: '8px 16px', 
//                     borderRadius: '5px', 
//                     cursor: 'pointer', 
//                     marginRight: '10px' 
//                   }}
//                 >
//                   Add to Cart
//                 </button>
//                 <button 
//                   onClick={(e) => { e.stopPropagation(); navigate('/cart', { state: { product } }); }} 
//                   style={{ 
//                     backgroundColor: '#28a745', 
//                     color: 'white', 
//                     border: 'none', 
//                     padding: '8px 16px', 
//                     borderRadius: '5px', 
//                     cursor: 'pointer' 
//                   }}
//                 >
//                   Buy Now
//                 </button>
//               </div>
//             ))
//           ) : (
//             <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
//               {searchTerm 
//                 ? 'No products found matching your search.' 
//                 : 'No products available at the moment.'}
//             </p>
//           )}
//         </div>
//       )}

//       {/* Cart Icon */}
//       <div className="cart-icon" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
//         <Link to="/cart" style={{ textDecoration: 'none' }}>
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>

//       {/* Footer */}
//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff', marginTop: '10px' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Home;



// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// // Utility: Debounce function
// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }

// // Utility: Custom retry function for Supabase requests
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// function Home() {
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const navigate = useNavigate();

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async (userLocation) => {
//     // Fallback to Bengaluru if location not provided
//     if (!userLocation) {
//       console.warn('No user location available, using default Bengaluru location.');
//       userLocation = { lat: 12.9753, lon: 77.591 };
//     }
//     setLoading(true);
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id, title, price, images,
//             product_variants (id, attributes, price, stock, images)
//           `)
//           .eq('is_approved', true)
//       );
//       if (error) throw error;
//       if (data) {
//         const mappedProducts = data.map(product => {
//           const hasProductImages = Array.isArray(product.images) && product.images.length > 0;
//           const variantWithImages = product.product_variants?.find(
//             (variant) => Array.isArray(variant.images) && variant.images.length > 0
//           );
//           const finalImages = hasProductImages
//             ? product.images
//             : (variantWithImages ? variantWithImages.images : ['https://dummyimage.com/150']);
//           const productPrice =
//             product.price !== null && product.price !== undefined
//               ? product.price
//               : null;
//           const variantPrice =
//             variantWithImages?.price ?? product.product_variants?.[0]?.price;
//           const finalPrice = productPrice ?? variantPrice ?? 0;
//           console.log(`Product ID ${product.id} (${product.title}):`, {
//             productPrice,
//             variantPrice,
//             finalPrice,
//             product_variants: product.product_variants,
//           });
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: finalImages,
//             price: finalPrice,
//           };
//         });
//         setProducts(mappedProducts);
//         console.log('Fetched products:', mappedProducts);
//       } else {
//         setProducts([]);
//         console.log('No products returned from Supabase.');
//       }
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       setError(`Error: ${error.message || 'Failed to fetch products.'}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Fetch banner images from Supabase storage
//   const fetchBannerImages = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.storage
//           .from('banner-images')
//           .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } })
//       );
//       if (error) {
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }
//       if (!data || data.length === 0) {
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }
//       const imageFiles = data.filter(
//         file => /\.(jpg|jpeg|png|gif)$/i.test(file.name) && file.name !== '.emptyFolderPlaceholder'
//       );
//       if (imageFiles.length === 0) {
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }
//       const bannerPromises = imageFiles.map(async (file) => {
//         const { data: { publicUrl }, error: urlError } = await retryRequest(() =>
//           supabase.storage.from('banner-images').getPublicUrl(file.name)
//         );
//         if (urlError) {
//           return { url: 'https://dummyimage.com/1200x300?text=Banner+Image', name: file.name };
//         }
//         return { url: publicUrl, name: file.name };
//       });
//       const bannerImagesResult = await Promise.all(bannerPromises);
//       setBannerImages(bannerImagesResult);
//     } catch (error) {
//       console.error('Error fetching banner images:', error);
//       setBannerImages([
//         { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//       ]);
//     }
//   }, []);

//   // Navigate to product details page
//   const handleProductClick = (product) => {
//     navigate(`/product/${product.id}`);
//   };

//   // Add product to cart
//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       console.error('Invalid product:', product);
//       setError('Cannot add invalid product to cart.');
//       return;
//     }
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existingItem = storedCart.find(item => item.id === product.id);
//       if (existingItem) {
//         const updatedCart = storedCart.map(item =>
//           item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
//         );
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       } else {
//         const newCartItem = {
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//         };
//         localStorage.setItem('cart', JSON.stringify([...storedCart, newCartItem]));
//       }
//       setError(null);
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       setError(`Error: ${error.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   // Debounced geolocation handler
//   const handleGeolocation = useCallback(
//     debounce((position) => {
//       const { latitude, longitude } = position.coords;
//       setLocation({ lat: latitude, lon: longitude });
//       console.log('Detected location:', { lat: latitude, lon: longitude });
//       fetchNearbyProducts({ lat: latitude, lon: longitude });
//     }, 1000),
//     [fetchNearbyProducts]
//   );

//   // Slider settings for the banner carousel
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//   };

//   useEffect(() => {
//     fetchBannerImages();
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         handleGeolocation,
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError('Location access denied. Using default Bengaluru location.');
//           setLocation({ lat: 12.9753, lon: 77.591 });
//           fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: false, timeout: 3000, maximumAge: 0 }
//       );
//     } else {
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       setLocation({ lat: 12.9753, lon: 77.591 });
//       fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchBannerImages, handleGeolocation, fetchNearbyProducts]);

//   // Filter products based on search term
//   const filteredProducts = products.filter(product =>
//     product.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="home">
//       <h1 style={{ color: '#007bff', textAlign: 'center', padding: '20px' }}>FreshCart</h1>

//       {/* Search Bar */}
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           style={{
//             padding: '10px',
//             width: '80%',
//             margin: '0 auto',
//             display: 'block',
//             borderRadius: '5px',
//             border: '1px solid #007bff',
//           }}
//         />
//       </div>

//       {/* Slide Banner (Carousel) */}
//       <div className="banner-slider">
//         {bannerImages.length > 0 ? (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, index) => (
//               <Link
//                 key={index}
//                 to={`/product/${index + 1}`}
//                 style={{ display: 'block', textDecoration: 'none' }}
//               >
//                 <div style={{ textAlign: 'center' }}>
//                   <img
//                     src={banner.url}
//                     alt={`Banner ${banner.name}`}
//                     onError={(e) => {
//                       console.error('Banner image load failed:', banner.url);
//                       e.target.src = 'https://dummyimage.com/1200x300?text=Default+Banner';
//                     }}
//                     style={{
//                       width: '100%',
//                       maxHeight: '300px',
//                       objectFit: 'cover',
//                       borderRadius: '5px',
//                     }}
//                   />
//                   <p style={{ color: '#007bff', padding: '10px' }}>
//                     Featured Product {index + 1}
//                   </p>
//                 </div>
//               </Link>
//             ))}
//           </Slider>
//         ) : (
//           <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
//             No banner images available.
//           </p>
//         )}
//       </div>

//       {error && (
//         <p style={{ color: '#ff0000', textAlign: 'center', padding: '10px' }}>
//           {error}
//         </p>
//       )}
//       {loading ? (
//         <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
//           Loading...
//         </p>
//       ) : (
//         <div
//           className="product-grid"
//           style={{
//             display: 'flex',
//             flexWrap: 'wrap',
//             justifyContent: 'center',
//             padding: '20px',
//             gap: '20px',
//           }}
//         >
//           {filteredProducts.length > 0 ? (
//             filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => handleProductClick(product)}
//                 style={{
//                   cursor: 'pointer',
//                   border: '1px solid #ccc',
//                   borderRadius: '8px',
//                   padding: '15px',
//                   width: '250px',
//                   backgroundColor: '#fff',
//                   boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
//                 }}
//               >
//                 <img
//                   src={product.images[0] || 'https://dummyimage.com/150'}
//                   alt={product.name || 'Unnamed Product'}
//                   onError={(e) => {
//                     console.error(
//                       'Product image load failed for:',
//                       product.name,
//                       'URL:',
//                       product.images[0] || 'N/A'
//                     );
//                     e.target.src = 'https://dummyimage.com/150';
//                   }}
//                   style={{
//                     width: '100%',
//                     height: '200px',
//                     objectFit: 'cover',
//                     borderRadius: '4px',
//                   }}
//                 />
//                 <h3 style={{ color: '#007bff', margin: '10px 0' }}>
//                   {product.name}
//                 </h3>
//                 <p style={{ color: '#000', margin: '5px 0' }}>
//                   ₹
//                   {product.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     addToCart(product);
//                   }}
//                   style={{
//                     backgroundColor: '#007bff',
//                     color: 'white',
//                     border: 'none',
//                     padding: '8px 16px',
//                     borderRadius: '5px',
//                     cursor: 'pointer',
//                     marginRight: '10px',
//                   }}
//                 >
//                   Add to Cart
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     navigate('/cart', { state: { product } });
//                   }}
//                   style={{
//                     backgroundColor: '#28a745',
//                     color: 'white',
//                     border: 'none',
//                     padding: '8px 16px',
//                     borderRadius: '5px',
//                     cursor: 'pointer',
//                   }}
//                 >
//                   Buy Now
//                 </button>
//               </div>
//             ))
//           ) : (
//             <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
//               {searchTerm
//                 ? 'No products found matching your search.'
//                 : 'No products available at the moment.'}
//             </p>
//           )}
//         </div>
//       )}

//       {/* Cart Icon */}
//       <div className="cart-icon" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
//         <Link to="/cart" style={{ textDecoration: 'none' }}>
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>

//       {/* Footer */}
//       <div
//         className="footer"
//         style={{
//           backgroundColor: '#f8f9fa',
//           padding: '10px',
//           textAlign: 'center',
//           color: '#666',
//           marginTop: '20px',
//         }}
//       >
//         <div
//           className="footer-icons"
//           style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}
//         >
//           <span
//             style={{
//               backgroundColor: '#007bff',
//               borderRadius: '50%',
//               width: '40px',
//               height: '40px',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               color: 'white',
//             }}
//           >
//             🏠
//           </span>
//           <span
//             style={{
//               backgroundColor: '#007bff',
//               borderRadius: '50%',
//               width: '40px',
//               height: '40px',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               color: 'white',
//             }}
//           >
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff', marginTop: '10px' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Home;



// src/components/Home.js

// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// /**
//  * Debounce utility function
//  */
// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }

// /**
//  * Exponential backoff retry
//  */
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
//   return null;
// }

// function Home() {
//   const navigate = useNavigate();

//   // State
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');

//   // --------------------------------
//   // Fetch products from Supabase
//   // --------------------------------
//   const fetchNearbyProducts = useCallback(async (userLocation) => {
//     // fallback if none
//     if (!userLocation) {
//       console.warn('No user location available, using default Bengaluru location.');
//       userLocation = { lat: 12.9753, lon: 77.591 };
//     }
//     setLoading(true);
//     try {
//       // Basic fetch of products
//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id, title, price, images,
//             product_variants (id, attributes, price, stock, images)
//           `)
//           .eq('is_approved', true)
//       );
//       if (error) throw error;

//       if (data) {
//         const mappedProducts = data.map((product) => {
//           // images + price logic
//           const hasProductImages = Array.isArray(product.images) && product.images.length > 0;
//           const variantWithImages = product.product_variants?.find(
//             (variant) => Array.isArray(variant.images) && variant.images.length > 0
//           );
//           const finalImages = hasProductImages
//             ? product.images
//             : variantWithImages
//             ? variantWithImages.images
//             : ['https://dummyimage.com/150'];
//           // figure out final price
//           const productPrice =
//             product.price !== null && product.price !== undefined
//               ? product.price
//               : null;
//           const variantPrice = variantWithImages?.price ?? product.product_variants?.[0]?.price;
//           const finalPrice = productPrice ?? variantPrice ?? 0;
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: finalImages,
//             price: finalPrice,
//           };
//         });
//         setProducts(mappedProducts);
//       } else {
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // --------------------------------
//   // Fetch banner images
//   // --------------------------------
//   const fetchBannerImages = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.storage
//           .from('banner-images')
//           .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } })
//       );
//       if (error || !data || data.length === 0) {
//         // fallback
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       const imageFiles = data.filter(
//         (file) =>
//           /\.(jpg|jpeg|png|gif)$/i.test(file.name) &&
//           file.name !== '.emptyFolderPlaceholder'
//       );
//       if (imageFiles.length === 0) {
//         // fallback
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       // gather public URLs
//       const bannerPromises = imageFiles.map(async (file) => {
//         const {
//           data: { publicUrl },
//           error: urlError,
//         } = await retryRequest(() =>
//           supabase.storage.from('banner-images').getPublicUrl(file.name)
//         );
//         if (urlError) {
//           return {
//             url: 'https://dummyimage.com/1200x300?text=Banner+Image',
//             name: file.name,
//           };
//         }
//         return { url: publicUrl, name: file.name };
//       });
//       const bannerImagesResult = await Promise.all(bannerPromises);
//       setBannerImages(bannerImagesResult);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([
//         { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//       ]);
//     }
//   }, []);

//   // --------------------------------
//   // On mount, get geolocation + fetch banner + fetch products
//   // --------------------------------
//   useEffect(() => {
//     fetchBannerImages();
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         handleGeolocation,
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError('Location access denied. Using default Bengaluru location.');
//           setLocation({ lat: 12.9753, lon: 77.591 });
//           fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: false, timeout: 3000, maximumAge: 0 }
//       );
//     } else {
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       setLocation({ lat: 12.9753, lon: 77.591 });
//       fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchBannerImages, fetchNearbyProducts]);

//   // --------------------------------
//   // Debounced geolocation
//   // --------------------------------
//   const handleGeolocation = useCallback(
//     debounce((pos) => {
//       const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       setLocation(userLoc);
//       fetchNearbyProducts(userLoc);
//     }, 1000),
//     [fetchNearbyProducts]
//   );

//   // --------------------------------
//   // Filter products by search term
//   // --------------------------------
//   const filteredProducts = products.filter((p) =>
//     p.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // --------------------------------
//   // Slider settings
//   // --------------------------------
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//   };

//   // --------------------------------
//   // Add product to cart
//   // --------------------------------
//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Cannot add invalid product to cart.');
//       return;
//     }
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }
//       // local storage cart
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existing = storedCart.find((item) => item.id === product.id);
//       if (existing) {
//         existing.quantity = (existing.quantity || 1) + 1;
//       } else {
//         storedCart.push({
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(storedCart));
//       setError(null);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError(`Error: ${err.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   // --------------------------------
//   // Render
//   // --------------------------------
//   if (loading) {
//     return <div className="home-loading">Loading...</div>;
//   }
//   return (
//     <div className="home">
//       <h1 className="home-title">FreshCart</h1>

//       {/* Search bar */}
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           className="search-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       {/* Banner slider */}
//       <div className="banner-slider">
//         {bannerImages.length > 0 ? (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, i) => (
//               <Link key={i} to={`/product/${i + 1}`} className="banner-link">
//                 <div className="banner-slide">
//                   <img
//                     src={banner.url}
//                     alt={`Banner ${banner.name}`}
//                     onError={(e) => {
//                       e.target.src = 'https://dummyimage.com/1200x300?text=Default+Banner';
//                     }}
//                   />
//                   <p className="banner-caption">Featured Product {i + 1}</p>
//                 </div>
//               </Link>
//             ))}
//           </Slider>
//         ) : (
//           <p className="no-banner">No banner images available.</p>
//         )}
//       </div>

//       {error && <p className="home-error">{error}</p>}

//       {/* Product grid */}
//       {filteredProducts.length === 0 ? (
//         <p className="no-products">
//           {searchTerm
//             ? 'No products found matching your search.'
//             : 'No products available at the moment.'}
//         </p>
//       ) : (
//         <div className="product-grid">
//           {filteredProducts.map((product) => (
//             <div
//               key={product.id}
//               className="product-card"
//               onClick={() => navigate(`/product/${product.id}`)}
//             >
//               <img
//                 src={product.images[0] || 'https://dummyimage.com/150'}
//                 alt={product.name}
//                 onError={(e) => {
//                   e.target.src = 'https://dummyimage.com/150';
//                 }}
//               />
//               <h3 className="product-name">{product.name}</h3>
//               <p className="product-price">
//                 ₹
//                 {product.price.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </p>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   addToCart(product);
//                 }}
//                 className="add-to-cart-btn"
//               >
//                 Add to Cart
//               </button>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   navigate('/cart', { state: { product } });
//                 }}
//                 className="buy-now-btn"
//               >
//                 Buy Now
//               </button>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Floating cart icon */}
//       <div className="cart-icon">
//         <Link to="/cart">
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>

//       {/* Footer */}
//       <div className="home-footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p className="footer-text">Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Home;


// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// /**
//  * Debounce utility function
//  */
// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }

// /**
//  * Exponential backoff retry
//  */
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
//   return null;
// }

// function Home() {
//   const navigate = useNavigate();

//   // State
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');

//   // --------------------------------
//   // Fetch products from Supabase
//   // --------------------------------
//   const fetchNearbyProducts = useCallback(async (userLocation) => {
//     if (!userLocation) {
//       console.warn('No user location available, using default Bengaluru location.');
//       userLocation = { lat: 12.9753, lon: 77.591 };
//     }
//     setLoading(true);
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(
//             `id, title, price, images,
//             product_variants (id, attributes, price, stock, images)`
//           )
//           .eq('is_approved', true)
//       );
//       if (error) throw error;

//       if (data) {
//         const mappedProducts = data.map((product) => {
//           const hasProductImages = Array.isArray(product.images) && product.images.length > 0;
//           const variantWithImages = product.product_variants?.find(
//             (variant) => Array.isArray(variant.images) && variant.images.length > 0
//           );
//           const finalImages = hasProductImages
//             ? product.images
//             : variantWithImages
//             ? variantWithImages.images
//             : ['https://dummyimage.com/150'];
//           const productPrice =
//             product.price !== null && product.price !== undefined
//               ? product.price
//               : null;
//           const variantPrice = variantWithImages?.price ?? product.product_variants?.[0]?.price;
//           const finalPrice = productPrice ?? variantPrice ?? 0;
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: finalImages,
//             price: finalPrice,
//           };
//         });
//         setProducts(mappedProducts);
//       } else {
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // --------------------------------
//   // Fetch banner images
//   // --------------------------------
//   const fetchBannerImages = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.storage
//           .from('banner-images')
//           .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } })
//       );
//       if (error || !data || data.length === 0) {
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       const imageFiles = data.filter(
//         (file) =>
//           /\.(jpg|jpeg|png|gif)$/i.test(file.name) &&
//           file.name !== '.emptyFolderPlaceholder'
//       );
//       if (imageFiles.length === 0) {
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       const bannerPromises = imageFiles.map(async (file) => {
//         const {
//           data: { publicUrl },
//           error: urlError,
//         } = await retryRequest(() =>
//           supabase.storage.from('banner-images').getPublicUrl(file.name)
//         );
//         if (urlError) {
//           return {
//             url: 'https://dummyimage.com/1200x300?text=Banner+Image',
//             name: file.name,
//           };
//         }
//         return { url: publicUrl, name: file.name };
//       });
//       const bannerImagesResult = await Promise.all(bannerPromises);
//       setBannerImages(bannerImagesResult);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([
//         { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//       ]);
//     }
//   }, []);

//   // --------------------------------
//   // On mount, get geolocation + fetch banner + fetch products
//   // --------------------------------
//   useEffect(() => {
//     fetchBannerImages();
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         handleGeolocation,
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError(
//             geoError.code === 3
//               ? 'Location request timed out. Using default Bengaluru location.'
//               : 'Location access denied. Using default Bengaluru location.'
//           );
//           setLocation({ lat: 12.9753, lon: 77.591 });
//           fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
//       );
//     } else {
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       setLocation({ lat: 12.9753, lon: 77.591 });
//       fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchBannerImages, fetchNearbyProducts]);

//   // --------------------------------
//   // Debounced geolocation
//   // --------------------------------
//   const handleGeolocation = useCallback(
//     debounce((pos) => {
//       const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       setLocation(userLoc);
//       fetchNearbyProducts(userLoc);
//     }, 1000),
//     [fetchNearbyProducts]
//   );

//   // --------------------------------
//   // Filter products by search term
//   // --------------------------------
//   const filteredProducts = products.filter((p) =>
//     p.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // --------------------------------
//   // Slider settings
//   // --------------------------------
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//   };

//   // --------------------------------
//   // Add product to cart
//   // --------------------------------
//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Cannot add invalid product to cart.');
//       return;
//     }
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existing = storedCart.find((item) => item.id === product.id);
//       if (existing) {
//         existing.quantity = (existing.quantity || 1) + 1;
//       } else {
//         storedCart.push({
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(storedCart));
//       setError(null);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError(`Error: ${err.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   // --------------------------------
//   // Render
//   // --------------------------------
//   if (loading) {
//     return <div className="home-loading">Loading...</div>;
//   }
//   return (
//     <div className="home">
//       <h1 className="home-title">FreshCart</h1>

//       {/* Search bar */}
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           className="search-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       {/* Banner slider */}
//       <div className="banner-slider">
//         {bannerImages.length > 0 ? (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, i) => (
//               <Link key={i} to={`/product/${i + 1}`} className="banner-link">
//                 <div className="banner-slide">
//                   <img
//                     src={banner.url}
//                     alt={`Banner ${banner.name}`}
//                     onError={(e) => {
//                       e.target.src = 'https://dummyimage.com/1200x300?text=Default+Banner';
//                     }}
//                   />
//                   <p className="banner-caption">Featured Product {i + 1}</p>
//                 </div>
//               </Link>
//             ))}
//           </Slider>
//         ) : (
//           <p className="no-banner">No banner images available.</p>
//         )}
//       </div>

//       {/* Error message with retry option */}
//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//           {error.includes('timed out') && (
//             <button
//               onClick={() => {
//                 setError(null);
//                 navigator.geolocation.getCurrentPosition(
//                   handleGeolocation,
//                   (geoError) => {
//                     console.error('Geolocation retry error:', geoError);
//                     setError(
//                       geoError.code === 3
//                         ? 'Location retry timed out. Using default Bengaluru location.'
//                         : 'Location retry failed. Using default Bengaluru location.'
//                     );
//                     setLocation({ lat: 12.9753, lon: 77.591 });
//                     fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//                   },
//                   { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
//                 );
//               }}
//               className="retry-btn"
//             >
//               Retry Location
//             </button>
//           )}
//         </div>
//       )}

//       {/* Product grid */}
//       {filteredProducts.length === 0 ? (
//         <p className="no-products">
//           {searchTerm
//             ? 'No products found matching your search.'
//             : 'No products available at the moment.'}
//         </p>
//       ) : (
//         <div className="product-grid">
//           {filteredProducts.map((product) => (
//             <div
//               key={product.id}
//               className="product-card"
//               onClick={() => navigate(`/product/${product.id}`)}
//             >
//               <img
//                 src={product.images[0] || 'https://dummyimage.com/150'}
//                 alt={product.name}
//                 onError={(e) => {
//                   e.target.src = 'https://dummyimage.com/150';
//                 }}
//               />
//               <h3 className="product-name">{product.name}</h3>
//               <p className="product-price">
//                 ₹
//                 {product.price.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </p>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   addToCart(product);
//                 }}
//                 className="add-to-cart-btn"
//               >
//                 Add to Cart
//               </button>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   navigate('/cart', { state: { product } });
//                 }}
//                 className="buy-now-btn"
//               >
//                 Buy Now
//               </button>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Floating cart icon */}
//       <div className="cart-icon">
//         <Link to="/cart">
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>

//       {/* Footer */}
//       <div className="home-footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p className="footer-text">Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Home;



// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }

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
//   return null;
// }

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc) return null;
//   const R = 6371; // Earth's radius in km
//   let sellerLon, sellerLat;
//   if (sellerLoc.coordinates) {
//     [sellerLon, sellerLat] = sellerLoc.coordinates;
//   } else if (sellerLoc.x && sellerLoc.y) {
//     sellerLon = sellerLoc.x;
//     sellerLat = sellerLoc.y;
//   } else {
//     return null;
//   }
//   const dLat = ((sellerLat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLat * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');

//   const fetchNearbyProducts = useCallback(async (userLocation) => {
//     if (!userLocation) {
//       console.warn('No user location available, using default Bengaluru location.');
//       userLocation = { lat: 12.9753, lon: 77.591 };
//     }
//     console.log('User Location:', userLocation);
//     setLoading(true);
//     try {
//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.rpc('get_sellers_with_coords')
//       );
//       if (sellersError) throw sellersError;
//       console.log('Sellers Data:', sellersData);

//       const nearbySellerIds = sellersData
//         .filter((seller) => {
//           const distance = calculateDistance(userLocation, {
//             x: seller.lon,
//             y: seller.lat,
//           });
//           console.log(`Seller ${seller.id} Distance: ${distance} km`);
//           return distance !== null && distance <= 20;
//         })
//         .map((seller) => seller.id);
//       console.log('Nearby Seller IDs:', nearbySellerIds);

//       if (nearbySellerIds.length === 0) {
//         console.log('No sellers within 20km');
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(
//             `id, title, price, images, seller_id,
//             product_variants (id, attributes, price, stock, images)`
//           )
//           .eq('is_approved', true)
//           .in('seller_id', nearbySellerIds)
//       );
//       if (error) throw error;
//       console.log('Fetched Products:', data);

//       if (data) {
//         const mappedProducts = data.map((product) => {
//           const hasProductImages = Array.isArray(product.images) && product.images.length > 0;
//           const variantWithImages = product.product_variants?.find(
//             (variant) => Array.isArray(variant.images) && variant.images.length > 0
//           );
//           const finalImages = hasProductImages
//             ? product.images
//             : variantWithImages
//             ? variantWithImages.images
//             : ['https://dummyimage.com/150'];
//           const productPrice =
//             product.price !== null && product.price !== undefined ? product.price : null;
//           const variantPrice =
//             variantWithImages?.price ?? product.product_variants?.[0]?.price;
//           const finalPrice = productPrice ?? variantPrice ?? 0;
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: finalImages,
//             price: finalPrice,
//           };
//         });
//         console.log('Mapped Products:', mappedProducts); // Debug log
//         setProducts(mappedProducts);
//       } else {
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const fetchBannerImages = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.storage
//           .from('banner-images')
//           .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } })
//       );
//       if (error || !data || data.length === 0) {
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       const imageFiles = data.filter(
//         (file) =>
//           /\.(jpg|jpeg|png|gif)$/i.test(file.name) &&
//           file.name !== '.emptyFolderPlaceholder'
//       );
//       if (imageFiles.length === 0) {
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       const bannerPromises = imageFiles.map(async (file) => {
//         const {
//           data: { publicUrl },
//           error: urlError,
//         } = await retryRequest(() =>
//           supabase.storage.from('banner-images').getPublicUrl(file.name)
//         );
//         if (urlError) {
//           return {
//             url: 'https://dummyimage.com/1200x300?text=Banner+Image',
//             name: file.name,
//           };
//         }
//         return { url: publicUrl, name: file.name };
//       });
//       const bannerImagesResult = await Promise.all(bannerPromises);
//       setBannerImages(bannerImagesResult);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([
//         { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//       ]);
//     }
//   }, []);

//   useEffect(() => {
//     fetchBannerImages();
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         handleGeolocation,
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError(
//             geoError.code === 3
//               ? 'Location request timed out. Using default Bengaluru location.'
//               : 'Location access denied. Using default Bengaluru location.'
//           );
//           setLocation({ lat: 12.9753, lon: 77.591 });
//           fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
//       );
//     } else {
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       setLocation({ lat: 12.9753, lon: 77.591 });
//       fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchBannerImages, fetchNearbyProducts]);

//   const handleGeolocation = useCallback(
//     debounce((pos) => {
//       const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       setLocation(userLoc);
//       fetchNearbyProducts(userLoc);
//     }, 1000),
//     [fetchNearbyProducts]
//   );

//   const filteredProducts = products.filter((p) =>
//     p.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );
//   console.log('Filtered Products:', filteredProducts); // Debug log

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//   };

//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Cannot add invalid product to cart.');
//       return;
//     }
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existing = storedCart.find((item) => item.id === product.id);
//       if (existing) {
//         existing.quantity = (existing.quantity || 1) + 1;
//       } else {
//         storedCart.push({
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(storedCart));
//       setError(null);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError(`Error: ${err.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   if (loading) {
//     return <div className="home-loading">Loading...</div>;
//   }
//   return (
//     <div className="home">
//       <h1 className="home-title">FreshCart</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           className="search-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>
//       <div className="banner-slider">
//         {bannerImages.length > 0 ? (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, i) => (
//               <Link key={i} to={`/product/${i + 1}`} className="banner-link">
//                 <div className="banner-slide">
//                   <img
//                     src={banner.url}
//                     alt={`Banner ${banner.name}`}
//                     onError={(e) => {
//                       e.target.src = 'https://dummyimage.com/1200x300?text=Default+Banner';
//                     }}
//                   />
//                   <p className="banner-caption">Featured Product {i + 1}</p>
//                 </div>
//               </Link>
//             ))}
//           </Slider>
//         ) : (
//           <p className="no-banner">No banner images available.</p>
//         )}
//       </div>
//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//           {error.includes('timed out') && (
//             <button
//               onClick={() => {
//                 setError(null);
//                 navigator.geolocation.getCurrentPosition(
//                   handleGeolocation,
//                   (geoError) => {
//                     console.error('Geolocation retry error:', geoError);
//                     setError(
//                       geoError.code === 3
//                         ? 'Location retry timed out. Using default Bengaluru location.'
//                         : 'Location retry failed. Using default Bengaluru location.'
//                     );
//                     setLocation({ lat: 12.9753, lon: 77.591 });
//                     fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//                   },
//                   { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
//                 );
//               }}
//               className="retry-btn"
//             >
//               Retry Location
//             </button>
//           )}
//         </div>
//       )}
//       {filteredProducts.length === 0 ? (
//         <p className="no-products">
//           {searchTerm
//             ? 'No products found matching your search.'
//             : 'No products available within 20km.'}
//         </p>
//       ) : (
//         <div className="product-grid">
//           {filteredProducts.map((product) => (
//             <div
//               key={product.id}
//               className="product-card"
//               onClick={() => navigate(`/product/${product.id}`)}
//             >
//               <img
//                 src={product.images[0] || 'https://dummyimage.com/150'}
//                 alt={product.name}
//                 onError={(e) => {
//                   e.target.src = 'https://dummyimage.com/150';
//                 }}
//               />
//               <h3 className="product-name">{product.name}</h3>
//               <p className="product-price">
//                 ₹
//                 {product.price.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </p>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   addToCart(product);
//                 }}
//                 className="add-to-cart-btn"
//               >
//                 Add to Cart
//               </button>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   navigate('/cart', { state: { product } });
//                 }}
//                 className="buy-now-btn"
//               >
//                 Buy Now
//               </button>
//             </div>
//           ))}
//         </div>
//       )}
//       <div className="cart-icon">
//         <Link to="/cart">
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>
//       <div className="home-footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p className="footer-text">Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Home;



// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }

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
//   return null;
// }

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc) return null;
//   const R = 6371; // Earth's radius in km
//   let sellerLon, sellerLat;
//   if (sellerLoc.coordinates) {
//     [sellerLon, sellerLat] = sellerLoc.coordinates;
//   } else if (sellerLoc.x && sellerLoc.y) {
//     sellerLon = sellerLoc.x;
//     sellerLat = sellerLoc.y;
//   } else {
//     return null;
//   }
//   const dLat = ((sellerLat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLat * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');

//   const fetchNearbyProducts = useCallback(async (userLocation) => {
//     if (!userLocation) {
//       console.warn('No user location available, using default Bengaluru location.');
//       userLocation = { lat: 12.9753, lon: 77.591 };
//     }
//     console.log('User Location:', userLocation);
//     setLoading(true);
//     try {
//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.rpc('get_sellers_with_coords')
//       );
//       if (sellersError) throw sellersError;
//       console.log('Sellers Data:', sellersData);

//       const nearbySellerIds = sellersData
//         .filter((seller) => {
//           const distance = calculateDistance(userLocation, {
//             x: seller.lon,
//             y: seller.lat,
//           });
//           console.log(`Seller ${seller.id} Distance: ${distance} km`);
//           return distance !== null && distance <= 40; // Changed from 20 to 40
//         })
//         .map((seller) => seller.id);
//       console.log('Nearby Seller IDs:', nearbySellerIds);

//       if (nearbySellerIds.length === 0) {
//         console.log('No sellers within 40km'); // Updated log message
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(
//             `id, title, price, images, seller_id,
//             product_variants (id, attributes, price, stock, images)`
//           )
//           .eq('is_approved', true)
//           .in('seller_id', nearbySellerIds)
//       );
//       if (error) throw error;
//       console.log('Fetched Products:', data);

//       if (data) {
//         const mappedProducts = data.map((product) => {
//           const hasProductImages = Array.isArray(product.images) && product.images.length > 0;
//           const variantWithImages = product.product_variants?.find(
//             (variant) => Array.isArray(variant.images) && variant.images.length > 0
//           );
//           const finalImages = hasProductImages
//             ? product.images
//             : variantWithImages
//             ? variantWithImages.images
//             : ['https://dummyimage.com/150'];
//           const productPrice =
//             product.price !== null && product.price !== undefined ? product.price : null;
//           const variantPrice =
//             variantWithImages?.price ?? product.product_variants?.[0]?.price;
//           const finalPrice = productPrice ?? variantPrice ?? 0;
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: finalImages,
//             price: finalPrice,
//           };
//         });
//         console.log('Mapped Products:', mappedProducts); // Debug log
//         setProducts(mappedProducts);
//       } else {
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const fetchBannerImages = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.storage
//           .from('banner-images')
//           .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } })
//       );
//       if (error || !data || data.length === 0) {
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       const imageFiles = data.filter(
//         (file) =>
//           /\.(jpg|jpeg|png|gif)$/i.test(file.name) &&
//           file.name !== '.emptyFolderPlaceholder'
//       );
//       if (imageFiles.length === 0) {
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       const bannerPromises = imageFiles.map(async (file) => {
//         const {
//           data: { publicUrl },
//           error: urlError,
//         } = await retryRequest(() =>
//           supabase.storage.from('banner-images').getPublicUrl(file.name)
//         );
//         if (urlError) {
//           return {
//             url: 'https://dummyimage.com/1200x300?text=Banner+Image',
//             name: file.name,
//           };
//         }
//         return { url: publicUrl, name: file.name };
//       });
//       const bannerImagesResult = await Promise.all(bannerPromises);
//       setBannerImages(bannerImagesResult);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([
//         { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//       ]);
//     }
//   }, []);

//   useEffect(() => {
//     fetchBannerImages();
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         handleGeolocation,
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError(
//             geoError.code === 3
//               ? 'Location request timed out. Using default Bengaluru location.'
//               : 'Location access denied. Using default Bengaluru location.'
//           );
//           setLocation({ lat: 12.9753, lon: 77.591 });
//           fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
//       );
//     } else {
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       setLocation({ lat: 12.9753, lon: 77.591 });
//       fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchBannerImages, fetchNearbyProducts]);

//   const handleGeolocation = useCallback(
//     debounce((pos) => {
//       const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       setLocation(userLoc);
//       fetchNearbyProducts(userLoc);
//     }, 1000),
//     [fetchNearbyProducts]
//   );

//   const filteredProducts = products.filter((p) =>
//     p.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );
//   console.log('Filtered Products:', filteredProducts); // Debug log

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//   };

//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Cannot add invalid product to cart.');
//       return;
//     }
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existing = storedCart.find((item) => item.id === product.id);
//       if (existing) {
//         existing.quantity = (existing.quantity || 1) + 1;
//       } else {
//         storedCart.push({
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(storedCart));
//       setError(null);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError(`Error: ${err.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   if (loading) {
//     return <div className="home-loading">Loading...</div>;
//   }
//   return (
//     <div className="home">
//       <h1 className="home-title">FreshCart</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           className="search-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>
//       <div className="banner-slider">
//         {bannerImages.length > 0 ? (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, i) => (
//               <Link key={i} to={`/product/${i + 1}`} className="banner-link">
//                 <div className="banner-slide">
//                   <img
//                     src={banner.url}
//                     alt={`Banner ${banner.name}`}
//                     onError={(e) => {
//                       e.target.src = 'https://dummyimage.com/1200x300?text=Default+Banner';
//                     }}
//                   />
//                   <p className="banner-caption">Featured Product {i + 1}</p>
//                 </div>
//               </Link>
//             ))}
//           </Slider>
//         ) : (
//           <p className="no-banner">No banner images available.</p>
//         )}
//       </div>
//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//           {error.includes('timed out') && (
//             <button
//               onClick={() => {
//                 setError(null);
//                 navigator.geolocation.getCurrentPosition(
//                   handleGeolocation,
//                   (geoError) => {
//                     console.error('Geolocation retry error:', geoError);
//                     setError(
//                       geoError.code === 3
//                         ? 'Location retry timed out. Using default Bengaluru location.'
//                         : 'Location retry failed. Using default Bengaluru location.'
//                     );
//                     setLocation({ lat: 12.9753, lon: 77.591 });
//                     fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
//                   },
//                   { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
//                 );
//               }}
//               className="retry-btn"
//             >
//               Retry Location
//             </button>
//           )}
//         </div>
//       )}
//       {filteredProducts.length === 0 ? (
//         <p className="no-products">
//           {searchTerm
//             ? 'No products found matching your search.'
//             : 'No products available within 40km.'} {/* Updated message */}
//         </p>
//       ) : (
//         <div className="product-grid">
//           {filteredProducts.map((product) => (
//             <div
//               key={product.id}
//               className="product-card"
//               onClick={() => navigate(`/product/${product.id}`)}
//             >
//               <img
//                 src={product.images[0] || 'https://dummyimage.com/150'}
//                 alt={product.name}
//                 onError={(e) => {
//                   e.target.src = 'https://dummyimage.com/150';
//                 }}
//               />
//               <h3 className="product-name">{product.name}</h3>
//               <p className="product-price">
//                 ₹
//                 {product.price.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </p>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   addToCart(product);
//                 }}
//                 className="add-to-cart-btn"
//               >
//                 Add to Cart
//               </button>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   navigate('/cart', { state: { product } });
//                 }}
//                 className="buy-now-btn"
//               >
//                 Buy Now
//               </button>
//             </div>
//           ))}
//         </div>
//       )}
//       <div className="cart-icon">
//         <Link to="/cart">
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>
//       <div className="home-footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p className="footer-text">Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Home;


// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) {
//         console.error(`Failed after ${maxAttempts} attempts:`, error);
//         throw error;
//       }
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || sellerLoc.latitude === null || sellerLoc.longitude === null) {
//     return null; // Return null if coordinates are missing
//   }
//   const R = 6371;
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
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

// function Home() {
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [userId, setUserId] = useState(null);

//   const fetchNearbyProducts = useCallback(async (userLocation) => {
//     if (!userLocation) {
//       console.warn('No user location, using default Bengaluru location.');
//       userLocation = { lat: 12.9753, lon: 77.591 };
//     }
//     console.log('User Location:', userLocation);
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       console.log('Auth Session:', session, 'Session Error:', sessionError);
//       setUserId(session?.user?.id || null);

//       if (session?.user) {
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData?.is_seller || false);
//         console.log('User Role:', profileData?.is_seller ? 'Seller' : 'Buyer');
//       } else {
//         console.log('No user logged in, proceeding as anon');
//         setIsSeller(false);
//       }

//       let productData;
//       if (isSeller) {
//         console.log('Fetching seller products for user:', session.user.id);
//         const { data, error } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .select('id, title, price, images, seller_id, stock')
//             .eq('seller_id', session.user.id)
//             .eq('is_approved', true)
//         );
//         console.log('Seller Products Response:', { data, error });
//         if (error) throw error;
//         productData = data;
//       } else {
//         console.log('Fetching all sellers for buyer');
//         const { data: allSellers, error: allError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude');
//         console.log('All Sellers Query:', { data: allSellers, error: allError });

//         if (!allSellers || allSellers.length === 0) {
//           console.log('No sellers data available');
//           setProducts([]);
//           setLoading(false);
//           return;
//         }

//         const nearbySellerIds = allSellers
//         .filter((seller) => {
//           if (seller.latitude === null || seller.longitude === null) return false; // Skip sellers with no location
//           const distance = calculateDistance(userLocation, seller);
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);
//         console.log('Nearby Seller IDs:', nearbySellerIds);

//         if (nearbySellerIds.length === 0) {
//           console.log('No sellers within 40km');
//           setProducts([]);
//           setLoading(false);
//           return;
//         }

//         const { data, error } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .select('id, title, price, images, seller_id, stock')
//             .eq('is_approved', true)
//             .in('seller_id', nearbySellerIds)
//         );
//         console.log('Products Response:', { data, error });
//         if (error) throw error;
//         productData = data;
//       }

//       if (productData && productData.length > 0) {
//         const mappedProducts = productData.map((product) => ({
//           id: product.id,
//           name: product.title || 'Unnamed Product',
//           images: Array.isArray(product.images) && product.images.length > 0
//             ? product.images
//             : ['https://dummyimage.com/150'],
//           price: parseFloat(product.price) || 0,
//           stock: product.stock || 0,
//         }));
//         console.log('Mapped Products:', mappedProducts);
//         setProducts(mappedProducts);
//       } else {
//         console.log('No products found');
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [isSeller]);

//   const fetchBannerImages = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.storage
//           .from('banner-images')
//           .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } })
//       );
//       console.log('Banner Storage Response:', { data, error });
//       if (error || !data || data.length === 0) {
//         console.warn('No banner images found, using default');
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       const imageFiles = data.filter(
//         (file) =>
//           /\.(jpg|jpeg|png|gif)$/i.test(file.name) &&
//           file.name !== '.emptyFolderPlaceholder'
//       );
//       if (imageFiles.length === 0) {
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       const bannerPromises = imageFiles.map(async (file) => {
//         const {
//           data: { publicUrl },
//           error: urlError,
//         } = await retryRequest(() =>
//           supabase.storage.from('banner-images').getPublicUrl(file.name)
//         );
//         if (urlError) {
//           return {
//             url: 'https://dummyimage.com/1200x300?text=Banner+Image',
//             name: file.name,
//           };
//         }
//         return { url: publicUrl, name: file.name };
//       });
//       const bannerImagesResult = await Promise.all(bannerPromises);
//       console.log('Banner Images:', bannerImagesResult);
//       setBannerImages(bannerImagesResult);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([
//         { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//       ]);
//     }
//   }, []);

//   const handleGeolocation = useCallback(
//     debounce((pos) => {
//       const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       console.log('Geolocation Success:', userLoc);
//       setLocation(userLoc);
//       fetchNearbyProducts(userLoc);
//     }, 1000),
//     [fetchNearbyProducts]
//   );

//   useEffect(() => {
//     fetchBannerImages();
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         handleGeolocation,
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError(
//             geoError.code === 1
//               ? 'Location access denied. Using default Bengaluru location.'
//               : geoError.code === 2
//               ? 'Location unavailable. Using default Bengaluru location.'
//               : 'Location request timed out. Using default Bengaluru location.'
//           );
//           const defaultLoc = { lat: 12.9753, lon: 77.591 };
//           setLocation(defaultLoc);
//           fetchNearbyProducts(defaultLoc);
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
//       );
//     } else {
//       console.warn('Geolocation not supported');
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       const defaultLoc = { lat: 12.9753, lon: 77.591 };
//       setLocation(defaultLoc);
//       fetchNearbyProducts(defaultLoc);
//     }
//   }, [fetchBannerImages, fetchNearbyProducts]);

//   const filteredProducts = products.filter((p) =>
//     p.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );
//   console.log('Filtered Products:', filteredProducts);

//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Cannot add invalid product to cart.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Product out of stock.');
//       return;
//     }
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existing = storedCart.find((item) => item.id === product.id);
//       if (existing) {
//         if (existing.quantity >= product.stock) {
//           setError('Cannot add more items than available stock.');
//           return;
//         }
//         existing.quantity += 1;
//       } else {
//         storedCart.push({
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//           image: product.images[0],
//           stock: product.stock,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(storedCart));
//       console.log('Added to cart:', product);
//       setError(null);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError(`Error: ${err.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//   };

//   if (loading) {
//     return <div className="home-loading">Loading...</div>;
//   }

//   return (
//     <div className="home">
//       <h1 className="home-title">FreshCart</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           className="search-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>
//       <div className="banner-slider">
//         {bannerImages.length > 0 ? (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, i) => (
//               <Link key={i} to={`/product/${i + 1}`} className="banner-link">
//                 <div className="banner-slide">
//                   <img
//                     src={banner.url}
//                     alt={`Banner ${banner.name}`}
//                     onError={(e) => {
//                       e.target.src = 'https://dummyimage.com/1200x300?text=Default+Banner';
//                     }}
//                   />
//                   <p className="banner-caption">Featured Product {i + 1}</p>
//                 </div>
//               </Link>
//             ))}
//           </Slider>
//         ) : (
//           <p className="no-banner">No banner images available.</p>
//         )}
//       </div>
//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//           {error.includes('timed out') && (
//             <button
//               onClick={() => {
//                 setError(null);
//                 navigator.geolocation.getCurrentPosition(
//                   handleGeolocation,
//                   (geoError) => {
//                     console.error('Geolocation retry error:', geoError);
//                     setError(
//                       geoError.code === 3
//                         ? 'Location retry timed out. Using default Bengaluru location.'
//                         : 'Location retry failed. Using default Bengaluru location.'
//                     );
//                     const defaultLoc = { lat: 12.9753, lon: 77.591 };
//                     setLocation(defaultLoc);
//                     fetchNearbyProducts(defaultLoc);
//                   },
//                   { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
//                 );
//               }}
//               className="retry-btn"
//             >
//               Retry Location
//             </button>
//           )}
//         </div>
//       )}
//       <section className="products-section">
//         <h2 className="products-heading">
//           {isSeller ? 'Your Products' : 'Products Near You (40km)'}
//         </h2>
//         {filteredProducts.length === 0 ? (
//           <p className="no-products">
//             {searchTerm
//               ? 'No products found matching your search.'
//               : isSeller
//               ? 'You have not added any products yet.'
//               : 'No products available within 40km.'}
//           </p>
//         ) : (
//           <div className="product-grid">
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//               >
//                 <img
//                   src={product.images[0] || 'https://dummyimage.com/150'}
//                   alt={product.name}
//                   className="product-image"
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
//                 <p className="product-stock">
//                   {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
//                 </p>
//                 {!isSeller && (
//                   <div className="product-buttons">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="add-to-cart-btn"
//                       disabled={product.stock <= 0}
//                     >
//                       Add to Cart
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         navigate('/cart', { state: { product } });
//                       }}
//                       className="buy-now-btn"
//                       disabled={product.stock <= 0}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//       <div className="cart-icon">
//         <Link to="/cart">
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>
//       {isSeller && (
//         <div className="seller-actions">
//           <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
//             Go to Seller Dashboard
//           </button>
//         </div>
//       )}
//       <footer className="home-footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p className="footer-text">Categories</p>
//       </footer>
//     </div>
//   );
// }

// export default Home;



// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) {
//         console.error(`Failed after ${maxAttempts} attempts:`, error);
//         throw error;
//       }
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || sellerLoc.latitude === null || sellerLoc.longitude === null) {
//     return null; // Return null if coordinates are missing
//   }
//   const R = 6371;
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
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

// function Home() {
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [userId, setUserId] = useState(null);

//   // This function always fetches nearby products for both buyer and seller
//   const fetchNearbyProducts = useCallback(async (userLocation) => {
//     if (!userLocation) {
//       console.warn('No user location, using default Bengaluru location.');
//       userLocation = { lat: 12.9753, lon: 77.591 };
//     }
//     console.log('User Location:', userLocation);
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       console.log('Auth Session:', session, 'Session Error:', sessionError);
//       setUserId(session?.user?.id || null);

//       if (session?.user) {
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData?.is_seller || false);
//         console.log('User Role:', profileData?.is_seller ? 'Seller' : 'Buyer');
//       } else {
//         console.log('No user logged in, proceeding as anon');
//         setIsSeller(false);
//       }

//       // Fetch all sellers regardless of user role
//       const { data: allSellers, error: allError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude');
//       console.log('All Sellers Query:', { data: allSellers, error: allError });

//       if (!allSellers || allSellers.length === 0) {
//         console.log('No sellers data available');
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Filter sellers that have a location and are within 40km of the user
//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           if (seller.latitude === null || seller.longitude === null) return false;
//           const distance = calculateDistance(userLocation, seller);
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);
//       console.log('Nearby Seller IDs:', nearbySellerIds);

//       if (nearbySellerIds.length === 0) {
//         console.log('No sellers within 40km');
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, title, price, images, seller_id, stock')
//           .eq('is_approved', true)
//           .in('seller_id', nearbySellerIds)
//       );
//       console.log('Products Response:', { data, error });
//       if (error) throw error;

//       if (data && data.length > 0) {
//         const mappedProducts = data.map((product) => ({
//           id: product.id,
//           name: product.title || 'Unnamed Product',
//           images:
//             Array.isArray(product.images) && product.images.length > 0
//               ? product.images
//               : ['https://dummyimage.com/150'],
//           price: parseFloat(product.price) || 0,
//           stock: product.stock || 0,
//         }));
//         console.log('Mapped Products:', mappedProducts);
//         setProducts(mappedProducts);
//       } else {
//         console.log('No products found');
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const fetchBannerImages = useCallback(async () => {
//     try {
//       const { data, error } = await retryRequest(() =>
//         supabase.storage
//           .from('banner-images')
//           .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } })
//       );
//       console.log('Banner Storage Response:', { data, error });
//       if (error || !data || data.length === 0) {
//         console.warn('No banner images found, using default');
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       const imageFiles = data.filter(
//         (file) =>
//           /\.(jpg|jpeg|png|gif)$/i.test(file.name) &&
//           file.name !== '.emptyFolderPlaceholder'
//       );
//       if (imageFiles.length === 0) {
//         setBannerImages([
//           { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//         ]);
//         return;
//       }

//       const bannerPromises = imageFiles.map(async (file) => {
//         const {
//           data: { publicUrl },
//           error: urlError,
//         } = await retryRequest(() =>
//           supabase.storage.from('banner-images').getPublicUrl(file.name)
//         );
//         if (urlError) {
//           return {
//             url: 'https://dummyimage.com/1200x300?text=Banner+Image',
//             name: file.name,
//           };
//         }
//         return { url: publicUrl, name: file.name };
//       });
//       const bannerImagesResult = await Promise.all(bannerPromises);
//       console.log('Banner Images:', bannerImagesResult);
//       setBannerImages(bannerImagesResult);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([
//         { url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' },
//       ]);
//     }
//   }, []);

//   const handleGeolocation = useCallback(
//     debounce((pos) => {
//       const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       console.log('Geolocation Success:', userLoc);
//       setLocation(userLoc);
//       fetchNearbyProducts(userLoc);
//     }, 1000),
//     [fetchNearbyProducts]
//   );

//   useEffect(() => {
//     fetchBannerImages();
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         handleGeolocation,
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError(
//             geoError.code === 1
//               ? 'Location access denied. Using default Bengaluru location.'
//               : geoError.code === 2
//               ? 'Location unavailable. Using default Bengaluru location.'
//               : 'Location request timed out. Using default Bengaluru location.'
//           );
//           const defaultLoc = { lat: 12.9753, lon: 77.591 };
//           setLocation(defaultLoc);
//           fetchNearbyProducts(defaultLoc);
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
//       );
//     } else {
//       console.warn('Geolocation not supported');
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       const defaultLoc = { lat: 12.9753, lon: 77.591 };
//       setLocation(defaultLoc);
//       fetchNearbyProducts(defaultLoc);
//     }
//   }, [fetchBannerImages, fetchNearbyProducts]);

//   const filteredProducts = products.filter((p) =>
//     p.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );
//   console.log('Filtered Products:', filteredProducts);

//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Cannot add invalid product to cart.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Product out of stock.');
//       return;
//     }
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existing = storedCart.find((item) => item.id === product.id);
//       if (existing) {
//         if (existing.quantity >= product.stock) {
//           setError('Cannot add more items than available stock.');
//           return;
//         }
//         existing.quantity += 1;
//       } else {
//         storedCart.push({
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//           image: product.images[0],
//           stock: product.stock,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(storedCart));
//       console.log('Added to cart:', product);
//       setError(null);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError(`Error: ${err.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 3000,
//   };

//   if (loading) {
//     return <div className="home-loading">Loading...</div>;
//   }

//   return (
//     <div className="home">
//       <h1 className="home-title">FreshCart</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           className="search-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>
//       <div className="banner-slider">
//         {bannerImages.length > 0 ? (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, i) => (
//               <Link key={i} to={`/product/${i + 1}`} className="banner-link">
//                 <div className="banner-slide">
//                   <img
//                     src={banner.url}
//                     alt={`Banner ${banner.name}`}
//                     onError={(e) => {
//                       e.target.src = 'https://dummyimage.com/1200x300?text=Default+Banner';
//                     }}
//                   />
//                   <p className="banner-caption">Featured Product {i + 1}</p>
//                 </div>
//               </Link>
//             ))}
//           </Slider>
//         ) : (
//           <p className="no-banner">No banner images available.</p>
//         )}
//       </div>
//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//           {error.includes('timed out') && (
//             <button
//               onClick={() => {
//                 setError(null);
//                 navigator.geolocation.getCurrentPosition(
//                   handleGeolocation,
//                   (geoError) => {
//                     console.error('Geolocation retry error:', geoError);
//                     setError(
//                       geoError.code === 3
//                         ? 'Location retry timed out. Using default Bengaluru location.'
//                         : 'Location retry failed. Using default Bengaluru location.'
//                     );
//                     const defaultLoc = { lat: 12.9753, lon: 77.591 };
//                     setLocation(defaultLoc);
//                     fetchNearbyProducts(defaultLoc);
//                   },
//                   { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
//                 );
//               }}
//               className="retry-btn"
//             >
//               Retry Location
//             </button>
//           )}
//         </div>
//       )}
//       <section className="products-section">
//         <h2 className="products-heading">Products Near You (40km)</h2>
//         {filteredProducts.length === 0 ? (
//           <p className="no-products">
//             {searchTerm
//               ? 'No products found matching your search.'
//               : 'No products available within 40km.'}
//           </p>
//         ) : (
//           <div className="product-grid">
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//               >
//                 <img
//                   src={product.images[0] || 'https://dummyimage.com/150'}
//                   alt={product.name}
//                   className="product-image"
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
//                 <p className="product-stock">
//                   {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
//                 </p>
//                 <div className="product-buttons">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="add-to-cart-btn"
//                     disabled={product.stock <= 0}
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       navigate('/cart', { state: { product } });
//                     }}
//                     className="buy-now-btn"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//       <div className="cart-icon">
//         <Link to="/cart">
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>
//       {isSeller && (
//         <div className="seller-actions">
//           <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
//             Go to Seller Dashboard
//           </button>
//         </div>
//       )}
//       <footer className="home-footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p className="footer-text">Categories</p>
//       </footer>
//     </div>
//   );
// }

// export default Home;




// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || sellerLoc.lat === null || sellerLoc.lon === null) return null;
//   const R = 6371;
//   const lat = sellerLoc.lat;
//   const lon = sellerLoc.lon;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);

//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation) {
//       console.warn('No buyer location provided.');
//       return;
//     }
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       console.log('Auth Session:', session, 'Session Error:', sessionError);
//       if (session?.user) {
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData?.is_seller || false);
//         console.log('User Role:', profileData?.is_seller ? 'Seller' : 'Buyer');
//       } else {
//         console.log('No user logged in, proceeding as anon');
//         setIsSeller(false);
//       }

//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude, allows_long');
//       if (sellersError) throw sellersError;
//       console.log('All Sellers:', allSellers);

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           if (seller.latitude === null || seller.longitude === null) return false;
//           const distance = calculateDistance(buyerLocation, { lat: seller.latitude, lon: seller.longitude });
//           return distance !== null && (distance <= 40 || seller.allows_long);
//         })
//         .map((seller) => seller.id);
//       console.log('Nearby Seller IDs:', nearbySellerIds);

//       if (nearbySellerIds.length === 0) {
//         console.log('No nearby sellers found.');
//         setProducts([]);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;
//       console.log('Products Response:', data);

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images?.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         stock: product.stock || 0,
//       }));
//       setProducts(mappedProducts);
//       console.log('Mapped Products:', mappedProducts);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation]);

//   const fetchBannerImages = useCallback(async () => {
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       console.log('Banner Storage Response:', data);
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//       console.log('Banner Images:', bannerImages);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     }
//   }, []);

//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Cannot add invalid product to cart.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Product out of stock.');
//       return;
//     }
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existing = storedCart.find((item) => item.id === product.id);
//       if (existing) {
//         if (existing.quantity >= product.stock) {
//           setError('Cannot add more items than available stock.');
//           return;
//         }
//         existing.quantity += 1;
//       } else {
//         storedCart.push({
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//           image: product.images[0],
//           stock: product.stock,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(storedCart));
//       console.log('Added to cart:', product);
//       setError(null);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError(`Error: ${err.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   useEffect(() => {
//     fetchBannerImages();
//     fetchNearbyProducts();
//   }, [fetchBannerImages, fetchNearbyProducts]);

//   const filteredProducts = React.useMemo(
//     () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
//     [products, searchTerm]
//   );
//   console.log('Filtered Products:', filteredProducts);

//   if (loading) return <div className="home-loading">Loading...</div>;

//   return (
//     <div className="home">
//       <h1 className="home-title">FreshCart</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>
//       <div className="banner-slider">
//         <Slider dots infinite speed={500} slidesToShow={1} slidesToScroll={1} autoplay autoplaySpeed={3000}>
//           {bannerImages.map((banner, i) => (
//             <Link key={i} to={`/product/${i + 1}`}>
//               <img src={banner.url} alt={`Banner ${banner.name}`} />
//             </Link>
//           ))}
//         </Slider>
//       </div>
//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//         </div>
//       )}
//       <section className="products-section">
//         <h2>Products Near You (40km)</h2>
//         {filteredProducts.length === 0 ? (
//           <p>
//             {searchTerm
//               ? 'No products found matching your search.'
//               : 'No products available within 40km.'}
//           </p>
//         ) : (
//           <div className="product-grid">
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//               >
//                 <img src={product.images[0]} alt={product.name} />
//                 <h3>{product.name}</h3>
//                 <p>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 <p className="product-stock">
//                   {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
//                 </p>
//                 <div className="product-buttons">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="add-to-cart-btn"
//                     disabled={product.stock <= 0}
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       navigate('/cart', { state: { product } });
//                     }}
//                     className="buy-now-btn"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//       <div className="cart-icon">
//         <Link to="/cart">
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>
//       {isSeller && (
//         <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
//           Go to Seller Dashboard
//         </button>
//       )}
//     </div>
//   );
// }

// export default React.memo(Home);


// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import '../style/Home.css';

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || sellerLoc.lat === null || sellerLoc.lon === null) return null;
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLoc.lat * (Math.PI / 180)) *
//       Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);

//   // Fetch nearby products only when a valid buyer location is available.
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       console.warn('No buyer location provided.');
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       console.log('Auth Session:', session, 'Session Error:', sessionError);
//       if (session?.user) {
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData?.is_seller || false);
//         console.log('User Role:', profileData?.is_seller ? 'Seller' : 'Buyer');
//       } else {
//         console.log('No user logged in, proceeding as anonymous');
//         setIsSeller(false);
//       }

//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude, allows_long');
//       if (sellersError) throw sellersError;
//       console.log('All Sellers:', allSellers);

//       const nearbySellerIds = allSellers
//         .filter((seller) => {
//           if (seller.latitude === null || seller.longitude === null) return false;
//           const distance = calculateDistance(buyerLocation, { lat: seller.latitude, lon: seller.longitude });
//           return distance !== null && (distance <= 40 || seller.allows_long);
//         })
//         .map((seller) => seller.id);
//       console.log('Nearby Seller IDs:', nearbySellerIds);

//       if (nearbySellerIds.length === 0) {
//         console.log('No nearby sellers found.');
//         setProducts([]);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, images, seller_id, stock')
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;
//       console.log('Products Response:', data);

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         stock: product.stock || 0,
//       }));
//       setProducts(mappedProducts);
//       console.log('Mapped Products:', mappedProducts);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images from Supabase storage.
//   const fetchBannerImages = useCallback(async () => {
//     try {
//       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
//       console.log('Banner Storage Response:', data);
//       const banners = await Promise.all(
//         data
//           .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
//           .map(async (file) => {
//             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
//             return { url: publicUrl, name: file.name };
//           })
//       );
//       console.log('Mapped Banners:', banners);
//       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     } catch (err) {
//       console.error('Error fetching banner images:', err);
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//     }
//   }, []);

//   // Add a product to the cart with validations for stock and user authentication.
//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Cannot add invalid product to cart.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Product out of stock.');
//       return;
//     }
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existing = storedCart.find((item) => item.id === product.id);
//       if (existing) {
//         if (existing.quantity >= product.stock) {
//           setError('Cannot add more items than available stock.');
//           return;
//         }
//         existing.quantity += 1;
//       } else {
//         storedCart.push({
//           id: product.id,
//           title: product.name,
//           price: product.price,
//           quantity: 1,
//           image: product.images[0],
//           stock: product.stock,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(storedCart));
//       console.log('Added to cart:', product);
//       setError(null);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError(`Error: ${err.message || 'Failed to add product to cart.'}`);
//     }
//   };

//   // Use effect to fetch banner images and products.
//   // Only call fetchNearbyProducts if buyerLocation is available.
//   useEffect(() => {
//     fetchBannerImages();
//   }, [fetchBannerImages]);

//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

//   // Filter products based on search term.
//   const filteredProducts = useMemo(
//     () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
//     [products, searchTerm]
//   );

//   if (loading) return <div className="home-loading">Loading...</div>;

//   return (
//     <div className="home">
//       <h1 className="home-title">FreshCart</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>
//       <div className="banner-slider">
//         <Slider dots infinite speed={500} slidesToShow={1} slidesToScroll={1} autoplay autoplaySpeed={3000}>
//           {bannerImages.map((banner, i) => (
//             <Link key={i} to={`/product/${i + 1}`}>
//               <img src={banner.url} alt={`Banner ${banner.name}`} />
//             </Link>
//           ))}
//         </Slider>
//       </div>
//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//         </div>
//       )}
//       <section className="products-section">
//         <h2>Products Near You (40km)</h2>
//         {filteredProducts.length === 0 ? (
//           <p>
//             {searchTerm
//               ? 'No products found matching your search.'
//               : 'No products available within 40km.'}
//           </p>
//         ) : (
//           <div className="product-grid">
//             {filteredProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//               >
//                 <img src={product.images[0]} alt={product.name} />
//                 <h3>{product.name}</h3>
//                 <p>
//                   ₹{product.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <p className="product-stock">
//                   {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
//                 </p>
//                 <div className="product-buttons">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="add-to-cart-btn"
//                     disabled={product.stock <= 0}
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       navigate('/cart', { state: { product } });
//                     }}
//                     className="buy-now-btn"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//       <div className="cart-icon">
//         <Link to="/cart">
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>
//       {isSeller && (
//         <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
//           Go to Seller Dashboard
//         </button>
//       )}
//     </div>
//   );
// }

// export default React.memo(Home);



// // import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// // import { Link, useNavigate } from 'react-router-dom';
// // import { supabase } from '../supabaseClient';
// // import { LocationContext } from '../App';
// // import { FaShoppingCart } from 'react-icons/fa';
// // import Slider from 'react-slick';
// // import 'slick-carousel/slick/slick.css';
// // import 'slick-carousel/slick/slick-theme.css';
// // import '../style/Home.css';

// // // Distance calculation (standardized to latitude/longitude)
// // function calculateDistance(userLoc, sellerLoc) {
// //   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
// //   const R = 6371; // Earth's radius in kilometers
// //   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
// //   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
// //   const a =
// //     Math.sin(latDiff / 2) ** 2 +
// //     Math.cos(userLoc.lat * (Math.PI / 180)) *
// //     Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
// //     Math.sin(lonDiff / 2) ** 2;
// //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// //   return R * c;
// // }

// // function Home() {
// //   const { buyerLocation } = useContext(LocationContext);
// //   const navigate = useNavigate();
// //   const [products, setProducts] = useState([]);
// //   const [bannerImages, setBannerImages] = useState([]);
// //   const [error, setError] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [isSeller, setIsSeller] = useState(false);

// //   // Fetch nearby products within 40 km
// //   const fetchNearbyProducts = useCallback(async () => {
// //     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
// //       console.warn('No buyer location provided.');
// //       setLoading(false);
// //       return;
// //     }
// //     setLoading(true);
// //     try {
// //       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
// //       console.log('Auth Session:', session, 'Session Error:', sessionError);
// //       if (session?.user) {
// //         const { data: profileData, error: profileError } = await supabase
// //           .from('profiles')
// //           .select('is_seller')
// //           .eq('id', session.user.id)
// //           .single();
// //         if (profileError) throw profileError;
// //         setIsSeller(profileData?.is_seller || false);
// //         console.log('User Role:', profileData?.is_seller ? 'Seller' : 'Buyer');
// //       } else {
// //         console.log('No user logged in, proceeding as anonymous');
// //         setIsSeller(false);
// //       }

// //       const { data: allSellers, error: sellersError } = await supabase
// //         .from('sellers')
// //         .select('id, latitude, longitude');
// //       if (sellersError) throw sellersError;
// //       console.log('All Sellers:', allSellers);

// //       const nearbySellerIds = allSellers
// //         .filter((seller) => {
// //           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
// //           console.log(`Seller ${seller.id} Distance: ${distance !== null ? distance.toFixed(2) : 'N/A'} km`);
// //           return distance !== null && distance <= 40; // Strict 40 km radius
// //         })
// //         .map((seller) => seller.id);
// //       console.log('Nearby Seller IDs:', nearbySellerIds);

// //       if (nearbySellerIds.length === 0) {
// //         console.log('No nearby sellers found within 40km.');
// //         setProducts([]);
// //         return;
// //       }

// //       const { data, error } = await supabase
// //         .from('products')
// //         .select('id, title, price, images, seller_id, stock')
// //         .eq('is_approved', true)
// //         .in('seller_id', nearbySellerIds);
// //       if (error) throw error;
// //       console.log('Products Response:', data);

// //       const mappedProducts = data.map((product) => ({
// //         id: product.id,
// //         name: product.title || 'Unnamed Product',
// //         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
// //         price: parseFloat(product.price) || 0,
// //         stock: product.stock || 0,
// //       }));
// //       setProducts(mappedProducts);
// //       console.log('Mapped Products:', mappedProducts);
// //     } catch (err) {
// //       console.error('Error fetching products:', err);
// //       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
// //       setProducts([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [buyerLocation]);

// //   // Fetch banner images from Supabase storage
// //   const fetchBannerImages = useCallback(async () => {
// //     try {
// //       const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
// //       console.log('Banner Storage Response:', data);
// //       const banners = await Promise.all(
// //         data
// //           .filter((file) => {
// //             const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file.name);
// //             if (!isImage) console.warn(`Excluded non-image file: ${file.name}`);
// //             return isImage;
// //           })
// //           .map(async (file) => {
// //             const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
// //             return { url: publicUrl, name: file.name };
// //           })
// //       );
// //       console.log('Mapped Banners:', banners);
// //       setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
// //     } catch (err) {
// //       console.error('Error fetching banner images:', err);
// //       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
// //     }
// //   }, []);

// //   // Add a product to the cart with stock and authentication validation
// //   const addToCart = async (product) => {
// //     if (!product || !product.id || !product.name || product.price === undefined) {
// //       setError('Cannot add invalid product to cart.');
// //       return;
// //     }
// //     if (product.stock <= 0) {
// //       setError('Product out of stock.');
// //       return;
// //     }
// //     try {
// //       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
// //       if (sessionError || !session?.user) {
// //         setError('Please log in to add items to your cart.');
// //         navigate('/auth');
// //         return;
// //       }
// //       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
// //       const existing = storedCart.find((item) => item.id === product.id);
// //       if (existing) {
// //         if (existing.quantity >= product.stock) {
// //           setError('Cannot add more items than available stock.');
// //           return;
// //         }
// //         existing.quantity += 1;
// //       } else {
// //         storedCart.push({
// //           id: product.id,
// //           title: product.name,
// //           price: product.price,
// //           quantity: 1,
// //           image: product.images[0],
// //           stock: product.stock,
// //         });
// //       }
// //       localStorage.setItem('cart', JSON.stringify(storedCart));
// //       console.log('Added to cart:', product);
// //       setError(null);
// //     } catch (err) {
// //       console.error('Error adding to cart:', err);
// //       setError(`Error: ${err.message || 'Failed to add product to cart.'}`);
// //     }
// //   };

// //   // Use effect to fetch banner images and products
// //   useEffect(() => {
// //     fetchBannerImages();
// //   }, [fetchBannerImages]);

// //   useEffect(() => {
// //     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
// //       fetchNearbyProducts();
// //     }
// //   }, [buyerLocation, fetchNearbyProducts]);

// //   // Filter products based on search term
// //   const filteredProducts = useMemo(
// //     () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
// //     [products, searchTerm]
// //   );

// //   if (loading) return <div className="home-loading">Loading...</div>;

// //   // Slider settings
// //   const sliderSettings = {
// //     dots: true,
// //     infinite: true,
// //     speed: 500,
// //     slidesToShow: 1,
// //     slidesToScroll: 1,
// //     autoplay: true,
// //     autoplaySpeed: 3000,
// //   };

// //   return (
// //     <div className="home">
// //       <h1 className="home-title">FreshCart</h1>
// //       <div className="search-bar">
// //         <input
// //           type="text"
// //           placeholder="Search products..."
// //           value={searchTerm}
// //           onChange={(e) => setSearchTerm(e.target.value)}
// //         />
// //       </div>
// //       <div className="banner-slider">
// //         <Slider {...sliderSettings}>
// //           {bannerImages.map((banner, i) => (
// //             <Link key={i} to={`/product/${i + 1}`}>
// //               <img src={banner.url} alt={`Banner ${banner.name}`} />
// //             </Link>
// //           ))}
// //         </Slider>
// //       </div>
// //       {error && (
// //         <div className="home-error">
// //           <p>{error}</p>
// //         </div>
// //       )}
// //       <section className="products-section">
// //         <h2>Products Near You (40km)</h2>
// //         {filteredProducts.length === 0 ? (
// //           <p>
// //             {searchTerm
// //               ? 'No products found matching your search.'
// //               : 'No products available within 40km.'}
// //           </p>
// //         ) : (
// //           <div className="product-grid">
// //             {filteredProducts.map((product) => (
// //               <div
// //                 key={product.id}
// //                 className="product-card"
// //                 onClick={() => navigate(`/product/${product.id}`)}
// //               >
// //                 <img
// //                   src={product.images[0]}
// //                   alt={product.name}
// //                   onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
// //                 />
// //                 <h3>{product.name}</h3>
// //                 <p>
// //                   ₹{product.price.toLocaleString('en-IN', {
// //                     minimumFractionDigits: 2,
// //                     maximumFractionDigits: 2,
// //                   })}
// //                 </p>
// //                 <p className="product-stock">
// //                   {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
// //                 </p>
// //                 <div className="product-buttons">
// //                   <button
// //                     onClick={(e) => {
// //                       e.stopPropagation();
// //                       addToCart(product);
// //                     }}
// //                     className="add-to-cart-btn"
// //                     disabled={product.stock <= 0}
// //                   >
// //                     <FaShoppingCart /> Add to Cart
// //                   </button>
// //                   <button
// //                     onClick={(e) => {
// //                       e.stopPropagation();
// //                       navigate('/cart', { state: { product } });
// //                     }}
// //                     className="buy-now-btn"
// //                     disabled={product.stock <= 0}
// //                   >
// //                     Buy Now
// //                   </button>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </section>
// //       <div className="cart-icon">
// //         <Link to="/cart">
// //           <FaShoppingCart size={30} color="#007bff" />
// //         </Link>
// //       </div>
// //       {isSeller && (
// //         <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
// //           Go to Seller Dashboard
// //         </button>
// //       )}
// //     </div>
// //   );
// // }

// // export default React.memo(Home);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import '../style/Home.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation (standardized to latitude/longitude)
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//     Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, session } = useContext(LocationContext);
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

//   // Fetch user role (buyer/seller)
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
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
//       setError('Failed to fetch user role.');
//     }
//   }, [session]);

//   // Fetch nearby products within 40 km
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setError('No buyer location available. Please enable location services or log in to set your location.');
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
//           return distance !== null && distance <= 40; // Strict 40 km radius
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         setError('No sellers found within 40km.');
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
//       setError('Failed to fetch products. Please try again.');
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images from Supabase storage
//   const fetchBannerImages = useCallback(async () => {
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
//       setError('Failed to load banner images. Using default banner.');
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add a product to the cart with stock, authentication, and Supabase validation
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Cannot add invalid product to cart.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Product out of stock.');
//       return;
//     }
//     try {
//       if (!session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }

//       // Check if product already exists in cart
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .single();
//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError; // PGRST116: no rows found

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         if (newQuantity > product.stock) {
//           setError('Cannot add more items than available stock.');
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
//             image: product.images[0],
//           });
//         if (insertError) throw insertError;
//       }

//       setError(null);
//       alert('Product added to cart successfully!');
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError('Failed to add product to cart. Please try again.');
//     }
//   }, [session, navigate]);

//   // Fetch data on mount
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//   }, [fetchUserRole, fetchBannerImages]);

//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

//   // Filter products based on search term
//   const filteredProducts = useMemo(
//     () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
//     [products, searchTerm]
//   );

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

//   return (
//     <div className="home">
//       <h1 className="home-title">FreshCart</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           aria-label="Search products"
//         />
//       </div>
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, i) => (
//               <Link key={i} to={`/product/${i + 1}`} aria-label={`Banner ${banner.name}`}>
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//               </Link>
//             ))}
//           </Slider>
//         )}
//       </div>
//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//           {(error.includes('Failed to fetch products') || error.includes('Failed to load banner images')) && (
//             <button
//               onClick={() => {
//                 if (error.includes('Failed to fetch products')) fetchNearbyProducts();
//                 if (error.includes('Failed to load banner images')) fetchBannerImages();
//               }}
//               className="retry-btn"
//             >
//               Retry
//             </button>
//           )}
//         </div>
//       )}
//       <section className="products-section">
//         <h2>Products Near You (40km)</h2>
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
//           <p>
//             {searchTerm
//               ? 'No products found matching your search.'
//               : 'No products available within 40km.'}
//           </p>
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
//                 <img
//                   src={product.images[0]}
//                   alt={product.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                 />
//                 <h3>{product.name}</h3>
//                 <p className="product-price">
//                   ₹{product.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <p className="product-stock">
//                   {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
//                 </p>
//                 <div className="product-buttons">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="add-to-cart-btn"
//                     disabled={product.stock <= 0}
//                     aria-label={`Add ${product.name} to cart`}
//                   >
//                     <FaShoppingCart /> Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       navigate('/cart', { state: { product } });
//                     }}
//                     className="buy-now-btn"
//                     disabled={product.stock <= 0}
//                     aria-label={`Buy ${product.name} now`}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//       <div className="cart-icon">
//         <Link to="/cart" aria-label="View cart">
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>
//       {isSeller && (
//         <button
//           onClick={() => navigate('/seller')}
//           className="btn-seller-dashboard"
//           aria-label="Go to seller dashboard"
//         >
//           Go to Seller Dashboard
//         </button>
//       )}
//     </div>
//   );
// }

// export default React.memo(Home);


// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import '../style/Home.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation (standardized to latitude/longitude)
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//     Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, session } = useContext(LocationContext);
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

//   // Fetch user role (buyer/seller)
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
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
//       setError('Failed to fetch user role.');
//     }
//   }, [session]);

//   // Fetch nearby products within 40 km
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setError('No buyer location available. Please enable location services or log in to set your location.');
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
//           return distance !== null && distance <= 40; // Strict 40 km radius
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         setError('No sellers found within 40km.');
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
//       setError('Failed to fetch products. Please try again.');
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images from Supabase storage
//   const fetchBannerImages = useCallback(async () => {
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
//       setError('Failed to load banner images. Using default banner.');
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add a product to the cart with stock, authentication, and Supabase validation
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Cannot add invalid product to cart.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Product out of stock.');
//       return;
//     }
//     try {
//       if (!session?.user) {
//         setError('Please log in to add items to your cart.');
//         navigate('/auth');
//         return;
//       }

//       // Check if product already exists in cart
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .single();
//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError; // PGRST116: no rows found

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         if (newQuantity > product.stock) {
//           setError('Cannot add more items than available stock.');
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

//       setError(null);
//       alert('Product added to cart successfully!');
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError('Failed to add product to cart. Please try again.');
//     }
//   }, [session, navigate, setError]); // Dependencies are correctly specified

//   // Fetch data on mount
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//   }, [fetchUserRole, fetchBannerImages]);

//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

//   // Filter products based on search term
//   const filteredProducts = useMemo(
//     () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
//     [products, searchTerm]
//   );

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

//   return (
//     <div className="home">
//       <h1 className="home-title">FreshCart</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search products..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           aria-label="Search products"
//         />
//       </div>
//       <div className="banner-slider">
//         {loadingBanners ? (
//           <div className="banner-skeleton" />
//         ) : (
//           <Slider {...sliderSettings}>
//             {bannerImages.map((banner, i) => (
//               <Link key={i} to={`/product/${i + 1}`} aria-label={`Banner ${banner.name}`}>
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//               </Link>
//             ))}
//           </Slider>
//         )}
//       </div>
//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//           {(error.includes('Failed to fetch products') || error.includes('Failed to load banner images')) && (
//             <button
//               onClick={() => {
//                 if (error.includes('Failed to fetch products')) fetchNearbyProducts();
//                 if (error.includes('Failed to load banner images')) fetchBannerImages();
//               }}
//               className="retry-btn"
//             >
//               Retry
//             </button>
//           )}
//         </div>
//       )}
//       <section className="products-section">
//         <h2>Products Near You (40km)</h2>
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
//           <p>
//             {searchTerm
//               ? 'No products found matching your search.'
//               : 'No products available within 40km.'}
//           </p>
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
//                 <img
//                   src={product.images[0]}
//                   alt={product.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                 />
//                 <h3>{product.name}</h3>
//                 <p className="product-price">
//                   ₹{product.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <p className="product-stock">
//                   {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
//                 </p>
//                 <div className="product-buttons">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="add-to-cart-btn"
//                     disabled={product.stock <= 0}
//                     aria-label={`Add ${product.name} to cart`}
//                   >
//                     <FaShoppingCart /> Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       navigate('/cart', { state: { product } });
//                     }}
//                     className="buy-now-btn"
//                     disabled={product.stock <= 0}
//                     aria-label={`Buy ${product.name} now`}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//       <div className="cart-icon">
//         <Link to="/cart" aria-label="View cart">
//           <FaShoppingCart size={30} color="#007bff" />
//         </Link>
//       </div>
//       {isSeller && (
//         <button
//           onClick={() => navigate('/seller')}
//           className="btn-seller-dashboard"
//           aria-label="Go to seller dashboard"
//         >
//           Go to Seller Dashboard
//         </button>
//       )}
//     </div>
//   );
// }

// export default React.memo(Home);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaMoon, FaSun, FaSearch, FaArrowRight } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import '../style/Home.css';

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
//   const { buyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isDarkMode, setIsDarkMode] = useState(false);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
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
//       setError('Failed to fetch user role.');
//     }
//   }, [session]);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setError('No buyer location available.');
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
//         setError('No sellers within 40km.');
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
//       setError('Failed to fetch products.');
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
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
//       setError('Failed to load banner images.');
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Invalid product.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Out of stock.');
//       return;
//     }
//     try {
//       if (!session?.user) {
//         setError('Please log in.');
//         navigate('/auth');
//         return;
//       }

//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .single();
//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         if (newQuantity > product.stock) {
//           setError('Exceeds stock.');
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

//       setError(null);
//       alert('Added to cart!');
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError('Failed to add to cart.');
//     }
//   }, [session, navigate, setError]);

//   // Fetch data on mount
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//   }, [fetchUserRole, fetchBannerImages]);

//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

//   // Filter products
//   const filteredProducts = useMemo(
//     () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
//     [products, searchTerm]
//   );

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

//   // Toggle dark mode
//   const toggleDarkMode = () => {
//     setIsDarkMode(!isDarkMode);
//     document.body.classList.toggle('dark-mode');
//   };

//   return (
//     <div className={`home ${isDarkMode ? 'dark-mode' : ''}`}>
//       {/* Dark Mode Toggle */}
//       <button
//         onClick={toggleDarkMode}
//         className="dark-mode-toggle"
//         aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
//       >
//         {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
//       </button>

//       {/* Hero Section */}
//       <div className="hero-section">
//         <h1 className="hero-title">Welcome to FreshCart</h1>
//         <p className="hero-subtitle">Shop the best products near you!</p>
//         <button
//           onClick={() => navigate('/products')}
//           className="hero-cta"
//           aria-label="Shop now"
//         >
//           Shop Now <FaArrowRight />
//         </button>
//       </div>

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
//             {bannerImages.map((banner, i) => (
//               <Link key={i} to={`/product/${i + 1}`} aria-label={`Banner ${banner.name}`}>
//                 <img src={banner.url} alt={`Banner ${banner.name}`} />
//               </Link>
//             ))}
//           </Slider>
//         )}
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//           {(error.includes('Failed to fetch products') || error.includes('Failed to load banner images')) && (
//             <button
//               onClick={() => {
//                 if (error.includes('Failed to fetch products')) fetchNearbyProducts();
//                 if (error.includes('Failed to load banner images')) fetchBannerImages();
//               }}
//               className="retry-btn"
//             >
//               Retry
//             </button>
//           )}
//         </div>
//       )}

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Products Near You (40km)</h2>
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
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products within 40km.'}</p>
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
//                   <p className={`product-stock ${product.stock <= 0 ? 'out-of-stock' : ''}`}>
//                     {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
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
//                         navigate('/cart', { state: { product } });
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

//       {/* Cart Icon */}
//       <div className="cart-icon">
//         <Link to="/cart" aria-label="View cart">
//           <FaShoppingCart size={28} />
//         </Link>
//       </div>

//       {/* Seller Dashboard Button */}
//       {isSeller && (
//         <button
//           onClick={() => navigate('/seller')}
//           className="btn-seller-dashboard"
//           aria-label="Go to seller dashboard"
//         >
//           Go to Seller Dashboard <FaArrowRight />
//         </button>
//       )}
//     </div>
//   );
// }

// export default React.memo(Home);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaMoon, FaSun, FaSearch, FaArrowRight } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import '../style/Home.css';

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
//   const { buyerLocation, session } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [isDarkMode, setIsDarkMode] = useState(false);

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
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
//       setError('Failed to fetch user role.');
//     }
//   }, [session]);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setError('No buyer location available.');
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
//         setError('No sellers within 40km.');
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
//       setError('Failed to fetch products.');
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
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
//       setError('Failed to load banner images.');
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Invalid product.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Out of stock.');
//       return;
//     }
//     try {
//       if (!session?.user) {
//         setError('Please log in.');
//         navigate('/auth');
//         return;
//       }

//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .single();
//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         if (newQuantity > product.stock) {
//           setError('Exceeds stock.');
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

//       setError(null);
//       alert('Added to cart!');
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError('Failed to add to cart.');
//     }
//   }, [navigate, session]);

//   // Fetch data on mount
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//   }, [fetchUserRole, fetchBannerImages]);

//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

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

//   // Toggle dark mode
//   const toggleDarkMode = () => {
//     setIsDarkMode(!isDarkMode);
//     document.body.classList.toggle('dark-mode');
//   };

//   return (
//     <div className={`home ${isDarkMode ? 'dark-mode' : ''}`}>
//       {/* Dark Mode Toggle */}
//       <button
//         onClick={toggleDarkMode}
//         className="dark-mode-toggle"
//         aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
//       >
//         {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
//       </button>

//       {/* Hero Section */}
//       <div className="hero-section">
//         <h1 className="hero-title">Welcome to FreshCart</h1>
//         <p className="hero-subtitle">Shop the best products near you!</p>
//         <button
//           onClick={() => navigate('/products')}
//           className="hero-cta"
//           aria-label="Shop now"
//         >
//           Shop Now <FaArrowRight />
//         </button>
//       </div>

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

//       {/* Error Message */}
//       {error && (
//         <div className="home-error" aria-live="polite">
//           <p>{error}</p>
//           {(error.includes('Failed to fetch products') || error.includes('Failed to load banner images')) && (
//             <button
//               onClick={() => {
//                 if (error.includes('Failed to fetch products')) fetchNearbyProducts();
//                 if (error.includes('Failed to load banner images')) fetchBannerImages();
//               }}
//               className="retry-btn"
//             >
//               Retry
//             </button>
//           )}
//         </div>
//       )}

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Products Near You (40km)</h2>
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
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products within 40km.'}</p>
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
//                   <p className={`product-stock ${product.stock <= 0 ? 'out-of-stock' : ''}`}>
//                     {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
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
//                         navigate('/cart', { state: { product } });
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

//       {/* Cart Icon */}
//       <div className="cart-icon">
//         <Link to="/cart" aria-label="View cart">
//           <FaShoppingCart size={28} />
//         </Link>
//       </div>
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
// import '../style/Home.css';

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
//   const { buyerLocation, session } = useContext(LocationContext);
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

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
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
//       setError('Failed to fetch user role.');
//     }
//   }, [session]);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setError('No buyer location available.');
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
//         setError('No sellers within 40km.');
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
//       setError('Failed to fetch products.');
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
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
//       setError('Failed to load banner images.');
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Invalid product.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Out of stock.');
//       return;
//     }
//     try {
//       if (!session?.user) {
//         setError('Please log in.');
//         navigate('/auth');
//         return;
//       }

//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .single();
//       if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         if (newQuantity > product.stock) {
//           setError('Exceeds stock.');
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

//       setError(null);
//       alert('Added to cart!');
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError('Failed to add to cart.');
//     }
//   }, [navigate, session]);

//   // Fetch data on mount
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//   }, [fetchUserRole, fetchBannerImages]);

//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

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
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   return (
//     <div className="home">
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

//       {/* Error Message */}
//       {error && (
//         <div className="home-error" aria-live="polite">
//           <p>{error}</p>
//           {(error.includes('Failed to fetch products') || error.includes('Failed to load banner images')) && (
//             <button
//               onClick={() => {
//                 if (error.includes('Failed to fetch products')) fetchNearbyProducts();
//                 if (error.includes('Failed to load banner images')) fetchBannerImages();
//               }}
//               className="retry-btn"
//             >
//               Retry
//             </button>
//           )}
//         </div>
//       )}

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Products Near You (40km)</h2>
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
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products within 40km.'}</p>
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
//                   <p className={`product-stock ${product.stock <= 0 ? 'out-of-stock' : ''}`}>
//                     In Stock: {product.stock > 0 ? product.stock : 'Out of Stock'}
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
//                         navigate('/cart', { state: { product } });
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

//       {/* Footer */}
//       <footer className="footer">
//         <div className="footer-icons">
//           <Link to="/" className="footer-icon active">
//             <FaHome size={24} />
//             <span>Home</span>
//           </Link>
//           <Link to="/categories" className="footer-icon">
//             <FaList size={24} />
//             <span>Category</span>
//           </Link>
//           <Link to="/account" className="footer-icon">
//             <FaUser size={24} />
//             <span>Account</span>
//           </Link>
//           <Link to="/cart" className="footer-icon">
//             <FaShoppingCart size={24} />
//             <span>Cart</span>
//           </Link>
//         </div>
//       </footer>
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
// import '../style/Home.css';
// import Footer from './Footer'; // Import Footer component

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
//   const { buyerLocation, session } = useContext(LocationContext);
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

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
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
//       setError('Failed to fetch user role.');
//     }
//   }, [session]);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setError('No buyer location available.');
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
//         setError('No sellers within 40km.');
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
//       setError('Failed to fetch products.');
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
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
//       setError('Failed to load banner images.');
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Invalid product.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Out of stock.');
//       return;
//     }
//     try {
//       if (!session?.user) {
//         setError('Please log in.');
//         navigate('/auth');
//         return;
//       }

//       // Check if product already exists in cart
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity, product_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .single();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         console.error('Fetch Error:', fetchError);
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         if (newQuantity > product.stock) {
//           setError('Exceeds stock.');
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) {
//           console.error('Update Error:', updateError);
//           throw updateError;
//         }
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
//         if (insertError) {
//           console.error('Insert Error:', insertError);
//           throw insertError;
//         }
//       }

//       setError(null);
//       alert('Added to cart!');
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError(`Failed to add to cart: ${err.message || 'Unknown error'}`);
//     }
//   }, [navigate, session]);

//   // Fetch data on mount
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();
//   }, [fetchUserRole, fetchBannerImages]);

//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

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
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   return (
//     <div className="home">
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

//       {/* Error Message */}
//       {error && (
//         <div className="home-error" aria-live="polite">
//           <p>{error}</p>
//           {(error.includes('Failed to fetch products') || error.includes('Failed to load banner images')) && (
//             <button
//               onClick={() => {
//                 if (error.includes('Failed to fetch products')) fetchNearbyProducts();
//                 if (error.includes('Failed to load banner images')) fetchBannerImages();
//               }}
//               className="retry-btn"
//             >
//               Retry
//             </button>
//           )}
//         </div>
//       )}

//       {/* Products Section */}
//       <section className="products-section">
//         <h2 className="section-title">Products Near You (40km)</h2>
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
//           <p className="no-products">{searchTerm ? 'No products found.' : 'No products within 40km.'}</p>
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
//                   <p className={`product-stock ${product.stock <= 0 ? 'out-of-stock' : ''}`}>
//                     In Stock: {product.stock > 0 ? product.stock : 'Out of Stock'}
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
//                         navigate('/cart', { state: { product } });
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

//       <Footer /> {/* Use Footer component instead of inline footer */}
//     </div>
//   );
// }

// // export default React.memo(Home);
// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaShoppingCart, FaSearch, FaHome, FaList, FaUser } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import '../style/Home.css';
// import Footer from './Footer'; // Import Footer component

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

//   // Fetch user role
//   const fetchUserRole = useCallback(async () => {
//     if (!session?.user) {
//       setIsSeller(false);
//       return;
//     }
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
//       setError('Failed to fetch user role.');
//     }
//   }, [session]);

//   // Fetch nearby products (without login dependency)
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setError('No buyer location available. Please allow location access or try again.');
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
//         setError('No sellers nearby.');
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
//       setError('Failed to fetch products.');
//       setProducts([]);
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, [buyerLocation]);

//   // Fetch banner images
//   const fetchBannerImages = useCallback(async () => {
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
//       setError('Failed to load banner images.');
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Invalid product.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Out of stock.');
//       return;
//     }
//     if (!session?.user) {
//       setError('Please log in to add items to cart.');
//       navigate('/auth');
//       return;
//     }

//     try {
//       // Check if product already exists in cart
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity, product_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .single();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         console.error('Fetch Error:', fetchError);
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         if (newQuantity > product.stock) {
//           setError('Exceeds stock.');
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) {
//           console.error('Update Error:', updateError);
//           throw updateError;
//         }
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
//         if (insertError) {
//           console.error('Insert Error:', insertError);
//           throw insertError;
//         }
//       }

//       setError(null);
//       alert('Added to cart!');
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       setError(`Failed to add to cart: ${err.message || 'Unknown error'}`);
//     }
//   }, [navigate, session]);

//   // Buy now (add to cart and navigate to cart page)
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.price === undefined) {
//       setError('Invalid product.');
//       return;
//     }
//     if (product.stock <= 0) {
//       setError('Out of stock.');
//       return;
//     }
//     if (!session?.user) {
//       setError('Please log in to proceed to cart.');
//       navigate('/auth');
//       return;
//     }

//     try {
//       // Check if product already exists in cart
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity, product_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .single();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         console.error('Fetch Error:', fetchError);
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         if (newQuantity > product.stock) {
//           setError('Exceeds stock.');
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) {
//           console.error('Update Error:', updateError);
//           throw updateError;
//         }
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
//         if (insertError) {
//           console.error('Insert Error:', insertError);
//           throw insertError;
//         }
//       }

//       setError(null);
//       // Navigate to cart page after adding to cart
//       navigate('/cart');
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       setError(`Failed to add to cart: ${err.message || 'Unknown error'}`);
//     }
//   }, [navigate, session]);

//   // Fetch data on mount and handle location
//   useEffect(() => {
//     fetchUserRole();
//     fetchBannerImages();

//     // Get location if not available from context
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation); // Update context
//             fetchNearbyProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             setError('Unable to fetch your location. Please enable location services or log in to set your location.');
//             setLoadingProducts(false);
//           }
//         );
//       } else {
//         setError('Geolocation is not supported by this browser.');
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
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   return (
//     <div className="home">
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

//       {/* Error Message */}
//       {error && (
//         <div className="home-error" aria-live="polite">
//           <p>{error}</p>
//           {(error.includes('Failed to fetch products') || error.includes('Failed to load banner images') || error.includes('Unable to fetch your location')) && (
//             <button
//               onClick={() => {
//                 if (error.includes('Failed to fetch products')) fetchNearbyProducts();
//                 if (error.includes('Failed to load banner images')) fetchBannerImages();
//                 if (error.includes('Unable to fetch your location') && navigator.geolocation) {
//                   navigator.geolocation.getCurrentPosition(
//                     (position) => {
//                       const newLocation = {
//                         lat: position.coords.latitude,
//                         lon: position.coords.longitude,
//                       };
//                       setBuyerLocation(newLocation);
//                       fetchNearbyProducts();
//                     },
//                     (geoError) => {
//                       console.error('Geolocation retry error:', geoError);
//                       setError('Location access denied. Please enable location services or log in.');
//                     }
//                   );
//                 }
//               }}
//               className="retry-btn"
//             >
//               Retry
//             </button>
//           )}
//         </div>
//       )}

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

//       <Footer /> {/* Use Footer component instead of inline footer */}
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
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity, product_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .single();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         throw fetchError;
//       }

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

//       toast.success('Added to cart!', {
//         position: "top-center",
//         autoClose: 2000,
//       });
//     } catch (err) {
//       console.error('Error adding to cart:', err);
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
//         .select('id, quantity, product_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .single();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         throw fetchError;
//       }

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


import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LocationContext } from '../App';
import { FaShoppingCart, FaSearch } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../style/Home.css';
import Footer from './Footer';

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
  const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
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
        position: "top-center",
        autoClose: 5000,
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
      if (err.message.includes('Network')) {
        toast.error('Network error while fetching user role. Please check your connection.', {
          position: "top-center",
          autoClose: 5000,
        });
      } else {
        toast.error('Failed to fetch user role.', {
          position: "top-center",
          autoClose: 3000,
        });
      }
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
    } catch (err) {
      console.error('Error fetching categories:', err);
      if (err.message.includes('Network')) {
        toast.error('Network error while fetching categories. Please check your connection.', {
          position: "top-center",
          autoClose: 5000,
        });
      } else {
        toast.error('Failed to fetch categories.', {
          position: "top-center",
          autoClose: 3000,
        });
      }
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch nearby products
  const fetchNearbyProducts = useCallback(async () => {
    if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
      toast.warn('No buyer location available. Please allow location access or log in.', {
        position: "top-center",
        autoClose: 5000,
      });
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
        toast.info('No sellers nearby.', {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, original_price, discount_amount, images, seller_id, stock')
        .eq('is_approved', true)
        .in('seller_id', nearbySellerIds);
      if (error) throw error;

      const mappedProducts = data.map((product) => ({
        id: product.id,
        name: product.title || 'Unnamed Product',
        images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
        price: parseFloat(product.price) || 0,
        originalPrice: product.original_price ? parseFloat(product.original_price) : null,
        discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
        stock: product.stock || 0,
      }));
      setProducts(mappedProducts);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      if (err.message.includes('Network')) {
        toast.error('Network error while fetching products. Please check your connection.', {
          position: "top-center",
          autoClose: 5000,
        });
      } else {
        toast.error('Failed to fetch products.', {
          position: "top-center",
          autoClose: 3000,
        });
      }
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
      if (err.message.includes('Network')) {
        toast.error('Network error while fetching banner images. Please check your connection.', {
          position: "top-center",
          autoClose: 5000,
        });
      } else {
        toast.error('Failed to load banner images.', {
          position: "top-center",
          autoClose: 3000,
        });
      }
      setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
    } finally {
      setLoadingBanners(false);
    }
  }, []);

  // Add to cart
  const addToCart = useCallback(async (product) => {
    if (!product || !product.id || !product.name || product.price === undefined) {
      toast.error('Invalid product.', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    if (product.stock <= 0) {
      toast.warn('Out of stock.', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    if (!session?.user) {
      toast.warn('Please log in to add items to cart.', {
        position: "top-center",
        autoClose: 3000,
      });
      navigate('/auth');
      return;
    }
    if (!checkNetworkStatus()) return;

    try {
      const { data: existingCartItem, error: fetchError } = await supabase
        .from('cart')
        .select('id, quantity')
        .eq('user_id', session.user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No rows found, proceed with insert
        } else {
          throw fetchError;
        }
      }

      if (existingCartItem) {
        const newQuantity = (existingCartItem.quantity || 0) + 1;
        if (newQuantity > product.stock) {
          toast.warn('Exceeds stock.', {
            position: "top-center",
            autoClose: 3000,
          });
          return;
        }
        const { error: updateError } = await supabase
          .from('cart')
          .update({ quantity: newQuantity })
          .eq('id', existingCartItem.id);
        if (updateError) throw updateError;
        toast.success(`${product.name} quantity updated in cart!`, {
          position: "top-center",
          autoClose: 2000,
        });
      } else {
        const { error: insertError } = await supabase
          .from('cart')
          .insert({
            user_id: session.user.id,
            product_id: product.id,
            quantity: 1,
            price: product.price,
            title: product.name,
          });
        if (insertError) throw insertError;
        toast.success(`${product.name} added to cart!`, {
          position: "top-center",
          autoClose: 2000,
        });
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      if (err.message.includes('Network')) {
        toast.error('Network error while adding to cart. Please check your connection.', {
          position: "top-center",
          autoClose: 5000,
        });
      } else if (err.code === '406') {
        toast.error('Unable to check cart due to a server error. Please try again.', {
          position: "top-center",
          autoClose: 3000,
        });
      } else {
        toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
          position: "top-center",
          autoClose: 3000,
        });
      }
    }
  }, [navigate, session]);

  // Buy now (add to cart and navigate to cart page)
  const buyNow = useCallback(async (product) => {
    if (!product || !product.id || !product.name || product.price === undefined) {
      toast.error('Invalid product.', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    if (product.stock <= 0) {
      toast.warn('Out of stock.', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    if (!session?.user) {
      toast.warn('Please log in to proceed to cart.', {
        position: "top-center",
        autoClose: 3000,
      });
      navigate('/auth');
      return;
    }
    if (!checkNetworkStatus()) return;

    try {
      const { data: existingCartItem, error: fetchError } = await supabase
        .from('cart')
        .select('id, quantity')
        .eq('user_id', session.user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No rows found, proceed with insert
        } else {
          throw fetchError;
        }
      }

      if (existingCartItem) {
        const newQuantity = (existingCartItem.quantity || 0) + 1;
        if (newQuantity > product.stock) {
          toast.warn('Exceeds stock.', {
            position: "top-center",
            autoClose: 3000,
          });
          return;
        }
        const { error: updateError } = await supabase
          .from('cart')
          .update({ quantity: newQuantity })
          .eq('id', existingCartItem.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart')
          .insert({
            user_id: session.user.id,
            product_id: product.id,
            quantity: 1,
            price: product.price,
            title: product.name,
          });
        if (insertError) throw insertError;
      }

      toast.success('Added to cart! Redirecting...', {
        position: "top-center",
        autoClose: 2000,
      });
      setTimeout(() => navigate('/cart'), 2000);
    } catch (err) {
      console.error('Error in Buy Now:', err);
      if (err.message.includes('Network')) {
        toast.error('Network error while adding to cart. Please check your connection.', {
          position: "top-center",
          autoClose: 5000,
        });
      } else {
        toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
          position: "top-center",
          autoClose: 3000,
        });
      }
    }
  }, [navigate, session]);

  // Compute search suggestions
  useEffect(() => {
    if (!searchTerm || !isSearchFocused) {
      setSuggestions([]);
      return;
    }

    const filteredSuggestions = products
      .filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 suggestions
    setSuggestions(filteredSuggestions);
  }, [searchTerm, products, isSearchFocused]);

  // Handle clicks outside the search bar to hide suggestions
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
            let errorMessage = 'Unable to fetch your location.';
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage = 'Location access denied. Please enable location services.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = 'Location information is unavailable. Please try again.';
            } else if (error.code === error.TIMEOUT) {
              errorMessage = 'Location request timed out. Please try again.';
            }
            toast.warn(errorMessage, {
              position: "top-center",
              autoClose: 5000,
            });
            setLoadingProducts(false);
          },
          { timeout: 10000 }
        );
      } else {
        toast.error('Geolocation is not supported by this browser.', {
          position: "top-center",
          autoClose: 5000,
        });
        setLoadingProducts(false);
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
    <div className="loading-container">
      <div className="loading-animation">
        <div className="loading-box">
          <FaShoppingCart className="loading-icon" />
          <span>Finding the best deals for you...</span>
        </div>
        <div className="loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="home">
      <ToastContainer />

      {/* Sticky Search Bar with Suggestions */}
      <div className="search-bar sticky" ref={searchRef}>
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search products..."
          onChange={(e) => debouncedSetSearchTerm(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          aria-label="Search products"
        />
        {suggestions.length > 0 && isSearchFocused && (
          <ul className="search-suggestions">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                className="suggestion-item"
                onClick={() => {
                  setSearchTerm(suggestion.name);
                  setIsSearchFocused(false);
                  setSuggestions([]);
                }}
              >
                {suggestion.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Banner Slider */}
      <div className="banner-slider">
        {loadingBanners ? (
          <div className="banner-skeleton" />
        ) : (
          <Slider {...sliderSettings}>
            {bannerImages.map((banner) => (
              <div key={banner.name} className="banner-wrapper">
                <img src={banner.url} alt={`Banner ${banner.name}`} />
                <button
                  className="view-offers-btn"
                  onClick={() => navigate('/categories')}
                >
                  View Offers
                </button>
              </div>
            ))}
          </Slider>
        )}
      </div>

      {/* Featured Categories Section */}
      <section className="categories-section">
        <div className="categories-header">
          <h2 className="section-title">Explore Categories</h2>
          <Link to="/categories" className="view-all-link">View All</Link>
        </div>
        {loadingCategories ? (
          <div className="category-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="category-card-skeleton">
                <div className="skeleton-image" />
                <div className="skeleton-text" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="no-categories">No categories available.</p>
        ) : (
          <div className="category-grid">
            {categories.map((category) => (
              <Link
                to={`/products?category=${category.id}`}
                key={category.id}
                className="category-card"
                aria-label={`View products in ${category.name} category`}
              >
                <div className="category-image-wrapper">
                  <img
                    src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
                    alt={category.name}
                    className="category-image"
                  />
                </div>
                <h3 className="category-name">{category.name.trim()}</h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Products Section */}
      <section className="products-section">
        <h2 className="section-title">Fast Delivery, Just Order!</h2>
        {loadingProducts ? (
          <div className="product-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="product-card-skeleton">
                <div className="skeleton-image" />
                <div className="skeleton-text" />
                <div className="skeleton-text short" />
                <div className="skeleton-buttons">
                  <div className="skeleton-btn" />
                  <div className="skeleton-btn" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="no-products">{searchTerm ? 'No products found.' : 'No products nearby.'}</p>
        ) : (
          <div className={`product-grid ${filteredProducts.length === 1 ? 'single-product' : ''}`}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
                aria-label={`View ${product.name}`}
              >
                <div className="product-image-wrapper">
                  {product.discountAmount > 0 && (
                    <span className="offer-badge">
                      <span className="offer-label">Offer!</span>
                      Save ₹{product.discountAmount.toFixed(2)}
                    </span>
                  )}
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
                    loading="lazy"
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="price-section">
                    <p className="product-price">
                      ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <p className="original-price">
                        ₹{product.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  <div className="product-buttons">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="add-to-cart-btn"
                      disabled={product.stock <= 0}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <FaShoppingCart /> Add to Cart
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        buyNow(product);
                      }}
                      className="buy-now-btn"
                      disabled={product.stock <= 0}
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