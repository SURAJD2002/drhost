
// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { toast } from 'react-hot-toast';
// import '../style/Products.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import icon from '../assets/icon.png';

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
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchCategoryName = useCallback(async () => {
//     if (!categoryId || categoryId === 'undefined' || isNaN(parseInt(categoryId, 10))) {
//       toast.error('Please select a valid category to view products.', {
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
//       setError('Please select a valid category to view products.');
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

//   const fetchRelatedCategories = useCallback(async () => {
//     if (!categoryId || categoryId === 'undefined' || isNaN(parseInt(categoryId, 10))) {
//       console.warn('Invalid or missing categoryId for related categories fetch:', categoryId);
//       return [];
//     }
//     try {
//       const { data, error } = await supabase
//         .from('category_relationships')
//         .select('related_category_id')
//         .eq('source_category_id', parseInt(categoryId, 10))
//         .order('weight', { ascending: false });
//       if (error) throw error;
//       return data.map((rel) => rel.related_category_id);
//     } catch (err) {
//       console.error('Error fetching related categories:', err);
//       return [];
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
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       setProducts([]);
//       setRelatedProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!categoryId || categoryId === 'undefined' || isNaN(parseInt(categoryId, 10))) {
//       toast.error('Please select a valid category to view products.', {
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
//       setError('Please select a valid category to view products.');
//       setProducts([]);
//       setRelatedProducts([]);
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
//           categories (max_delivery_radius_km, is_restricted, name)
//         `)
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active');
//       if (productsError) throw productsError;

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
//             return false;
//           }
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller) {
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
//             categoryName: product.categories?.name || '',
//             variants,
//             displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//             displayOriginalPrice:
//               variants.length > 0
//                 ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                   product.original_price
//                 : product.original_price,
//           };
//         });

//       setProducts(nearbyProducts);

//       let relatedProducts = [];
//       if (nearbyProducts.length === 0 || true) {
//         const relatedCategoryIds = await fetchRelatedCategories();
//         if (relatedCategoryIds.length > 0) {
//           const { data: relatedProductsData, error: relatedProductsError } = await supabase
//             .from('products')
//             .select(`
//               id,
//               title,
//               price,
//               original_price,
//               discount_amount,
//               images,
//               seller_id,
//               stock,
//               delivery_radius_km,
//               category_id,
//               categories (max_delivery_radius_km, is_restricted, name)
//             `)
//             .in('category_id', relatedCategoryIds)
//             .eq('is_approved', true)
//             .eq('status', 'active');
//           if (relatedProductsError) throw relatedProductsError;

//           const relatedProductIds = relatedProductsData.map((product) => product.id);

//           const { data: relatedVariantData, error: relatedVariantError } = await supabase
//             .from('product_variants')
//             .select('id, product_id, price, original_price, stock, attributes, images')
//             .eq('status', 'active')
//             .in('product_id', relatedProductIds);
//           if (relatedVariantError) throw relatedVariantError;

//           relatedProducts = relatedProductsData
//             .filter((product) => {
//               if (!product.categories) {
//                 return false;
//               }
//               const seller = sellersData.find((s) => s.id === product.seller_id);
//               if (!seller) {
//                 return false;
//               }
//               const distance = calculateDistance(buyerLocation, {
//                 latitude: seller.latitude,
//                 longitude: seller.longitude,
//               });
//               const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//               return distance !== null && distance <= effectiveRadius;
//             })
//             .map((product) => {
//               const variants = relatedVariantData
//                 .filter((v) => v.product_id === product.id)
//                 .map((v) => ({
//                   id: v.id,
//                   price: parseFloat(v.price) || 0,
//                   originalPrice: v.original_price ? parseFloat(v.original_price) : null,
//                   stock: v.stock || 0,
//                   attributes: v.attributes || {},
//                   images: v.images && v.images.length > 0 ? v.images : product.images,
//                 }));

//               const validImages = Array.isArray(product.images)
//                 ? product.images.filter((img) => typeof img === 'string' && img.trim())
//                 : [];

//               return {
//                 id: product.id,
//                 name: product.title || 'Unnamed Product',
//                 images: validImages.length > 0 ? validImages : [DEFAULT_IMAGE],
//                 price: parseFloat(product.price) || 0,
//                 originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//                 discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//                 stock: product.stock || 0,
//                 seller_id: product.seller_id,
//                 deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//                 categoryId: product.category_id,
//                 categoryName: product.categories?.name || '',
//                 variants,
//                 displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//                 displayOriginalPrice:
//                   variants.length > 0
//                     ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                       product.original_price
//                     : product.original_price,
//               };
//             });
//         }
//       }

//       if (nearbyProducts.length === 0 && relatedProducts.length === 0) {
//         toast(`No ${categoryName || 'products'} found within delivery radius for this category or related categories.`, {
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
//       } else if (nearbyProducts.length === 0 && relatedProducts.length > 0) {
//         toast(`No ${categoryName || 'products'} found in this category, but we found related products you might like!`, {
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

//       setRelatedProducts(relatedProducts);
//       setError(null);
//     } catch (err) {
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
//       setRelatedProducts([]);
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId, categoryName, navigate, fetchRelatedCategories]);

