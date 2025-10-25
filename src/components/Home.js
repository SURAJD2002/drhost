

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
// import '../style/CursorAndNearbyProducts.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { 
//   infoToast, 
//   successToast, 
//   errorToast, 
//   authRequiredToast, 
//   outOfStockToast, 
//   invalidProductToast, 
//   productAddedToCartToast,
//   nearbyProductsComingSoonToast 
// } from '../utils/toastUtils';
// import { 
//   fetchNearbyProducts as fetchNearbyProductsUtil, 
//   getUserLocationWithFallback,
//   checkLocationPermission 
// } from '../utils/nearbyProducts';

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
  
//   // Nearby products state
//   const [nearbyProducts, setNearbyProducts] = useState([]);
//   const [loadingNearbyProducts, setLoadingNearbyProducts] = useState(false);
//   const [nearbyProductsError, setNearbyProductsError] = useState(null);
//   const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

//   // Default location for Jharia, Dhanbad
//   const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 };
//   const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';

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
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
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

//   // Fetch nearby products using the new utility
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || typeof buyerLocation.lat !== 'number' || typeof buyerLocation.lon !== 'number') {
//       setLoadingNearbyProducts(false);
//       return;
//     }
    
//     setLoadingNearbyProducts(true);
//     setNearbyProductsError(null);
//     try {
//       const products = await fetchNearbyProductsUtil(buyerLocation.lat, buyerLocation.lon, 20);
      
//       // Ensure products is an array
//       const safeProducts = Array.isArray(products) ? products : [];
//       setNearbyProducts(safeProducts);
      
//       if (safeProducts.length === 0) {
//         nearbyProductsComingSoonToast();
//       }

//     } catch (error) {
//       console.error('Error fetching nearby products:', error);
//       setNearbyProductsError(error.message);
//       setNearbyProducts([]);
//     } finally {
//       setLoadingNearbyProducts(false);
//     }
//   }, [buyerLocation]);

//   // Request location permission
//   const requestLocationPermission = useCallback(async () => {
//     try {
//       const location = await getUserLocationWithFallback();
//       if (location) {
//         setBuyerLocation(location);
//         setLocationPermissionGranted(true);
//         infoToast('Location permission granted! Showing nearby products.');
//       } else {
//         infoToast('Location permission denied. Using default location.');
//       }
//     } catch (error) {
//       console.error('Location permission error:', error);
//       infoToast('Could not access location. Using default location.');
//     }
//   }, [setBuyerLocation]);

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
//       infoToast('Selected variant is not available.');
//       return false;
//     }
//     return true;
//   };

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('add items to cart');
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
//           toast('Please select this category from the categories page to add products to cart.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: 'var(--toastify-color-info)',
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
//         outOfStockToast();
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
//           toast('Please select this category from the categories page to proceed.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: 'var(--toastify-color-info)',
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
//             let errorMessage = 'Unable to fetch location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.error(`${errorMessage} Using default location (Jharia, Dhanbad).`, {
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
//             setBuyerLocation(DEFAULT_LOCATION);
//             fetchNearbyProducts();
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         toast.error('Geolocation not supported. Using default location (Jharia, Dhanbad).', {
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
//         setBuyerLocation(DEFAULT_LOCATION);
//         fetchNearbyProducts();
//       }
//     } else {
//       fetchNearbyProducts();
//     }
//   }, [fetchBannerImages, fetchCategories, buyerLocation, setBuyerLocation, fetchNearbyProducts]);

//   // Fetch nearby products when location is available
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

//       {/* Nearby Products Section */}
//       <section className="nearby-products-section">
//         <div className="nearby-products-header">
//           <span className="nearby-products-icon">📍</span>
//           <h2 className="nearby-products-title">Products Near You</h2>
//         </div>
        
//         {!locationPermissionGranted && !buyerLocation && (
//           <div className="location-permission-request">
//             <div className="location-permission-icon">📍</div>
//             <h3 className="location-permission-title">Enable Location Access</h3>
//             <p className="location-permission-message">
//               Allow location access to discover products available for delivery in your area.
//             </p>
//             <button 
//               className="location-permission-button"
//               onClick={requestLocationPermission}
//             >
//               Enable Location
//             </button>
//           </div>
//         )}
        
//         {loadingNearbyProducts && (
//           <div className="nearby-products-loading">
//             <div className="nearby-products-spinner"></div>
//             <span className="nearby-products-loading-text">Finding nearby products...</span>
//           </div>
//         )}
        
//         {!loadingNearbyProducts && nearbyProducts.length === 0 && locationPermissionGranted && (
//           <div className="no-nearby-products">
//             <div className="no-nearby-products-icon">🚀</div>
//             <h3 className="no-nearby-products-title">No nearby products yet — coming soon!</h3>
//             <p className="no-nearby-products-message">
//               We're working hard to bring you amazing products in your area. Check back soon!
//             </p>
//           </div>
//         )}
        
//         {!loadingNearbyProducts && nearbyProducts.length > 0 && (
//           <div className="nearby-products-grid">
//             {nearbyProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="nearby-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`Click to open product details for ${product.name || product.title}`}
//               >
//                 <img 
//                   src={product.images?.[0] || 'https://dummyimage.com/150'} 
//                   alt={product.name || product.title}
//                   className="nearby-product-image"
//                 />
//                 <div className="nearby-product-info">
//                   <h3 className="nearby-product-name">
//                     {product.name || product.title}
//                   </h3>
//                   <p className="nearby-product-price">
//                     ₹{product.price?.toFixed(2) || '0.00'}
//                   </p>
//                   {product.distance && (
//                     <p className="nearby-product-distance">
//                       📍 {product.distance.toFixed(1)} km away
//                     </p>
//                   )}
//                   {product.sellers?.store_name && (
//                     <p className="nearby-product-seller">
//                       by {product.sellers.store_name}
//                     </p>
//                   )}
//                 </div>
//               </div>
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
// import { Toaster } from 'react-hot-toast';
// import '../style/Home.css';
// import '../style/CursorAndNearbyProducts.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import {
//   infoToast,
//   successToast,
//   errorToast,
//   blueInfoToast,
//   authRequiredToast,
//   outOfStockToast,
//   invalidProductToast,
//   nearbyProductsComingSoonToast,
// } from '../utils/toastUtils';
// import {
//   fetchNearbyProducts as fetchNearbyProductsUtil,
//   getUserLocationWithFallback,
// } from '../utils/nearbyProducts';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, productLoc) {
//   if (!userLoc || !productLoc || !productLoc.latitude || !productLoc.longitude || productLoc.latitude === 0 || productLoc.longitude === 0) {
//     console.log('Invalid location data:', { userLoc, productLoc });
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(productLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
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
//   const [nearbyProducts, setNearbyProducts] = useState([]);
//   const [loadingNearbyProducts, setLoadingNearbyProducts] = useState(false);
//   // const [nearbyProductsError, setNearbyProductsError] = useState(null); // Unused
//   const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
//   const searchRef = useRef(null);

//   const DEFAULT_LOCATION = useMemo(() => ({ lat: 23.7407, lon: 86.4146 }), []);
//   // const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India'; // Unused
//   const DEFAULT_DELIVERY_RADIUS = 50; // 50 km to match nearby products

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     (value) => {
//       const debouncedFn = debounce((val) => setSearchTerm(val), 300);
//       debouncedFn(value);
//     }, 
//     [setSearchTerm]
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       errorToast('No internet connection. Please check your network.');
//       return false;
//     }
//     return true;
//   };

//   // Fetch global products - latest 20 active products
//   const fetchProducts = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       // Fetch latest 20 active, approved products for global section
//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select(`
//           id,
//           title,
//           name,
//           description,
//           category_id,
//           is_approved,
//           status,
//           images,
//           images_json,
//           price,
//           display_price,
//           sale_price,
//           original_price,
//           discount_amount,
//           stock,
//           latitude,
//           longitude,
//           specifications,
//           delivery_radius_km,
//           seller_id,
//           seller_name,
//           product_variants!inner(id, stock, price, status)
//         `)
//         .eq('status', 'active')
//         .eq('is_approved', true)
//         .order('created_at', { ascending: false })
//         .limit(20); // Limit to latest 20 products for global section

//       if (productsError) throw productsError;

//       // Global products - no location filtering, just show latest 20
//       let filteredProducts = productsData || [];
//       console.log('✅ GLOBAL Products loaded (latest 20):', filteredProducts.length);

//       // Transform products to match frontend expectations
//       const transformedProducts = filteredProducts.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images || (product.images_json?.images || []),
//         displayPrice: Number(product.display_price) || 0,
//         displayOriginalPrice: Number(product.original_price) || null,
//         discountAmount: Number(product.discount_amount) || 0,
//         stock: product.stock || 0,
//         categoryId: product.category_id,
//         sellerName: product.seller_name || 'Unknown Seller',
//         sellerId: product.seller_id,
//         variants: (product.product_variants || []).filter((v) => v.status === 'active'),
//         description: product.description,
//         specifications: product.specifications,
//         deliveryRadiusKm: product.delivery_radius_km,
//         latitude: product.latitude,
//         longitude: product.longitude,
//       }));

//       setProducts(transformedProducts);
//       setError(null);
//       console.log('✅ GLOBAL Products loaded (latest 20):', transformedProducts.length);
//     } catch (err) {
//       console.error('Failed to fetch products:', err);
//       setError('Failed to load products. Please try again.');
//       setProducts([]);
//       errorToast('Failed to load products');
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, []); // Global products don't depend on buyer location

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
//         .order('name')
//         .limit(20);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//       errorToast('Failed to load categories');
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products using reliable fallback query - NO LIMIT
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || typeof buyerLocation.lat !== 'number' || typeof buyerLocation.lon !== 'number') {
//       setLoadingNearbyProducts(false);
//       return;
//     }
//     setLoadingNearbyProducts(true);
//     // setNearbyProductsError(null); // Unused
//     try {
//       // Use the reliable fallback query - fetch ALL nearby products within radius
//       const products = await fetchNearbyProductsUtil(buyerLocation.lat, buyerLocation.lon, null); // No limit
//       const safeProducts = Array.isArray(products) ? products : [];
//       setNearbyProducts(safeProducts);
//       if (safeProducts.length === 0) {
//         nearbyProductsComingSoonToast();
//       }
//       console.log('✅ NEARBY Products loaded (ALL within radius):', safeProducts.length);
//     } catch (error) {
//       console.error('Error fetching nearby products:', error);
//       // setNearbyProductsError(error.message); // Unused
//       setNearbyProducts([]);
//       errorToast('Failed to load nearby products');
//     } finally {
//       setLoadingNearbyProducts(false);
//     }
//   }, [buyerLocation]);

//   // Request location permission
//   const requestLocationPermission = useCallback(async () => {
//     try {
//       const location = await getUserLocationWithFallback();
//       if (location) {
//         setBuyerLocation(location);
//         setLocationPermissionGranted(true);
//         blueInfoToast('Location permission granted! Showing nearby products.');
//       } else {
//         setBuyerLocation(DEFAULT_LOCATION);
//         blueInfoToast('Location permission denied. Using default location (Jharia, Dhanbad).');
//       }
//     } catch (error) {
//       console.error('Location permission error:', error);
//       setBuyerLocation(DEFAULT_LOCATION);
//       blueInfoToast('Could not access location. Using default location (Jharia, Dhanbad).');
//     }
//   }, [setBuyerLocation, DEFAULT_LOCATION]);

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
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//       errorToast('Failed to load banners');
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
//       infoToast('Selected variant is not available.');
//       return false;
//     }
//     return true;
//   };

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('add items to cart');
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
//           infoToast('Please select this category from the categories page to add products to cart.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
//           successToast(`${product.name} quantity updated in cart!`);
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
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
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
//           successToast(`${product.name} added to cart!`);
//         }
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('proceed to checkout');
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
//           infoToast('Please select this category from the categories page to proceed.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
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
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
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

//         successToast('Added to cart! Redirecting to cart...');
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
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
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Initial data fetch
//   useEffect(() => {
//     fetchBannerImages();
//     fetchCategories();
//     fetchProducts();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
//             setBuyerLocation(newLocation);
//             setLocationPermissionGranted(true);
//           },
//           (error) => {
//             let errorMessage = 'Unable to fetch location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information unavailable.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out.';
//             }
//             errorToast(`${errorMessage} Using default location (Jharia, Dhanbad).`);
//             setBuyerLocation(DEFAULT_LOCATION);
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         blueInfoToast('Geolocation not supported. Using default location (Jharia, Dhanbad).');
//         setBuyerLocation(DEFAULT_LOCATION);
//       }
//     }
//   }, [fetchBannerImages, fetchCategories, fetchProducts, setBuyerLocation, DEFAULT_LOCATION, buyerLocation]);

//   // Fetch nearby products and global products when location changes
//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//       fetchProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts, fetchProducts]);

//   // Filter products for search
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

//   // Show loading state only if all sections are loading
//   if (loadingProducts && loadingBanners && loadingCategories) {
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
//   }

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
//                   navigate(`/product/${suggestion.id}`);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') {
//                     setSearchTerm(suggestion.name);
//                     setIsSearchFocused(false);
//                     setSuggestions([]);
//                     navigate(`/product/${suggestion.id}`);
//                   }
//                 }}
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

//       {/* Nearby Products Section */}
//       <section className="nearby-products-section">
//         <div className="nearby-products-header">
//           <span className="nearby-products-icon">📍</span>
//           <h2 className="nearby-products-title">Products Near You</h2>
//         </div>
//         {!locationPermissionGranted && !buyerLocation && (
//           <div className="location-permission-request">
//             <div className="location-permission-icon">📍</div>
//             <h3 className="location-permission-title">Enable Location Access</h3>
//             <p className="location-permission-message">
//               Allow location access to discover products available for delivery in your area.
//             </p>
//             <button
//               className="location-permission-button"
//               onClick={requestLocationPermission}
//               aria-label="Enable Location"
//             >
//               Enable Location
//             </button>
//           </div>
//         )}
//         {loadingNearbyProducts && (
//           <div className="nearby-products-loading">
//             <div className="nearby-products-spinner"></div>
//             <span className="nearby-products-loading-text">Finding nearby products...</span>
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length === 0 && locationPermissionGranted && (
//           <div className="no-nearby-products">
//             <div className="no-nearby-products-icon">🚀</div>
//             <h3 className="no-nearby-products-title">No nearby products yet — coming soon!</h3>
//             <p className="no-nearby-products-message">
//               We're working hard to bring you amazing products in your area. Check back soon!
//             </p>
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length > 0 && (
//           <div className="nearby-products-grid">
//             {nearbyProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="nearby-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name || product.title}`}
//               >
//                 <img
//                   src={product.images?.[0] || 'https://dummyimage.com/150'}
//                   alt={product.name || product.title}
//                   className="nearby-product-image"
//                   loading="lazy"
//                 />
//                 <div className="nearby-product-info">
//                   <h3 className="nearby-product-name">{product.name || product.title}</h3>
//                   <p className="nearby-product-price">
//                     ₹{(product.displayPrice || product.price || 0).toFixed(2)}
//                   </p>
//                   {product.distance_km && (
//                     <p className="nearby-product-distance">📍 {product.distance_km.toFixed(1)} km away</p>
//                   )}
//                   {product.seller_name && (
//                     <p className="nearby-product-seller">by {product.seller_name}</p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Global Products Section */}
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
//             {searchTerm ? 'No products found.' : 'No products available in your area.'}
//             {!searchTerm && (
//               <>
//                 <Link to="/categories">Browse all categories</Link> or{' '}
//                 <button
//                   onClick={requestLocationPermission}
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
//                     src={product.images[0] || 'https://dummyimage.com/150'}
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
//                   <p className="td-product-seller">by {product.sellerName}</p>
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
// import { Toaster } from 'react-hot-toast';
// import '../style/Home.css';
// import '../style/CursorAndNearbyProducts.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import {
//   infoToast,
//   successToast,
//   errorToast,
//   blueInfoToast,
//   authRequiredToast,
//   outOfStockToast,
//   invalidProductToast,
//   nearbyProductsComingSoonToast,
// } from '../utils/toastUtils';
// import {
//   fetchNearbyProducts as fetchNearbyProductsUtil,
//   getUserLocationWithFallback,
// } from '../utils/nearbyProducts';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, productLoc) {
//   if (!userLoc || !productLoc || !productLoc.latitude || !productLoc.longitude || productLoc.latitude === 0 || productLoc.longitude === 0) {
//     console.log('Invalid location data:', { userLoc, productLoc });
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(productLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
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
//   const [nearbyProducts, setNearbyProducts] = useState([]);
//   const [loadingNearbyProducts, setLoadingNearbyProducts] = useState(false);
//   const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
//   const searchRef = useRef(null);

//   const DEFAULT_LOCATION = useMemo(() => ({ lat: 23.7407, lon: 86.4146 }), []);
//   const DEFAULT_DELIVERY_RADIUS = 50; // 50 km to match nearby products

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => setSearchTerm(value), 300),
//     [setSearchTerm]
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       errorToast('No internet connection. Please check your network.');
//       return false;
//     }
//     return true;
//   };

//   // Fetch exactly 4 global products
//   const fetchProducts = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select(`
//           id,
//           title,
//           name,
//           description,
//           category_id,
//           is_approved,
//           status,
//           images,
//           images_json,
//           price,
//           display_price,
//           sale_price,
//           original_price,
//           discount_amount,
//           stock,
//           latitude,
//           longitude,
//           specifications,
//           delivery_radius_km,
//           seller_id,
//           seller_name,
//           product_variants!inner(id, stock, price, status)
//         `)
//         .eq('status', 'active')
//         .eq('is_approved', true)
//         .order('created_at', { ascending: false })
//         .limit(1000); // Fetch exactly 4 products

//       if (productsError) throw productsError;

//       let filteredProducts = productsData || [];
//       console.log('✅ GLOBAL Products loaded (exactly 4):', filteredProducts.length);

//       const transformedProducts = filteredProducts.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images || (product.images_json?.images || []),
//         displayPrice: Number(product.display_price) || 0,
//         displayOriginalPrice: Number(product.original_price) || null,
//         discountAmount: Number(product.discount_amount) || 0,
//         stock: product.stock || 0,
//         categoryId: product.category_id,
//         sellerName: product.seller_name || 'Unknown Seller',
//         sellerId: product.seller_id,
//         variants: (product.product_variants || []).filter((v) => v.status === 'active'),
//         description: product.description,
//         specifications: product.specifications,
//         deliveryRadiusKm: product.delivery_radius_km,
//         latitude: product.latitude,
//         longitude: product.longitude,
//       }));

//       setProducts(transformedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Failed to fetch products:', err);
//       setError('Failed to load products. Please try again.');
//       setProducts([]);
//       errorToast('Failed to load products');
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, []);

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
//         .order('name')
//         .limit(20);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//       errorToast('Failed to load categories');
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || typeof buyerLocation.lat !== 'number' || typeof buyerLocation.lon !== 'number') {
//       setLoadingNearbyProducts(false);
//       return;
//     }
//     setLoadingNearbyProducts(true);
//     try {
//       const products = await fetchNearbyProductsUtil(buyerLocation.lat, buyerLocation.lon, null);
//       const safeProducts = Array.isArray(products) ? products : [];
//       setNearbyProducts(safeProducts);
//       if (safeProducts.length === 0) {
//         nearbyProductsComingSoonToast();
//       }
//       console.log('✅ NEARBY Products loaded:', safeProducts.length);
//     } catch (error) {
//       console.error('Error fetching nearby products:', error);
//       setNearbyProducts([]);
//       errorToast('Failed to load nearby products');
//     } finally {
//       setLoadingNearbyProducts(false);
//     }
//   }, [buyerLocation]);

//   // Request location permission
//   const requestLocationPermission = useCallback(async () => {
//     try {
//       const location = await getUserLocationWithFallback();
//       if (location) {
//         setBuyerLocation(location);
//         setLocationPermissionGranted(true);
//         blueInfoToast('Location permission granted! Showing nearby products.');
//       } else {
//         setBuyerLocation(DEFAULT_LOCATION);
//         blueInfoToast('Location permission denied. Using default location (Jharia, Dhanbad).');
//       }
//     } catch (error) {
//       console.error('Location permission error:', error);
//       setBuyerLocation(DEFAULT_LOCATION);
//       blueInfoToast('Could not access location. Using default location (Jharia, Dhanbad).');
//     }
//   }, [setBuyerLocation, DEFAULT_LOCATION]);

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
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//       errorToast('Failed to load banners');
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
//       infoToast('Selected variant is not available.');
//       return false;
//     }
//     return true;
//   };

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('add items to cart');
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
//           infoToast('Please select this category from the categories page to add products to cart.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
//           successToast(`${product.name} quantity updated in cart!`);
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
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
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
//           successToast(`${product.name} added to cart!`);
//         }
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('proceed to checkout');
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
//           infoToast('Please select this category from the categories page to proceed.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
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
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
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

//         successToast('Added to cart! Redirecting to cart...');
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
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
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Initial data fetch
//   useEffect(() => {
//     fetchBannerImages();
//     fetchCategories();
//     fetchProducts();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
//             setBuyerLocation(newLocation);
//             setLocationPermissionGranted(true);
//           },
//           (error) => {
//             let errorMessage = 'Unable to fetch location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information unavailable.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out.';
//             }
//             errorToast(`${errorMessage} Using default location (Jharia, Dhanbad).`);
//             setBuyerLocation(DEFAULT_LOCATION);
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         blueInfoToast('Geolocation not supported. Using default location (Jharia, Dhanbad).');
//         setBuyerLocation(DEFAULT_LOCATION);
//       }
//     }
//   }, [fetchBannerImages, fetchCategories, fetchProducts, setBuyerLocation, DEFAULT_LOCATION]);

//   // Fetch nearby products when location changes
//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

//   // Filter products for search
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

//   // Show loading state for all sections
//   if (loadingProducts && loadingBanners && loadingCategories) {
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
//   }

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
//                   navigate(`/product/${suggestion.id}`);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') {
//                     setSearchTerm(suggestion.name);
//                     setIsSearchFocused(false);
//                     setSuggestions([]);
//                     navigate(`/product/${suggestion.id}`);
//                   }
//                 }}
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

//       {/* Nearby Products Section */}
//       <section className="nearby-products-section">
//         <div className="nearby-products-header">
//           <span className="nearby-products-icon">📍</span>
//           <h2 className="nearby-products-title">Products Near You</h2>
//         </div>
//         {!locationPermissionGranted && !buyerLocation && (
//           <div className="location-permission-request">
//             <div className="location-permission-icon">📍</div>
//             <h3 className="location-permission-title">Enable Location Access</h3>
//             <p className="location-permission-message">
//               Allow location access to discover products available for delivery in your area.
//             </p>
//             <button
//               className="location-permission-button"
//               onClick={requestLocationPermission}
//               aria-label="Enable Location"
//             >
//               Enable Location
//             </button>
//           </div>
//         )}
//         {loadingNearbyProducts && (
//           <div className="nearby-products-loading">
//             <div className="nearby-products-spinner"></div>
//             <span className="nearby-products-loading-text">Finding nearby products...</span>
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length === 0 && locationPermissionGranted && (
//           <div className="no-nearby-products">
//             <div className="no-nearby-products-icon">🚀</div>
//             <h3 className="no-nearby-products-title">No nearby products yet — coming soon!</h3>
//             <p className="no-nearby-products-message">
//               We're working hard to bring you amazing products in your area. Check back soon!
//             </p>
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length > 0 && (
//           <div className="nearby-products-grid">
//             {nearbyProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="nearby-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name || product.title}`}
//               >
//                 <img
//                   src={product.images?.[0] || 'https://dummyimage.com/150'}
//                   alt={product.name || product.title}
//                   className="nearby-product-image"
//                   loading="lazy"
//                 />
//                 <div className="nearby-product-info">
//                   <h3 className="nearby-product-name">{product.name || product.title}</h3>
//                   <p className="nearby-product-price">
//                     ₹{(product.displayPrice || product.price || 0).toFixed(2)}
//                   </p>
//                   {product.distance_km && (
//                     <p className="nearby-product-distance">📍 {product.distance_km.toFixed(1)} km away</p>
//                   )}
//                   {product.seller_name && (
//                     <p className="nearby-product-seller">by {product.seller_name}</p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Global Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="td-product-grid td-product-grid--fixed">
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
//             {searchTerm ? 'No products found.' : 'No products available in your area.'}
//             {!searchTerm && (
//               <>
//                 <Link to="/categories">Browse all categories</Link> or{' '}
//                 <button
//                   onClick={requestLocationPermission}
//                   className="td-change-location-btn"
//                   aria-label="Change location"
//                 >
//                   Change Location
//                 </button>
//               </>
//             )}
//           </p>
//         ) : (
//           <div className={`td-product-grid td-product-grid--fixed ${filteredProducts.length < 4 ? 'td-product-grid--sparse' : ''}`}>
//             {filteredProducts.slice(0, 4).map((product) => (
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
//                     src={product.images[0] || 'https://dummyimage.com/150'}
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
//                   <p className="td-product-seller">by {product.sellerName}</p>
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
// import { Toaster } from 'react-hot-toast';
// import '../style/Home.css';
// import '../style/CursorAndNearbyProducts.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import {
//   infoToast,
//   successToast,
//   errorToast,
//   blueInfoToast,
//   authRequiredToast,
//   outOfStockToast,
//   invalidProductToast,
//   nearbyProductsComingSoonToast,
// } from '../utils/toastUtils';
// import {
//   fetchNearbyProducts as fetchNearbyProductsUtil,
//   getUserLocationWithFallback,
// } from '../utils/nearbyProducts';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, productLoc) {
//   if (!userLoc || !productLoc || !productLoc.latitude || !productLoc.longitude || productLoc.latitude === 0 || productLoc.longitude === 0) {
//     console.log('Invalid location data:', { userLoc, productLoc });
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(productLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
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
//   const [nearbyProducts, setNearbyProducts] = useState([]);
//   const [loadingNearbyProducts, setLoadingNearbyProducts] = useState(false);
//   const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
//   const searchRef = useRef(null);

//   const DEFAULT_LOCATION = useMemo(() => ({ lat: 23.7407, lon: 86.4146 }), []);
//   const DEFAULT_DELIVERY_RADIUS = 50; // 50 km to match nearby products

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     debounce((value) => setSearchTerm(value), 300),
//     [setSearchTerm]
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       errorToast('No internet connection. Please check your network.');
//       return false;
//     }
//     return true;
//   };

//   // Fetch exactly 4 global products
//   const fetchProducts = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select(`
//           id,
//           title,
//           name,
//           description,
//           category_id,
//           is_approved,
//           status,
//           images,
//           images_json,
//           price,
//           display_price,
//           sale_price,
//           original_price,
//           discount_amount,
//           stock,
//           latitude,
//           longitude,
//           specifications,
//           delivery_radius_km,
//           seller_id,
//           seller_name,
//           product_variants!inner(id, stock, price, status)
//         `)
//         .eq('status', 'active')
//         .eq('is_approved', true)
//         .order('created_at', { ascending: false })
//         .limit(1000); // Fetch exactly 4 products

//       if (productsError) throw productsError;

//       let filteredProducts = productsData || [];
//       console.log('✅ GLOBAL Products loaded (exactly 4):', filteredProducts.length);

//       const transformedProducts = filteredProducts.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images || (product.images_json?.images || []),
//         displayPrice: Number(product.display_price) || 0,
//         displayOriginalPrice: Number(product.original_price) || null,
//         discountAmount: Number(product.discount_amount) || 0,
//         stock: product.stock || 0,
//         categoryId: product.category_id,
//         sellerName: product.seller_name || 'Unknown Seller',
//         sellerId: product.seller_id,
//         variants: (product.product_variants || []).filter((v) => v.status === 'active'),
//         description: product.description,
//         specifications: product.specifications,
//         deliveryRadiusKm: product.delivery_radius_km,
//         latitude: product.latitude,
//         longitude: product.longitude,
//       }));

//       setProducts(transformedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Failed to fetch products:', err);
//       setError('Failed to load products. Please try again.');
//       setProducts([]);
//       errorToast('Failed to load products');
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, []);

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
//         .order('name')
//         .limit(20);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//       errorToast('Failed to load categories');
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || typeof buyerLocation.lat !== 'number' || typeof buyerLocation.lon !== 'number') {
//       setLoadingNearbyProducts(false);
//       return;
//     }
//     setLoadingNearbyProducts(true);
//     try {
//       const products = await fetchNearbyProductsUtil(buyerLocation.lat, buyerLocation.lon, null);
//       const safeProducts = Array.isArray(products) ? products : [];
//       setNearbyProducts(safeProducts);
//       if (safeProducts.length === 0 && locationPermissionGranted) {
//         // Check if no products are within delivery radius
//         const hasNoProductsInRadius = safeProducts.every((product) => {
//           if (!product.latitude || !product.longitude) return true;
//           const distance = calculateDistance(buyerLocation, {
//             latitude: product.latitude,
//             longitude: product.longitude,
//           });
//           const effectiveRadius = product.delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           return distance === null || distance > effectiveRadius;
//         });
//         if (hasNoProductsInRadius) {
//           console.log('No products within delivery radius, showing custom message.');
//         }
//       }
//       console.log('✅ NEARBY Products loaded:', safeProducts.length);
//     } catch (error) {
//       console.error('Error fetching nearby products:', error);
//       setNearbyProducts([]);
//       errorToast('Failed to load nearby products');
//     } finally {
//       setLoadingNearbyProducts(false);
//     }
//   }, [buyerLocation, locationPermissionGranted]);

//   // Request location permission
//   const requestLocationPermission = useCallback(async () => {
//     try {
//       const location = await getUserLocationWithFallback();
//       if (location) {
//         setBuyerLocation(location);
//         setLocationPermissionGranted(true);
//         blueInfoToast('Location permission granted! Showing nearby products.');
//       } else {
//         setBuyerLocation(DEFAULT_LOCATION);
//         blueInfoToast('Location permission denied. Using default location (Jharia, Dhanbad).');
//       }
//     } catch (error) {
//       console.error('Location permission error:', error);
//       setBuyerLocation(DEFAULT_LOCATION);
//       blueInfoToast('Could not access location. Using default location (Jharia, Dhanbad).');
//     }
//   }, [setBuyerLocation, DEFAULT_LOCATION]);

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
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//       errorToast('Failed to load banners');
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
//       infoToast('Selected variant is not available.');
//       return false;
//     }
//     return true;
//   };

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('add items to cart');
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
//           infoToast('Please select this category from the categories page to add products to cart.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
//           successToast(`${product.name} quantity updated in cart!`);
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
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
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
//           successToast(`${product.name} added to cart!`);
//         }
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('proceed to checkout');
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
//           infoToast('Please select this category from the categories page to proceed.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
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
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
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

//         successToast('Added to cart! Redirecting to cart...');
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
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
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Initial data fetch
//   useEffect(() => {
//     fetchBannerImages();
//     fetchCategories();
//     fetchProducts();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
//             setBuyerLocation(newLocation);
//             setLocationPermissionGranted(true);
//           },
//           (error) => {
//             let errorMessage = 'Unable to fetch location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information unavailable.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out.';
//             }
//             errorToast(`${errorMessage} Using default location (Jharia, Dhanbad).`);
//             setBuyerLocation(DEFAULT_LOCATION);
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         blueInfoToast('Geolocation not supported. Using default location (Jharia, Dhanbad).');
//         setBuyerLocation(DEFAULT_LOCATION);
//       }
//     }
//   }, [fetchBannerImages, fetchCategories, fetchProducts, setBuyerLocation, DEFAULT_LOCATION]);

//   // Fetch nearby products when location changes
//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

//   // Filter products for search
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

//   // Show loading state for all sections
//   if (loadingProducts && loadingBanners && loadingCategories) {
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
//   }

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
//                   navigate(`/product/${suggestion.id}`);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') {
//                     setSearchTerm(suggestion.name);
//                     setIsSearchFocused(false);
//                     setSuggestions([]);
//                     navigate(`/product/${suggestion.id}`);
//                   }
//                 }}
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

//       {/* Nearby Products Section */}
//       <section className="nearby-products-section">
//         <div className="nearby-products-header">
//           <span className="nearby-products-icon">📍</span>
//           <h2 className="nearby-products-title">Products Near You</h2>
//         </div>
//         {!locationPermissionGranted && !buyerLocation && (
//           <div className="location-permission-request">
//             <div className="location-permission-icon">📍</div>
//             <h3 className="location-permission-title">Enable Location Access</h3>
//             <p className="location-permission-message">
//               Allow location access to discover products available for delivery in your area.
//             </p>
//             <button
//               className="location-permission-button"
//               onClick={requestLocationPermission}
//               aria-label="Enable Location"
//             >
//               Enable Location
//             </button>
//           </div>
//         )}
//         {loadingNearbyProducts && (
//           <div className="nearby-products-loading">
//             <div className="nearby-products-spinner"></div>
//             <span className="nearby-products-loading-text">Finding nearby products...</span>
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length === 0 && locationPermissionGranted && (
//           <div className="no-nearby-products">
//             <div className="no-nearby-products-icon">🚀</div>
//             <h3 className="no-nearby-products-title">We are coming soon in your location</h3>
//             <p className="no-nearby-products-message">
//               We're working hard to bring you amazing products in your area. Check back soon!
//             </p>
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length > 0 && (
//           <div className="nearby-products-grid">
//             {nearbyProducts.map((product) => (
//               <div
//                 key={product.id}
//                 className="nearby-product-card"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View ${product.name || product.title}`}
//               >
//                 <img
//                   src={product.images?.[0] || 'https://dummyimage.com/150'}
//                   alt={product.name || product.title}
//                   className="nearby-product-image"
//                   loading="lazy"
//                 />
//                 <div className="nearby-product-info">
//                   <h3 className="nearby-product-name">{product.name || product.title}</h3>
//                   <p className="nearby-product-price">
//                     ₹{(product.displayPrice || product.price || 0).toFixed(2)}
//                   </p>
//                   {product.distance_km && (
//                     <p className="nearby-product-distance">📍 {product.distance_km.toFixed(1)} km away</p>
//                   )}
//                   {product.seller_name && (
//                     <p className="nearby-product-seller">by {product.seller_name}</p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Global Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="td-product-grid td-product-grid--fixed">
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
//             {searchTerm ? 'No products found.' : 'No products available in your area.'}
//             {!searchTerm && (
//               <>
//                 <Link to="/categories">Browse all categories</Link> or{' '}
//                 <button
//                   onClick={requestLocationPermission}
//                   className="td-change-location-btn"
//                   aria-label="Change location"
//                 >
//                   Change Location
//                 </button>
//               </>
//             )}
//           </p>
//         ) : (
//           <div className={`td-product-grid td-product-grid--fixed ${filteredProducts.length < 4 ? 'td-product-grid--sparse' : ''}`}>
//             {filteredProducts.slice(0, 4).map((product) => (
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
//                     src={product.images[0] || 'https://dummyimage.com/150'}
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
//                   <p className="td-product-seller">by {product.sellerName}</p>
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
// import { FaSearch, FaShoppingCart } from 'react-icons/fa'; // Added FaShoppingCart import
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { Toaster } from 'react-hot-toast';
// import '../style/Home.css';
// import '../style/CursorAndNearbyProducts.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import HomeProducts from './HomeProducts'; // Reference to artifact 05de5614-3c49-4d2a-8b60-e9c1feb0db8a
// import {
//   infoToast,
//   successToast,
//   errorToast,
//   blueInfoToast,
//   authRequiredToast,
//   outOfStockToast,
//   invalidProductToast,
//   nearbyProductsComingSoonToast,
// } from '../utils/toastUtils';
// import {
//   fetchNearbyProducts as fetchNearbyProductsUtil,
//   getUserLocationWithFallback,
// } from '../utils/nearbyProducts';

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, productLoc) {
//   if (!userLoc || !productLoc || !productLoc.latitude || !productLoc.longitude || productLoc.latitude === 0 || productLoc.longitude === 0) {
//     console.log('Invalid location data:', { userLoc, productLoc });
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(productLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
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
//   const [nearbyProducts, setNearbyProducts] = useState([]);
//   const [loadingNearbyProducts, setLoadingNearbyProducts] = useState(false);
//   const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
//   const searchRef = useRef(null);

//   const DEFAULT_LOCATION = useMemo(() => ({ lat: 23.7407, lon: 86.4146 }), []);
//   const DEFAULT_DELIVERY_RADIUS = 50; // 50 km to match nearby products

//   // Debounced search handler (inline to fix ESLint warning)
//   const debouncedSetSearchTerm = useCallback(
//     (value) => {
//       let timeoutId;
//       clearTimeout(timeoutId);
//       timeoutId = setTimeout(() => setSearchTerm(value), 300);
//     },
//     [setSearchTerm]
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       errorToast('No internet connection. Please check your network.');
//       return false;
//     }
//     return true;
//   };

//   // Fetch exactly 4 global products
//   const fetchProducts = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select(`
//           id,
//           title,
//           name,
//           description,
//           category_id,
//           is_approved,
//           status,
//           images,
//           images_json,
//           price,
//           display_price,
//           sale_price,
//           original_price,
//           discount_amount,
//           stock,
//           latitude,
//           longitude,
//           specifications,
//           delivery_radius_km,
//           seller_id,
//           seller_name,
//           product_variants!inner(id, stock, price, status)
//         `)
//         .eq('status', 'active')
//         .eq('is_approved', true)
//         .order('created_at', { ascending: false })
//         .limit(4);

//       if (productsError) throw productsError;

//       const transformedProducts = productsData.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images || (product.images_json?.images || []),
//         offer_price: Number(product.display_price) || 0,
//         original_price: Number(product.original_price) || null,
//         discountAmount: Number(product.discount_amount) || 0,
//         stock: product.stock || 0,
//         categoryId: product.category_id,
//         sellerName: product.seller_name || 'Unknown Seller',
//         sellerId: product.seller_id,
//         variants: (product.product_variants || []).filter((v) => v.status === 'active'),
//         description: product.description,
//         specifications: product.specifications,
//         deliveryRadiusKm: product.delivery_radius_km,
//         latitude: product.latitude,
//         longitude: product.longitude,
//       }));

//       setProducts(transformedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Failed to fetch products:', err);
//       setError('Failed to load products. Please try again.');
//       setProducts([]);
//       errorToast('Failed to load products');
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, []);

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
//         .order('name')
//         .limit(20);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//       errorToast('Failed to load categories');
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || typeof buyerLocation.lat !== 'number' || typeof buyerLocation.lon !== 'number') {
//       setLoadingNearbyProducts(false);
//       return;
//     }
//     setLoadingNearbyProducts(true);
//     try {
//       const products = await fetchNearbyProductsUtil(buyerLocation.lat, buyerLocation.lon, null);
//       const safeProducts = Array.isArray(products) ? products.map((product) => ({
//         ...product,
//         offer_price: Number(product.displayPrice || product.price || 0),
//         original_price: Number(product.original_price) || null,
//       })) : [];
//       setNearbyProducts(safeProducts);
//       if (safeProducts.length === 0 && locationPermissionGranted) {
//         nearbyProductsComingSoonToast();
//       }
//     } catch (error) {
//       console.error('Error fetching nearby products:', error);
//       setNearbyProducts([]);
//       errorToast('Failed to load nearby products');
//     } finally {
//       setLoadingNearbyProducts(false);
//     }
//   }, [buyerLocation, locationPermissionGranted]);

//   // Request location permission
//   const requestLocationPermission = useCallback(async () => {
//     try {
//       const location = await getUserLocationWithFallback();
//       if (location) {
//         setBuyerLocation(location);
//         setLocationPermissionGranted(true);
//         blueInfoToast('Location permission granted! Showing nearby products.');
//       } else {
//         setBuyerLocation(DEFAULT_LOCATION);
//         blueInfoToast('Location permission denied. Using default location (Jharia, Dhanbad).');
//       }
//     } catch (error) {
//       console.error('Location permission error:', error);
//       setBuyerLocation(DEFAULT_LOCATION);
//       blueInfoToast('Could not access location. Using default location (Jharia, Dhanbad).');
//     }
//   }, [setBuyerLocation, DEFAULT_LOCATION]);

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
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//       errorToast('Failed to load banners');
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
//       infoToast('Selected variant is not available.');
//       return false;
//     }
//     return true;
//   };

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.offer_price === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('add items to cart');
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
//           infoToast('Please select this category from the categories page to add products to cart.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
//         }

//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', session.user.id)
//           .eq('product_id', product.id);

//         if (variantId === null) {
//           query = query.is('variable_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') {
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
//           successToast(`${product.name} quantity updated in cart!`);
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.offer_price,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.offer_price,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//           successToast(`${product.name} added to cart!`);
//         }
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.offer_price === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('proceed to checkout');
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
//           infoToast('Please select this category from the categories page to proceed.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.offer_price,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.offer_price,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//         }

//         successToast('Added to cart! Redirecting to cart...');
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
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
//       .slice(0, 5)
//       .map((product) => ({
//         ...product,
//         offer_price: product.displayPrice,
//         original_price: product.displayOriginalPrice,
//       }));
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
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Initial data fetch
//   useEffect(() => {
//     fetchBannerImages();
//     fetchCategories();
//     fetchProducts();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
//             setBuyerLocation(newLocation);
//             setLocationPermissionGranted(true);
//           },
//           (error) => {
//             let errorMessage = 'Unable to fetch location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information unavailable.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out.';
//             }
//             errorToast(`${errorMessage} Using default location (Jharia, Dhanbad).`);
//             setBuyerLocation(DEFAULT_LOCATION);
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         blueInfoToast('Geolocation not supported. Using default location (Jharia, Dhanbad).');
//         setBuyerLocation(DEFAULT_LOCATION);
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fetchBannerImages, fetchCategories, fetchProducts, setBuyerLocation, DEFAULT_LOCATION]);

//   // Fetch nearby products when location changes
//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

//   // Filter products for search
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => ({
//       ...p,
//       offer_price: p.displayPrice,
//       original_price: p.displayOriginalPrice,
//     }));
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

//   // Show loading state for all sections
//   if (loadingProducts && loadingBanners && loadingCategories) {
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
//   }

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
//                   navigate(`/product/${suggestion.id}`);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') {
//                     setSearchTerm(suggestion.name);
//                     setIsSearchFocused(false);
//                     setSuggestions([]);
//                     navigate(`/product/${suggestion.id}`);
//                   }
//                 }}
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

//       {/* Nearby Products Section */}
//       <section className="nearby-products-section">
//         <div className="nearby-products-header">
//           <span className="nearby-products-icon">📍</span>
//           <h2 className="nearby-products-title">Products Near You</h2>
//         </div>
//         {!locationPermissionGranted && !buyerLocation && (
//           <div className="location-permission-request">
//             <div className="location-permission-icon">📍</div>
//             <h3 className="location-permission-title">Enable Location Access</h3>
//             <p className="location-permission-message">
//               Allow location access to discover products available for delivery in your area.
//             </p>
//             <button
//               className="location-permission-button"
//               onClick={requestLocationPermission}
//               aria-label="Enable Location"
//             >
//               Enable Location
//             </button>
//           </div>
//         )}
//         {loadingNearbyProducts && (
//           <div className="nearby-products-loading">
//             <div className="nearby-products-spinner"></div>
//             <span className="nearby-products-loading-text">Finding nearby products...</span>
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length === 0 && locationPermissionGranted && (
//           <div className="no-nearby-products">
//             <div className="no-nearby-products-icon">🚀</div>
//             <h3 className="no-nearby-products-title">We are coming soon in your location</h3>
//             <p className="no-nearby-products-message">
//               We're working hard to bring you amazing products in your area. Check back soon!
//             </p>
//             {nearbyProductsComingSoonToast()}
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length > 0 && (
//           <HomeProducts
//             products={nearbyProducts}
//             addToCart={addToCart}
//             buyNow={buyNow}
//           />
//         )}
//       </section>

//       {/* Global Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="flex flex-col bg-white shadow-md rounded-lg overflow-hidden h-full">
//                 <div className="w-full aspect-square bg-gray-200 animate-pulse rounded-md" />
//                 <div className="flex flex-col p-4 gap-2">
//                   <div className="h-5 bg-gray-200 rounded animate-pulse" />
//                   <div className="flex items-center gap-2">
//                     <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
//                     <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
//                   </div>
//                   <div className="flex gap-2 mt-auto">
//                     <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
//                     <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <HomeProducts
//             products={filteredProducts.slice(0, 4)}
//             addToCart={addToCart}
//             buyNow={buyNow}
//           />
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
// import { FaSearch, FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { Toaster } from 'react-hot-toast';
// import '../style/Home.css';
// import '../style/CursorAndNearbyProducts.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import HomeProducts from './HomeProducts'; // Reference to artifact 05de5614-3c49-4d2a-8b60-e9c1feb0db8a
// import {
//   infoToast,
//   successToast,
//   errorToast,
//   blueInfoToast,
//   authRequiredToast,
//   outOfStockToast,
//   invalidProductToast,
//   nearbyProductsComingSoonToast,
// } from '../utils/toastUtils';
// import {
//   fetchNearbyProducts as fetchNearbyProductsUtil,
//   getUserLocationWithFallback,
// } from '../utils/nearbyProducts';

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, productLoc) {
//   if (!userLoc || !productLoc || !productLoc.latitude || !productLoc.longitude || productLoc.latitude === 0 || productLoc.longitude === 0) {
//     console.log('Invalid location data:', { userLoc, productLoc });
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(productLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
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
//   const [nearbyProducts, setNearbyProducts] = useState([]);
//   const [loadingNearbyProducts, setLoadingNearbyProducts] = useState(false);
//   const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
//   const searchRef = useRef(null);

//   const DEFAULT_LOCATION = useMemo(() => ({ lat: 23.7407, lon: 86.4146 }), []);
//   const DEFAULT_DELIVERY_RADIUS = 50; // 50 km to match nearby products

//   // Debounced search handler (inline to fix ESLint warning)
//   const debouncedSetSearchTerm = useCallback(
//     (value) => {
//       let timeoutId;
//       clearTimeout(timeoutId);
//       timeoutId = setTimeout(() => setSearchTerm(value), 300);
//     },
//     [setSearchTerm]
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       errorToast('No internet connection. Please check your network.');
//       return false;
//     }
//     return true;
//   };

//   // Fetch exactly 4 global products
//   const fetchProducts = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select(`
//           id,
//           title,
//           name,
//           description,
//           category_id,
//           is_approved,
//           status,
//           images,
//           images_json,
//           price,
//           display_price,
//           sale_price,
//           original_price,
//           discount_amount,
//           stock,
//           latitude,
//           longitude,
//           specifications,
//           delivery_radius_km,
//           seller_id,
//           seller_name,
//           product_variants!inner(id, stock, price, status)
//         `)
//         .eq('status', 'active')
//         .eq('is_approved', true)
//         .order('created_at', { ascending: false })
//         .limit(4);

//       if (productsError) throw productsError;

//       const transformedProducts = productsData.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images || (product.images_json?.images || []),
//         offer_price: Number(product.display_price) || 0,
//         original_price: Number(product.original_price) || null,
//         discountAmount: Number(product.discount_amount) || 0,
//         stock: product.stock || 0,
//         categoryId: product.category_id,
//         sellerName: product.seller_name || 'Unknown Seller',
//         sellerId: product.seller_id,
//         variants: (product.product_variants || []).filter((v) => v.status === 'active'),
//         description: product.description,
//         specifications: product.specifications,
//         deliveryRadiusKm: product.delivery_radius_km,
//         latitude: product.latitude,
//         longitude: product.longitude,
//       }));

//       setProducts(transformedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Failed to fetch products:', err);
//       setError('Failed to load products. Please try again.');
//       setProducts([]);
//       errorToast('Failed to load products');
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, []);

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
//         .order('name')
//         .limit(20);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//       errorToast('Failed to load categories');
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || typeof buyerLocation.lat !== 'number' || typeof buyerLocation.lon !== 'number') {
//       setLoadingNearbyProducts(false);
//       return;
//     }
//     setLoadingNearbyProducts(true);
//     try {
//       const products = await fetchNearbyProductsUtil(buyerLocation.lat, buyerLocation.lon, null);
//       const safeProducts = Array.isArray(products) ? products.map((product) => ({
//         ...product,
//         offer_price: Number(product.displayPrice || product.price || 0),
//         original_price: Number(product.original_price) || null,
//       })) : [];
//       setNearbyProducts(safeProducts);
//       if (safeProducts.length === 0 && locationPermissionGranted) {
//         nearbyProductsComingSoonToast();
//       }
//     } catch (error) {
//       console.error('Error fetching nearby products:', error);
//       setNearbyProducts([]);
//       errorToast('Failed to load nearby products');
//     } finally {
//       setLoadingNearbyProducts(false);
//     }
//   }, [buyerLocation, locationPermissionGranted]);

//   // Request location permission
//   const requestLocationPermission = useCallback(async () => {
//     try {
//       const location = await getUserLocationWithFallback();
//       if (location) {
//         setBuyerLocation(location);
//         setLocationPermissionGranted(true);
//         blueInfoToast('Location permission granted! Showing nearby products.');
//       } else {
//         setBuyerLocation(DEFAULT_LOCATION);
//         blueInfoToast('Location permission denied. Using default location (Jharia, Dhanbad).');
//       }
//     } catch (error) {
//       console.error('Location permission error:', error);
//       setBuyerLocation(DEFAULT_LOCATION);
//       blueInfoToast('Could not access location. Using default location (Jharia, Dhanbad).');
//     }
//   }, [setBuyerLocation, DEFAULT_LOCATION]);

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
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//       errorToast('Failed to load banners');
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
//       infoToast('Selected variant is not available.');
//       return false;
//     }
//     return true;
//   };

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.offer_price === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('add items to cart');
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
//           infoToast('Please select this category from the categories page to add products to cart.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
//           successToast(`${product.name} quantity updated in cart!`);
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.offer_price,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.offer_price,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//           successToast(`${product.name} added to cart!`);
//         }
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.offer_price === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('proceed to checkout');
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
//           infoToast('Please select this category from the categories page to proceed.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.offer_price,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.offer_price,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//         }

//         successToast('Added to cart! Redirecting to cart...');
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
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
//       .slice(0, 5)
//       .map((product) => ({
//         ...product,
//         offer_price: product.displayPrice,
//         original_price: product.displayOriginalPrice,
//       }));
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
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Initial data fetch
//   useEffect(() => {
//     fetchBannerImages();
//     fetchCategories();
//     fetchProducts();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
//             setBuyerLocation(newLocation);
//             setLocationPermissionGranted(true);
//           },
//           (error) => {
//             let errorMessage = 'Unable to fetch location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information unavailable.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out.';
//             }
//             errorToast(`${errorMessage} Using default location (Jharia, Dhanbad).`);
//             setBuyerLocation(DEFAULT_LOCATION);
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         blueInfoToast('Geolocation not supported. Using default location (Jharia, Dhanbad).');
//         setBuyerLocation(DEFAULT_LOCATION);
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fetchBannerImages, fetchCategories, fetchProducts, setBuyerLocation, DEFAULT_LOCATION]);

//   // Fetch nearby products when location changes
//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

//   // Filter products for search
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => ({
//       ...p,
//       offer_price: p.displayPrice,
//       original_price: p.displayOriginalPrice,
//     }));
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

//   // Show loading state for all sections
//   if (loadingProducts && loadingBanners && loadingCategories) {
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
//   }

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
//                   navigate(`/product/${suggestion.id}`);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') {
//                     setSearchTerm(suggestion.name);
//                     setIsSearchFocused(false);
//                     setSuggestions([]);
//                     navigate(`/product/${suggestion.id}`);
//                   }
//                 }}
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

//       {/* Nearby Products Section */}
//       <section className="nearby-products-section">
//         <div className="nearby-products-header">
//           <span className="nearby-products-icon">📍</span>
//           <h2 className="nearby-products-title">Products Near You</h2>
//         </div>
//         {!locationPermissionGranted && !buyerLocation && (
//           <div className="location-permission-request">
//             <div className="location-permission-icon">📍</div>
//             <h3 className="location-permission-title">Enable Location Access</h3>
//             <p className="location-permission-message">
//               Allow location access to discover products available for delivery in your area.
//             </p>
//             <button
//               className="location-permission-button"
//               onClick={requestLocationPermission}
//               aria-label="Enable Location"
//             >
//               Enable Location
//             </button>
//           </div>
//         )}
//         {loadingNearbyProducts && (
//           <div className="nearby-products-loading">
//             <div className="nearby-products-spinner"></div>
//             <span className="nearby-products-loading-text">Finding nearby products...</span>
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length === 0 && locationPermissionGranted && (
//           <div className="no-nearby-products">
//             <div className="no-nearby-products-icon">🚀</div>
//             <h3 className="no-nearby-products-title">We are coming soon in your location</h3>
//             <p className="no-nearby-products-message">
//               We're working hard to bring you amazing products in your area. Check back soon!
//             </p>
//             {nearbyProductsComingSoonToast()}
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length > 0 && (
//           <HomeProducts
//             products={nearbyProducts}
//             addToCart={addToCart}
//             buyNow={buyNow}
//           />
//         )}
//       </section>

//       {/* Global Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="flex flex-col bg-white shadow-md rounded-lg overflow-hidden h-full animate-pulse">
//                 <div className="w-full aspect-square bg-gray-200 rounded-md" />
//                 <div className="flex flex-col p-4 gap-2">
//                   <div className="h-5 bg-gray-200 rounded w-3/4" />
//                   <div className="flex items-center gap-2">
//                     <div className="h-4 bg-gray-200 rounded w-16" />
//                     <div className="h-4 bg-gray-200 rounded w-12" />
//                   </div>
//                   <div className="flex gap-2 mt-auto">
//                     <div className="flex-1 h-8 bg-gray-200 rounded" />
//                     <div className="flex-1 h-8 bg-gray-200 rounded" />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <HomeProducts
//             products={filteredProducts.slice(0, 4)}
//             addToCart={addToCart}
//             buyNow={buyNow}
//           />
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
// import { FaSearch, FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { Toaster } from 'react-hot-toast';
// import '../style/Home.css';
// import '../style/CursorAndNearbyProducts.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import HomeProducts from './HomeProducts';
// import {
//   infoToast,
//   successToast,
//   errorToast,
//   blueInfoToast,
//   authRequiredToast,
//   outOfStockToast,
//   invalidProductToast,
//   nearbyProductsComingSoonToast,
// } from '../utils/toastUtils';
// import {
//   fetchNearbyProducts as fetchNearbyProductsUtil,
//   getUserLocationWithFallback,
// } from '../utils/nearbyProducts';

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, productLoc) {
//   if (!userLoc || !productLoc || !productLoc.latitude || !productLoc.longitude || productLoc.latitude === 0 || productLoc.longitude === 0) {
//     console.log('Invalid location data:', { userLoc, productLoc });
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(productLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
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
//   const [nearbyProducts, setNearbyProducts] = useState([]);
//   const [loadingNearbyProducts, setLoadingNearbyProducts] = useState(false);
//   const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
//   const searchRef = useRef(null);

//   const DEFAULT_LOCATION = useMemo(() => ({ lat: 23.7407, lon: 86.4146 }), []);
//   const DEFAULT_DELIVERY_RADIUS = 50; // 50 km to match nearby products

//   // Debounced search handler (inline to fix ESLint warning)
//   const debouncedSetSearchTerm = useCallback(
//     (value) => {
//       let timeoutId;
//       clearTimeout(timeoutId);
//       timeoutId = setTimeout(() => setSearchTerm(value), 300);
//     },
//     [setSearchTerm]
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       errorToast('No internet connection. Please check your network.');
//       return false;
//     }
//     return true;
//   };

//   // Fetch exactly 4 global products
//   const fetchProducts = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select(`
//           id,
//           title,
//           name,
//           description,
//           category_id,
//           is_approved,
//           status,
//           images,
//           images_json,
//           price,
//           display_price,
//           sale_price,
//           original_price,
//           discount_amount,
//           stock,
//           latitude,
//           longitude,
//           specifications,
//           delivery_radius_km,
//           seller_id,
//           seller_name,
//           product_variants!inner(id, stock, price, status)
//         `)
//         .eq('status', 'active')
//         .eq('is_approved', true)
//         .order('created_at', { ascending: false })
//         .limit(4);

//       if (productsError) throw productsError;

//       const transformedProducts = productsData.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images || (product.images_json?.images || []),
//         offer_price: Number(product.display_price) || 0,
//         original_price: Number(product.original_price) || null,
//         discountAmount: Number(product.discount_amount) || 0,
//         stock: product.stock || 0,
//         categoryId: product.category_id,
//         sellerName: product.seller_name || 'Unknown Seller',
//         sellerId: product.seller_id,
//         variants: (product.product_variants || []).filter((v) => v.status === 'active'),
//         description: product.description,
//         specifications: product.specifications,
//         deliveryRadiusKm: product.delivery_radius_km,
//         latitude: product.latitude,
//         longitude: product.longitude,
//       }));

//       setProducts(transformedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Failed to fetch products:', err);
//       setError('Failed to load products. Please try again.');
//       setProducts([]);
//       errorToast('Failed to load products');
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, []);

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
//         .order('name')
//         .limit(20);
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//       errorToast('Failed to load categories');
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || typeof buyerLocation.lat !== 'number' || typeof buyerLocation.lon !== 'number') {
//       setLoadingNearbyProducts(false);
//       return;
//     }
//     setLoadingNearbyProducts(true);
//     try {
//       const products = await fetchNearbyProductsUtil(buyerLocation.lat, buyerLocation.lon, null);
//       const safeProducts = Array.isArray(products) ? products.map((product) => ({
//         ...product,
//         offer_price: Number(product.displayPrice || product.price || 0),
//         original_price: Number(product.original_price) || null,
//       })) : [];
//       setNearbyProducts(safeProducts);
//       if (safeProducts.length === 0 && locationPermissionGranted) {
//         nearbyProductsComingSoonToast();
//       }
//     } catch (error) {
//       console.error('Error fetching nearby products:', error);
//       setNearbyProducts([]);
//       errorToast('Failed to load nearby products');
//     } finally {
//       setLoadingNearbyProducts(false);
//     }
//   }, [buyerLocation, locationPermissionGranted]);

//   // Request location permission
//   const requestLocationPermission = useCallback(async () => {
//     try {
//       const location = await getUserLocationWithFallback();
//       if (location) {
//         setBuyerLocation(location);
//         setLocationPermissionGranted(true);
//         blueInfoToast('Location permission granted! Showing nearby products.');
//       } else {
//         setBuyerLocation(DEFAULT_LOCATION);
//         blueInfoToast('Location permission denied. Using default location (Jharia, Dhanbad).');
//       }
//     } catch (error) {
//       console.error('Location permission error:', error);
//       setBuyerLocation(DEFAULT_LOCATION);
//       blueInfoToast('Could not access location. Using default location (Jharia, Dhanbad).');
//     }
//   }, [setBuyerLocation, DEFAULT_LOCATION]);

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
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//       errorToast('Failed to load banners');
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
//       infoToast('Selected variant is not available.');
//       return false;
//     }
//     return true;
//   };

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.offer_price === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('add items to cart');
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
//           infoToast('Please select this category from the categories page to add products to cart.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
//           successToast(`${product.name} quantity updated in cart!`);
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.offer_price,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.offer_price,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//           successToast(`${product.name} added to cart!`);
//         }
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.offer_price === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('proceed to checkout');
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
//           infoToast('Please select this category from the categories page to proceed.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.offer_price,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.offer_price,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//         }

//         successToast('Added to cart! Redirecting to cart...');
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
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
//       .slice(0, 5)
//       .map((product) => ({
//         ...product,
//         offer_price: product.displayPrice,
//         original_price: product.displayOriginalPrice,
//       }));
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
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Initial data fetch
//   useEffect(() => {
//     fetchBannerImages();
//     fetchCategories();
//     fetchProducts();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
//             setBuyerLocation(newLocation);
//             setLocationPermissionGranted(true);
//           },
//           (error) => {
//             let errorMessage = 'Unable to fetch location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information unavailable.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out.';
//             }
//             errorToast(`${errorMessage} Using default location (Jharia, Dhanbad).`);
//             setBuyerLocation(DEFAULT_LOCATION);
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         blueInfoToast('Geolocation not supported. Using default location (Jharia, Dhanbad).');
//         setBuyerLocation(DEFAULT_LOCATION);
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fetchBannerImages, fetchCategories, fetchProducts, setBuyerLocation, DEFAULT_LOCATION]);

//   // Fetch nearby products when location changes
//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

//   // Filter products for search
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => ({
//       ...p,
//       offer_price: p.displayPrice,
//       original_price: p.displayOriginalPrice,
//     }));
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

//   // Show loading state for all sections
//   if (loadingProducts && loadingBanners && loadingCategories) {
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
//   }

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
//                   navigate(`/product/${suggestion.id}`);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') {
//                     setSearchTerm(suggestion.name);
//                     setIsSearchFocused(false);
//                     setSuggestions([]);
//                     navigate(`/product/${suggestion.id}`);
//                   }
//                 }}
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

//       {/* Nearby Products Section */}
//       <section className="nearby-products-section">
//         <div className="nearby-products-header">
//           <span className="nearby-products-icon">📍</span>
//           <h2 className="nearby-products-title">Products Near You</h2>
//         </div>
//         {!locationPermissionGranted && !buyerLocation && (
//           <div className="location-permission-request">
//             <div className="location-permission-icon">📍</div>
//             <h3 className="location-permission-title">Enable Location Access</h3>
//             <p className="location-permission-message">
//               Allow location access to discover products available for delivery in your area.
//             </p>
//             <button
//               className="location-permission-button"
//               onClick={requestLocationPermission}
//               aria-label="Enable Location"
//             >
//               Enable Location
//             </button>
//           </div>
//         )}
//         {loadingNearbyProducts && (
//           <div className="nearby-products-loading">
//             <div className="nearby-products-spinner"></div>
//             <span className="nearby-products-loading-text">Finding nearby products...</span>
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length === 0 && locationPermissionGranted && (
//           <div className="no-nearby-products">
//             <div className="no-nearby-products-icon">🚀</div>
//             <h3 className="no-nearby-products-title">We are coming soon in your location</h3>
//             <p className="no-nearby-products-message">
//               We're working hard to bring you amazing products in your area. Check back soon!
//             </p>
//             {nearbyProductsComingSoonToast()}
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length > 0 && (
//           <HomeProducts
//             products={nearbyProducts}
//             addToCart={addToCart}
//             buyNow={buyNow}
//           />
//         )}
//       </section>

//       {/* Global Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="hp-products-container">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="hp-product-card hp-product-card-skeleton">
//                 <div className="hp-image-container">
//                   <div className="hp-product-image hp-skeleton"></div>
//                 </div>
//                 <div className="hp-product-info">
//                   <div className="hp-product-name hp-skeleton"></div>
//                   <div className="hp-price-container">
//                     <div className="hp-offer-price hp-skeleton"></div>
//                     <div className="hp-original-price hp-skeleton"></div>
//                   </div>
//                   <div className="hp-button-container">
//                     <div className="hp-button hp-skeleton"></div>
//                     <div className="hp-button hp-skeleton"></div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <HomeProducts
//             products={filteredProducts.slice(0, 4)}
//             addToCart={addToCart}
//             buyNow={buyNow}
//           />
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
// import { FaSearch, FaShoppingCart } from 'react-icons/fa';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';
// import { Toaster } from 'react-hot-toast';
// import '../style/Home.css';
// import '../style/CursorAndNearbyProducts.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import HomeProducts from './HomeProducts';
// import {
//   infoToast,
//   successToast,
//   errorToast,
//   blueInfoToast,
//   authRequiredToast,
//   outOfStockToast,
//   invalidProductToast,
//   nearbyProductsComingSoonToast,
// } from '../utils/toastUtils';
// import {
//   fetchNearbyProducts as fetchNearbyProductsUtil,
//   getUserLocationWithFallback,
// } from '../utils/nearbyProducts';

// // Distance calculation using Haversine formula
// function calculateDistance(userLoc, productLoc) {
//   if (!userLoc || !productLoc || !productLoc.latitude || !productLoc.longitude || productLoc.latitude === 0 || productLoc.longitude === 0) {
//     console.log('Invalid location data:', { userLoc, productLoc });
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const latDiff = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(productLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
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
//   const [nearbyProducts, setNearbyProducts] = useState([]);
//   const [loadingNearbyProducts, setLoadingNearbyProducts] = useState(false);
//   const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
//   const searchRef = useRef(null);

//   const DEFAULT_LOCATION = useMemo(() => ({ lat: 23.7407, lon: 86.4146 }), []);
//   const DEFAULT_DELIVERY_RADIUS = 50;

//   // Debounced search handler
//   const debouncedSetSearchTerm = useCallback(
//     (value) => {
//       let timeoutId;
//       clearTimeout(timeoutId);
//       timeoutId = setTimeout(() => setSearchTerm(value), 300);
//     },
//     []
//   );

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       errorToast('No internet connection. Please check your network.');
//       return false;
//     }
//     return true;
//   };

//   // Fetch exactly 4 global products
//   const fetchProducts = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingProducts(false);
//       setProducts([]);
//       return;
//     }
//     setLoadingProducts(true);
//     try {
//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select(`
//           id,
//           title,
//           name,
//           description,
//           category_id,
//           is_approved,
//           status,
//           images,
//           images_json,
//           price,
//           display_price,
//           sale_price,
//           original_price,
//           discount_amount,
//           stock,
//           latitude,
//           longitude,
//           specifications,
//           delivery_radius_km,
//           seller_id,
//           seller_name,
//           product_variants!inner(id, stock, price, status)
//         `)
//         .eq('status', 'active')
//         .eq('is_approved', true)
//         .order('created_at', { ascending: false })
//         .limit(4);

//       if (productsError) throw productsError;

//       const transformedProducts = Array.isArray(productsData)
//         ? productsData.map((product) => ({
//             id: product.id,
//             name: product.title || product.name || 'Unnamed Product',
//             images: product.images || (product.images_json?.images || []),
//             offer_price: Number(product.display_price) || 0,
//             original_price: Number(product.original_price) || null,
//             discountAmount: Number(product.discount_amount) || 0,
//             stock: product.stock || 0,
//             categoryId: product.category_id,
//             sellerName: product.seller_name || 'Unknown Seller',
//             sellerId: product.seller_id,
//             variants: (product.product_variants || []).filter((v) => v.status === 'active'),
//             description: product.description,
//             specifications: product.specifications,
//             deliveryRadiusKm: product.delivery_radius_km,
//             latitude: product.latitude,
//             longitude: product.longitude,
//           }))
//         : [];
//       setProducts(transformedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Failed to fetch products:', err);
//       setError('Failed to load products. Please try again.');
//       setProducts([]);
//       errorToast('Failed to load products');
//     } finally {
//       setLoadingProducts(false);
//     }
//   }, []);

//   // Fetch categories
//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoadingCategories(false);
//       setCategories([]);
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
//       setCategories(Array.isArray(data) ? data : []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load categories. Please try again.');
//       setCategories([]);
//       errorToast('Failed to load categories');
//     } finally {
//       setLoadingCategories(false);
//     }
//   }, []);

//   // Fetch nearby products
//   const fetchNearbyProducts = useCallback(async () => {
//     if (!buyerLocation || typeof buyerLocation.lat !== 'number' || typeof buyerLocation.lon !== 'number') {
//       setLoadingNearbyProducts(false);
//       setNearbyProducts([]);
//       return;
//     }
//     setLoadingNearbyProducts(true);
//     try {
//       const products = await fetchNearbyProductsUtil(buyerLocation.lat, buyerLocation.lon, null);
//       const safeProducts = Array.isArray(products)
//         ? products.map((product) => ({
//             ...product,
//             offer_price: Number(product.display_price || product.price || 0),
//             original_price: Number(product.original_price) || null,
//             name: product.title || product.name || 'Unnamed Product',
//             images: product.images || (product.images_json?.images || []),
//             stock: product.stock || 0,
//             categoryId: product.category_id,
//             sellerName: product.seller_name || 'Unknown Seller',
//             sellerId: product.seller_id,
//             variants: (product.product_variants || []).filter((v) => v.status === 'active'),
//             description: product.description,
//             specifications: product.specifications,
//             deliveryRadiusKm: product.delivery_radius_km,
//             latitude: product.latitude,
//             longitude: product.longitude,
//           }))
//         : [];
//       setNearbyProducts(safeProducts);
//       if (safeProducts.length === 0 && locationPermissionGranted) {
//         nearbyProductsComingSoonToast();
//       }
//     } catch (error) {
//       console.error('Error fetching nearby products:', error);
//       setNearbyProducts([]);
//       errorToast('Failed to load nearby products');
//     } finally {
//       setLoadingNearbyProducts(false);
//     }
//   }, [buyerLocation, locationPermissionGranted]);

//   // Request location permission
//   const requestLocationPermission = useCallback(async () => {
//     try {
//       const location = await getUserLocationWithFallback();
//       if (location) {
//         setBuyerLocation(location);
//         setLocationPermissionGranted(true);
//         blueInfoToast('Location permission granted! Showing nearby products.');
//       } else {
//         setBuyerLocation(DEFAULT_LOCATION);
//         blueInfoToast('Location permission denied. Using default location (Jharia, Dhanbad).');
//       }
//     } catch (error) {
//       console.error('Location permission error:', error);
//       setBuyerLocation(DEFAULT_LOCATION);
//       blueInfoToast('Could not access location. Using default location (Jharia, Dhanbad).');
//     }
//   }, [setBuyerLocation, DEFAULT_LOCATION]);

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
//       setBannerImages([{ url: 'https://dummyimage.com/1200x300', name: 'default' }]);
//       errorToast('Failed to load banners');
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
//       infoToast('Selected variant is not available.');
//       return false;
//     }
//     return true;
//   };

//   // Add to cart
//   const addToCart = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.offer_price === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('add items to cart');
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
//           infoToast('Please select this category from the categories page to add products to cart.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants?.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
//           successToast(`${product.name} quantity updated in cart!`);
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.offer_price,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.offer_price,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//           successToast(`${product.name} added to cart!`);
//         }
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
//       }
//     },
//     [navigate, session, setCartCount, buyerLocation]
//   );

//   // Buy now
//   const buyNow = useCallback(
//     async (product) => {
//       if (!product || !product.id || !product.name || product.offer_price === undefined) {
//         invalidProductToast();
//         return;
//       }
//       if (product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//         outOfStockToast();
//         return;
//       }
//       if (!session?.user) {
//         authRequiredToast('proceed to checkout');
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
//           infoToast('Please select this category from the categories page to proceed.');
//           navigate('/categories');
//           return;
//         }

//         const { data: productData, error: productError } = await supabase
//           .from('products')
//           .select('id, delivery_radius_km, category_id, latitude, longitude')
//           .eq('id', product.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .single();
//         if (productError || !productData) {
//           errorToast('Product is not available.');
//           return;
//         }

//         if (buyerLocation && productData.latitude && productData.longitude) {
//           const distance = calculateDistance(buyerLocation, {
//             latitude: productData.latitude,
//             longitude: productData.longitude,
//           });
//           if (distance === null) {
//             errorToast('Unable to calculate distance to product.');
//             return;
//           }

//           let effectiveRadius = productData.delivery_radius_km;
//           if (!effectiveRadius) {
//             const { data: categoryData, error: categoryError } = await supabase
//               .from('categories')
//               .select('max_delivery_radius_km')
//               .eq('id', productData.category_id)
//               .single();
//             if (categoryError) throw categoryError;
//             effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//           }

//           if (distance > effectiveRadius) {
//             errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
//             return;
//           }
//         }

//         let itemToAdd = product;
//         let variantId = null;

//         if (product.variants?.length > 0) {
//           const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//           if (validVariants.length === 0) {
//             errorToast('No available variants in stock.');
//             return;
//           }
//           itemToAdd = validVariants.reduce((cheapest, variant) =>
//             variant.price < cheapest.price ? variant : cheapest
//           );
//           variantId = itemToAdd.id;

//           const isValidVariant = await validateVariant(variantId);
//           if (!isValidVariant) return;
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
//           throw new Error(fetchError.message || 'Failed to check cart');
//         }

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           const stockLimit = itemToAdd.stock || product.stock;
//           if (newQuantity > stockLimit) {
//             errorToast('Exceeds stock.');
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ quantity: newQuantity })
//             .eq('id', existingCartItem.id);
//           if (updateError) throw new Error(updateError.message || 'Failed to update cart');
//         } else {
//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: session.user.id,
//               product_id: product.id,
//               variant_id: variantId,
//               quantity: 1,
//               price: itemToAdd.price || product.offer_price,
//               title: product.name,
//             })
//             .select('id')
//             .single();
//           if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
//           setCartCount((prev) => prev + 1);
//           const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//           storedCart.push({
//             id: product.id,
//             cartId: data.id,
//             quantity: 1,
//             variantId,
//             price: itemToAdd.price || product.offer_price,
//             title: product.name,
//             images: product.images,
//             uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//           });
//           localStorage.setItem('cart', JSON.stringify(storedCart));
//         }

//         successToast('Added to cart! Redirecting to cart...');
//         setTimeout(() => navigate('/cart'), 2000);
//       } catch (err) {
//         errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
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
//     const filteredSuggestions = Array.isArray(products)
//       ? products
//           .filter((product) => product.name?.toLowerCase().includes(searchTerm.toLowerCase()))
//           .slice(0, 5)
//           .map((product) => ({
//             ...product,
//             offer_price: product.offer_price,
//             original_price: product.original_price,
//           }))
//       : [];
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, products, isSearchFocused]);

//   // Filter products for search
//   const filteredProducts = useMemo(() => {
//     if (!Array.isArray(products)) return [];
//     if (!searchTerm) return products;
//     return products.filter((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => ({
//       ...p,
//       offer_price: p.offer_price,
//       original_price: p.original_price,
//     }));
//   }, [products, searchTerm]);

//   // Handle clicks outside the search bar
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

//   // Initial data fetch
//   useEffect(() => {
//     fetchBannerImages();
//     fetchCategories();
//     fetchProducts();

//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
//             setBuyerLocation(newLocation);
//             setLocationPermissionGranted(true);
//           },
//           (error) => {
//             let errorMessage = 'Unable to fetch location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information unavailable.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out.';
//             }
//             errorToast(`${errorMessage} Using default location (Jharia, Dhanbad).`);
//             setBuyerLocation(DEFAULT_LOCATION);
//           },
//           { timeout: 10000, enableHighAccuracy: true }
//         );
//       } else {
//         blueInfoToast('Geolocation not supported. Using default location (Jharia, Dhanbad).');
//         setBuyerLocation(DEFAULT_LOCATION);
//       }
//     }
//   }, [fetchBannerImages, fetchCategories, fetchProducts, setBuyerLocation, DEFAULT_LOCATION]);

//   // Fetch nearby products when location changes
//   useEffect(() => {
//     if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
//       fetchNearbyProducts();
//     }
//   }, [buyerLocation, fetchNearbyProducts]);

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

//   // Show loading state for all sections
//   if (loadingProducts && loadingBanners && loadingCategories) {
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
//   }

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
//         <meta property="og:image" content={products[0]?.images?.[0] || 'https://dummyimage.com/1200x300'} />
//         <meta property="og:url" content="https://www.markeet.com/" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Markeet - Shop Electronics, Fashion, Jewellery & More" />
//         <meta
//           name="twitter:description"
//           content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
//         />
//         <meta name="twitter:image" content={products[0]?.images?.[0] || 'https://dummyimage.com/1200x300'} />
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
//                   navigate(`/product/${suggestion.id}`);
//                 }}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') {
//                     setSearchTerm(suggestion.name);
//                     setIsSearchFocused(false);
//                     setSuggestions([]);
//                     navigate(`/product/${suggestion.id}`);
//                   }
//                 }}
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

//       {/* Nearby Products Section */}
//       <section className="nearby-products-section">
//         <div className="nearby-products-header">
//           <span className="nearby-products-icon">📍</span>
//           <h2 className="nearby-products-title">Products Near You</h2>
//         </div>
//         {!locationPermissionGranted && !buyerLocation && (
//           <div className="location-permission-request">
//             <div className="location-permission-icon">📍</div>
//             <h3 className="location-permission-title">Enable Location Access</h3>
//             <p className="location-permission-message">
//               Allow location access to discover products available for delivery in your area.
//             </p>
//             <button
//               className="location-permission-button"
//               onClick={requestLocationPermission}
//               aria-label="Enable Location"
//             >
//               Enable Location
//             </button>
//           </div>
//         )}
//         {loadingNearbyProducts && (
//           <div className="nearby-products-loading">
//             <div className="nearby-products-spinner"></div>
//             <span className="nearby-products-loading-text">Finding nearby products...</span>
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length === 0 && locationPermissionGranted && (
//           <div className="no-nearby-products">
//             <div className="no-nearby-products-icon">🚀</div>
//             <h3 className="no-nearby-products-title">We are coming soon in your location</h3>
//             <p className="no-nearby-products-message">
//               We're working hard to bring you amazing products in your area. Check back soon!
//             </p>
//           </div>
//         )}
//         {!loadingNearbyProducts && nearbyProducts.length > 0 && (
//           <HomeProducts
//             products={nearbyProducts}
//             addToCart={addToCart}
//             buyNow={buyNow}
//           />
//         )}
//       </section>

//       {/* Global Products Section */}
//       <section className="td-products-section">
//         <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
//         {loadingProducts ? (
//           <div className="hp-products-container">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="hp-product-card hp-product-card-skeleton">
//                 <div className="hp-image-container">
//                   <div className="hp-product-image hp-skeleton"></div>
//                 </div>
//                 <div className="hp-product-info">
//                   <div className="hp-product-name hp-skeleton"></div>
//                   <div className="hp-price-container">
//                     <div className="hp-offer-price hp-skeleton"></div>
//                     <div className="hp-original-price hp-skeleton"></div>
//                   </div>
//                   <div className="hp-button-container">
//                     <div className="hp-button hp-skeleton"></div>
//                     <div className="hp-button hp-skeleton"></div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <HomeProducts
//             products={filteredProducts.slice(0, 4)}
//             addToCart={addToCart}
//             buyNow={buyNow}
//           />
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
import { FaSearch, FaShoppingCart } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';
import { Toaster } from 'react-hot-toast';
import '../style/Home.css';
import '../style/CursorAndNearbyProducts.css';
import Footer from './Footer';
import { Helmet } from 'react-helmet-async';
import HomeProducts from './HomeProducts';
import {
  infoToast,
  successToast,
  errorToast,
  blueInfoToast,
  authRequiredToast,
  outOfStockToast,
  invalidProductToast,
  nearbyProductsComingSoonToast,
} from '../utils/toastUtils';
import {
  fetchNearbyProducts as fetchNearbyProductsUtil,
  getUserLocationWithFallback,
} from '../utils/nearbyProducts';
import {
  DEFAULT_LOCATION,
  DEFAULT_DELIVERY_RADIUS,
  DEFAULT_BANNER_IMAGE,
  DEFAULT_CATEGORY_IMAGE,
  CURRENCY_SYMBOL,
  TABLE_NAMES,
  STATUS_ACTIVE,
  MAX_PRODUCTS_HOME,
  MAX_CATEGORIES_HOME,
  MAX_BANNERS,
  MAX_SEARCH_SUGGESTIONS,
  SEARCH_DEBOUNCE_DELAY,
  GEOLOCATION_TIMEOUT,
  ROUTES,
  TOAST_DURATION,
} from '../utils/constants';

// Distance calculation using Haversine formula
function calculateDistance(userLoc, productLoc) {
  if (!userLoc || !productLoc || !productLoc.latitude || !productLoc.longitude || productLoc.latitude === 0 || productLoc.longitude === 0) {
    console.log('Invalid location data:', { userLoc, productLoc });
    return null;
  }
  const R = 6371; // Earth's radius in km
  const latDiff = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
  const lonDiff = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(productLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
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
  const [nearbyProducts, setNearbyProducts] = useState([]);
  const [loadingNearbyProducts, setLoadingNearbyProducts] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const searchRef = useRef(null);

  // Debounced search handler
  const debouncedSetSearchTerm = useCallback(
    (value) => {
      let timeoutId;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setSearchTerm(value), SEARCH_DEBOUNCE_DELAY);
    },
    []
  );

  // Check network connectivity
  const checkNetworkStatus = () => {
    if (!navigator.onLine) {
      errorToast('No internet connection. Please check your network.');
      return false;
    }
    return true;
  };

  // Fetch exactly 4 global products
  const fetchProducts = useCallback(async () => {
    if (!checkNetworkStatus()) {
      setLoadingProducts(false);
      setProducts([]);
      return;
    }
    setLoadingProducts(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from(TABLE_NAMES.PRODUCTS)
        .select(`
          id,
          title,
          name,
          description,
          category_id,
          is_approved,
          status,
          images,
          images_json,
          price,
          display_price,
          sale_price,
          original_price,
          discount_amount,
          stock,
          latitude,
          longitude,
          specifications,
          delivery_radius_km,
          seller_id,
          seller_name,
          product_variants!inner(id, stock, price, status)
        `)
        .eq('status', STATUS_ACTIVE)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(MAX_PRODUCTS_HOME);

      if (productsError) throw productsError;

      const transformedProducts = Array.isArray(productsData)
        ? productsData.map((product) => ({
            id: product.id,
            name: product.title || product.name || 'Unnamed Product',
            images: product.images || (product.images_json?.images || []),
            offer_price: Number(product.display_price) || 0,
            original_price: Number(product.original_price) || null,
            discountAmount: Number(product.discount_amount) || 0,
            stock: product.stock || 0,
            categoryId: product.category_id,
            sellerName: product.seller_name || 'Unknown Seller',
            sellerId: product.seller_id,
            variants: (product.product_variants || []).filter((v) => v.status === STATUS_ACTIVE),
            description: product.description,
            specifications: product.specifications,
            deliveryRadiusKm: product.delivery_radius_km,
            latitude: product.latitude,
            longitude: product.longitude,
          }))
        : [];
      setProducts(transformedProducts);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
      errorToast('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!checkNetworkStatus()) {
      setLoadingCategories(false);
      setCategories([]);
      return;
    }
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_NAMES.CATEGORIES)
        .select('id, name, image_url, is_restricted')
        .order('name')
        .limit(MAX_CATEGORIES_HOME);
      if (error) throw error;
      setCategories(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to load categories. Please try again.');
      setCategories([]);
      errorToast('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch nearby products
  const fetchNearbyProducts = useCallback(async () => {
    if (!buyerLocation || typeof buyerLocation.lat !== 'number' || typeof buyerLocation.lon !== 'number') {
      setLoadingNearbyProducts(false);
      setNearbyProducts([]);
      return;
    }
    setLoadingNearbyProducts(true);
    try {
      const products = await fetchNearbyProductsUtil(buyerLocation.lat, buyerLocation.lon, null);
      const safeProducts = Array.isArray(products)
        ? products.map((product) => ({
            ...product,
            offer_price: Number(product.display_price || product.price || 0),
            original_price: Number(product.original_price) || null,
            name: product.title || product.name || 'Unnamed Product',
            images: product.images || (product.images_json?.images || []),
            stock: product.stock || 0,
            categoryId: product.category_id,
            sellerName: product.seller_name || 'Unknown Seller',
            sellerId: product.seller_id,
            variants: (product.product_variants || []).filter((v) => v.status === STATUS_ACTIVE),
            description: product.description,
            specifications: product.specifications,
            deliveryRadiusKm: product.delivery_radius_km,
            latitude: product.latitude,
            longitude: product.longitude,
          }))
        : [];
      setNearbyProducts(safeProducts);
      if (safeProducts.length === 0 && locationPermissionGranted) {
        nearbyProductsComingSoonToast();
      }
    } catch (error) {
      console.error('Error fetching nearby products:', error);
      setNearbyProducts([]);
      errorToast('Failed to load nearby products');
    } finally {
      setLoadingNearbyProducts(false);
    }
  }, [buyerLocation, locationPermissionGranted]);

  // Request location permission
  const requestLocationPermission = useCallback(async () => {
    try {
      const location = await getUserLocationWithFallback();
      if (location) {
        setBuyerLocation(location);
        setLocationPermissionGranted(true);
        blueInfoToast('Location permission granted! Showing nearby products.');
      } else {
        setBuyerLocation(DEFAULT_LOCATION);
        blueInfoToast('Location permission denied. Using default location (Jharia, Dhanbad).');
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setBuyerLocation(DEFAULT_LOCATION);
      blueInfoToast('Could not access location. Using default location (Jharia, Dhanbad).');
    }
  }, [setBuyerLocation]);

  // Fetch banner images
  const fetchBannerImages = useCallback(async () => {
    if (!checkNetworkStatus()) {
      setLoadingBanners(false);
      return;
    }
    setLoadingBanners(true);
    try {
      const { data } = await supabase.storage.from('banner-images').list('', { limit: MAX_BANNERS });
      const banners = await Promise.all(
        data
          .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
          .map(async (file) => {
            const { data: { publicUrl } } = await supabase.storage.from('banner-images').getPublicUrl(file.name);
            return { url: publicUrl, name: file.name };
          })
      );
      setBannerImages(banners.length > 0 ? banners : [{ url: DEFAULT_BANNER_IMAGE, name: 'default' }]);
    } catch (err) {
      setBannerImages([{ url: DEFAULT_BANNER_IMAGE, name: 'default' }]);
      errorToast('Failed to load banners');
    } finally {
      setLoadingBanners(false);
    }
  }, []);

  // Validate variant ID
  const validateVariant = async (variantId) => {
    if (!variantId) return true;
    const { data, error } = await supabase
      .from(TABLE_NAMES.PRODUCT_VARIANTS)
      .select('id')
      .eq('id', variantId)
      .eq('status', STATUS_ACTIVE)
      .single();
    if (error || !data) {
      infoToast('Selected variant is not available.');
      return false;
    }
    return true;
  };

  // Add to cart
  const addToCart = useCallback(
    async (product) => {
      if (!product || !product.id || !product.name || product.offer_price === undefined) {
        invalidProductToast();
        return;
      }
      if (product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0))) {
        outOfStockToast();
        return;
      }
      if (!session?.user) {
        authRequiredToast('add items to cart');
        navigate(ROUTES.AUTH);
        return;
      }
      if (!checkNetworkStatus()) return;

      try {
        const { data: categoryData, error: categoryError } = await supabase
          .from(TABLE_NAMES.CATEGORIES)
          .select('is_restricted')
          .eq('id', product.categoryId)
          .single();
        if (categoryError) throw categoryError;
        if (categoryData?.is_restricted) {
          infoToast('Please select this category from the categories page to add products to cart.');
          navigate(ROUTES.CATEGORIES);
          return;
        }

        const { data: productData, error: productError } = await supabase
          .from(TABLE_NAMES.PRODUCTS)
          .select('id, delivery_radius_km, category_id, latitude, longitude')
          .eq('id', product.id)
          .eq('is_approved', true)
          .eq('status', STATUS_ACTIVE)
          .single();
        if (productError || !productData) {
          errorToast('Product is not available.');
          return;
        }

        if (buyerLocation && productData.latitude && productData.longitude) {
          const distance = calculateDistance(buyerLocation, {
            latitude: productData.latitude,
            longitude: productData.longitude,
          });
          if (distance === null) {
            errorToast('Unable to calculate distance to product.');
            return;
          }

          let effectiveRadius = productData.delivery_radius_km;
          if (!effectiveRadius) {
            const { data: categoryData, error: categoryError } = await supabase
              .from(TABLE_NAMES.CATEGORIES)
              .select('max_delivery_radius_km')
              .eq('id', productData.category_id)
              .single();
            if (categoryError) throw categoryError;
            effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
          }

          if (distance > effectiveRadius) {
            errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
            return;
          }
        }

        let itemToAdd = product;
        let variantId = null;

        if (product.variants?.length > 0) {
          const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
          if (validVariants.length === 0) {
            errorToast('No available variants in stock.');
            return;
          }
          itemToAdd = validVariants.reduce((cheapest, variant) =>
            variant.price < cheapest.price ? variant : cheapest
          );
          variantId = itemToAdd.id;

          const isValidVariant = await validateVariant(variantId);
          if (!isValidVariant) return;
        }

        let query = supabase
          .from(TABLE_NAMES.CART)
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
            errorToast('Exceeds stock.');
            return;
          }
          const { error: updateError } = await supabase
            .from(TABLE_NAMES.CART)
            .update({ quantity: newQuantity })
            .eq('id', existingCartItem.id);
          if (updateError) throw new Error(updateError.message || 'Failed to update cart');
          successToast(`${product.name} quantity updated in cart!`);
        } else {
          const { data, error: insertError } = await supabase
            .from(TABLE_NAMES.CART)
            .insert({
              user_id: session.user.id,
              product_id: product.id,
              variant_id: variantId,
              quantity: 1,
              price: itemToAdd.price || product.offer_price,
              title: product.name,
            })
            .select('id')
            .single();
          if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
          setCartCount((prev) => prev + 1);
          const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
          storedCart.push({
            id: product.id,
            cartId: data.id,
            quantity: 1,
            variantId,
            price: itemToAdd.price || product.offer_price,
            title: product.name,
            images: product.images,
            uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
          });
          localStorage.setItem('cart', JSON.stringify(storedCart));
          successToast(`${product.name} added to cart!`);
        }
      } catch (err) {
        errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
      }
    },
    [navigate, session, setCartCount, buyerLocation]
  );

  // Buy now
  const buyNow = useCallback(
    async (product) => {
      if (!product || !product.id || !product.name || product.offer_price === undefined) {
        invalidProductToast();
        return;
      }
      if (product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0))) {
        outOfStockToast();
        return;
      }
      if (!session?.user) {
        authRequiredToast('proceed to checkout');
        navigate(ROUTES.AUTH);
        return;
      }
      if (!checkNetworkStatus()) return;

      try {
        const { data: categoryData, error: categoryError } = await supabase
          .from(TABLE_NAMES.CATEGORIES)
          .select('is_restricted')
          .eq('id', product.categoryId)
          .single();
        if (categoryError) throw categoryError;
        if (categoryData?.is_restricted) {
          infoToast('Please select this category from the categories page to proceed.');
          navigate(ROUTES.CATEGORIES);
          return;
        }

        const { data: productData, error: productError } = await supabase
          .from(TABLE_NAMES.PRODUCTS)
          .select('id, delivery_radius_km, category_id, latitude, longitude')
          .eq('id', product.id)
          .eq('is_approved', true)
          .eq('status', STATUS_ACTIVE)
          .single();
        if (productError || !productData) {
          errorToast('Product is not available.');
          return;
        }

        if (buyerLocation && productData.latitude && productData.longitude) {
          const distance = calculateDistance(buyerLocation, {
            latitude: productData.latitude,
            longitude: productData.longitude,
          });
          if (distance === null) {
            errorToast('Unable to calculate distance to product.');
            return;
          }

          let effectiveRadius = productData.delivery_radius_km;
          if (!effectiveRadius) {
            const { data: categoryData, error: categoryError } = await supabase
              .from(TABLE_NAMES.CATEGORIES)
              .select('max_delivery_radius_km')
              .eq('id', productData.category_id)
              .single();
            if (categoryError) throw categoryError;
            effectiveRadius = categoryData?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
          }

          if (distance > effectiveRadius) {
            errorToast(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`);
            return;
          }
        }

        let itemToAdd = product;
        let variantId = null;

        if (product.variants?.length > 0) {
          const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
          if (validVariants.length === 0) {
            errorToast('No available variants in stock.');
            return;
          }
          itemToAdd = validVariants.reduce((cheapest, variant) =>
            variant.price < cheapest.price ? variant : cheapest
          );
          variantId = itemToAdd.id;

          const isValidVariant = await validateVariant(variantId);
          if (!isValidVariant) return;
        }

        let query = supabase
          .from(TABLE_NAMES.CART)
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
            errorToast('Exceeds stock.');
            return;
          }
          const { error: updateError } = await supabase
            .from(TABLE_NAMES.CART)
            .update({ quantity: newQuantity })
            .eq('id', existingCartItem.id);
          if (updateError) throw new Error(updateError.message || 'Failed to update cart');
        } else {
          const { data, error: insertError } = await supabase
            .from(TABLE_NAMES.CART)
            .insert({
              user_id: session.user.id,
              product_id: product.id,
              variant_id: variantId,
              quantity: 1,
              price: itemToAdd.price || product.offer_price,
              title: product.name,
            })
            .select('id')
            .single();
          if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
          setCartCount((prev) => prev + 1);
          const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
          storedCart.push({
            id: product.id,
            cartId: data.id,
            quantity: 1,
            variantId,
            price: itemToAdd.price || product.offer_price,
            title: product.name,
            images: product.images,
            uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
          });
          localStorage.setItem('cart', JSON.stringify(storedCart));
        }

        successToast('Added to cart! Redirecting to cart...');
        setTimeout(() => navigate(ROUTES.CART), 2000);
      } catch (err) {
        errorToast(`Failed to add to cart: ${err.message || 'Unknown error'}`);
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
    const filteredSuggestions = Array.isArray(products)
      ? products
          .filter((product) => product.name?.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, MAX_SEARCH_SUGGESTIONS)
          .map((product) => ({
            ...product,
            offer_price: product.offer_price,
            original_price: product.original_price,
          }))
      : [];
    setSuggestions(filteredSuggestions);
  }, [searchTerm, products, isSearchFocused]);

  // Filter products for search
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    if (!searchTerm) return products;
    return products.filter((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => ({
      ...p,
      offer_price: p.offer_price,
      original_price: p.original_price,
    }));
  }, [products, searchTerm]);

  // Handle clicks outside the search bar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchBannerImages();
    fetchCategories();
    fetchProducts();

    if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
            setBuyerLocation(newLocation);
            setLocationPermissionGranted(true);
          },
          (error) => {
            let errorMessage = 'Unable to fetch location.';
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage = 'Location access denied.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = 'Location information unavailable.';
            } else if (error.code === error.TIMEOUT) {
              errorMessage = 'Location request timed out.';
            }
            errorToast(`${errorMessage} Using default location (Jharia, Dhanbad).`);
            setBuyerLocation(DEFAULT_LOCATION);
          },
          { timeout: GEOLOCATION_TIMEOUT, enableHighAccuracy: true }
        );
      } else {
        blueInfoToast('Geolocation not supported. Using default location (Jharia, Dhanbad).');
        setBuyerLocation(DEFAULT_LOCATION);
      }
    }
  }, [fetchBannerImages, fetchCategories, fetchProducts, setBuyerLocation]);

  // Fetch nearby products when location changes
  useEffect(() => {
    if (buyerLocation && buyerLocation.lat && buyerLocation.lon) {
      fetchNearbyProducts();
    }
  }, [buyerLocation, fetchNearbyProducts]);

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

  // Show loading state for all sections
  if (loadingProducts && loadingBanners && loadingCategories) {
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
  }

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
        <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_BANNER_IMAGE} />
        <meta property="og:url" content="https://www.markeet.com/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Markeet - Shop Electronics, Fashion, Jewellery & More" />
        <meta
          name="twitter:description"
          content="Discover electronics, appliances, fashion, jewellery, and home decoration on Markeet. Fast delivery within your local area in India."
        />
        <meta name="twitter:image" content={products[0]?.images?.[0] || DEFAULT_BANNER_IMAGE} />
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
      <Toaster position="top-center" toastOptions={{ duration: TOAST_DURATION }} />

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
                  navigate(ROUTES.PRODUCT(suggestion.id));
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setSearchTerm(suggestion.name);
                    setIsSearchFocused(false);
                    setSuggestions([]);
                    navigate(ROUTES.PRODUCT(suggestion.id));
                  }
                }}
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
                  onClick={() => navigate(ROUTES.CATEGORIES)}
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
          <Link to={ROUTES.CATEGORIES} className="td-cat-view-all" aria-label="View All Categories">
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
                to={`${ROUTES.PRODUCTS}?category=${category.id}`}
                key={category.id}
                state={{ fromCategories: true }}
                className="td-cat-card"
                aria-label={`View ${category.name} products`}
              >
                <img
                  src={category.image_url || DEFAULT_CATEGORY_IMAGE}
                  alt={category.name}
                  className="td-cat-image"
                  onError={(e) => (e.target.src = DEFAULT_CATEGORY_IMAGE)}
                  loading="lazy"
                />
                <h3 className="td-cat-name">{category.name.trim()}</h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Nearby Products Section */}
      <section className="nearby-products-section">
        <div className="nearby-products-header">
          <span className="nearby-products-icon">📍</span>
          <h2 className="nearby-products-title">Products Near You</h2>
        </div>
        {!locationPermissionGranted && !buyerLocation && (
          <div className="location-permission-request">
            <div className="location-permission-icon">📍</div>
            <h3 className="location-permission-title">Enable Location Access</h3>
            <p className="location-permission-message">
              Allow location access to discover products available for delivery in your area.
            </p>
            <button
              className="location-permission-button"
              onClick={requestLocationPermission}
              aria-label="Enable Location"
            >
              Enable Location
            </button>
          </div>
        )}
        {loadingNearbyProducts && (
          <div className="nearby-products-loading">
            <div className="nearby-products-spinner"></div>
            <span className="nearby-products-loading-text">Finding nearby products...</span>
          </div>
        )}
        {!loadingNearbyProducts && nearbyProducts.length === 0 && locationPermissionGranted && (
          <div className="no-nearby-products">
            <div className="no-nearby-products-icon">🚀</div>
            <h3 className="no-nearby-products-title">We are coming soon in your location</h3>
            <p className="no-nearby-products-message">
              We're working hard to bring you amazing products in your area. Check back soon!
            </p>
          </div>
        )}
        {!loadingNearbyProducts && nearbyProducts.length > 0 && (
          <HomeProducts
            products={nearbyProducts}
            addToCart={addToCart}
            buyNow={buyNow}
          />
        )}
      </section>

      {/* Global Products Section */}
      <section className="td-products-section">
        <h2 className="td-section-title">Shop Electronics, Fashion, Jewellery & More!</h2>
        {loadingProducts ? (
          <div className="prod-grid">
            {[...Array(MAX_PRODUCTS_HOME)].map((_, i) => (
              <div key={i} className="prod-item prod-item-skeleton">
                <div className="prod-image-wrapper">
                  <div className="prod-image-skeleton"></div>
                </div>
                <div className="prod-item-name prod-skeleton"></div>
                <div className="prod-price-section">
                  <div className="prod-price prod-skeleton"></div>
                  <div className="prod-original-price prod-skeleton"></div>
                </div>
                <div className="prod-item-radius prod-skeleton"></div>
                <div className="prod-item-actions">
                  <div className="prod-add-cart-btn prod-skeleton"></div>
                  <div className="prod-buy-now-btn prod-skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <HomeProducts
            products={filteredProducts.slice(0, MAX_PRODUCTS_HOME)}
            addToCart={addToCart}
            buyNow={buyNow}
          />
        )}
      </section>

      <Footer />
    </div>
  );
}

export default React.memo(Home);