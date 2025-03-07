// import React, { useState, useEffect } from 'react';
// import { useSearchParams, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';

// function Products() {
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           fetchProducts(userLocation);
//         },
//         (error) => {
//           console.error('Geolocation error:', error);
//           const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//           setLocation(bengaluruLocation);
//           fetchProducts(bengaluruLocation);
//         }
//       );
//     } else {
//       const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//       setLocation(bengaluruLocation);
//       fetchProducts(bengaluruLocation);
//     }
//   }, [categoryId]);

//   const fetchProducts = async (userLocation) => {
//     if (!userLocation || !categoryId) return;

//     try {
//       console.log('Fetching products with location:', userLocation, 'for category:', categoryId);
//       // First, try nearby products (20 km)
//       let { data, error: rpcError } = await supabase.rpc('nearby_products', {
//         user_lon: userLocation.lon,
//         user_lat: userLocation.lat,
//         max_distance_meters: 20000,
//         include_long_distance: false,
//       }).eq('category_id', parseInt(categoryId, 10)); // Ensure categoryId is an integer

//       if (rpcError) {
//         console.error('RPC error (nearby):', rpcError);
//         setError(`Error fetching nearby products: ${rpcError.message}`);
//       } else if (!data || data.length === 0) {
//         console.log('No nearby products, fetching with long-distance...');
//         // Fall back to long-distance products
//         ({ data, error: rpcError } = await supabase.rpc('nearby_products', {
//           user_lon: userLocation.lon,
//           user_lat: userLocation.lat,
//           max_distance_meters: 20000,
//           include_long_distance: true,
//         }).eq('category_id', parseInt(categoryId, 10)));
//         if (rpcError) throw rpcError;
//         console.log('Long-distance products:', data);
//       }

//       if (data) {
//         console.log('Products with category_id and images:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//         })));
//       } else {
//         // Fallback to all approved products in the category
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('products')
//           .select('id, category_id, name, price, images, sellers(location, allows_long_distance)')
//           .eq('category_id', parseInt(categoryId, 10))
//           .eq('is_approved', true);
//         if (fallbackError) {
//           console.error('Fallback error:', fallbackError);
//           setError(`Fallback error: ${fallbackError.message}`);
//           setProducts([]);
//         } else {
//           console.log('Fallback products with category_id and images:', fallbackData);
//           setProducts(fallbackData.map(product => ({
//             ...product,
//             images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//           })));
//         }
//       }
//     } catch (error) {
//       console.error('Unexpected error:', error);
//       setError(`Unexpected error: ${error.message}`);
//       // Fallback to all approved products in the category
//       const { data, error: fallbackError } = await supabase
//         .from('products')
//         .select('id, category_id, name, price, images, sellers(location, allows_long_distance)')
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true);
//       if (fallbackError) console.error(fallbackError);
//       else setProducts(data.map(product => ({
//         ...product,
//         images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//       })));
//     }
//   };

//   return (
//     <div className="products-page">
//       <h1>Products in Category</h1>
//       <div className="product-grid">
//         {error && <p style={{ color: 'red' }}>{error}</p>}
//         {products.map((product) => (
//           <div key={product.id} className="product-card">
//             <img 
//               src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//               alt={product.name} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/150'; 
//                 console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//               }}
//               style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
//             />
//             <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//             <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>
//               {product.distance_km 
//                 ? `${product.distance_km.toFixed(1)} km away${product.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
//                 : 'Distance TBD'}
//             </p>
//             <p style={{ color: '#666' }}>Category ID: {product.category_id || 'Unknown'}</p>
//             <Link to={`/product/${product.id}`} className="view-details-btn">
//               View Details
//             </Link>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default Products;


// import React, { useState, useEffect } from 'react';
// import { useSearchParams, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';

// function Products() {
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           fetchProducts(userLocation);
//         },
//         (error) => {
//           console.error('Geolocation error:', error);
//           const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//           setLocation(bengaluruLocation);
//           fetchProducts(bengaluruLocation);
//         }
//       );
//     } else {
//       const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//       setLocation(bengaluruLocation);
//       fetchProducts(bengaluruLocation);
//     }
//   }, [categoryId]);

//   const fetchProducts = async (userLocation) => {
//     if (!userLocation || !categoryId) return;

//     try {
//       console.log('Fetching products with location:', userLocation, 'for category:', categoryId);
//       // First, try nearby products (20 km)
//       let { data, error: rpcError } = await supabase.rpc('nearby_products', {
//         user_lon: userLocation.lon,
//         user_lat: userLocation.lat,
//         max_distance_meters: 20000,
//         include_long_distance: false,
//       }).eq('category_id', parseInt(categoryId, 10)); // Ensure categoryId is an integer

//       if (rpcError) {
//         console.error('RPC error (nearby):', rpcError);
//         setError(`Error fetching nearby products: ${rpcError.message}`);
//       } else if (!data || data.length === 0) {
//         console.log('No nearby products, fetching with long-distance...');
//         // Fall back to long-distance products
//         ({ data, error: rpcError } = await supabase.rpc('nearby_products', {
//           user_lon: userLocation.lon,
//           user_lat: userLocation.lat,
//           max_distance_meters: 20000,
//           include_long_distance: true,
//         }).eq('category_id', parseInt(categoryId, 10)));
//         if (rpcError) throw rpcError;
//         console.log('Long-distance products:', data);
//       }

//       if (data) {
//         console.log('Products with category_id and images:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           name: product.name || 'Unnamed Product', // Fallback for missing name
//           images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//         })));
//       } else {
//         // Fallback to all approved products in the category
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('products')
//           .select('id, category_id, name, price, images, sellers(location, allows_long_distance)')
//           .eq('category_id', parseInt(categoryId, 10))
//           .eq('is_approved', true);
//         if (fallbackError) {
//           console.error('Fallback error:', fallbackError);
//           setError(`Fallback error: ${fallbackError.message}`);
//           setProducts([]);
//         } else {
//           console.log('Fallback products with category_id and images:', fallbackData);
//           setProducts(fallbackData.map(product => ({
//             ...product,
//             name: product.name || 'Unnamed Product', // Fallback for missing name
//             images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//           })));
//         }
//       }
//     } catch (error) {
//       console.error('Unexpected error:', error);
//       setError(`Unexpected error: ${error.message}`);
//       // Fallback to all approved products in the category
//       const { data, error: fallbackError } = await supabase
//         .from('products')
//         .select('id, category_id, name, price, images, sellers(location, allows_long_distance)')
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true);
//       if (fallbackError) console.error(fallbackError);
//       else setProducts(data.map(product => ({
//         ...product,
//         name: product.name || 'Unnamed Product', // Fallback for missing name
//         images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//       })));
//     }
//   };

