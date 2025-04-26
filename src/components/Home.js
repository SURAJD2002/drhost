
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



import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LocationContext } from '../App';
import { FaShoppingCart } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../style/Home.css';

// Distance calculation (standardized to latitude/longitude)
function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
  const R = 6371; // Earth's radius in kilometers
  const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
  const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(userLoc.lat * (Math.PI / 180)) *
    Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
    Math.sin(lonDiff / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function Home() {
  const { buyerLocation } = useContext(LocationContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [bannerImages, setBannerImages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeller, setIsSeller] = useState(false);

  // Fetch nearby products within 40 km
  const fetchNearbyProducts = useCallback(async () => {
    if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
      console.warn('No buyer location provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Auth Session:', session, 'Session Error:', sessionError);
      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('id', session.user.id)
          .single();
        if (profileError) throw profileError;
        setIsSeller(profileData?.is_seller || false);
        console.log('User Role:', profileData?.is_seller ? 'Seller' : 'Buyer');
      } else {
        console.log('No user logged in, proceeding as anonymous');
        setIsSeller(false);
      }

      const { data: allSellers, error: sellersError } = await supabase
        .from('sellers')
        .select('id, latitude, longitude');
      if (sellersError) throw sellersError;
      console.log('All Sellers:', allSellers);

      const nearbySellerIds = allSellers
        .filter((seller) => {
          const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
          console.log(`Seller ${seller.id} Distance: ${distance !== null ? distance.toFixed(2) : 'N/A'} km`);
          return distance !== null && distance <= 40; // Strict 40 km radius
        })
        .map((seller) => seller.id);
      console.log('Nearby Seller IDs:', nearbySellerIds);

      if (nearbySellerIds.length === 0) {
        console.log('No nearby sellers found within 40km.');
        setProducts([]);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, images, seller_id, stock')
        .eq('is_approved', true)
        .in('seller_id', nearbySellerIds);
      if (error) throw error;
      console.log('Products Response:', data);

      const mappedProducts = data.map((product) => ({
        id: product.id,
        name: product.title || 'Unnamed Product',
        images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
        price: parseFloat(product.price) || 0,
        stock: product.stock || 0,
      }));
      setProducts(mappedProducts);
      console.log('Mapped Products:', mappedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(`Error: ${err.message || 'Failed to fetch products.'}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [buyerLocation]);

  // Fetch banner images from Supabase storage
  const fetchBannerImages = useCallback(async () => {
    try {
      const { data } = await supabase.storage.from('banner-images').list('', { limit: 100 });
      console.log('Banner Storage Response:', data);
      const banners = await Promise.all(
        data
          .filter((file) => {
            const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file.name);
            if (!isImage) console.warn(`Excluded non-image file: ${file.name}`);
            return isImage;
          })
          .map(async (file) => {
            const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
            return { url: publicUrl, name: file.name };
          })
      );
      console.log('Mapped Banners:', banners);
      setBannerImages(banners.length > 0 ? banners : [{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
    } catch (err) {
      console.error('Error fetching banner images:', err);
      setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
    }
  }, []);

  // Add a product to the cart with stock and authentication validation
  const addToCart = async (product) => {
    if (!product || !product.id || !product.name || product.price === undefined) {
      setError('Cannot add invalid product to cart.');
      return;
    }
    if (product.stock <= 0) {
      setError('Product out of stock.');
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
      const existing = storedCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setError('Cannot add more items than available stock.');
          return;
        }
        existing.quantity += 1;
      } else {
        storedCart.push({
          id: product.id,
          title: product.name,
          price: product.price,
          quantity: 1,
          image: product.images[0],
          stock: product.stock,
        });
      }
      localStorage.setItem('cart', JSON.stringify(storedCart));
      console.log('Added to cart:', product);
      setError(null);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(`Error: ${err.message || 'Failed to add product to cart.'}`);
    }
  };

  // Use effect to fetch banner images and products
  useEffect(() => {
    fetchBannerImages();
  }, [fetchBannerImages]);

  useEffect(() => {
    if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
      fetchNearbyProducts();
    }
  }, [buyerLocation, fetchNearbyProducts]);

  // Filter products based on search term
  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, searchTerm]
  );

  if (loading) return <div className="home-loading">Loading...</div>;

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div className="home">
      <h1 className="home-title">FreshCart</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="banner-slider">
        <Slider {...sliderSettings}>
          {bannerImages.map((banner, i) => (
            <Link key={i} to={`/product/${i + 1}`}>
              <img src={banner.url} alt={`Banner ${banner.name}`} />
            </Link>
          ))}
        </Slider>
      </div>
      {error && (
        <div className="home-error">
          <p>{error}</p>
        </div>
      )}
      <section className="products-section">
        <h2>Products Near You (40km)</h2>
        {filteredProducts.length === 0 ? (
          <p>
            {searchTerm
              ? 'No products found matching your search.'
              : 'No products available within 40km.'}
          </p>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
                />
                <h3>{product.name}</h3>
                <p>
                  ₹{product.price.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="product-stock">
                  {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
                </p>
                <div className="product-buttons">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="add-to-cart-btn"
                    disabled={product.stock <= 0}
                  >
                    <FaShoppingCart /> Add to Cart
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/cart', { state: { product } });
                    }}
                    className="buy-now-btn"
                    disabled={product.stock <= 0}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="cart-icon">
        <Link to="/cart">
          <FaShoppingCart size={30} color="#007bff" />
        </Link>
      </div>
      {isSeller && (
        <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
          Go to Seller Dashboard
        </button>
      )}
    </div>
  );
}

export default React.memo(Home);