//   const validateVariant = async (variantId) => {
//     if (!variantId) return true;
//     const { data, error } = await supabase
//       .from('product_variants')
//       .select('id')
//       .eq('id', variantId)
//       .eq('status', 'active')
//       .single();
//     if (error || !data) {
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
//             let errorMessage = 'Unable to fetch your location in Jharia, Dhanbad.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services for Jharia, Dhanbad.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable in Jharia, Dhanbad. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out in Jharia, Dhanbad. Please try again.';
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
//             const defaultLoc = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad default
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
//         const defaultLoc = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad default
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
//   const relatedProductList = relatedProducts.map((product, index) => ({
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
//         <meta property="og:image" content={products[0]?.images[0] || relatedProducts[0]?.images[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={products[0]?.images[0] || relatedProducts[0]?.images[0] || DEFAULT_IMAGE} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'ItemList',
//             itemListElement: [...productList, ...relatedProductList],
//           })}
//         </script>
//       </Helmet>
//       {products.length === 0 && relatedProducts.length === 0 ? (
//         <>
//           <div className="prod-no-items">No products found within delivery radius for this category or related categories.</div>
//           <div className="prod-suggestion">
//             Try browsing other categories or check back later.
//             <button onClick={() => navigate('/categories')} className="prod-retry-btn">
//               Browse Categories
//             </button>
//           </div>
//           <img src={icon} alt="Markeet Logo" className="prod-icon" />
//         </>
//       ) : (
//         <>
//           <h2 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h2>
//           {products.length > 0 ? (
//             <div className="prod-grid">
//               {products.map((product) => (
//                 <div
//                   key={product.id}
//                   className="prod-item"
//                   onClick={() => navigate(`/product/${product.id}`)}
//                   role="button"
//                   tabIndex={0}
//                   onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                   aria-label={`View product ${product.name}`}
//                 >
//                   <div className="prod-image-wrapper">
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
//                         e.target.src = DEFAULT_IMAGE;
//                       }}
//                       loading="lazy"
//                     />
//                   </div>
//                   <h3 className="prod-item-name">{product.name}</h3>
//                   <div className="prod-price-section">
//                     <p className="prod-price">
//                       ₹{product.displayPrice.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                       <p className="prod-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                   </div>
//                   <p className="prod-item-radius">Delivery Radius: {product.deliveryRadius} km</p>
//                   <div className="prod-item-actions">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="prod-add-cart-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       {product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))
//                         ? 'Out of Stock'
//                         : 'Add to Cart'}
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleBuyNow(product);
//                       }}
//                       className="prod-buy-now-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="prod-no-items">No products found within delivery radius for this category.</div>
//           )}
//           {relatedProducts.length > 0 && (
//             <>
//               <h2 className="prod-title">Related Products</h2>
//               <div className="prod-grid">
//                 {relatedProducts.map((product) => (
//                   <div
//                     key={product.id}
//                     className="prod-item"
//                     onClick={() => navigate(`/product/${product.id}`)}
//                     role="button"
//                     tabIndex={0}
//                     onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                     aria-label={`View product ${product.name}`}
//                   >
//                     <div className="prod-image-wrapper">
//                       {product.discountAmount > 0 && (
//                         <span className="offer-badge">
//                           <span className="offer-label">Offer!</span>
//                           Save ₹{product.discountAmount.toFixed(2)}
//                         </span>
//                       )}
//                       <img
//                         src={product.images[0]}
//                         alt={product.name}
//                         onError={(e) => {
//                           e.target.src = DEFAULT_IMAGE;
//                         }}
//                         loading="lazy"
//                       />
//                     </div>
//                     <h3 className="prod-item-name">{product.name}</h3>
//                     <p className="prod-item-category">Category: {product.categoryName}</p>
//                     <div className="prod-price-section">
//                       <p className="prod-price">
//                         ₹{product.displayPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                       {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                         <p className="prod-original-price">
//                           ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </p>
//                       )}
//                     </div>
//                     <p className="prod-item-radius">Delivery Radius: {product.deliveryRadius} km</p>
//                     <div className="prod-item-actions">
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           addToCart(product);
//                         }}
//                         className="prod-add-cart-btn"
//                         disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                         aria-label={`Add ${product.name} to cart`}
//                       >
//                         {product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))
//                           ? 'Out of Stock'
//                           : 'Add to Cart'}
//                       </button>
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleBuyNow(product);
//                         }}
//                         className="prod-buy-now-btn"
//                         disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                         aria-label={`Buy ${product.name} now`}
//                       >
//                         Buy Now
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </>
//           )}
//           <img src={icon} alt="Markeet Logo" className="prod-icon" />
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Products);



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { toast } from 'react-hot-toast';
// import '../style/Products.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import icon from '../assets/icon.png';

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
//   const navigate = useNavigate();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Log query params for debugging
//   useEffect(() => {
//     console.log('URL:', window.location.href);
//     console.log('searchParams:', Object.fromEntries(searchParams));
//     console.log('categoryId:', categoryId);
//   }, [searchParams, categoryId]);

//   const fetchCategoryName = useCallback(async () => {
//     if (!categoryId || categoryId === 'undefined' || isNaN(parseInt(categoryId, 10))) {
//       toast.error('Please select a valid category to view products.', {
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
//       setError('Please select a valid category to view products.');
//       setProducts([]);
//       setLoading(false);
//       navigate('/categories');
//       return false;
//     }
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('name, max_delivery_radius_km, is_restricted')
//         .eq('id', parseInt(categoryId, 10))
//         .single();
//       if (error) throw error;
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
//         return false;
//       }
//       setCategoryName(data?.name || '');
//       return true;
//     } catch (err) {
//       toast.error(`Failed to fetch category details: ${err.message || 'Unknown error'}`, {
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
//       return false;
//     }
//   }, [categoryId, navigate, location.state]);