//   return (
//     <div className="products-page">
//       <h1 style={{ color: '#007bff' }}>FreshCart Products in Category</h1>
//       <div className="product-grid">
//         {error && <p style={{ color: '#ff0000' }}>{error}</p>}
//         {products.map((product) => (
//           <div key={product.id} className="product-card">
//             <img 
//               src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//               alt={product.name} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/150'; 
//                 console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//               }}
//               style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
//             />
//             <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//             <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>
//               {product.distance_km 
//                 ? `${product.distance_km.toFixed(1)} km away${product.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
//                 : 'Distance TBD'}
//             </p>
//             <p style={{ color: '#666' }}>Category ID: {product.category_id || 'Unknown'}</p>
//             <Link to={`/product/${product.id}`} className="view-details-btn" style={{ color: '#007bff', textDecoration: 'none' }}>
//               View Details
//             </Link>
//           </div>
//         ))}
//       </div>
//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Products;


// import React, { useState, useEffect } from 'react';
// import { useSearchParams, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';

// function Products() {
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(''); // Add message state
//   const [cartItems, setCartItems] = useState([]); // Add cartItems state

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           fetchProducts(userLocation);
//           fetchCartItems(); // Fetch cart items on mount
//         },
//         (error) => {
//           console.error('Geolocation error:', error);
//           const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//           setLocation(bengaluruLocation);
//           fetchProducts(bengaluruLocation);
//           fetchCartItems(); // Fetch cart items on mount
//         }
//       );
//     } else {
//       const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//       setLocation(bengaluruLocation);
//       fetchProducts(bengaluruLocation);
//       fetchCartItems(); // Fetch cart items on mount
//     }
//   }, [categoryId]);

//   const fetchProducts = async (userLocation) => {
//     if (!userLocation || !categoryId) return;

//     try {
//       console.log('Fetching products with location:', userLocation, 'for category:', categoryId);
//       // First, try nearby products (20 km)
//       let { data, error: rpcError } = await supabase.rpc('nearby_products', {
//         user_lon: userLocation.lon,
//         user_lat: userLocation.lat,
//         max_distance_meters: 20000,
//         include_long_distance: false,
//       }).eq('category_id', parseInt(categoryId, 10)) // Ensure categoryId is an integer
//         .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)'); // Include both title and name

//       if (rpcError) {
//         console.error('RPC error (nearby):', rpcError);
//         setError(`Error fetching nearby products: ${rpcError.message}`);
//       } else if (!data || data.length === 0) {
//         console.log('No nearby products, fetching with long-distance...');
//         // Fall back to long-distance products
//         ({ data, error: rpcError } = await supabase.rpc('nearby_products', {
//           user_lon: userLocation.lon,
//           user_lat: userLocation.lat,
//           max_distance_meters: 20000,
//           include_long_distance: true,
//         }).eq('category_id', parseInt(categoryId, 10))
//           .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)')); // Include both title and name
//         if (rpcError) throw rpcError;
//         console.log('Long-distance products:', data);
//       }

//       if (data) {
//         console.log('Products with category_id, title, and name:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           name: product.title || product.name || 'Unnamed Product', // Fallback to title, then name, then 'Unnamed Product'
//           images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//         })));
//       } else {
//         // Fallback to all approved products in the category
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('products')
//           .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)') // Include both title and name
//           .eq('category_id', parseInt(categoryId, 10))
//           .eq('is_approved', true);
//         if (fallbackError) {
//           console.error('Fallback error:', fallbackError);
//           setError(`Fallback error: ${fallbackError.message}`);
//           setProducts([]);
//         } else {
//           console.log('Fallback products with category_id, title, and name:', fallbackData);
//           setProducts(fallbackData.map(product => ({
//             ...product,
//             name: product.title || product.name || 'Unnamed Product', // Fallback to title, then name, then 'Unnamed Product'
//             images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//           })));
//         }
//       }
//     } catch (error) {
//       console.error('Unexpected error:', error);
//       setError(`Unexpected error: ${error.message}`);
//       // Fallback to all approved products in the category
//       const { data, error: fallbackError } = await supabase
//         .from('products')
//         .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)') // Include both title and name
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true);
//       if (fallbackError) console.error(fallbackError);
//       else setProducts(data.map(product => ({
//         ...product,
//         name: product.title || product.name || 'Unnamed Product', // Fallback to title, then name, then 'Unnamed Product'
//         images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//       })));
//     }
//   };

//   // Fetch cart items from Supabase or localStorage
//   const fetchCartItems = async () => {
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }

//       // Optionally fetch from Supabase if using a database
//       const userId = session.user.id;
//       const { data, error } = await supabase
//         .from('cart')
//         .select('id, product_id, title, price, quantity')
//         .eq('user_id', userId);

//       if (error) {
//         // Fallback to localStorage if Supabase cart isn’t set up
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(storedCart);
//       } else {
//         setCartItems(data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching cart items:', error);
//       // Fallback to localStorage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);
//       setError(`Error: ${error.message || 'Failed to load cart. Falling back to local storage.'}`);
//     }
//   };

//   // Add product to cart with validation
//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.title || !product.price) {
//       console.error('Invalid product added to cart:', product);
//       setError('Cannot add invalid product to cart. Please try again.');
//       return;
//     }

//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }

//       // Use localStorage for cart (fall back to Supabase if needed later)
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existingItem = storedCart.find(item => item.id === product.id);

