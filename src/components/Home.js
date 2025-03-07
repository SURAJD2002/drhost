
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




import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaShoppingCart } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../style/Home.css';

// Debounce utility function for geolocation
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Custom retry function for Supabase requests
async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function Home() {
  const [products, setProducts] = useState([]);
  const [bannerImages, setBannerImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Fetch nearby products
  const fetchNearbyProducts = useCallback(async (userLocation) => {
    if (!userLocation) {
      console.warn('No user location available, using default Bengaluru location.');
      userLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
    }

    setLoading(true);
    try {
      const { data, error } = await retryRequest(() =>
        supabase
          .from('products')
          .select(`
            id, title, price, images,
            product_variants (id, attributes, price, stock, images)
          `)
          .eq('is_approved', true)
      );
      if (error) throw error;

      if (data) {
        const mappedProducts = data.map(product => {
          const hasProductImages = Array.isArray(product.images) && product.images.length > 0;
          const variantWithImages = product.product_variants?.find(
            (variant) => Array.isArray(variant.images) && variant.images.length > 0
          );
          const finalImages = hasProductImages
            ? product.images
            : (variantWithImages ? variantWithImages.images : ['https://dummyimage.com/150']);

          // Prioritize product.price, then variant price, with better logging
          const productPrice = product.price !== null && product.price !== undefined ? product.price : null;
          const variantPrice = variantWithImages?.price ?? product.product_variants?.[0]?.price;
          const finalPrice = productPrice ?? variantPrice ?? 0; // Default to 0 only if no price exists

          console.log(`Product ID ${product.id} (${product.title}):`, {
            productPrice,
            variantPrice,
            finalPrice,
            product_variants: product.product_variants,
          });

          return {
            id: product.id,
            name: product.title || 'Unnamed Product',
            images: finalImages,
            price: finalPrice,
          };
        });
        setProducts(mappedProducts);
        console.log('Fetched products:', mappedProducts);
      } else {
        setProducts([]);
        console.log('No products returned from Supabase.');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(`Error: ${error.message || 'Failed to fetch products.'}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch banner images from Supabase storage
  const fetchBannerImages = useCallback(async () => {
    try {
      const { data, error } = await retryRequest(() =>
        supabase.storage
          .from('banner-images')
          .list('', {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' },
          })
      );

      if (error) {
        setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
        return;
      }

      if (!data || data.length === 0) {
        setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
        return;
      }

      const imageFiles = data.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name) && file.name !== '.emptyFolderPlaceholder');
      if (imageFiles.length === 0) {
        setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
        return;
      }

      const bannerPromises = imageFiles.map(async (file) => {
        const { data: { publicUrl }, error: urlError } = await retryRequest(() =>
          supabase.storage.from('banner-images').getPublicUrl(file.name)
        );
        if (urlError) {
          return { url: 'https://dummyimage.com/1200x300?text=Banner+Image', name: file.name };
        }
        return { url: publicUrl, name: file.name };
      });

      const bannerImagesResult = await Promise.all(bannerPromises);
      setBannerImages(bannerImagesResult);
    } catch (error) {
      console.error('Error fetching banner images:', error);
      setBannerImages([{ url: 'https://dummyimage.com/1200x300?text=Default+Banner', name: 'default-banner' }]);
    }
  }, []);

  // Add product to cart
  const addToCart = async (product) => {
    if (!product || !product.id || !product.name || product.price === undefined) {
      console.error('Invalid product:', product);
      setError('Cannot add invalid product to cart.');
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Please log in to add items to your cart.');
        navigate('/auth');
        return;
      }

      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      const existingItem = storedCart.find(item => item.id === product.id);

      if (existingItem) {
        const updatedCart = storedCart.map(item =>
          item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      } else {
        const newCartItem = {
          id: product.id,
          title: product.name,
          price: product.price,
          quantity: 1,
        };
        localStorage.setItem('cart', JSON.stringify([...storedCart, newCartItem]));
      }
      setError(null);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError(`Error: ${error.message || 'Failed to add product to cart.'}`);
    }
  };

  // Handle product click to show details
  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  // Debounced geolocation handler
  const handleGeolocation = useCallback(debounce((position) => {
    const { latitude, longitude } = position.coords;
    setLocation({ lat: latitude, lon: longitude });
    console.log('Detected location:', { lat: latitude, lon: longitude });
    fetchNearbyProducts({ lat: latitude, lon: longitude });
  }, 1000), [fetchNearbyProducts]);

  // Slider settings for the banner carousel
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  useEffect(() => {
    fetchBannerImages();

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        handleGeolocation,
        (geoError) => {
          console.error('Geolocation error:', geoError);
          setError('Location access denied. Using default Bengaluru location.');
          setLocation({ lat: 12.9753, lon: 77.591 });
          fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setError('Geolocation not supported. Using default Bengaluru location.');
      setLocation({ lat: 12.9753, lon: 77.591 });
      fetchNearbyProducts({ lat: 12.9753, lon: 77.591 });
    }
  }, [fetchBannerImages, handleGeolocation, fetchNearbyProducts]);

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    const matches = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matches && searchTerm) {
      console.log(`Product "${product.name}" does not match search term "${searchTerm}"`);
    }
    return matches;
  });

  return (
    <div className="home">
      <h1 style={{ color: '#007bff', textAlign: 'center', padding: '20px' }}>FreshCart</h1>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '10px', width: '80%', margin: '0 auto', display: 'block', borderRadius: '5px', border: '1px solid #007bff' }}
        />
      </div>

      {/* Slide Banner (Carousel) */}
      <div className="banner-slider">
        {bannerImages.length > 0 ? (
          <Slider {...sliderSettings}>
            {bannerImages.map((banner, index) => (
              <Link key={index} to={`/product/${index + 1}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={banner.url} 
                    alt={`Banner ${banner.name}`} 
                    onError={(e) => { 
                      console.error('Banner image load failed:', banner.url);
                      e.target.src = 'https://dummyimage.com/1200x300?text=Default+Banner'; 
                    }}
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '5px' }}
                  />
                  <p style={{ color: '#007bff', padding: '10px' }}>Featured Product {index + 1}</p>
                </div>
              </Link>
            ))}
          </Slider>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No banner images available.
          </p>
        )}
      </div>

      {error && <p style={{ color: '#ff0000', textAlign: 'center', padding: '10px' }}>{error}</p>}
      {loading ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Loading...</p>
      ) : (
        <div className="product-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', padding: '20px', gap: '20px' }}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="product-card" 
                onClick={() => handleProductClick(product)}
                style={{ 
                  cursor: 'pointer', 
                  border: '1px solid #ccc', 
                  borderRadius: '8px', 
                  padding: '15px', 
                  width: '250px', 
                  backgroundColor: '#fff', 
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' 
                }}
              >
                <img 
                  src={product.images[0] || 'https://dummyimage.com/150'} 
                  alt={product.name || 'Unnamed Product'} 
                  onError={(e) => { 
                    console.error('Product image load failed for:', product.name, 'URL:', product.images[0] || 'N/A');
                    e.target.src = 'https://dummyimage.com/150'; 
                  }}
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <h3 style={{ color: '#007bff', margin: '10px 0' }}>{product.name}</h3>
                <p style={{ color: '#000', margin: '5px 0' }}>
                  ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <button 
                  onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
                  style={{ 
                    backgroundColor: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: '5px', 
                    cursor: 'pointer', 
                    marginRight: '10px' 
                  }}
                >
                  Add to Cart
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/cart', { state: { product } }); }} 
                  style={{ 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: '5px', 
                    cursor: 'pointer' 
                  }}
                >
                  Buy Now
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              {searchTerm 
                ? 'No products found matching your search.' 
                : 'No products available at the moment.'}
            </p>
          )}
        </div>
      )}

      {/* Cart Icon */}
      <div className="cart-icon" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
        <Link to="/cart" style={{ textDecoration: 'none' }}>
          <FaShoppingCart size={30} color="#007bff" />
        </Link>
      </div>

      {/* Footer */}
      <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
        <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <span style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            🏠
          </span>
          <span style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            🛒
          </span>
        </div>
        <p style={{ color: '#007bff', marginTop: '10px' }}>Categories</p>
      </div>
    </div>
  );
}

export default Home;