//   const fetchRelatedCategories = useCallback(async () => {
//     if (!categoryId || categoryId === 'undefined' || isNaN(parseInt(categoryId, 10))) {
//       console.warn('Invalid or missing categoryId for related categories fetch:', categoryId);
//       return [];
//     }
//     try {
//       const { data, error } = await supabase
//         .from('category_relationships')
//         .select('related_category_id')
//         .eq('source_category_id', parseInt(categoryId, 10))
//         .order('weight', { ascending: false });
//       if (error) throw error;
//       return data.map((rel) => rel.related_category_id);
//     } catch (err) {
//       console.error('Error fetching related categories:', err);
//       return [];
//     }
//   }, [categoryId]);

//   const fetchProducts = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

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
//       setRelatedProducts([]);
//       setLoading(false);
//       return;
//     }

//     const isValidCategory = await fetchCategoryName();
//     if (!isValidCategory) return;

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
//           categories (max_delivery_radius_km, is_restricted, name)
//         `)
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active');
//       if (productsError) throw productsError;

//       const productIds = productsData.map((product) => product.id);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', productIds);
//       if (variantError) throw variantError;

//       const nearbyProducts = productsData
//         .filter((product) => {
//           if (!product.categories) return false;
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller) return false;
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
//             categoryName: product.categories?.name || '',
//             variants,
//             displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//             displayOriginalPrice:
//               variants.length > 0
//                 ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                   product.original_price
//                 : product.original_price,
//           };
//         });

//       setProducts(nearbyProducts);

//       let relatedProducts = [];
//       if (nearbyProducts.length === 0) {
//         const relatedCategoryIds = await fetchRelatedCategories();
//         if (relatedCategoryIds.length > 0) {
//           const { data: relatedProductsData, error: relatedProductsError } = await supabase
//             .from('products')
//             .select(`
//               id,
//               title,
//               price,
//               original_price,
//               discount_amount,
//               images,
//               seller_id,
//               stock,
//               delivery_radius_km,
//               category_id,
//               categories (max_delivery_radius_km, is_restricted, name)
//             `)
//             .in('category_id', relatedCategoryIds)
//             .eq('is_approved', true)
//             .eq('status', 'active');
//           if (relatedProductsError) throw relatedProductsError;

//           const relatedProductIds = relatedProductsData.map((product) => product.id);

//           const { data: relatedVariantData, error: relatedVariantError } = await supabase
//             .from('product_variants')
//             .select('id, product_id, price, original_price, stock, attributes, images')
//             .eq('status', 'active')
//             .in('product_id', relatedProductIds);
//           if (relatedVariantError) throw relatedVariantError;

//           relatedProducts = relatedProductsData
//             .filter((product) => {
//               if (!product.categories) return false;
//               const seller = sellersData.find((s) => s.id === product.seller_id);
//               if (!seller) return false;
//               const distance = calculateDistance(buyerLocation, {
//                 latitude: seller.latitude,
//                 longitude: seller.longitude,
//               });
//               const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//               return distance !== null && distance <= effectiveRadius;
//             })
//             .map((product) => {
//               const variants = relatedVariantData
//                 .filter((v) => v.product_id === product.id)
//                 .map((v) => ({
//                   id: v.id,
//                   price: parseFloat(v.price) || 0,
//                   originalPrice: v.original_price ? parseFloat(v.original_price) : null,
//                   stock: v.stock || 0,
//                   attributes: v.attributes || {},
//                   images: v.images && v.images.length > 0 ? v.images : product.images,
//                 }));

//               const validImages = Array.isArray(product.images)
//                 ? product.images.filter((img) => typeof img === 'string' && img.trim())
//                 : [];

//               return {
//                 id: product.id,
//                 name: product.title || 'Unnamed Product',
//                 images: validImages.length > 0 ? validImages : [DEFAULT_IMAGE],
//                 price: parseFloat(product.price) || 0,
//                 originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//                 discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//                 stock: product.stock || 0,
//                 seller_id: product.seller_id,
//                 deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//                 categoryId: product.category_id,
//                 categoryName: product.categories?.name || '',
//                 variants,
//                 displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//                 displayOriginalPrice:
//                   variants.length > 0
//                     ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                       product.original_price
//                     : product.original_price,
//               };
//             });
//         }
//       }

//       if (nearbyProducts.length === 0 && relatedProducts.length === 0) {
//         toast(`No ${categoryName || 'products'} found within delivery radius for this category or related categories.`, {
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
//       } else if (nearbyProducts.length === 0 && relatedProducts.length > 0) {
//         toast(`No ${categoryName || 'products'} found in this category, but we found related products you might like!`, {
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

//       setRelatedProducts(relatedProducts);
//       setError(null);
//     } catch (err) {
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
//       setRelatedProducts([]);
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId, categoryName, navigate, fetchCategoryName, fetchRelatedCategories]);