//       if (existingItem) {
//         // Update quantity if product exists in cart
//         const updatedCart = storedCart.map(item =>
//           item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
//         );
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       } else {
//         // Add new product to cart
//         const newCartItem = {
//           id: product.id,
//           title: product.title,
//           price: product.price,
//           quantity: 1,
//         };
//         localStorage.setItem('cart', JSON.stringify([...storedCart, newCartItem]));
//       }
//       setMessage('Product added to cart successfully!'); // Use setMessage
//       setCartItems(JSON.parse(localStorage.getItem('cart')) || []); // Update cart state
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       setError(`Error: ${error.message || 'Failed to add product to cart. Please try again later.'}`);
//     }
//   };

//   return (
//     <div className="products-page">
//       <h1 style={{ color: '#007bff' }}>FreshCart Products in Category</h1>
//       <div className="product-grid">
//         {error && <p style={{ color: '#ff0000' }}>{error}</p>}
//         {message && <p style={{ color: '#007bff' }}>{message}</p>} {/* Display message */}
//         {products.map((product) => (
//           <div key={product.id} className="product-card">
//             <img 
//               src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//               alt={product.name} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/150'; 
//                 console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//               }}
//               style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
//             />
//             <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//             <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>
//               {product.distance_km 
//                 ? `${product.distance_km.toFixed(1)} km away${product.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
//                 : 'Distance TBD'}
//             </p>
//             <p style={{ color: '#666' }}>Category ID: {product.category_id || 'Unknown'}</p>
//             <button 
//               onClick={() => addToCart(product)} 
//               className="add-to-cart-btn" 
//               style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//             >
//               Add to Cart
//             </button>
//             <Link to={`/product/${product.id}`} className="view-details-btn" style={{ color: '#007bff', textDecoration: 'none' }}>
//               View Details
//             </Link>
//           </div>
//         ))}
//       </div>
//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Products;


// import React, { useState, useEffect, useCallback } from 'react';
// import { useSearchParams, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';

// function Products() {
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(''); // Add message state
//   const [cartItems, setCartItems] = useState([]); // Add cartItems state
//   const [showProductModal, setShowProductModal] = useState(null); // State for product modal
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           fetchProducts(userLocation);
//           fetchCartItems(); // Fetch cart items on mount
//         },
//         (error) => {
//           console.error('Geolocation error:', error);
//           const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//           setLocation(bengaluruLocation);
//           fetchProducts(bengaluruLocation);
//           fetchCartItems(); // Fetch cart items on mount
//         }
//       );
//     } else {
//       const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//       setLocation(bengaluruLocation);
//       fetchProducts(bengaluruLocation);
//       fetchCartItems(); // Fetch cart items on mount
//     }
//   }, [categoryId]);

//   const fetchProducts = async (userLocation) => {
//     if (!userLocation || !categoryId) return;

//     try {
//       console.log('Fetching products with location:', userLocation, 'for category:', categoryId);
//       // First, try nearby products (20 km)
//       let { data, error: rpcError } = await supabase.rpc('nearby_products', {
//         user_lon: userLocation.lon,
//         user_lat: userLocation.lat,
//         max_distance_meters: 20000,
//         include_long_distance: false,
//       }).eq('category_id', parseInt(categoryId, 10)) // Ensure categoryId is an integer
//         .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)'); // Include both title and name

//       if (rpcError) {
//         console.error('RPC error (nearby):', rpcError);
//         setError(`Error fetching nearby products: ${rpcError.message}`);
//       } else if (!data || data.length === 0) {
//         console.log('No nearby products, fetching with long-distance...');
//         // Fall back to long-distance products
//         ({ data, error: rpcError } = await supabase.rpc('nearby_products', {
//           user_lon: userLocation.lon,
//           user_lat: userLocation.lat,
//           max_distance_meters: 20000,
//           include_long_distance: true,
//         }).eq('category_id', parseInt(categoryId, 10))
//           .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)')); // Include both title and name
//         if (rpcError) throw rpcError;
//         console.log('Long-distance products:', data);
//       }

//       if (data) {
//         console.log('Products with category_id, title, and name:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           name: product.title || product.name || 'Unnamed Product', // Fallback to title, then name, then 'Unnamed Product'
//           images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//         })));
//       } else {
//         // Fallback to all approved products in the category
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('products')
//           .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)') // Include both title and name
//           .eq('category_id', parseInt(categoryId, 10))
//           .eq('is_approved', true);
//         if (fallbackError) {
//           console.error('Fallback error:', fallbackError);
//           setError(`Fallback error: ${fallbackError.message}`);
//           setProducts([]);
//         } else {
//           console.log('Fallback products with category_id, title, and name:', fallbackData);
//           setProducts(fallbackData.map(product => ({
//             ...product,
//             name: product.title || product.name || 'Unnamed Product', // Fallback to title, then name, then 'Unnamed Product'
//             images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//           })));
//         }
//       }
//     } catch (error) {
//       console.error('Unexpected error:', error);
//       setError(`Unexpected error: ${error.message}`);
//       // Fallback to all approved products in the category
//       const { data, error: fallbackError } = await supabase
//         .from('products')
//         .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)') // Include both title and name
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true);
//       if (fallbackError) console.error(fallbackError);
//       else setProducts(data.map(product => ({
//         ...product,
//         name: product.title || product.name || 'Unnamed Product', // Fallback to title, then name, then 'Unnamed Product'
//         images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//       })));
//     }
//   };

//   // Fetch cart items from Supabase or localStorage
//   const fetchCartItems = async () => {
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }

//       // Optionally fetch from Supabase if using a database
//       const userId = session.user.id;
//       const { data, error } = await supabase
//         .from('cart')
//         .select('id, product_id, title, price, quantity')
//         .eq('user_id', userId);

//       if (error) {
//         // Fallback to localStorage if Supabase cart isn’t set up
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(storedCart);
//       } else {
//         setCartItems(data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching cart items:', error);
//       // Fallback to localStorage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);
//       setError(`Error: ${error.message || 'Failed to load cart. Falling back to local storage.'}`);
//     }
//   };

//   // Add product to cart with validation
//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.title || !product.price) {
//       console.error('Invalid product added to cart:', product);
//       setError('Cannot add invalid product to cart. Please try again.');
//       return;
//     }

//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }

//       // Use localStorage for cart (fall back to Supabase if needed later)
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existingItem = storedCart.find(item => item.id === product.id);

//       if (existingItem) {
//         // Update quantity if product exists in cart
//         const updatedCart = storedCart.map(item =>
//           item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
//         );
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       } else {
//         // Add new product to cart
//         const newCartItem = {
//           id: product.id,
//           title: product.title,
//           price: product.price,
//           quantity: 1,
//         };
//         localStorage.setItem('cart', JSON.stringify([...storedCart, newCartItem]));
//       }
//       setMessage('Product added to cart successfully!'); // Use setMessage
//       setCartItems(JSON.parse(localStorage.getItem('cart')) || []); // Update cart state
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       setError(`Error: ${error.message || 'Failed to add product to cart. Please try again later.'}`);
//     }
//   };

//   // Handle product card click to show details in a modal
//   const handleProductClick = (product) => {
//     setShowProductModal(product);
//   };

//   // Handle buy now click to redirect to cart
//   const handleBuyNow = (product) => {
//     navigate('/cart', { state: { product } });
//   };

//   return (
//     <div className="products-page">
//       <h1 style={{ color: '#007bff' }}>FreshCart Products in Category</h1>
//       <div className="product-grid">
//         {error && <p style={{ color: '#ff0000' }}>{error}</p>}
//         {message && <p style={{ color: '#007bff' }}>{message}</p>} {/* Display message */}
//         {products.map((product) => (
//           <div 
//             key={product.id} 
//             className="product-card" 
//             onClick={() => handleProductClick(product)}
//             style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}
//           >
//             <img 
//               src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//               alt={product.name} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/150'; 
//                 console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//               }}
//               style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
//             />
//             <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//             <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>
//               {product.distance_km 
//                 ? `${product.distance_km.toFixed(1)} km away${product.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
//                 : 'Distance TBD'}
//             </p>
//             <p style={{ color: '#666' }}>Category ID: {product.category_id || 'Unknown'}</p>
//             <button 
//               onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
//               className="add-to-cart-btn" 
//               style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
//             >
//               Add to Cart
//             </button>
//             <button 
//               onClick={(e) => { e.stopPropagation(); handleBuyNow(product); }} 
//               className="buy-now-btn" 
//               style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//             >
//               Buy Now
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* Product Details Modal */}
//       {showProductModal && (
//         <div className="modal" onClick={() => setShowProductModal(null)}>
//           <div className="modal-content" onClick={e => e.stopPropagation()}>
//             <h2 style={{ color: '#007bff' }}>{showProductModal.name}</h2>
//             <img 
//               src={showProductModal.images?.[0] ? showProductModal.images[0] : 'https://dummyimage.com/300'} 
//               alt={showProductModal.name} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/300'; 
//                 console.error('Image load failed for:', showProductModal.name, 'URL:', showProductModal.images?.[0]); 
//               }}
//               style={{ width: '100%', height: '300px', objectFit: 'contain', borderRadius: '4px' }}
//             />
//             <p style={{ color: '#666' }}>Price: ₹{showProductModal.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>
//               Distance: {showProductModal.distance_km 
//                 ? `${showProductModal.distance_km.toFixed(1)} km${showProductModal.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
//                 : 'Distance TBD'}
//             </p>
//             <p style={{ color: '#666' }}>Category ID: {showProductModal.category_id || 'Unknown'}</p>
//             <div className="modal-actions" style={{ marginTop: '20px' }}>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); addToCart(showProductModal); setShowProductModal(null); }} 
//                 className="add-to-cart-btn" 
//                 style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
//               >
//                 Add to Cart
//               </button>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); handleBuyNow(showProductModal); setShowProductModal(null); }} 
//                 className="buy-now-btn" 
//                 style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//               >
//                 Buy Now
//               </button>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); setShowProductModal(null); }} 
//                 className="close-btn" 
//                 style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Products;


