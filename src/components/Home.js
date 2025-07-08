
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

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', { duration: 3000, position: 'top-center' });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Validate product exists and is active
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, seller_id')
//         .eq('id', product.id)
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .single();
//       if (productError || !productData) {
//         toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
//         return;
//       }

//       // Validate seller distance
//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .eq('id', productData.seller_id)
//         .single();
//       if (sellerError || !sellerData || calculateDistance(buyerLocation, sellerData) > 40) {
//         toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
//         return;
//       }

//       // Select the cheapest variant with stock if variants exist
//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         // Validate variant exists in database
//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }
//       }

//       // Build the query to check for existing cart item
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
//           toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
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
//         toast.success(`${product.name} quantity updated in cart!`, { duration: 3000, position: 'top-center' });
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
//         toast.success(`${product.name} added to cart!`, { duration: 3000, position: 'top-center' });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
//     }
//   }, [navigate, session, setCartCount, buyerLocation]);

//   // Buy now
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to proceed to cart.', { duration: 3000, position: 'top-center' });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Validate product exists and is active
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, seller_id')
//         .eq('id', product.id)
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .single();
//       if (productError || !productData) {
//         toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
//         return;
//       }

//       // Validate seller distance
//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .eq('id', productData.seller_id)
//         .single();
//       if (sellerError || !sellerData || calculateDistance(buyerLocation, sellerData) > 40) {
//         toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
//         return;
//       }

//       // Select the cheapest variant with stock if variants exist
//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         // Validate variant exists in database
//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }
//       }

//       // Build the query to check for existing cart item
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
//           toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
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

//       toast.success('Added to cart! Redirecting...', { duration: 2000, position: 'top-center' });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
//     }
//   }, [navigate, session, setCartCount, buyerLocation]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
//           originalPrice: product.original_price ? parseFloat(product.original_price) : null, // Fixed: Changed 'v' to 'product'
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
//           distance: calculateDistance(buyerLocation, allSellers.find((s) => s.id === product.seller_id)),
//         };
//       }).sort((a, b) => a.displayPrice - b.displayPrice); // Sort by price
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error. Please check your connection.'
//         : 'Failed to load products. Please try again.';
//       setError(errorMessage);
//       toast.error(errorMessage, { duration: 3000, position: 'top-center' });
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

//   // Add to cart
//   const addToCart = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', { duration: 3000, position: 'top-center' });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Validate product exists and is active
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, seller_id')
//         .eq('id', product.id)
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .single();
//       if (productError || !productData) {
//         toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
//         return;
//       }

//       // Validate seller distance
//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .eq('id', productData.seller_id)
//         .single();
//       if (sellerError || !sellerData || calculateDistance(buyerLocation, sellerData) > 40) {
//         toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
//         return;
//       }

//       // Select the cheapest variant with stock if variants exist
//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         // Validate variant exists in database
//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }
//       }

//       // Build the query to check for existing cart item
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
//           toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
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
//         toast.success(`${product.name} quantity updated in cart!`, { duration: 3000, position: 'top-center' });
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
//         toast.success(`${product.name} added to cart!`, { duration: 3000, position: 'top-center' });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
//     }
//   }, [navigate, session, setCartCount, buyerLocation]);

//   // Buy now
//   const buyNow = useCallback(async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to proceed to cart.', { duration: 3000, position: 'top-center' });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Validate product exists and is active
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, seller_id')
//         .eq('id', product.id)
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .single();
//       if (productError || !productData) {
//         toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
//         return;
//       }

//       // Validate seller distance
//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .eq('id', productData.seller_id)
//         .single();
//       if (sellerError || !sellerData || calculateDistance(buyerLocation, sellerData) > 40) {
//         toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
//         return;
//       }

//       // Select the cheapest variant with stock if variants exist
//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         // Validate variant exists in database
//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }
//       }

//       // Build the query to check for existing cart item
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
//           toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
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