//   const validateVariant = async (variantId) => {
//     if (!variantId) return true;
//     try {
//       const { data, error } = await supabase
//         .from('product_variants')
//         .select('id')
//         .eq('id', variantId)
//         .eq('status', 'active')
//         .single();
//       if (error || !data) return false;
//       return true;
//     } catch (err) {
//       console.error('Error validating variant:', err);
//       return false;
//     }
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
//         if (updateError) throw new Error(updateError.message || 'Failed to update cart');
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
//         if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
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
//         if (updateError) throw new Error(updateError.message || 'Failed to update cart');
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
//         if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
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
//             let errorMessage = 'Unable to fetch your location in Jharia, Dhanbad.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services for Jharia, Dhanbad.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable in Jharia, Dhanbad. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out in Jharia, Dhanbad. Please try again.';
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
//             const defaultLoc = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad default
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
//         const defaultLoc = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad default
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [buyerLocation, setBuyerLocation, fetchProducts]);

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
//   const relatedProductList = relatedProducts.map((product, index) => ({
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
//         <meta property="og:image" content={products[0]?.images[0] || relatedProducts[0]?.images[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={products[0]?.images[0] || relatedProducts[0]?.images[0] || DEFAULT_IMAGE} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'ItemList',
//             itemListElement: [...productList, ...relatedProductList],
//           })}
//         </script>
//       </Helmet>
//       {products.length === 0 && relatedProducts.length === 0 ? (
//         <>
//           <div className="prod-no-items">No products found within delivery radius for this category or related categories.</div>
//           <div className="prod-suggestion">
//             Try browsing other categories or check back later.
//             <button onClick={() => navigate('/categories')} className="prod-retry-btn">
//               Browse Categories
//             </button>
//           </div>
//           <img src={icon} alt="Markeet Logo" className="prod-icon" />
//         </>
//       ) : (
//         <>
//           <h2 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h2>
//           {products.length > 0 ? (
//             <div className="prod-grid">
//               {products.map((product) => (
//                 <div
//                   key={product.id}
//                   className="prod-item"
//                   onClick={() => navigate(`/product/${product.id}`)}
//                   role="button"
//                   tabIndex={0}
//                   onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                   aria-label={`View product ${product.name}`}
//                 >
//                   <div className="prod-image-wrapper">
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
//                         e.target.src = DEFAULT_IMAGE;
//                       }}
//                       loading="lazy"
//                     />
//                   </div>
//                   <h3 className="prod-item-name">{product.name}</h3>
//                   <div className="prod-price-section">
//                     <p className="prod-price">
//                       ₹{product.displayPrice.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                       <p className="prod-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                   </div>
//                   <p className="prod-item-radius">Delivery Radius: {product.deliveryRadius} km</p>
//                   <div className="prod-item-actions">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="prod-add-cart-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       {product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))
//                         ? 'Out of Stock'
//                         : 'Add to Cart'}
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleBuyNow(product);
//                       }}
//                       className="prod-buy-now-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="prod-no-items">No products found within delivery radius for this category.</div>
//           )}
//           {relatedProducts.length > 0 && (
//             <>
//               <h2 className="prod-title">Related Products</h2>
//               <div className="prod-grid">
//                 {relatedProducts.map((product) => (
//                   <div
//                     key={product.id}
//                     className="prod-item"
//                     onClick={() => navigate(`/product/${product.id}`)}
//                     role="button"
//                     tabIndex={0}
//                     onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                     aria-label={`View product ${product.name}`}
//                   >
//                     <div className="prod-image-wrapper">
//                       {product.discountAmount > 0 && (
//                         <span className="offer-badge">
//                           <span className="offer-label">Offer!</span>
//                           Save ₹{product.discountAmount.toFixed(2)}
//                         </span>
//                       )}
//                       <img
//                         src={product.images[0]}
//                         alt={product.name}
//                         onError={(e) => {
//                           e.target.src = DEFAULT_IMAGE;
//                         }}
//                         loading="lazy"
//                       />
//                     </div>
//                     <h3 className="prod-item-name">{product.name}</h3>
//                     <p className="prod-item-category">Category: {product.categoryName}</p>
//                     <div className="prod-price-section">
//                       <p className="prod-price">
//                         ₹{product.displayPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                       {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                         <p className="prod-original-price">
//                           ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </p>
//                       )}
//                     </div>
//                     <p className="prod-item-radius">Delivery Radius: {product.deliveryRadius} km</p>
//                     <div className="prod-item-actions">
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           addToCart(product);
//                         }}
//                         className="prod-add-cart-btn"
//                         disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                         aria-label={`Add ${product.name} to cart`}
//                       >
//                         {product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))
//                           ? 'Out of Stock'
//                           : 'Add to Cart'}
//                       </button>
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleBuyNow(product);
//                         }}
//                         className="prod-buy-now-btn"
//                         disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                         aria-label={`Buy ${product.name} now`}
//                       >
//                         Buy Now
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </>
//           )}
//           <img src={icon} alt="Markeet Logo" className="prod-icon" />
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Products);



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { toast } from 'react-hot-toast';
// import useScrollMemory from '../hooks/useScrollManager';
// import '../style/Products.css';
// import '../style/CursorAndNearbyProducts.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import icon from '../assets/icon.png';
// import { 
//   infoToast, 
//   authRequiredToast, 
//   outOfStockToast, 
//   invalidProductToast, 
//   productAddedToCartToast 
// } from '../utils/toastUtils';

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