// import React, { useState, useEffect, useCallback } from 'react';
// import { useSearchParams, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';

// function Products() {
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(''); // Add message state
//   const [cartItems, setCartItems] = useState([]); // Add cartItems state
//   const [showProductModal, setShowProductModal] = useState(null); // State for product modal
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           fetchProducts(userLocation);
//           fetchCartItems(); // Fetch cart items on mount
//         },
//         (error) => {
//           console.error('Geolocation error:', error);
//           const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//           setLocation(bengaluruLocation);
//           fetchProducts(bengaluruLocation);
//           fetchCartItems(); // Fetch cart items on mount
//         }
//       );
//     } else {
//       const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//       setLocation(bengaluruLocation);
//       fetchProducts(bengaluruLocation);
//       fetchCartItems(); // Fetch cart items on mount
//     }
//   }, [categoryId]);

//   const fetchProducts = async (userLocation) => {
//     if (!userLocation || !categoryId) return;

//     try {
//       console.log('Fetching products with location:', userLocation, 'for category:', categoryId);
//       // First, try nearby products (20 km)
//       let { data, error: rpcError } = await supabase.rpc('nearby_products', {
//         user_lon: userLocation.lon,
//         user_lat: userLocation.lat,
//         max_distance_meters: 20000,
//         include_long_distance: false,
//       }).eq('category_id', parseInt(categoryId, 10)) // Ensure categoryId is an integer
//         .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)'); // Include both title and name

//       if (rpcError) {
//         console.error('RPC error (nearby):', rpcError);
//         setError(`Error fetching nearby products: ${rpcError.message}`);
//       } else if (!data || data.length === 0) {
//         console.log('No nearby products, fetching with long-distance...');
//         // Fall back to long-distance products
//         ({ data, error: rpcError } = await supabase.rpc('nearby_products', {
//           user_lon: userLocation.lon,
//           user_lat: userLocation.lat,
//           max_distance_meters: 20000,
//           include_long_distance: true,
//         }).eq('category_id', parseInt(categoryId, 10))
//           .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)')); // Include both title and name
//         if (rpcError) throw rpcError;
//         console.log('Long-distance products:', data);
//       }

//       if (data) {
//         console.log('Products with category_id, title, and name:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           name: product.title || product.name || 'Unnamed Product', // Fallback to title, then name, then 'Unnamed Product'
//           images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//         })));
//       } else {
//         // Fallback to all approved products in the category
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('products')
//           .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)') // Include both title and name
//           .eq('category_id', parseInt(categoryId, 10))
//           .eq('is_approved', true);
//         if (fallbackError) {
//           console.error('Fallback error:', fallbackError);
//           setError(`Fallback error: ${fallbackError.message}`);
//           setProducts([]);
//         } else {
//           console.log('Fallback products with category_id, title, and name:', fallbackData);
//           setProducts(fallbackData.map(product => ({
//             ...product,
//             name: product.title || product.name || 'Unnamed Product', // Fallback to title, then name, then 'Unnamed Product'
//             images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//           })));
//         }
//       }
//     } catch (error) {
//       console.error('Unexpected error:', error);
//       setError(`Unexpected error: ${error.message}`);
//       // Fallback to all approved products in the category
//       const { data, error: fallbackError } = await supabase
//         .from('products')
//         .select('id, category_id, title, name, price, images, sellers(location, allows_long_distance)') // Include both title and name
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true);
//       if (fallbackError) console.error(fallbackError);
//       else setProducts(data.map(product => ({
//         ...product,
//         name: product.title || product.name || 'Unnamed Product', // Fallback to title, then name, then 'Unnamed Product'
//         images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//       })));
//     }
//   };

//   // Fetch cart items from Supabase or localStorage
//   const fetchCartItems = async () => {
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }

//       // Optionally fetch from Supabase if using a database
//       const userId = session.user.id;
//       const { data, error } = await supabase
//         .from('cart')
//         .select('id, product_id, title, price, quantity')
//         .eq('user_id', userId);

//       if (error) {
//         // Fallback to localStorage if Supabase cart isn’t set up
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(storedCart);
//       } else {
//         setCartItems(data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching cart items:', error);
//       // Fallback to localStorage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);
//       setError(`Error: ${error.message || 'Failed to load cart. Falling back to local storage.'}`);
//     }
//   };

//   // Add product to cart with validation
//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.title || !product.price) {
//       console.error('Invalid product added to cart:', product);
//       setError('Cannot add invalid product to cart. Please try again.');
//       return;
//     }

//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }

//       // Use localStorage for cart (fall back to Supabase if needed later)
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const existingItem = storedCart.find(item => item.id === product.id);