//       toast.success('Added to cart! Redirecting...', { duration: 2000, position: 'top-center' });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
//     }
//   }, [navigate, session, setCartCount, buyerLocation]);

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
//             toast.error('Unable to fetch location. Using default location (Bangalore).', {
//               duration: 3000,
//               position: 'top-center',
//             });
//             setBuyerLocation({ lat: 12.9716, lon: 77.5946 }); // Bangalore coordinates
//             fetchNearbyProducts();
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         toast.error('Geolocation not supported. Using default location (Bangalore).', {
//           duration: 3000,
//           position: 'top-center',
//         });
//         setBuyerLocation({ lat: 12.9716, lon: 77.5946 }); // Bangalore coordinates
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
//           <p className="td-no-products">
//             {searchTerm ? 'No products found.' : 'No products nearby. '}
//             {!searchTerm && (
//               <>
//                 <Link to="/categories">Browse all categories</Link> or{' '}
//                 <button
//                   onClick={() => {
//                     setBuyerLocation(null);
//                     toast.info('Please allow location access or enter a new location.', {
//                       duration: 3000,
//                       position: 'top-center',
//                     });
//                   }}
//                   className="td-change-location-btn"
//                   aria-label="Change location"
//                 >
//                   Change Location
//                 </button>
//               </>
//             )}
//           </p>
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

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
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

//   // Fetch nearby products and their variants with radius filtering
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
//       // Fetch sellers with valid locations
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       // Fetch products with category radius
//       const { data: productData, error: productError } = await supabase
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
//           category_id,
//           delivery_radius_km,
//           categories (id, max_delivery_radius_km)
//         `)
//         .eq('is_approved', true)
//         .eq('status', 'active');
//       if (productError) throw productError;

//       // Filter products based on distance and radius
//       const filteredProducts = productData
//         .filter((product) => {
//           const seller = allSellers.find((s) => s.id === product.seller_id);
//           if (!seller) return false;
//           const distance = calculateDistance(buyerLocation, {
//             latitude: seller.latitude,
//             longitude: seller.longitude,
//           });
//           if (distance === null) return false;
//           // Use product-specific radius if set, otherwise use category radius
//           const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//           return distance <= effectiveRadius;
//         })
//         .map((product) => product.id);

//       if (filteredProducts.length === 0) {
//         setProducts([]);
//         return;
//       }

//       // Fetch variants for filtered products
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', filteredProducts);
//       if (variantError) throw variantError;

//       // Map products with variants
//       const mappedProducts = productData
//         .filter((product) => filteredProducts.includes(product.id))
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
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//             price: parseFloat(product.price) || 0,
//             originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//             discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             categoryId: product.category_id,
//             variants,
//             displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//             displayOriginalPrice:
//               variants.length > 0
//                 ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                   product.original_price
//                 : product.original_price,
//             distance: calculateDistance(
//               buyerLocation,
//               allSellers.find((s) => s.id === product.seller_id)
//             ),
//             deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//           };
//         })
//         .sort((a, b) => a.displayPrice - b.displayPrice); // Sort by price
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error. Please check your connection.'
//         : 'Failed to load products. Please try again.';
//       setError(errorMessage);
//       toast.error(errorMessage, { duration: 3000, position: 'top-center' });
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

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to add items to cart.', { duration: 3000, position: 'top-center' });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         // Validate product exists and is active
//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Validate seller distance
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Fetch category radius if product radius is not set
//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Select the cheapest variant with stock if variants exist
//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           // Validate variant exists in database
//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//         }

//         // Build the query to check for existing cart item
//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', fetchError);
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', updateError);
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//           toast.success(`${product.name} quantity updated in cart!`, { duration: 3000, position: 'top-center' });
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Insert cart error:', insertError);
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//           toast.success(`${product.name} added to cart!`, { duration: 3000, position: 'top-center' });
//         }
//       } catch (err) {
//         console.error('Error adding to cart:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to proceed to cart.', { duration: 3000, position: 'top-center' });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         // Validate product exists and is active
//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Validate seller distance
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Fetch category radius if product radius is not set
//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Select the cheapest variant with stock if variants exist
//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           // Validate variant exists in database
//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//         }

//         // Build the query to check for existing cart item
//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', fetchError);
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', updateError);
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Insert cart error:', insertError);
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//         }

//         toast.success('Added to cart! Redirecting...', { duration: 2000, position: 'top-center' });
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         console.error('Error in Buy Now:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
//             toast.error('Unable to fetch location. Using default location (Bangalore).', {
//               duration: 3000,
//               position: 'top-center',
//             });
//             setBuyerLocation({ lat: 12.9716, lon: 77.5946 }); // Bangalore coordinates
//             fetchNearbyProducts();
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         toast.error('Geolocation not supported. Using default location (Bangalore).', {
//           duration: 3000,
//           position: 'top-center',
//         });
//         setBuyerLocation({ lat: 12.9716, lon: 77.5946 }); // Bangalore coordinates
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

//   if (loadingProducts && loadingBanners && loadingCategories)
//     return (
//       <div className="td-loading-container">
//         <div className="td-loading-animation">
//           <div className="td-loading-box">
//             <FaShoppingCart className="td-loading-icon" />
//             <span>Finding the best deals for you...</span>
//           </div>
//           <div className="td-loading-dots">
//             <span>.</span>
//             <span>.</span>
//             <span>.</span>
//           </div>
//         </div>
//       </div>
//     );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, gifts, and home decoration on Markeet. Fast delivery within your local area in India."
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
//                 onKeyPress={(e) =>
//                   e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])
//                 }
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
//           <p className="td-no-products">
//             {searchTerm ? 'No products found.' : 'No products nearby. '}
//             {!searchTerm && (
//               <>
//                 <Link to="/categories">Browse all categories</Link> or{' '}
//                 <button
//                   onClick={() => {
//                     setBuyerLocation(null);
//                     toast.info('Please allow location access or enter a new location.', {
//                       duration: 3000,
//                       position: 'top-center',
//                     });
//                   }}
//                   className="td-change-location-btn"
//                   aria-label="Change location"
//                 >
//                   Change Location
//                 </button>
//               </>
//             )}
//           </p>
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
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
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

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
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
//         .select('id, name, image_url, is_restricted')
//         .eq('is_restricted', false) // Exclude restricted categories like Grocery
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

//   // Fetch nearby products and their variants with radius filtering
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
//       // Fetch sellers with valid locations
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       // Fetch products with category radius
//       const { data: productData, error: productError } = await supabase
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
//           category_id,
//           delivery_radius_km,
//           categories (id, max_delivery_radius_km, is_restricted)
//         `)
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .eq('categories.is_restricted', false); // Exclude products from restricted categories
//       if (productError) throw productError;

//       // Filter products based on distance and radius
//       const filteredProducts = productData
//         .filter((product) => {
//           const seller = allSellers.find((s) => s.id === product.seller_id);
//           if (!seller) return false;
//           const distance = calculateDistance(buyerLocation, {
//             latitude: seller.latitude,
//             longitude: seller.longitude,
//           });
//           if (distance === null) return false;
//           // Use product-specific radius if set, otherwise use category radius
//           const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//           return distance <= effectiveRadius;
//         })
//         .map((product) => product.id);

//       if (filteredProducts.length === 0) {
//         setProducts([]);
//         return;
//       }

//       // Fetch variants for filtered products
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', filteredProducts);
//       if (variantError) throw variantError;

//       // Map products with variants
//       const mappedProducts = productData
//         .filter((product) => filteredProducts.includes(product.id))
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
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//             price: parseFloat(product.price) || 0,
//             originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//             discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             categoryId: product.category_id,
//             variants,
//             displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//             displayOriginalPrice:
//               variants.length > 0
//                 ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                   product.original_price
//                 : product.original_price,
//             distance: calculateDistance(
//               buyerLocation,
//               allSellers.find((s) => s.id === product.seller_id)
//             ),
//             deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//           };
//         })
//         .sort((a, b) => a.displayPrice - b.displayPrice); // Sort by price
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error. Please check your connection.'
//         : 'Failed to load products. Please try again.';
//       setError(errorMessage);
//       toast.error(errorMessage, { duration: 3000, position: 'top-center' });
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

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to add items to cart.', { duration: 3000, position: 'top-center' });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         // Check if product belongs to a restricted category
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('is_restricted')
//           .eq('id', product.categoryId)
//           .single();
//         if (categoryError) throw categoryError;
//         if (categoryData?.is_restricted) {
//           toast.error('Please select this category from the categories page to add products to cart.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           navigate('/categories');
//           return;
//         }

//         // Validate product exists and is active
//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Validate seller distance
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Fetch category radius if product radius is not set
//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Select the cheapest variant with stock if variants exist
//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           // Validate variant exists in database
//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//         }

//         // Build the query to check for existing cart item
//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', fetchError);
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', updateError);
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//           toast.success(`${product.name} quantity updated in cart!`, { duration: 3000, position: 'top-center' });
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Insert cart error:', insertError);
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//           toast.success(`${product.name} added to cart!`, { duration: 3000, position: 'top-center' });
//         }
//       } catch (err) {
//         console.error('Error adding to cart:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to proceed to cart.', { duration: 3000, position: 'top-center' });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         // Check if product belongs to a restricted category
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('is_restricted')
//           .eq('id', product.categoryId)
//           .single();
//         if (categoryError) throw categoryError;
//         if (categoryData?.is_restricted) {
//           toast.error('Please select this category from the categories page to proceed to checkout.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           navigate('/categories');
//           return;
//         }

//         // Validate product exists and is active
//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Validate seller distance
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Fetch category radius if product radius is not set
//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Select the cheapest variant with stock if variants exist
//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           // Validate variant exists in database
//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//         }

//         // Build the query to check for existing cart item
//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', fetchError);
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', updateError);
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Insert cart error:', insertError);
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//         }

//         toast.success('Added to cart! Redirecting...', { duration: 2000, position: 'top-center' });
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         console.error('Error in Buy Now:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
//             toast.error('Unable to fetch location. Using default location (Bangalore).', {
//               duration: 3000,
//               position: 'top-center',
//             });
//             setBuyerLocation({ lat: 12.9716, lon: 77.5946 }); // Bangalore coordinates
//             fetchNearbyProducts();
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         toast.error('Geolocation not supported. Using default location (Bangalore).', {
//           duration: 3000,
//           position: 'top-center',
//         });
//         setBuyerLocation({ lat: 12.9716, lon: 77.5946 }); // Bangalore coordinates
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

//   if (loadingProducts && loadingBanners && loadingCategories)
//     return (
//       <div className="td-loading-container">
//         <div className="td-loading-animation">
//           <div className="td-loading-box">
//             <FaShoppingCart className="td-loading-icon" />
//             <span>Finding the best deals for you...</span>
//           </div>
//           <div className="td-loading-dots">
//             <span>.</span>
//             <span>.</span>
//             <span>.</span>
//           </div>
//         </div>
//       </div>
//     );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, gifts, and home decoration on Markeet. Fast delivery within your local area in India."
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
//                 onKeyPress={(e) =>
//                   e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])
//                 }
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
//                 state={{ fromCategories: true }} // Pass navigation state
//                 className="td-cat-card"
//                 aria-label={`View ${category.name} products`}
//               >
//                 <img
//                   src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                   alt={category.name} // Fixed for accessibility
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
//           <p className="td-no-products">
//             {searchTerm ? 'No products found.' : 'No products nearby. '}
//             {!searchTerm && (
//               <>
//                 <Link to="/categories">Browse all categories</Link> or{' '}
//                 <button
//                   onClick={() => {
//                     setBuyerLocation(null);
//                     toast.info('Please allow location access or enter a new location.', {
//                       duration: 3000,
//                       position: 'top-center',
//                     });
//                   }}
//                   className="td-change-location-btn"
//                   aria-label="Change location"
//                 >
//                   Change Location
//                 </button>
//               </>
//             )}
//           </p>
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
//                     alt={product.name} // Fixed for accessibility
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
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
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

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
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
//         .select('id, name, image_url, is_restricted')
//         .eq('is_restricted', false) // Explicitly exclude restricted categories
//         .is('is_restricted', false) // Double-check for null or false
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       console.log('Fetched categories:', data); // Debug log
//       // Additional client-side filter to ensure no restricted categories
//       const filteredData = (data || []).filter(cat => cat.is_restricted === false);
//       if (filteredData.length === 0) {
//         console.warn('No non-restricted categories found.');
//       }
//       setCategories(filteredData);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//       toast.error('Failed to load categories.', { duration: 3000, position: 'top-center' });
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products and their variants with radius filtering
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
//       // Fetch sellers with valid locations
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       // Fetch products with category radius
//       const { data: productData, error: productError } = await supabase
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
//           category_id,
//           delivery_radius_km,
//           categories (id, max_delivery_radius_km, is_restricted)
//         `)
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .eq('categories.is_restricted', false); // Exclude products from restricted categories
//       if (productError) throw productError;

//       // Filter products based on distance and radius
//       const filteredProducts = productData
//         .filter((product) => {
//           const seller = allSellers.find((s) => s.id === product.seller_id);
//           if (!seller) return false;
//           const distance = calculateDistance(buyerLocation, {
//             latitude: seller.latitude,
//             longitude: seller.longitude,
//           });
//           if (distance === null) return false;
//           const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//           return distance <= effectiveRadius;
//         })
//         .map((product) => product.id);

//       if (filteredProducts.length === 0) {
//         setProducts([]);
//         return;
//       }

//       // Fetch variants for filtered products
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', filteredProducts);
//       if (variantError) throw variantError;

//       // Map products with variants
//       const mappedProducts = productData
//         .filter((product) => filteredProducts.includes(product.id))
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
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//             price: parseFloat(product.price) || 0,
//             originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//             discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             categoryId: product.category_id,
//             variants,
//             displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//             displayOriginalPrice:
//               variants.length > 0
//                 ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                   product.original_price
//                 : product.original_price,
//             distance: calculateDistance(
//               buyerLocation,
//               allSellers.find((s) => s.id === product.seller_id)
//             ),
//             deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//           };
//         })
//         .sort((a, b) => a.displayPrice - b.displayPrice); // Sort by price
//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error. Please check your connection.'
//         : 'Failed to load products. Please try again.';
//       setError(errorMessage);
//       toast.error(errorMessage, { duration: 3000, position: 'top-center' });
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

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to add items to cart.', { duration: 3000, position: 'top-center' });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         // Check if product belongs to a restricted category
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('is_restricted')
//           .eq('id', product.categoryId)
//           .single();
//         if (categoryError) throw categoryError;
//         if (categoryData?.is_restricted) {
//           toast.error('Please select this category from the categories page to add products to cart.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           navigate('/categories');
//           return;
//         }

//         // Validate product exists and is active
//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Validate seller distance
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Fetch category radius if product radius is not set
//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Select the cheapest variant with stock if variants exist
//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           // Validate variant exists in database
//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//         }

//         // Build the query to check for existing cart item
//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', fetchError);
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', updateError);
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//           toast.success(`${product.name} quantity updated in cart!`, { duration: 3000, position: 'top-center' });
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Insert cart error:', insertError);
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//           toast.success(`${product.name} added to cart!`, { duration: 3000, position: 'top-center' });
//         }
//       } catch (err) {
//         console.error('Error adding to cart:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', { duration: 3000, position: 'top-center' });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to proceed to cart.', { duration: 3000, position: 'top-center' });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         // Check if product belongs to a restricted category
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('is_restricted')
//           .eq('id', product.categoryId)
//           .single();
//         if (categoryError) throw categoryError;
//         if (categoryData?.is_restricted) {
//           toast.error('Please select this category from the categories page to proceed to checkout.', {
//             duration: 3000,
//             position: 'top-center',
//           });
//           navigate('/categories');
//           return;
//         }

//         // Validate product exists and is active
//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           toast.error('Product is not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Validate seller distance
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Fetch category radius if product radius is not set
//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error('Product is not available in your area.', { duration: 3000, position: 'top-center' });
//           return;
//         }

//         // Select the cheapest variant with stock if variants exist
//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           // Validate variant exists in database
//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//         }

//         // Build the query to check for existing cart item
//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', fetchError);
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', { duration: 3000, position: 'top-center' });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', updateError);
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Insert cart error:', insertError);
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//         }

//         toast.success('Added to cart! Redirecting...', { duration: 2000, position: 'top-center' });
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         console.error('Error in Buy Now:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, { duration: 3000, position: 'top-center' });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
//             toast.error('Unable to fetch location. Using default location (Bangalore).', {
//               duration: 3000,
//               position: 'top-center',
//             });
//             setBuyerLocation({ lat: 12.9716, lon: 77.5946 }); // Bangalore coordinates
//             fetchNearbyProducts();
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         toast.error('Geolocation not supported. Using default location (Bangalore).', {
//           duration: 3000,
//           position: 'top-center',
//         });
//         setBuyerLocation({ lat: 12.9716, lon: 77.5946 }); // Bangalore coordinates
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

//   if (loadingProducts && loadingBanners && loadingCategories)
//     return (
//       <div className="td-loading-container">
//         <div className="td-loading-animation">
//           <div className="td-loading-box">
//             <FaShoppingCart className="td-loading-icon" />
//             <span>Finding the best deals for you...</span>
//           </div>
//           <div className="td-loading-dots">
//             <span>.</span>
//             <span>.</span>
//             <span>.</span>
//           </div>
//         </div>
//       </div>
//     );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, gifts, and home decoration on Markeet. Fast delivery within your local area in India."
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
//                 onKeyPress={(e) =>
//                   e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])
//                 }
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
//                 state={{ fromCategories: true }} // Pass navigation state
//                 className="td-cat-card"
//                 aria-label={`View ${category.name} products`}
//               >
//                 <img
//                   src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                   alt={category.name}
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
//           <p className="td-no-products">
//             {searchTerm ? 'No products found.' : 'No products nearby. '}
//             {!searchTerm && (
//               <>
//                 <Link to="/categories">Browse all categories</Link> or{' '}
//                 <button
//                   onClick={() => {
//                     setBuyerLocation(null);
//                     toast.info('Please allow location access or enter a new location.', {
//                       duration: 3000,
//                       position: 'top-center',
//                     });
//                   }}
//                   className="td-change-location-btn"
//                   aria-label="Change location"
//                 >
//                   Change Location
//                 </button>
//               </>
//             )}
//           </p>
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
//                       ₹{product.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                       <p className="td-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
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

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
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
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch categories (exclude restricted categories for homepage)
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, image_url, is_restricted')
//         .eq('is_restricted', false)
//         .order('name')
//         .limit(6);
//       if (error) throw error;
//       console.log('Fetched categories:', data);
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//       toast.error('Failed to load categories', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setLoadingProducts([]);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       // Fetch sellers with valid locations
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       // Fetch products, explicitly excluding restricted categories
//       const { data: productData, error: productError } = await supabase
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
//           category_id,
//           delivery_radius_km,
//           categories (id, max_delivery_radius_km, is_restricted)
//         `)
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .in('category_id', [1, 2, 4, 5, 7, 8]);
//       if (productError) throw productError;

//       console.log('Raw productData:', productData);

//       // Additional client-side filtering to handle null categories and ensure no restricted products
//       const filteredProductData = productData.filter((product) => {
//         if (!product.categories) {
//           console.warn(`Product ${product.id} has invalid or missing category (category_id: ${product.category_id})`);
//           return false;
//         }
//         return product.categories.is_restricted === false;
//       });

//       // Filter products based on distance and radius
//       const filteredProducts = filteredProductData
//         .filter((product) => {
//           const seller = allSellers.find((s) => s.id === product.seller_id);
//           if (!seller) {
//             console.warn(`No seller found for product ${product.id}`);
//             return false;
//           }
//           const distance = calculateDistance(buyerLocation, {
//             latitude: seller.latitude,
//             longitude: seller.longitude,
//           });
//           if (distance === null) return false;
//           const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//           return distance <= effectiveRadius;
//         })
//         .map((product) => product.id);

//       if (filteredProducts.length === 0) {
//         setProducts([]);
//         return;
//       }

//       // Fetch variants for filtered products
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', filteredProducts);
//       if (variantError) throw variantError;

//       // Map products with variants
//       const mappedProducts = filteredProductData
//         .filter((product) => filteredProducts.includes(product.id))
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
//             : ['https://dummyimage.com/150'];

//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: validImages.length > 0 ? validImages : ['https://dummyimage.com/150'],
//             price: parseFloat(product.price) || 0,
//             originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//             discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             categoryId: product.category_id,
//             variants,
//             displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//             displayOriginalPrice:
//               variants.length > 0
//                 ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                   product.original_price
//                 : product.original_price,
//             distance: calculateDistance(
//               buyerLocation,
//               allSellers.find((s) => s.id === product.seller_id)
//             ),
//             deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//           };
//         })
//         .sort((a, b) => a.displayPrice - b.displayPrice);

//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error. Please check your connection.'
//         : 'Failed to load products. Please try again.';
//       setError(errorMessage);
//       toast.error(errorMessage, {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
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
//       toast.error('Failed to load banners', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Validate variant ID
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

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to add items to cart.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         // Check if product belongs to a restricted category
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('is_restricted')
//           .eq('id', product.categoryId)
//           .single();
//         if (categoryError) throw categoryError;
//         if (categoryData?.is_restricted) {
//           toast.error('Please select this category from the categories page to add products to cart.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           navigate('/categories');
//           return;
//         }

//         // Validate product
//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           toast.error('Product is not available.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         // Validate seller distance
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`, {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//         }

//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', fetchError);
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', updateError);
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//           toast.success(`${product.name} quantity updated in cart!`, {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Insert cart error:', insertError);
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//           toast.success(`${product.name} added to cart!`, {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//         }
//       } catch (err) {
//         console.error('Error adding to cart:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to proceed to checkout.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('is_restricted')
//           .eq('id', product.categoryId)
//           .single();
//         if (categoryError) throw categoryError;
//         if (categoryData?.is_restricted) {
//           toast.error('Product is not available in this section. Please select this category from the categories page.', {
//             duration: 3600,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productData || !productData) {
//           toast.error('Product is not available.', {
//             duration: 3600,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error('Product is not available in your area.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//         }

//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', { fetchError });
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', { updateError });
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Error inserting to cart:', { insertError });
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//         }

//         toast.success('Added to cart! Redirecting to cart...', {
//           duration: 2000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         console.error('Error in Buy Now:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
//             let errorMessage = 'Unable to fetch location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.error(`${errorMessage} Using default location (Bangalore).`, {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             setBuyerLocation({ lat: 12.9716, lon: 77.5946 });
//             fetchNearbyProducts();
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         toast.error('Geolocation not supported. Using default location (Bangalore).', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         setBuyerLocation({ lat: 12.9716, lon: 77.5946 });
//         fetchNearbyProducts();
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

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

//   if (loadingProducts && loadingBanners && loadingCategories)
//     return (
//       <div className="td-loading-container">
//         <div className="td-loading-animation">
//           <div className="td-loading-box">
//             <FaShoppingCart className="td-loading-icon" />
//             <span>Finding the best deals for you...</span>
//           </div>
//           <div className="td-loading-dots">
//             <span>.</span>
//             <span>.</span>
//             <span>.</span>
//           </div>
//         </div>
//       </div>
//     );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, home decoration, Markeet, local shopping"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/" />
//         <meta property="og:title" content="Markeet - Shop Electronics, Fashion, Jewellery & More" />
//         <meta
//           property="og:description"
//           content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
//         />
//         <meta property="og:image" content={products[0]?.images[0] || 'https://dummyimage.com/1200x300'} />
//         <meta property="og:url" content="https://www.markeet.com/" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Markeet - Shop Electronics, Fashion, Jewellery & More" />
//         <meta
//           name="twitter:description"
//           content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
//         />
//         <meta name="twitter:image" content={products[0]?.images[0] || 'https://dummyimage.com/1200x300'} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Markeet Home',
//             description: 'Shop electronics, appliances, jewellery, fashion, and more on Markeet with fast local delivery.',
//             url: 'https://www.markeet.com/',
//           })}
//         </script>
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
//                 onKeyPress={(e) =>
//                   e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])
//                 }
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
//                 state={{ fromCategories: true }}
//                 className="td-cat-card"
//                 aria-label={`View ${category.name} products`}
//               >
//                 <img
//                   src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                   alt={category.name}
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
//           <p className="td-no-products">
//             {searchTerm ? 'No products found.' : 'No products nearby. '}
//             {!searchTerm && (
//               <>
//                 <Link to="/categories">Browse all categories</Link> or{' '}
//                 <button
//                   onClick={() => {
//                     setBuyerLocation(null);
//                     toast.info('Please allow location access or enter a new location.', {
//                       duration: 3000,
//                       position: 'top-center',
//                       style: {
//                         background: '#1890ff',
//                         color: '#fff',
//                         fontWeight: 'bold',
//                         borderRadius: '8px',
//                         padding: '16px',
//                         boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//                       },
//                     });
//                   }}
//                   className="td-change-location-btn"
//                   aria-label="Change location"
//                 >
//                   Change Location
//                 </button>
//               </>
//             )}
//           </p>
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
//                       ₹{product.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                       <p className="td-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
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

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
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
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch categories (include all categories, including restricted)
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, image_url, is_restricted')
//         .order('name')
//         .limit(20);
//       if (error) throw error;
//       console.log('Fetched categories:', data);
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//       toast.error('Failed to load categories', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       setLoadingProducts(false); // Fixed typo from setLoadingProducts([])
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       // Fetch sellers with valid locations
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       // Fetch products, explicitly excluding restricted categories
//       const { data: productData, error: productError } = await supabase
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
//           category_id,
//           delivery_radius_km,
//           categories (id, max_delivery_radius_km, is_restricted)
//         `)
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .in('category_id', [1, 2, 4, 5, 7, 8]);
//       if (productError) throw productError;

//       console.log('Raw productData:', productData);

//       // Additional client-side filtering to handle null categories and ensure no restricted products
//       const filteredProductData = productData.filter((product) => {
//         if (!product.categories) {
//           console.warn(`Product ${product.id} has invalid or missing category (category_id: ${product.category_id})`);
//           return false;
//         }
//         return product.categories.is_restricted === false;
//       });

//       // Filter products based on distance and radius
//       const filteredProducts = filteredProductData
//         .filter((product) => {
//           const seller = allSellers.find((s) => s.id === product.seller_id);
//           if (!seller) {
//             console.warn(`No seller found for product ${product.id}`);
//             return false;
//           }
//           const distance = calculateDistance(buyerLocation, {
//             latitude: seller.latitude,
//             longitude: seller.longitude,
//           });
//           if (distance === null) return false;
//           const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//           return distance <= effectiveRadius;
//         })
//         .map((product) => product.id);

//       if (filteredProducts.length === 0) {
//         setProducts([]);
//         return;
//       }

//       // Fetch variants for filtered products
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', filteredProducts);
//       if (variantError) throw variantError;

//       // Map products with variants
//       const mappedProducts = filteredProductData
//         .filter((product) => filteredProducts.includes(product.id))
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
//             : ['https://dummyimage.com/150'];

//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: validImages.length > 0 ? validImages : ['https://dummyimage.com/150'],
//             price: parseFloat(product.price) || 0,
//             originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//             discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             categoryId: product.category_id,
//             variants,
//             displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//             displayOriginalPrice:
//               variants.length > 0
//                 ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                   product.original_price
//                 : product.original_price,
//             distance: calculateDistance(
//               buyerLocation,
//               allSellers.find((s) => s.id === product.seller_id)
//             ),
//             deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//           };
//         })
//         .sort((a, b) => a.displayPrice - b.displayPrice);

//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error. Please check your connection.'
//         : 'Failed to load products. Please try again.';
//       setError(errorMessage);
//       toast.error(errorMessage, {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
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
//       toast.error('Failed to load banners', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Validate variant ID
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

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to add items to cart.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         // Check if product belongs to a restricted category
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('is_restricted')
//           .eq('id', product.categoryId)
//           .single();
//         if (categoryError) throw categoryError;
//         if (categoryData?.is_restricted) {
//           toast.error('Please select this category from the categories page to add products to cart.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           navigate('/categories');
//           return;
//         }

//         // Validate product
//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           toast.error('Product is not available.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         // Validate seller distance
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`, {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//         }

//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', { fetchError });
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', updateError);
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//           toast.success(`${product.name} quantity updated in cart!`, {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Insert cart error:', insertError);
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//           toast.success(`${product.name} added to cart!`, {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//         }
//       } catch (err) {
//         console.error('Error adding to cart:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to proceed to checkout.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('is_restricted')
//           .eq('id', product.categoryId)
//           .single();
//         if (categoryError) throw categoryError;
//         if (categoryData?.is_restricted) {
//           toast.error('Please select this category from the categories page to proceed.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           toast.error('Product is not available.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`, {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//         }

//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', { fetchError });
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', { updateError });
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Error inserting to cart:', { insertError });
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//         }

//         toast.success('Added to cart! Redirecting to cart...', {
//           duration: 2000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         console.error('Error in Buy Now:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
//             let errorMessage = 'Unable to fetch location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.error(`${errorMessage} Using default location (Bangalore).`, {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             setBuyerLocation({ lat: 12.9716, lon: 77.5946 });
//             fetchNearbyProducts();
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         toast.error('Geolocation not supported. Using default location (Bangalore).', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         setBuyerLocation({ lat: 12.9716, lon: 77.5946 });
//         fetchNearbyProducts();
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

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

//   if (loadingProducts && loadingBanners && loadingCategories)
//     return (
//       <div className="td-loading-container">
//         <div className="td-loading-animation">
//           <div className="td-loading-box">
//             <FaShoppingCart className="td-loading-icon" />
//             <span>Finding the best deals for you...</span>
//           </div>
//           <div className="td-loading-dots">
//             <span>.</span>
//             <span>.</span>
//             <span>.</span>
//           </div>
//         </div>
//       </div>
//     );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, home decoration, Markeet, local shopping"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/" />
//         <meta property="og:title" content="Markeet - Shop Electronics, Fashion, Jewellery & More" />
//         <meta
//           property="og:description"
//           content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
//         />
//         <meta property="og:image" content={products[0]?.images[0] || 'https://dummyimage.com/1200x300'} />
//         <meta property="og:url" content="https://www.markeet.com/" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Markeet - Shop Electronics, Fashion, Jewellery & More" />
//         <meta
//           name="twitter:description"
//           content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
//         />
//         <meta name="twitter:image" content={products[0]?.images[0] || 'https://dummyimage.com/1200x300'} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Markeet Home',
//             description: 'Shop electronics, appliances, jewellery, fashion, and more on Markeet with fast local delivery.',
//             url: 'https://www.markeet.com/',
//           })}
//         </script>
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
//                 onKeyPress={(e) =>
//                   e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])
//                 }
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
//                 state={{ fromCategories: true }}
//                 className="td-cat-card"
//                 aria-label={`View ${category.name} products`}
//               >
//                 <img
//                   src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                   alt={category.name}
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
//           <p className="td-no-products">
//             {searchTerm ? 'No products found.' : 'No products nearby. '}
//             {!searchTerm && (
//               <>
//                 <Link to="/categories">Browse all categories</Link> or{' '}
//                 <button
//                   onClick={() => {
//                     setBuyerLocation(null);
//                     toast.info('Please allow location access or enter a new location.', {
//                       duration: 3000,
//                       position: 'top-center',
//                       style: {
//                         background: '#1890ff',
//                         color: '#fff',
//                         fontWeight: 'bold',
//                         borderRadius: '8px',
//                         padding: '16px',
//                         boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//                       },
//                     });
//                   }}
//                   className="td-change-location-btn"
//                   aria-label="Change location"
//                 >
//                   Change Location
//                 </button>
//               </>
//             )}
//           </p>
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
//                       ₹{product.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                       <p className="td-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
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

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Home() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [bannerImages, setBannerImages] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingBanners, setLoadingBanners] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
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
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       return false;
//     }
//     return true;
//   };

//   // Fetch categories (include all categories, including restricted)
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       return;
//     }
//     setLoadingCategories(true);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, image_url, is_restricted')
//         .order('name')
//         .limit(20);
//       if (error) throw error;
//       console.log('Fetched categories:', data);
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//       toast.error('Failed to load categories', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
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
//       // Fetch sellers with valid locations
//       const { data: allSellers, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       // Fetch non-restricted category IDs
//       const { data: nonRestrictedCategories, error: categoryError } = await supabase
//         .from('categories')
//         .select('id')
//         .eq('is_restricted', false);
//       if (categoryError) throw categoryError;

//       const nonRestrictedCategoryIds = nonRestrictedCategories.map((cat) => cat.id);
//       if (nonRestrictedCategoryIds.length === 0) {
//         console.log('No non-restricted categories found.');
//         setProducts([]);
//         setLoadingProducts(false);
//         return;
//       }

//       // Fetch products from non-restricted categories
//       const { data: productData, error: productError } = await supabase
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
//           category_id,
//           delivery_radius_km,
//           categories (id, max_delivery_radius_km, is_restricted)
//         `)
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .in('category_id', nonRestrictedCategoryIds);
//       if (productError) throw productError;

//       console.log('Raw productData:', productData);

//       // Additional client-side filtering to handle null categories
//       const filteredProductData = productData.filter((product) => {
//         if (!product.categories) {
//           console.warn(`Product ${product.id} has invalid or missing category (category_id: ${product.category_id})`);
//           return false;
//         }
//         return product.categories.is_restricted === false; // Redundant but kept for safety
//       });

//       // Filter products based on distance and radius
//       const filteredProducts = filteredProductData
//         .filter((product) => {
//           const seller = allSellers.find((s) => s.id === product.seller_id);
//           if (!seller) {
//             console.warn(`No seller found for product ${product.id}`);
//             return false;
//           }
//           const distance = calculateDistance(buyerLocation, {
//             latitude: seller.latitude,
//             longitude: seller.longitude,
//           });
//           if (distance === null) return false;
//           const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//           return distance <= effectiveRadius;
//         })
//         .map((product) => product.id);

//       if (filteredProducts.length === 0) {
//         setProducts([]);
//         return;
//       }

//       // Fetch variants for filtered products
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', filteredProducts);
//       if (variantError) throw variantError;

//       // Map products with variants
//       const mappedProducts = filteredProductData
//         .filter((product) => filteredProducts.includes(product.id))
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
//             : ['https://dummyimage.com/150'];

//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: validImages.length > 0 ? validImages : ['https://dummyimage.com/150'],
//             price: parseFloat(product.price) || 0,
//             originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//             discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             categoryId: product.category_id,
//             variants,
//             displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//             displayOriginalPrice:
//               variants.length > 0
//                 ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                   product.original_price
//                 : product.original_price,
//             distance: calculateDistance(
//               buyerLocation,
//               allSellers.find((s) => s.id === product.seller_id)
//             ),
//             deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//           };
//         })
//         .sort((a, b) => a.displayPrice - b.displayPrice);

//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error. Please check your connection.'
//         : 'Failed to load products. Please try again.';
//       setError(errorMessage);
//       toast.error(errorMessage, {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
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
//       toast.error('Failed to load banners', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoadingBanners(false);
//     }
//   }, []);

//   // Validate variant ID
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

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to add items to cart.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         // Check if product belongs to a restricted category
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('is_restricted')
//           .eq('id', product.categoryId)
//           .single();
//         if (categoryError) throw categoryError;
//         if (categoryData?.is_restricted) {
//           toast.error('Please select this category from the categories page to add products to cart.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           navigate('/categories');
//           return;
//         }

//         // Validate product
//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           toast.error('Product is not available.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         // Validate seller distance
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`, {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//         }

//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', { fetchError });
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', updateError);
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//           toast.success(`${product.name} quantity updated in cart!`, {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Insert cart error:', insertError);
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//           toast.success(`${product.name} added to cart!`, {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//         }
//       } catch (err) {
//         console.error('Error adding to cart:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         toast.error('Invalid product.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         toast.error('Out of stock.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }
//       if (!session?.user) {
//         toast.error('Please log in to proceed to checkout.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         navigate('/auth');
//         return;
//       }
//       if (!checkNetworkStatus()) return;

//       try {
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('is_restricted')
//           .eq('id', product.categoryId)
//           .single();
//         if (categoryError) throw categoryError;
//         if (categoryData?.is_restricted) {
//           toast.error('Please select this category from the categories page to proceed.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, category_id')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           toast.error('Product is not available.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('id, latitude, longitude')
//           .eq('id', productData.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           toast.error('Seller information not available.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         const distance = calculateDistance(buyerLocation, sellerData);
//         if (distance === null) {
//           toast.error('Unable to calculate distance to seller.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let effectiveRadius = productData.delivery_radius_km;
//         if (!effectiveRadius) {
//           const { data: categoryData, error: categoryError } = await supabase
//             .from('categories')
//             .select('max_delivery_radius_km')
//             .eq('id', productData.category_id)
//             .single();
//           if (categoryError) throw categoryError;
//           effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//         }

//         if (distance > effectiveRadius) {
//           toast.error(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`, {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             toast.error('No available variants in stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) {
//             toast.error('Selected variant is not available.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//         }

//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           console.error('Fetch cart item error:', { fetchError });
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds stock.', {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) {
//             console.error('Update cart error:', { updateError });
//             throw new Error(updateError.message || 'Failed to update cart');
//           }
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.displayPrice,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) {
//             console.error('Error inserting to cart:', { insertError });
//             throw new Error(insertError.message || 'Failed to add to cart');
//           }
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//         }

//         toast.success('Added to cart! Redirecting to cart...', {
//           duration: 2000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         console.error('Error in Buy Now:', err);
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Compute search suggestions
//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }

//     const filteredSuggestions = products
//       .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
//             let errorMessage = 'Unable to fetch location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.error(`${errorMessage} Using default location (Bangalore).`, {
//               duration: 3000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//               },
//             });
//             setBuyerLocation({ lat: 12.9716, lon: 77.5946 });
//             fetchNearbyProducts();
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         toast.error('Geolocation not supported. Using default location (Bangalore).', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         setBuyerLocation({ lat: 12.9716, lon: 77.5946 });
//         fetchNearbyProducts();
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

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

//   if (loadingProducts && loadingBanners && loadingCategories)
//     return (
//       <div className="td-loading-container">
//         <div className="td-loading-animation">
//           <div className="td-loading-box">
//             <FaShoppingCart className="td-loading-icon" />
//             <span>Finding the best deals for you...</span>
//           </div>
//           <div className="td-loading-dots">
//             <span>.</span>
//             <span>.</span>
//             <span>.</span>
//           </div>
//         </div>
//       </div>
//     );

//   return (
//     <div className="td-home">
//       <Helmet>
//         <title>Markeet - Shop Electronics, Fashion, Jewellery & More</title>
//         <meta
//           name="description"
//           content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, home decoration, Markeet, local shopping"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/" />
//         <meta property="og:title" content="Markeet - Shop Electronics, Fashion, Jewellery & More" />
//         <meta
//           property="og:description"
//           content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
//         />
//         <meta property="og:image" content={products[0]?.images[0] || 'https://dummyimage.com/1200x300'} />
//         <meta property="og:url" content="https://www.markeet.com/" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Markeet - Shop Electronics, Fashion, Jewellery & More" />
//         <meta
//           name="twitter:description"
//           content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
//         />
//         <meta name="twitter:image" content={products[0]?.images[0] || 'https://dummyimage.com/1200x300'} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Markeet Home',
//             description: 'Shop electronics, appliances, jewellery, fashion, and more on Markeet with fast local delivery.',
//             url: 'https://www.markeet.com/',
//           })}
//         </script>
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
//                 onKeyPress={(e) =>
//                   e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])
//                 }
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
//                 state={{ fromCategories: true }}
//                 className="td-cat-card"
//                 aria-label={`View ${category.name} products`}
//               >
//                 <img
//                   src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                   alt={category.name}
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
//           <p className="td-no-products">
//             {searchTerm ? 'No products found.' : 'No products nearby. '}
//             {!searchTerm && (
//               <>
//                 <Link to="/categories">Browse all categories</Link> or{' '}
//                 <button
//                   onClick={() => {
//                     setBuyerLocation(null);
//                     toast.info('Please allow location access or enter a new location.', {
//                       duration: 3000,
//                       position: 'top-center',
//                       style: {
//                         background: '#1890ff',
//                         color: '#fff',
//                         fontWeight: 'bold',
//                         borderRadius: '8px',
//                         padding: '16px',
//                         boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//                       },
//                     });
//                   }}
//                   className="td-change-location-btn"
//                   aria-label="Change location"
//                 >
//                   Change Location
//                 </button>
//               </>
//             )}
//           </p>
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
//                       ₹{product.displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                       <p className="td-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
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

// Distance calculation using Haversine formula
function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
  const R = 6371; // Earth's radius in km
  const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
  const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function Home() {
  const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [bannerImages, setBannerImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);

  // Default location for Jharia, Dhanbad
  const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 };
  const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';

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

  // Fetch categories (include all categories, including restricted)
  const fetchCategories = useCallback(async () => {
    if (!checkNetworkStatus()) {
      setLoadingCategories(false);
      return;
    }
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, image_url, is_restricted')
        .order('name')
        .limit(20);
      if (error) throw error;
      setCategories(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load categories. Please try again.');
      setCategories([]);
      toast.error('Failed to load categories', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        },
      });
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch nearby products
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
      // Fetch sellers with valid locations
      const { data: allSellers, error: sellersError } = await supabase
        .from('sellers')
        .select('id, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (sellersError) throw sellersError;

      // Fetch non-restricted category IDs
      const { data: nonRestrictedCategories, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('is_restricted', false);
      if (categoryError) throw categoryError;

      const nonRestrictedCategoryIds = nonRestrictedCategories.map((cat) => cat.id);
      if (nonRestrictedCategoryIds.length === 0) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }

      // Fetch products from non-restricted categories
      const { data: productData, error: productError } = await supabase
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
          category_id,
          delivery_radius_km,
          categories (id, max_delivery_radius_km, is_restricted)
        `)
        .eq('is_approved', true)
        .eq('status', 'active')
        .in('category_id', nonRestrictedCategoryIds);
      if (productError) throw productError;

      // Additional client-side filtering to handle null categories
      const filteredProductData = productData.filter((product) => {
        if (!product.categories) {
          return false;
        }
        return product.categories.is_restricted === false; // Redundant but kept for safety
      });

      // Filter products based on distance and radius
      const filteredProducts = filteredProductData
        .filter((product) => {
          const seller = allSellers.find((s) => s.id === product.seller_id);
          if (!seller) {
            return false;
          }
          const distance = calculateDistance(buyerLocation, {
            latitude: seller.latitude,
            longitude: seller.longitude,
          });
          if (distance === null) return false;
          const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
          return distance <= effectiveRadius;
        })
        .map((product) => product.id);

      if (filteredProducts.length === 0) {
        setProducts([]);
        return;
      }

      // Fetch variants for filtered products
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('id, product_id, price, original_price, stock, attributes, images')
        .eq('status', 'active')
        .in('product_id', filteredProducts);
      if (variantError) throw variantError;

      // Map products with variants
      const mappedProducts = filteredProductData
        .filter((product) => filteredProducts.includes(product.id))
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
            : ['https://dummyimage.com/150'];

          return {
            id: product.id,
            name: product.title || 'Unnamed Product',
            images: validImages.length > 0 ? validImages : ['https://dummyimage.com/150'],
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
            distance: calculateDistance(
              buyerLocation,
              allSellers.find((s) => s.id === product.seller_id)
            ),
            deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
          };
        })
        .sort((a, b) => a.displayPrice - b.displayPrice);

      setProducts(mappedProducts);
      setError(null);
    } catch (err) {
      const errorMessage = err.message.includes('Network')
        ? 'Network error. Please check your connection.'
        : 'Failed to load products. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        },
      });
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
      setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
      toast.error('Failed to load banners', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        },
      });
    } finally {
      setLoadingBanners(false);
    }
  }, []);

  // Validate variant ID
  const validateVariant = async (variantId) => {
    if (!variantId) return true;
    const { data, error } = await supabase
      .from('product_variants')
      .select('id')
      .eq('id', variantId)
      .eq('status', 'active')
      .single();
    if (error || !data) {
      toast.error('Selected variant is not available.', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        },
      });
      return false;
    }
    return true;
  };

  // Add to cart
  const addToCart = useCallback(
    async (product) => {
      if (!product || !product.id || !product.name || product.displayPrice === undefined) {
        toast.error('Invalid product.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        });
        return;
      }
      if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
        toast.error('Out of stock.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        });
        return;
      }
      if (!session?.user) {
        toast.error('Please log in to add items to cart.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        });
        navigate('/auth');
        return;
      }
      if (!checkNetworkStatus()) return;

      try {
        // Check if product belongs to a restricted category
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('is_restricted')
          .eq('id', product.categoryId)
          .single();
        if (categoryError) throw categoryError;
        if (categoryData?.is_restricted) {
          toast.error('Please select this category from the categories page to add products to cart.', {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            },
          });
          navigate('/categories');
          return;
        }

        // Validate product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id, seller_id, delivery_radius_km, category_id')
          .eq('id', product.id)
          .eq('is_approved', true)
          .eq('status', 'active')
          .single();
        if (productError || !productData) {
          toast.error('Product is not available.', {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            },
          });
          return;
        }

        // Validate seller distance
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellers')
          .select('id, latitude, longitude')
          .eq('id', productData.seller_id)
          .single();
        if (sellerError || !sellerData) {
          toast.error('Seller information not available.', {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            },
          });
          return;
        }

        const distance = calculateDistance(buyerLocation, sellerData);
        if (distance === null) {
          toast.error('Unable to calculate distance to seller.', {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
              duration: 3000,
              position: 'top-center',
              style: {
                background: '#ff4d4f',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
              duration: 3000,
              position: 'top-center',
              style: {
                background: '#ff4d4f',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#52c41a',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#52c41a',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            },
          });
        }
      } catch (err) {
        toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        });
      }
    },
    [navigate, session, setCartCount, buyerLocation]
  );

  // Buy now
  const buyNow = useCallback(
    async (product) => {
      if (!product || !product.id || !product.name || product.displayPrice === undefined) {
        toast.error('Invalid product.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        });
        return;
      }
      if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
        toast.error('Out of stock.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        });
        return;
      }
      if (!session?.user) {
        toast.error('Please log in to proceed to checkout.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
        if (categoryData?.is_restricted) {
          toast.error('Please select this category from the categories page to proceed.', {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            },
          });
          return;
        }

        const distance = calculateDistance(buyerLocation, sellerData);
        if (distance === null) {
          toast.error('Unable to calculate distance to seller.', {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
              duration: 3000,
              position: 'top-center',
              style: {
                background: '#ff4d4f',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
              duration: 3000,
              position: 'top-center',
              style: {
                background: '#ff4d4f',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        });
        setTimeout(() => navigate('/cart'), 2000);
      } catch (err) {
        toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        });
      }
    },
    [navigate, session, setCartCount, buyerLocation]
  );

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
            let errorMessage = 'Unable to fetch location.';
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage = 'Location access denied. Please enable location services.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = 'Location information unavailable. Please try again.';
            } else if (error.code === error.TIMEOUT) {
              errorMessage = 'Location request timed out. Please try again.';
            }
            toast.error(`${errorMessage} Using default location (Jharia, Dhanbad).`, {
              duration: 3000,
              position: 'top-center',
              style: {
                background: '#ff4d4f',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              },
            });
            setBuyerLocation(DEFAULT_LOCATION);
            fetchNearbyProducts();
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        toast.error('Geolocation not supported. Using default location (Jharia, Dhanbad).', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        });
        setBuyerLocation(DEFAULT_LOCATION);
        fetchNearbyProducts();
      }
    } else {
      fetchNearbyProducts();
    }
  }, [fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

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

  if (loadingProducts && loadingBanners && loadingCategories)
    return (
      <div className="td-loading-container">
        <div className="td-loading-animation">
          <div className="td-loading-box">
            <FaShoppingCart className="td-loading-icon" />
            <span>Finding the best deals for you...</span>
          </div>
          <div className="td-loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
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
          content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
        />
        <meta
          name="keywords"
          content="ecommerce, electronics, appliances, fashion, jewellery, home decoration, Markeet, local shopping"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.markeet.com/" />
        <meta property="og:title" content="Markeet - Shop Electronics, Fashion, Jewellery & More" />
        <meta
          property="og:description"
          content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
        />
        <meta property="og:image" content={products[0]?.images[0] || 'https://dummyimage.com/1200x300'} />
        <meta property="og:url" content="https://www.markeet.com/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Markeet - Shop Electronics, Fashion, Jewellery & More" />
        <meta
          name="twitter:description"
          content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
        />
        <meta name="twitter:image" content={products[0]?.images[0] || 'https://dummyimage.com/1200x300'} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Markeet Home',
            description: 'Shop electronics, appliances, jewellery, fashion, and more on Markeet with fast local delivery.',
            url: 'https://www.markeet.com/',
          })}
        </script>
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
                onKeyPress={(e) =>
                  e.key === 'Enter' && setSearchTerm(suggestion.name) && setIsSearchFocused(false) && setSuggestions([])
                }
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
                state={{ fromCategories: true }}
                className="td-cat-card"
                aria-label={`View ${category.name} products`}
              >
                <img
                  src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
                  alt={category.name}
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
          <p className="td-no-products">
            {searchTerm ? 'No products found.' : 'No products nearby. '}
            {!searchTerm && (
              <>
                <Link to="/categories">Browse all categories</Link> or{' '}
                <button
                  onClick={() => {
                    setBuyerLocation(null);
                    toast.info('Please allow location access or enter a new location.', {
                      duration: 3000,
                      position: 'top-center',
                      style: {
                        background: '#1890ff',
                        color: '#fff',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        padding: '16px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      },
                    });
                  }}
                  className="td-change-location-btn"
                  aria-label="Change location"
                >
                  Change Location
                </button>
              </>
            )}
          </p>
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
                    alt={product.name}
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
                        ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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