// // Process products (main or related) to filter by distance and map to display format
// const processProducts = (productsData, variantData, sellersData, buyerLocation, defaultRadius = 40) => {
//   return productsData
//     .filter((product) => {
//       if (!product.categories) return false;
//       const seller = sellersData.find((s) => s.id === product.seller_id);
//       if (!seller) return false;
//       const distance = calculateDistance(buyerLocation, {
//         latitude: seller.latitude,
//         longitude: seller.longitude,
//       });
//       const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || defaultRadius;
//       return distance !== null && distance <= effectiveRadius;
//     })
//     .map((product) => {
//       const variants = variantData
//         .filter((v) => v.product_id === product.id)
//         .map((v) => ({
//           id: v.id,
//           price: parseFloat(v.price) || 0,
//           originalPrice: v.original_price ? parseFloat(v.original_price) : null,
//           stock: v.stock || 0,
//           attributes: v.attributes || {},
//           images: v.images && v.images.length > 0 ? v.images : product.images,
//         }));

//       const validImages = Array.isArray(product.images)
//         ? product.images.filter((img) => typeof img === 'string' && img.trim())
//         : [];

//       return {
//         id: product.id,
//         name: product.title || 'Unnamed Product',
//         images: validImages.length > 0 ? validImages : [DEFAULT_IMAGE],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//         seller_id: product.seller_id,
//         deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || defaultRadius,
//         categoryId: product.category_id,
//         categoryName: product.categories?.name || '',
//         variants,
//         displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//         displayOriginalPrice:
//           variants.length > 0
//             ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//               product.original_price
//             : product.original_price,
//       };
//     });
// };

// function Products() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const [searchParams] = useSearchParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const categoryId = searchParams.get('category');
  
//   // Enhanced navigation with scroll memory
//   const { navigate } = useScrollMemory();
//   const [products, setProducts] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Log query params for debugging
//   useEffect(() => {
//     console.log('URL:', window.location.href);
//     console.log('searchParams:', Object.fromEntries(searchParams));
//     console.log('categoryId:', categoryId);
//   }, [searchParams, categoryId]);

//   const fetchCategoryName = useCallback(async () => {
//     if (!categoryId || categoryId === 'undefined' || isNaN(parseInt(categoryId, 10))) {
//       toast('Please select a valid category to view products.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: 'var(--toastify-color-info)',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       setError('Please select a valid category to view products.');
//       setProducts([]);
//       setLoading(false);
//       navigate('/categories');
//       return false;
//     }
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('name, max_delivery_radius_km, is_restricted')
//         .eq('id', parseInt(categoryId, 10))
//         .single();
//       if (error) throw error;
//       if (data?.is_restricted && !location.state?.fromCategories) {
//         toast(`Please select the ${data.name} category from the categories page to view products.`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: 'var(--toastify-color-info)',
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
//         return false;
//       }
//       setCategoryName(data?.name || '');
//       return true;
//     } catch (err) {
//       toast.error(`Failed to fetch category details: ${err.message || 'Unknown error'}`, {
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
//       return false;
//     }
//   }, [categoryId, navigate, location.state]);

//   const fetchRelatedCategories = useCallback(async () => {
//     if (!categoryId || categoryId === 'undefined' || isNaN(parseInt(categoryId, 10))) {
//       console.warn('Invalid or missing categoryId for related categories fetch:', categoryId);
//       return [];
//     }
//     try {
//       const { data, error } = await supabase
//         .from('category_relationships')
//         .select('related_category_id')
//         .eq('source_category_id', parseInt(categoryId, 10))
//         .order('weight', { ascending: false });
//       if (error) throw error;
//       return data.map((rel) => rel.related_category_id);
//     } catch (err) {
//       console.error('Error fetching related categories:', err);
//       return [];
//     }
//   }, [categoryId]);

//   const fetchProducts = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

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
//       setRelatedProducts([]);
//       setLoading(false);
//       return;
//     }

//     const isValidCategory = await fetchCategoryName();
//     if (!isValidCategory) return;

//     setLoading(true);
//     setError(null);
//     try {
//       // Fetch sellers data once for both main and related products
//       const { data: sellersData, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       // Fetch main products
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
//           categories (max_delivery_radius_km, is_restricted, name)
//         `)
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active');
//       if (productsError) throw productsError;

//       const productIds = productsData.map((product) => product.id);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', productIds);
//       if (variantError) throw variantError;

//       const nearbyProducts = processProducts(productsData, variantData, sellersData, buyerLocation);

//       setProducts(nearbyProducts);

//       // Fetch related products only if no nearby products are found
//       let relatedProducts = [];
//       if (nearbyProducts.length === 0) {
//         const relatedCategoryIds = await fetchRelatedCategories();
//         if (relatedCategoryIds.length > 0) {
//           const { data: relatedProductsData, error: relatedProductsError } = await supabase
//             .from('products')
//             .select(`
//               id,
//               title,
//               price,
//               original_price,
//               discount_amount,
//               images,
//               seller_id,
//               stock,
//               delivery_radius_km,
//               category_id,
//               categories (max_delivery_radius_km, is_restricted, name)
//             `)
//             .in('category_id', relatedCategoryIds)
//             .eq('is_approved', true)
//             .eq('status', 'active');
//           if (relatedProductsError) throw relatedProductsError;

//           const relatedProductIds = relatedProductsData.map((product) => product.id);

//           const { data: relatedVariantData, error: relatedVariantError } = await supabase
//             .from('product_variants')
//             .select('id, product_id, price, original_price, stock, attributes, images')
//             .eq('status', 'active')
//             .in('product_id', relatedProductIds);
//           if (relatedVariantError) throw relatedVariantError;

//           relatedProducts = processProducts(relatedProductsData, relatedVariantData, sellersData, buyerLocation);
//         }
//       }