//       if (existingItem) {
//         // Update quantity if product exists in cart
//         const updatedCart = storedCart.map(item =>
//           item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
//         );
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       } else {
//         // Add new product to cart
//         const newCartItem = {
//           id: product.id,
//           title: product.title,
//           price: product.price,
//           quantity: 1,
//         };
//         localStorage.setItem('cart', JSON.stringify([...storedCart, newCartItem]));
//       }
//       setMessage('Product added to cart successfully!'); // Use setMessage
//       setCartItems(JSON.parse(localStorage.getItem('cart')) || []); // Update cart state
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       setError(`Error: ${error.message || 'Failed to add product to cart. Please try again later.'}`);
//     }
//   };

//   // Handle product card click to show details in a modal
//   const handleProductClick = (product) => {
//     setShowProductModal(product);
//   };

//   // Handle buy now click to redirect to cart
//   const handleBuyNow = (product) => {
//     navigate('/cart', { state: { product } });
//   };

//   return (
//     <div className="products-page">
//       <h1 style={{ color: '#007bff' }}>FreshCart Products in Category</h1>
//       <div className="product-grid">
//         {error && <p style={{ color: '#ff0000' }}>{error}</p>}
//         {message && <p style={{ color: '#007bff' }}>{message}</p>} {/* Display message */}
//         {products.map((product) => (
//           <div 
//             key={product.id} 
//             className="product-card" 
//             onClick={() => handleProductClick(product)}
//             style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}
//           >
//             <img 
//               src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//               alt={product.name} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/150'; 
//                 console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//               }}
//               style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
//             />
//             <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//             <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>
//               {product.distance_km 
//                 ? `${product.distance_km.toFixed(1)} km away${product.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
//                 : 'Distance TBD'}
//             </p>
//             <p style={{ color: '#666' }}>Category ID: {product.category_id || 'Unknown'}</p>
//             <button 
//               onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
//               className="add-to-cart-btn" 
//               style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
//             >
//               Add to Cart
//             </button>
//             <button 
//               onClick={(e) => { e.stopPropagation(); handleBuyNow(product); }} 
//               className="buy-now-btn" 
//               style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//             >
//               Buy Now
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* Product Details Modal */}
//       {showProductModal && (
//         <div className="modal" onClick={() => setShowProductModal(null)}>
//           <div className="modal-content" onClick={e => e.stopPropagation()}>
//             <h2 style={{ color: '#007bff' }}>{showProductModal.name}</h2>
//             <img 
//               src={showProductModal.images?.[0] ? showProductModal.images[0] : 'https://dummyimage.com/300'} 
//               alt={showProductModal.name} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/300'; 
//                 console.error('Image load failed for:', showProductModal.name, 'URL:', showProductModal.images?.[0]); 
//               }}
//               style={{ width: '100%', height: '300px', objectFit: 'contain', borderRadius: '4px' }}
//             />
//             <p style={{ color: '#666' }}>Price: ₹{showProductModal.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>
//               Distance: {showProductModal.distance_km 
//                 ? `${showProductModal.distance_km.toFixed(1)} km${showProductModal.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
//                 : 'Distance TBD'}
//             </p>
//             <p style={{ color: '#666' }}>Category ID: {showProductModal.category_id || 'Unknown'}</p>
//             <div className="modal-actions" style={{ marginTop: '20px' }}>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); addToCart(showProductModal); setShowProductModal(null); }} 
//                 className="add-to-cart-btn" 
//                 style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
//               >
//                 Add to Cart
//               </button>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); handleBuyNow(showProductModal); setShowProductModal(null); }} 
//                 className="buy-now-btn" 
//                 style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//               >
//                 Buy Now
//               </button>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); setShowProductModal(null); }} 
//                 className="close-btn" 
//                 style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Products;


// import React, { useState, useEffect, useCallback } from 'react';
// import { useSearchParams, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';

// function Products() {
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(''); 
//   const [cartItems, setCartItems] = useState([]); 
//   const [showProductModal, setShowProductModal] = useState(null); 
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           fetchProducts(userLocation);
//           fetchCartItems(); 
//         },
//         (error) => {
//           console.error('Geolocation error:', error);
//           const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; 
//           setLocation(bengaluruLocation);
//           fetchProducts(bengaluruLocation);
//           fetchCartItems(); 
//         }
//       );
//     } else {
//       const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; 
//       setLocation(bengaluruLocation);
//       fetchProducts(bengaluruLocation);
//       fetchCartItems(); 
//     }
//   }, [categoryId]);

//   const fetchProducts = async (userLocation) => {
//     if (!userLocation || !categoryId) return;
//     try {
//       console.log('Fetching products with location:', userLocation, 'for category:', categoryId);
//       // Use the RPC function "nearby_products" and embed seller data using the explicit alias.
//       let { data, error: rpcError } = await supabase.rpc('nearby_products', {
//         user_lon: userLocation.lon,
//         user_lat: userLocation.lat,
//         max_distance_meters: 20000,
//         include_long_distance: false,
//       })
//       .eq('category_id', parseInt(categoryId, 10))
//       .select('id, category_id, title, name, price, images, sellers!products_seller_id_fkey(location, allows_long_distance)');

//       if (rpcError) {
//         console.error('RPC error (nearby):', rpcError);
//         setError(`Error fetching nearby products: ${rpcError.message}`);
//       } else if (!data || data.length === 0) {
//         console.log('No nearby products, fetching with long-distance...');
//         // Fall back to long-distance products
//         ({ data, error: rpcError } = await supabase.rpc('nearby_products', {
//           user_lon: userLocation.lon,
//           user_lat: userLocation.lat,
//           max_distance_meters: 20000,
//           include_long_distance: true,
//         })
//         .eq('category_id', parseInt(categoryId, 10))
//         .select('id, category_id, title, name, price, images, sellers!products_seller_id_fkey(location, allows_long_distance)'));
//         if (rpcError) throw rpcError;
//         console.log('Long-distance products:', data);
//       }

//       if (data) {
//         console.log('Products:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           name: product.title || product.name || 'Unnamed Product',
//           images: Array.isArray(product.images) ? product.images : [],
//         })));
//       } else {
//         // Fallback query if RPC fails.
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('products')
//           .select('id, category_id, title, name, price, images, sellers!products_seller_id_fkey(location, allows_long_distance)')

//           .eq('category_id', parseInt(categoryId, 10))
//           .eq('is_approved', true);
//         if (fallbackError) {
//           console.error('Fallback error:', fallbackError);
//           setError(`Fallback error: ${fallbackError.message}`);
//           setProducts([]);
//         } else {
//           console.log('Fallback products:', fallbackData);
//           setProducts(fallbackData.map(product => ({
//             ...product,
//             name: product.title || product.name || 'Unnamed Product',
//             images: Array.isArray(product.images) ? product.images : [],
//           })));
//         }
//       }
//     } catch (error) {
//       console.error('Unexpected error:', error);
//       setError(`Unexpected error: ${error.message}`);
//       // Optional: fallback query here...
//     }
//   };

//   const fetchCartItems = async () => {
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }
//       const userId = session.user.id;
//       const { data, error } = await supabase
//         .from('cart')
//         .select('id, product_id, title, price, quantity')
//         .eq('user_id', userId);
//       if (error) {
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(storedCart);
//       } else {
//         setCartItems(data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching cart items:', error);
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);
//       setError(`Error: ${error.message || 'Failed to load cart. Falling back to local storage.'}`);
//     }
//   };

//   // Add product to cart
//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.title || !product.price) {
//       console.error('Invalid product added to cart:', product);
//       setError('Cannot add invalid product to cart. Please try again.');
//       return;
//     }
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
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
//           title: product.title,
//           price: product.price,
//           quantity: 1,
//         };
//         localStorage.setItem('cart', JSON.stringify([...storedCart, newCartItem]));
//       }
//       setMessage('Product added to cart successfully!');
//       setCartItems(JSON.parse(localStorage.getItem('cart')) || []);
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       setError(`Error: ${error.message || 'Failed to add product to cart. Please try again later.'}`);
//     }
//   };

//   // Handle product card click to show details in a modal
//   const handleProductClick = (product) => {
//     setShowProductModal(product);
//   };

//   // Handle buy now click to redirect to cart
//   const handleBuyNow = (product) => {
//     navigate('/cart', { state: { product } });
//   };

//   return (
//     <div className="products-page">
//       <h1 style={{ color: '#007bff' }}>FreshCart Products in Category</h1>
//       <div className="product-grid">
//         {error && <p style={{ color: '#ff0000' }}>{error}</p>}
//         {message && <p style={{ color: '#007bff' }}>{message}</p>}
//         {products.map((product) => (
//           <div 
//             key={product.id} 
//             className="product-card" 
//             onClick={() => handleProductClick(product)}
//             style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}
//           >
//             <img 
//               src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//               alt={product.name} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/150'; 
//                 console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//               }}
//               style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
//             />
//             <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//             <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>
//               {product.distance_km 
//                 ? `${product.distance_km.toFixed(1)} km away${product.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
//                 : 'Distance TBD'}
//             </p>
//             <p style={{ color: '#666' }}>Category ID: {product.category_id || 'Unknown'}</p>
//             <button 
//               onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
//               className="add-to-cart-btn" 
//               style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
//             >
//               Add to Cart
//             </button>
//             <button 
//               onClick={(e) => { e.stopPropagation(); handleBuyNow(product); }} 
//               className="buy-now-btn" 
//               style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//             >
//               Buy Now
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* Product Details Modal */}
//       {showProductModal && (
//         <div className="modal" onClick={() => setShowProductModal(null)}>
//           <div className="modal-content" onClick={e => e.stopPropagation()}>
//             <h2 style={{ color: '#007bff' }}>{showProductModal.name}</h2>
//             <img 
//               src={showProductModal.images?.[0] ? showProductModal.images[0] : 'https://dummyimage.com/300'} 
//               alt={showProductModal.name} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/300'; 
//                 console.error('Image load failed for:', showProductModal.name, 'URL:', showProductModal.images?.[0]); 
//               }}
//               style={{ width: '100%', height: '300px', objectFit: 'contain', borderRadius: '4px' }}
//             />
//             <p style={{ color: '#666' }}>Price: ₹{showProductModal.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>
//               Distance: {showProductModal.distance_km 
//                 ? `${showProductModal.distance_km.toFixed(1)} km${showProductModal.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
//                 : 'Distance TBD'}
//             </p>
//             <p style={{ color: '#666' }}>Category ID: {showProductModal.category_id || 'Unknown'}</p>
//             <div className="modal-actions" style={{ marginTop: '20px' }}>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); addToCart(showProductModal); setShowProductModal(null); }} 
//                 className="add-to-cart-btn" 
//                 style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
//               >
//                 Add to Cart
//               </button>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); handleBuyNow(showProductModal); setShowProductModal(null); }} 
//                 className="buy-now-btn" 
//                 style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//               >
//                 Buy Now
//               </button>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); setShowProductModal(null); }} 
//                 className="close-btn" 
//                 style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Products;


// import React, { useState, useEffect, useCallback } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';

// // Custom retry function for Supabase requests
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

// // Simple Haversine distance calculation (in kilometers)
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc) return null;
//   const R = 6371; // Radius of the Earth in km
//   let sellerLon, sellerLat;
//   if (sellerLoc.coordinates) {
//     [sellerLon, sellerLat] = sellerLoc.coordinates;
//   } else if (sellerLoc.x && sellerLoc.y) {
//     sellerLon = sellerLoc.x;
//     sellerLat = sellerLoc.y;
//   } else {
//     return null;
//   }
//   const dLat = (sellerLat - userLoc.lat) * (Math.PI / 180);
//   const dLon = (sellerLon - userLoc.lon) * (Math.PI / 180);
//   const a = Math.sin(dLat/2) ** 2 +
//             Math.cos(userLoc.lat * (Math.PI / 180)) *
//             Math.cos(sellerLat * (Math.PI / 180)) *
//             Math.sin(dLon/2) ** 2;
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
//   const navigate = useNavigate();
//   const [showProductModal, setShowProductModal] = useState(null);

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           fetchProducts(userLocation);
//           fetchCartItems();
//         },
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           const defaultLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//           setLocation(defaultLocation);
//           fetchProducts(defaultLocation);
//           fetchCartItems();
//         },
//         { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLocation = { lat: 12.9753, lon: 77.591 };
//       setLocation(defaultLocation);
//       fetchProducts(defaultLocation);
//       fetchCartItems();
//     }
//   }, [categoryId]);

//   const fetchProducts = useCallback(async (userLocation) => {
//     if (!userLocation || !categoryId) return;
//     try {
//       console.log('Fetching products with location:', userLocation, 'for category:', categoryId);
//       // Call the RPC function 'nearby_products_v1'
//       let { data, error: rpcError } = await retryRequest(() =>
//         supabase.rpc('nearby_products_v1', {
//           user_lon: userLocation.lon,
//           user_lat: userLocation.lat,
//           max_distance_meters: 20000,
//           include_long_distance: false,
//         })
//         .eq('category_id', parseInt(categoryId, 10))
//         .select(
//           'id, category_id, title, name, price, images, distance_km, sellers:products_seller_id_fkey(id, location, allows_long_distance)'
//         )
            
//       );
//       if (rpcError) {
//         console.error('RPC error (nearby):', rpcError);
//         setError(`Schema issue detected. Contact support. ${rpcError.message}`);
//       } else if (!data || data.length === 0) {
//         console.log('No nearby products, fetching with long-distance...');
//         ({ data, error: rpcError } = await retryRequest(() =>
//           supabase.rpc('nearby_products_v1', {
//             user_lon: userLocation.lon,
//             user_lat: userLocation.lat,
//             max_distance_meters: 20000,
//             include_long_distance: true,
//           })
//           .eq('category_id', parseInt(categoryId, 10))
//           .select(
//             'id, category_id, title, name, price, images, distance_km, sellers:products_seller_id_fkey(id, location, allows_long_distance)'
//           )
//         ));
//         if (rpcError) throw rpcError;
//         console.log('Long-distance products:', data);
//       }
//       if (data) {
//         console.log('Fetched products:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           name: product.title || product.name || 'Unnamed Product',
//           images: Array.isArray(product.images) ? product.images : [],
//           // If distance_km is missing, calculate using seller.location (if available)
//           distance_km: product.distance_km || calculateDistance(userLocation, product.sellers?.location),
//         })));
//       } else {
//         // Fallback: Query directly from the products table
//         const { data: fallbackData, error: fallbackError } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .select(
//               'id, category_id, title, name, price, images, sellers:products_seller_id_fkey(id, location, allows_long_distance)'
//             )
//             .eq('category_id', parseInt(categoryId, 10))
//             .eq('is_approved', true)
//         );
//         if (fallbackError) {
//           console.error('Fallback error:', fallbackError);
//           setError(`Fallback error: ${fallbackError.message}`);
//           setProducts([]);
//         } else {
//           console.log('Fallback products:', fallbackData);
//           setProducts(fallbackData.map(product => ({
//             ...product,
//             name: product.title || product.name || 'Unnamed Product',
//             images: Array.isArray(product.images) ? product.images : [],
//             distance_km: product.distance_km || calculateDistance(userLocation, product.sellers?.location),
//           })));
//         }
//       }
//     } catch (error) {
//       console.error('Unexpected error:', error);
//       setError(`Unexpected error: ${error.message}`);
//       // Final fallback query
//       const { data, error: fallbackError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(
//             'id, seller_id, category_id, title, name, images, product_variants(*), sellers:products_seller_id_fkey(id, location, allows_long_distance)'
//           )
//           .eq('category_id', parseInt(categoryId, 10))
//           .eq('is_approved', true)
//       );
//       if (fallbackError) console.error(fallbackError);
//       else setProducts(data.map(product => ({
//         ...product,
//         name: product.title || product.name || 'Unnamed Product',
//         images: Array.isArray(product.images) ? product.images : [],
//         distance_km: product.distance_km || calculateDistance(userLocation, product.sellers?.location),
//       })));
//     }
//   }, [categoryId]);