//       if (nearbyProducts.length === 0 && relatedProducts.length === 0) {
//         toast(`No ${categoryName || 'products'} found within delivery radius for this category or related categories.`, {
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
//       } else if (nearbyProducts.length === 0 && relatedProducts.length > 0) {
//         toast(`No ${categoryName || 'products'} found in this category, but we found related products you might like!`, {
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

//       setRelatedProducts(relatedProducts);
//       setError(null);
//     } catch (err) {
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
//       setRelatedProducts([]);
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId, categoryName, navigate, fetchCategoryName, fetchRelatedCategories]);

//   const validateVariant = async (variantId) => {
//     if (!variantId) return true;
//     try {
//       const { data, error } = await supabase
//         .from('product_variants')
//         .select('id')
//         .eq('id', variantId)
//         .eq('status', 'active')
//         .single();
//       if (error || !data) return false;
//       return true;
//     } catch (err) {
//       console.error('Error validating variant:', err);
//       return false;
//     }
//   };

//   const addToCart = async (product, redirect = false) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       invalidProductToast();
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       outOfStockToast();
//       return;
//     }
//     if (!session?.user) {
//       authRequiredToast(redirect ? 'proceed to checkout' : 'add items to cart');
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
//         toast(`Please select this category from the categories page to ${redirect ? 'proceed to checkout' : 'add products to cart'}.`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: 'var(--toastify-color-info)',
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
//         if (updateError) throw new Error(updateError.message || 'Failed to update cart');
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
//         if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
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

//       if (redirect) {
//         toast.success('Added to cart! Redirecting to cart...', {
//           duration: 2000,
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
//         setTimeout(() => navigate('/cart'), 2000);
//       }
//     } catch (err) {
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

//   const handleBuyNow = (product) => addToCart(product, true);

//   useEffect(() => {
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
//             let errorMessage = 'Unable to fetch your location in Jharia, Dhanbad.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services for Jharia, Dhanbad.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable in Jharia, Dhanbad. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out in Jharia, Dhanbad. Please try again.';
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
//             const defaultLoc = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad default
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
//         const defaultLoc = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad default
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [buyerLocation, setBuyerLocation, fetchProducts]);

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
//   const relatedProductList = relatedProducts.map((product, index) => ({
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
//         <meta property="og:image" content={products[0]?.images[0] || relatedProducts[0]?.images[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={products[0]?.images[0] || relatedProducts[0]?.images[0] || DEFAULT_IMAGE} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'ItemList',
//             itemListElement: [...productList, ...relatedProductList],
//           })}
//         </script>
//       </Helmet>
//       {products.length === 0 && relatedProducts.length === 0 ? (
//         <>
//           <div className="prod-no-items">No products found within delivery radius for this category or related categories.</div>
//           <div className="prod-suggestion">
//             Try browsing other categories or check back later.
//             <button onClick={() => navigate('/categories')} className="prod-retry-btn">
//               Browse Categories
//             </button>
//           </div>
//           <img src={icon} alt="Markeet Logo" className="prod-icon" />
//         </>
//       ) : (
//         <>
//           <h2 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h2>
//           {products.length > 0 ? (
//             <div className="prod-grid">
//               {products.map((product) => (
//                 <div
//                   key={product.id}
//                   className="prod-item"
//                   onClick={() => {
//                     navigate(`/product/${product.id}`, {
//                       state: {
//                         fromCategory: true,
//                         categoryId: categoryId,
//                         categoryName: categoryName,
//                         scrollPosition: window.scrollY
//                       }
//                     });
//                   }}
//                   role="button"
//                   tabIndex={0}
//                   onKeyPress={(e) => {
//                     if (e.key === 'Enter') {
//                       navigate(`/product/${product.id}`, {
//                         state: {
//                           fromCategory: true,
//                           categoryId: categoryId,
//                           categoryName: categoryName,
//                           scrollPosition: window.scrollY
//                         }
//                       });
//                     }
//                   }}
//                   aria-label={`View product ${product.name}`}
//                 >
//                   <div className="prod-image-wrapper">
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
//                         e.target.src = DEFAULT_IMAGE;
//                       }}
//                       loading="lazy"
//                     />
//                   </div>
//                   <h3 className="prod-item-name">{product.name}</h3>
//                   <div className="prod-price-section">
//                     <p className="prod-price">
//                       ₹{product.displayPrice.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                       <p className="prod-original-price">
//                         ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                   </div>
//                   <p className="prod-item-radius">Delivery Radius: {product.deliveryRadius} km</p>
//                   <div className="prod-item-actions">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         addToCart(product);
//                       }}
//                       className="prod-add-cart-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Add ${product.name} to cart`}
//                     >
//                       {product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))
//                         ? 'Out of Stock'
//                         : 'Add to Cart'}
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleBuyNow(product);
//                       }}
//                       className="prod-buy-now-btn"
//                       disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                       aria-label={`Buy ${product.name} now`}
//                     >
//                       Buy Now
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="prod-no-items">No products found within delivery radius for this category.</div>
//           )}
//           {relatedProducts.length > 0 && (
//             <>
//               <h2 className="prod-title">Related Products</h2>
//               <div className="prod-grid">
//                 {relatedProducts.map((product) => (
//                   <div
//                     key={product.id}
//                     className="prod-item"
//                     onClick={() => {
//                       navigate(`/product/${product.id}`, {
//                         state: {
//                           fromCategory: true,
//                           categoryId: categoryId,
//                           categoryName: categoryName,
//                           scrollPosition: window.scrollY
//                         }
//                       });
//                     }}
//                     role="button"
//                     tabIndex={0}
//                     onKeyPress={(e) => {
//                       if (e.key === 'Enter') {
//                         navigate(`/product/${product.id}`, {
//                           state: {
//                             fromCategory: true,
//                             categoryId: categoryId,
//                             categoryName: categoryName,
//                             scrollPosition: window.scrollY
//                           }
//                         });
//                       }
//                     }}
//                     aria-label={`View product ${product.name}`}
//                   >
//                     <div className="prod-image-wrapper">
//                       {product.discountAmount > 0 && (
//                         <span className="offer-badge">
//                           <span className="offer-label">Offer!</span>
//                           Save ₹{product.discountAmount.toFixed(2)}
//                         </span>
//                       )}
//                       <img
//                         src={product.images[0]}
//                         alt={product.name}
//                         onError={(e) => {
//                           e.target.src = DEFAULT_IMAGE;
//                         }}
//                         loading="lazy"
//                       />
//                     </div>
//                     <h3 className="prod-item-name">{product.name}</h3>
//                     <p className="prod-item-category">Category: {product.categoryName}</p>
//                     <div className="prod-price-section">
//                       <p className="prod-price">
//                         ₹{product.displayPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                       {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                         <p className="prod-original-price">
//                           ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </p>
//                       )}
//                     </div>
//                     <p className="prod-item-radius">Delivery Radius: {product.deliveryRadius} km</p>
//                     <div className="prod-item-actions">
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           addToCart(product);
//                         }}
//                         className="prod-add-cart-btn"
//                         disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                         aria-label={`Add ${product.name} to cart`}
//                       >
//                         {product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))
//                           ? 'Out of Stock'
//                           : 'Add to Cart'}
//                       </button>
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleBuyNow(product);
//                         }}
//                         className="prod-buy-now-btn"
//                         disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                         aria-label={`Buy ${product.name} now`}
//                       >
//                         Buy Now
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </>
//           )}
//           <img src={icon} alt="Markeet Logo" className="prod-icon" />
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Products);