//   const fetchCartItems = async () => {
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         return;
//       }
//       const userId = session.user.id;
//       const { data, error } = await supabase
//         .from('cart')
//         .select('id, product_id, title, price, quantity')
//         .eq('user_id', userId);
//       if (error) {
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(storedCart);
//       } else {
//         setCartItems(data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching cart items:', error);
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);
//       setError(`Error: ${error.message || 'Failed to load cart. Falling back to local storage.'}`);
//     }
//   };

//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.title || product.price === undefined) {
//       console.error('Invalid product added to cart:', product);
//       setError('Cannot add invalid product to cart. Please try again.');
//       return;
//     }
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
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
//           title: product.title || product.name,
//           price: product.price,
//           quantity: 1,
//         };
//         localStorage.setItem('cart', JSON.stringify([...storedCart, newCartItem]));
//       }
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       setError(`Error: ${error.message || 'Failed to add product to cart. Please try again later.'}`);
//     }
//   };

//   const handleProductClick = (product) => {
//     setShowProductModal(product);
//   };

//   const handleBuyNow = (product) => {
//     navigate('/cart', { state: { product } });
//   };

//   return (
//     <div className="products-page">
//       <h1 style={{ color: '#007bff' }}>FreshCart Products in Category</h1>
//       <div className="product-grid">
//         {error && <p style={{ color: '#ff0000' }}>{error}</p>}
//         {message && <p style={{ color: '#007bff' }}>{message}</p>}
//         {products.map((product) => (
//           <div 
//             key={product.id} 
//             className="product-card" 
//             onClick={() => handleProductClick(product)}
//             style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}
//           >
//             <img 
//               src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//               alt={product.name} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/150'; 
//                 console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//               }}
//               style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
//             />
//             <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//             <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>
//               {product.distance_km 
//                 ? `${product.distance_km.toFixed(1)} km away${product.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
//                 : 'Distance TBD'}
//             </p>
//             <p style={{ color: '#666' }}>Category ID: {product.category_id || 'Unknown'}</p>
//             <button 
//               onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
//               className="add-to-cart-btn" 
//               style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
//             >
//               Add to Cart
//             </button>
//             <button 
//               onClick={(e) => { e.stopPropagation(); handleBuyNow(product); }} 
//               className="buy-now-btn" 
//               style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//             >
//               Buy Now
//             </button>
//           </div>
//         ))}
//       </div>

//       {showProductModal && (
//         <div className="modal" onClick={() => setShowProductModal(null)}>
//           <div className="modal-content" onClick={e => e.stopPropagation()}>
//             <h2 style={{ color: '#007bff' }}>{showProductModal.name}</h2>
//             <img 
//               src={showProductModal.images?.[0] ? showProductModal.images[0] : 'https://dummyimage.com/300'} 
//               alt={showProductModal.name} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/300'; 
//                 console.error('Image load failed for:', showProductModal.name, 'URL:', showProductModal.images?.[0]); 
//               }}
//               style={{ width: '100%', height: '300px', objectFit: 'contain', borderRadius: '4px' }}
//             />
//             <p style={{ color: '#666' }}>
//               Price: ₹{showProductModal.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </p>
//             <p style={{ color: '#666' }}>
//               Distance: {showProductModal.distance_km 
//                 ? `${showProductModal.distance_km.toFixed(1)} km${showProductModal.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
//                 : 'Distance TBD'}
//             </p>
//             <p style={{ color: '#666' }}>Category ID: {showProductModal.category_id || 'Unknown'}</p>
//             <div className="modal-actions" style={{ marginTop: '20px' }}>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); addToCart(showProductModal); setShowProductModal(null); }} 
//                 className="add-to-cart-btn" 
//                 style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
//               >
//                 Add to Cart
//               </button>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); handleBuyNow(showProductModal); setShowProductModal(null); }} 
//                 className="buy-now-btn" 
//                 style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//               >
//                 Buy Now
//               </button>
//               <button 
//                 onClick={(e) => { e.stopPropagation(); setShowProductModal(null); }} 
//                 className="close-btn" 
//                 style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Products;



import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/Products.css';

// Custom retry function for Supabase requests
async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

// Simple Haversine distance calculation (in kilometers)
function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc || !sellerLoc) return null;
  const R = 6371; // Earth's radius in km
  let sellerLon, sellerLat;
  if (sellerLoc.coordinates) {
    [sellerLon, sellerLat] = sellerLoc.coordinates;
  } else if (sellerLoc.x && sellerLoc.y) {
    sellerLon = sellerLoc.x;
    sellerLat = sellerLoc.y;
  } else {
    return null;
  }
  const dLat = (sellerLat - userLoc.lat) * (Math.PI / 180);
  const dLon = (sellerLon - userLoc.lon) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(userLoc.lat * (Math.PI / 180)) *
            Math.cos(sellerLat * (Math.PI / 180)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function Products() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const [products, setProducts] = useState([]);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();
  const [showProductModal, setShowProductModal] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(userLocation);
          fetchProducts(userLocation);
          fetchCartItems();
        },
        (geoError) => {
          console.error('Geolocation error:', geoError);
          const defaultLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
          setLocation(defaultLocation);
          fetchProducts(defaultLocation);
          fetchCartItems();
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
      );
    } else {
      const defaultLocation = { lat: 12.9753, lon: 77.591 };
      setLocation(defaultLocation);
      fetchProducts(defaultLocation);
      fetchCartItems();
    }
  }, [categoryId]);

  const fetchProducts = useCallback(async (userLocation) => {
    if (!userLocation || !categoryId) return;
    try {
      console.log('Fetching products with location:', userLocation, 'for category:', categoryId);
      // Call the RPC function 'nearby_products_v1'
      let { data, error: rpcError } = await retryRequest(() =>
        supabase.rpc('nearby_products_v1', {
          user_lon: userLocation.lon,
          user_lat: userLocation.lat,
          max_distance_meters: 20000,
          include_long_distance: false,
        })
        .eq('category_id', parseInt(categoryId, 10))
        .select(
          'id, category_id, title, name, price, images, distance_km, seller_location, seller_allows_long_distance'
        )
      );
      if (rpcError) {
        console.error('RPC error (nearby):', rpcError);
        setError(`Schema issue detected. Contact support. ${rpcError.message}`);
      } else if (!data || data.length === 0) {
        console.log('No nearby products, fetching with long-distance...');
        ({ data, error: rpcError } = await retryRequest(() =>
          supabase.rpc('nearby_products_v1', {
            user_lon: userLocation.lon,
            user_lat: userLocation.lat,
            max_distance_meters: 20000,
            include_long_distance: true,
          })
          .eq('category_id', parseInt(categoryId, 10))
          .select(
            'id, category_id, title, name, price, images, distance_km, seller_location, seller_allows_long_distance'
          )
        ));
        if (rpcError) throw rpcError;
        console.log('Long-distance products:', data);
      }
      if (data) {
        console.log('Fetched products:', data);
        setProducts(data.map(product => ({
          ...product,
          name: product.title || product.name || 'Unnamed Product',
          images: Array.isArray(product.images) ? product.images : [],
          // Use returned distance_km or calculate using seller_location if missing
          distance_km: product.distance_km || calculateDistance(userLocation, product.seller_location),
          seller: {
            location: product.seller_location,
            allows_long_distance: product.seller_allows_long_distance,
          },
        })));
      } else {
        // Fallback: Query directly from the products table (without seller join)
        const { data: fallbackData, error: fallbackError } = await retryRequest(() =>
          supabase
            .from('products')
            .select(
              'id, category_id, title, name, price, images'
            )
            .eq('category_id', parseInt(categoryId, 10))
            .eq('is_approved', true)
        );
        if (fallbackError) {
          console.error('Fallback error:', fallbackError);
          setError(`Fallback error: ${fallbackError.message}`);
          setProducts([]);
        } else {
          console.log('Fallback products:', fallbackData);
          setProducts(fallbackData.map(product => ({
            ...product,
            name: product.title || product.name || 'Unnamed Product',
            images: Array.isArray(product.images) ? product.images : [],
            distance_km: calculateDistance(userLocation, null),
          })));
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError(`Unexpected error: ${error.message}`);
      // Final fallback query (if needed)
      const { data, error: fallbackError } = await retryRequest(() =>
        supabase
          .from('products')
          .select(
            'id, seller_id, category_id, title, name, images, price'
          )
          .eq('category_id', parseInt(categoryId, 10))
          .eq('is_approved', true)
      );
      if (fallbackError) console.error(fallbackError);
      else setProducts(data.map(product => ({
        ...product,
        name: product.title || product.name || 'Unnamed Product',
        images: Array.isArray(product.images) ? product.images : [],
        distance_km: calculateDistance(userLocation, null),
      })));
    }
  }, [categoryId]);

  const fetchCartItems = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Authentication required. Please ensure you are logged in.');
        return;
      }
      const userId = session.user.id;
      const { data, error } = await supabase
        .from('cart')
        .select('id, product_id, title, price, quantity')
        .eq('user_id', userId);
      if (error) {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        setCartItems(storedCart);
      } else {
        setCartItems(data || []);
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(storedCart);
      setError(`Error: ${error.message || 'Failed to load cart. Falling back to local storage.'}`);
    }
  };

  const addToCart = async (product) => {
    if (!product || !product.id || !product.title || product.price === undefined) {
      console.error('Invalid product added to cart:', product);
      setError('Cannot add invalid product to cart. Please try again.');
      return;
    }
    try {
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Authentication required. Please ensure you are logged in.');
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
          title: product.title || product.name,
          price: product.price,
          quantity: 1,
        };
        localStorage.setItem('cart', JSON.stringify([...storedCart, newCartItem]));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError(`Error: ${error.message || 'Failed to add product to cart. Please try again later.'}`);
    }
  };

  const handleProductClick = (product) => {
    setShowProductModal(product);
  };

  const handleBuyNow = (product) => {
    navigate('/cart', { state: { product } });
  };

  return (
    <div className="products-page">
      <h1 style={{ color: '#007bff' }}>FreshCart Products in Category</h1>
      <div className="product-grid">
        {error && <p style={{ color: '#ff0000' }}>{error}</p>}
        {message && <p style={{ color: '#007bff' }}>{message}</p>}
        {products.map((product) => (
          <div 
            key={product.id} 
            className="product-card" 
            onClick={() => handleProductClick(product)}
            style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}
          >
            <img 
              src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
              alt={product.name} 
              onError={(e) => { 
                e.target.src = 'https://dummyimage.com/150'; 
                console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
              }}
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
            />
            <h3 style={{ color: '#007bff' }}>{product.name}</h3>
            <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p style={{ color: '#666' }}>
              {product.distance_km 
                ? `${product.distance_km.toFixed(1)} km away${product.seller_allows_long_distance ? ' (Long-distance available)' : ''}` 
                : 'Distance TBD'}
            </p>
            <p style={{ color: '#666' }}>Category ID: {product.category_id || 'Unknown'}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
              className="add-to-cart-btn" 
              style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
            >
              Add to Cart
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleBuyNow(product); }} 
              className="buy-now-btn" 
              style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>

      {showProductModal && (
        <div className="modal" onClick={() => setShowProductModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#007bff' }}>{showProductModal.name}</h2>
            <img 
              src={showProductModal.images?.[0] ? showProductModal.images[0] : 'https://dummyimage.com/300'} 
              alt={showProductModal.name} 
              onError={(e) => { 
                e.target.src = 'https://dummyimage.com/300'; 
                console.error('Image load failed for:', showProductModal.name, 'URL:', showProductModal.images?.[0]); 
              }}
              style={{ width: '100%', height: '300px', objectFit: 'contain', borderRadius: '4px' }}
            />
            <p style={{ color: '#666' }}>
              Price: ₹{showProductModal.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p style={{ color: '#666' }}>
              Distance: {showProductModal.distance_km 
                ? `${showProductModal.distance_km.toFixed(1)} km${showProductModal.seller_allows_long_distance ? ' (Long-distance available)' : ''}` 
                : 'Distance TBD'}
            </p>
            <p style={{ color: '#666' }}>Category ID: {showProductModal.category_id || 'Unknown'}</p>
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); addToCart(showProductModal); setShowProductModal(null); }} 
                className="add-to-cart-btn" 
                style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
              >
                Add to Cart
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleBuyNow(showProductModal); setShowProductModal(null); }} 
                className="buy-now-btn" 
                style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
              >
                Buy Now
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowProductModal(null); }} 
                className="close-btn" 
                style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
        <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            🏠
          </span>
          <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            🛒
          </span>
        </div>
        <p style={{ color: '#007bff' }}>Categories</p>
      </div>
    </div>
  );
}

export default Products;