import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LocationContext } from '../App';
import { toast } from 'react-hot-toast';
import '../style/Products.css';
import '../style/CursorAndNearbyProducts.css';
import Footer from './Footer';
import { Helmet } from 'react-helmet-async';
import icon from '../assets/icon.png';
import { 
  authRequiredToast, 
  outOfStockToast, 
  invalidProductToast
} from '../utils/toastUtils';

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

// Process products (main or related) to filter by distance and map to display format
const processProducts = (productsData, variantData, sellersData, buyerLocation, defaultRadius = 40) => {
  return productsData
    .filter((product) => {
      if (!product.categories) return false;
      const seller = sellersData.find((s) => s.id === product.seller_id);
      if (!seller) return false;
      const distance = calculateDistance(buyerLocation, {
        latitude: seller.latitude,
        longitude: seller.longitude,
      });
      const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || defaultRadius;
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
        deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || defaultRadius,
        categoryId: product.category_id,
        categoryName: product.categories?.name || '',
        variants,
        displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
        displayOriginalPrice:
          variants.length > 0
            ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
              product.original_price
            : product.original_price,
      };
    });
};

function Products() {
  const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const categoryId = searchParams.get('category');
  const [products, setProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Log query params for debugging
  useEffect(() => {
    console.log('URL:', window.location.href);
    console.log('searchParams:', Object.fromEntries(searchParams));
    console.log('categoryId:', categoryId);
  }, [searchParams, categoryId]);

  const fetchCategoryName = useCallback(async () => {
    if (!categoryId || categoryId === 'undefined' || isNaN(parseInt(categoryId, 10))) {
      toast('Please select a valid category to view products.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: 'var(--toastify-color-info)',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      setError('Please select a valid category to view products.');
      setProducts([]);
      setLoading(false);
      navigate('/categories');
      return false;
    }
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name, max_delivery_radius_km, is_restricted')
        .eq('id', parseInt(categoryId, 10))
        .single();
      if (error) throw error;
      // Allow restricted categories on category page regardless of entry path
      setCategoryName(data?.name || '');
      return true;
    } catch (err) {
      toast.error(`Failed to fetch category details: ${err.message || 'Unknown error'}`, {
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
      return false;
    }
  }, [categoryId, navigate]);

  const fetchRelatedCategories = useCallback(async () => {
    if (!categoryId || categoryId === 'undefined' || isNaN(parseInt(categoryId, 10))) {
      console.warn('Invalid or missing categoryId for related categories fetch:', categoryId);
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('category_relationships')
        .select('related_category_id')
        .eq('source_category_id', parseInt(categoryId, 10))
        .order('weight', { ascending: false });
      if (error) throw error;
      return data.map((rel) => rel.related_category_id);
    } catch (err) {
      console.error('Error fetching related categories:', err);
      return [];
    }
  }, [categoryId]);

  const fetchProducts = useCallback(async () => {
    if (!checkNetworkStatus()) {
      setLoading(false);
      return;
    }

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
      setRelatedProducts([]);
      setLoading(false);
      return;
    }

    const isValidCategory = await fetchCategoryName();
    if (!isValidCategory) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch sellers data once for both main and related products
      const { data: sellersData, error: sellersError } = await supabase
        .from('sellers')
        .select('id, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (sellersError) throw sellersError;

      // Fetch main products
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
          categories (max_delivery_radius_km, is_restricted, name)
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

      const nearbyProducts = processProducts(productsData, variantData, sellersData, buyerLocation);

      setProducts(nearbyProducts);

      // Fetch related products only if no nearby products are found
      let relatedProducts = [];
      if (nearbyProducts.length === 0) {
        const relatedCategoryIds = await fetchRelatedCategories();
        if (relatedCategoryIds.length > 0) {
          const { data: relatedProductsData, error: relatedProductsError } = await supabase
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
              categories (max_delivery_radius_km, is_restricted, name)
            `)
            .in('category_id', relatedCategoryIds)
            .eq('is_approved', true)
            .eq('status', 'active');
          if (relatedProductsError) throw relatedProductsError;

          const relatedProductIds = relatedProductsData.map((product) => product.id);

          const { data: relatedVariantData, error: relatedVariantError } = await supabase
            .from('product_variants')
            .select('id, product_id, price, original_price, stock, attributes, images')
            .eq('status', 'active')
            .in('product_id', relatedProductIds);
          if (relatedVariantError) throw relatedVariantError;

          relatedProducts = processProducts(relatedProductsData, relatedVariantData, sellersData, buyerLocation);
        }
      }

      if (nearbyProducts.length === 0 && relatedProducts.length === 0) {
        toast(`No ${categoryName || 'products'} found within delivery radius for this category or related categories.`, {
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
      } else if (nearbyProducts.length === 0 && relatedProducts.length > 0) {
        toast(`No ${categoryName || 'products'} found in this category, but we found related products you might like!`, {
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

      setRelatedProducts(relatedProducts);
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
      setRelatedProducts([]);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [buyerLocation, categoryId, categoryName, fetchCategoryName, fetchRelatedCategories]);

  const validateVariant = async (variantId) => {
    if (!variantId) return true;
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id')
        .eq('id', variantId)
        .eq('status', 'active')
        .single();
      if (error || !data) return false;
      return true;
    } catch (err) {
      console.error('Error validating variant:', err);
      return false;
    }
  };

  const addToCart = async (product, redirect = false) => {
    if (!product || !product.id || !product.name || product.displayPrice === undefined) {
      invalidProductToast();
      return;
    }
    if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
      outOfStockToast();
      return;
    }
    if (!session?.user) {
      authRequiredToast(redirect ? 'proceed to checkout' : 'add items to cart');
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
        toast(`Please select this category from the categories page to ${redirect ? 'proceed to checkout' : 'add products to cart'}.`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: 'var(--toastify-color-info)',
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
        if (updateError) throw new Error(updateError.message || 'Failed to update cart');
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
        if (insertError) throw new Error(insertError.message || 'Failed to add to cart');
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

      if (redirect) {
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

  const handleBuyNow = (product) => addToCart(product, true);

  useEffect(() => {
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
  }, [buyerLocation, setBuyerLocation, fetchProducts]);

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
  const relatedProductList = relatedProducts.map((product, index) => ({
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
        <meta property="og:image" content={products[0]?.images[0] || relatedProducts[0]?.images[0] || DEFAULT_IMAGE} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={products[0]?.images[0] || relatedProducts[0]?.images[0] || DEFAULT_IMAGE} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: [...productList, ...relatedProductList],
          })}
        </script>
      </Helmet>
      {products.length === 0 && relatedProducts.length === 0 ? (
        <>
          <div className="prod-no-items">No products found within delivery radius for this category or related categories.</div>
          <div className="prod-suggestion">
            Try browsing other categories or check back later.
            <button onClick={() => navigate('/categories')} className="prod-retry-btn">
              Browse Categories
            </button>
          </div>
          <img src={icon} alt="Markeet Logo" className="prod-icon" />
        </>
      ) : (
        <>
          <h2 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h2>
          {products.length > 0 ? (
            <div className="prod-grid">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="prod-item"
                  onClick={() => {
                    navigate(`/product/${product.id}`, {
                      state: {
                        fromCategory: true,
                        categoryId: categoryId,
                        categoryName: categoryName,
                        scrollPosition: window.scrollY
                      }
                    });
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/product/${product.id}`, {
                        state: {
                          fromCategory: true,
                          categoryId: categoryId,
                          categoryName: categoryName,
                          scrollPosition: window.scrollY
                        }
                      });
                    }
                  }}
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
          ) : (
            <div className="prod-no-items">No products found within delivery radius for this category.</div>
          )}
          {relatedProducts.length > 0 && (
            <>
              <h2 className="prod-title">Related Products</h2>
              <div className="prod-grid">
                {relatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="prod-item"
                    onClick={() => {
                      navigate(`/product/${product.id}`, {
                        state: {
                          fromCategory: true,
                          categoryId: categoryId,
                          categoryName: categoryName,
                          scrollPosition: window.scrollY
                        }
                      });
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        navigate(`/product/${product.id}`, {
                          state: {
                            fromCategory: true,
                            categoryId: categoryId,
                            categoryName: categoryName,
                            scrollPosition: window.scrollY
                          }
                        });
                      }
                    }}
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
                    <p className="prod-item-category">Category: {product.categoryName}</p>
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
            </>
          )}
          <img src={icon} alt="Markeet Logo" className="prod-icon" />
        </>
      )}
      <Footer />
    </div>
  );
}

export default React.memo(Products);