
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



import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/Products.css';

// Retry function
async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Distance calculation
function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude) return null;
  const R = 6371; // Earth's radius in kilometers
  const lat = sellerLoc.latitude;
  const lon = sellerLoc.longitude;
  const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
  const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(userLoc.lat * (Math.PI / 180)) *
    Math.cos(lat * (Math.PI / 180)) *
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
  const [showProductModal, setShowProductModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = useCallback(
    async (userLocation) => {
      if (!userLocation || !categoryId) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: sellersData, error: sellersError } = await retryRequest(() =>
          supabase.from('sellers').select('id, latitude, longitude')
        );
        if (sellersError) throw sellersError;
        console.log('Sellers Data:', sellersData);

        const nearbySellerIds = sellersData
          .filter((seller) => {
            const distance = calculateDistance(userLocation, seller);
            console.log(`Seller ${seller.id} Distance: ${distance !== null ? distance.toFixed(2) : 'N/A'} km`);
            return distance !== null && distance <= 40; // Changed from 20 km to 40 km
          })
          .map((seller) => seller.id);
        console.log('Nearby Seller IDs:', nearbySellerIds);

        if (nearbySellerIds.length === 0) {
          console.log('No sellers within 40km');
          setProducts([]);
          setLoading(false);
          setError('No products found within 40km for this category.');
          return;
        }

        const { data, error } = await retryRequest(() =>
          supabase
            .from('products')
            .select('id, category_id, title, name, price, images, seller_id')
            .eq('category_id', parseInt(categoryId, 10))
            .eq('is_approved', true)
            .in('seller_id', nearbySellerIds)
        );
        if (error) throw error;
        console.log('Fetched Products:', data);

        if (data) {
          setProducts(
            data.map((p) => ({
              ...p,
              name: p.title || p.name || 'Unnamed Product',
              images: Array.isArray(p.images) ? p.images : [],
              distance_km: calculateDistance(userLocation, sellersData.find((s) => s.id === p.seller_id)),
            }))
          );
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(`Error: ${err.message || 'Failed to fetch products.'}`);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [categoryId]
  );

  const fetchCartItems = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        const stored = JSON.parse(localStorage.getItem('cart')) || [];
        setCartItems(stored);
        return;
      }
      const userId = session.user.id;
      const { data, error } = await supabase.from('cart').select('*').eq('user_id', userId);
      if (error) {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        setCartItems(storedCart);
      } else {
        setCartItems(data || []);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      const fallback = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(fallback);
      setError(`Cart error: ${error.message}`);
    }
  };

  const addToCart = async (product) => {
    if (!product || !product.id || product.price === undefined) {
      setError('Invalid product. Cannot add to cart.');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Authentication required. Please log in.');
        return;
      }
      const current = JSON.parse(localStorage.getItem('cart')) || [];
      const found = current.find((item) => item.id === product.id);
      if (found) {
        found.quantity = (found.quantity || 1) + 1;
      } else {
        current.push({
          id: product.id,
          title: product.title || product.name,
          price: product.price,
          quantity: 1,
        });
      }
      localStorage.setItem('cart', JSON.stringify(current));
      setMessage('Item added to cart!');
      setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    } catch (err) {
      console.error('Add to cart error:', err);
      setError(`Add to cart error: ${err.message}`);
    }
  };

  const handleBuyNow = (product) => {
    navigate('/cart', { state: { product } });
  };

  const handleProductClick = (product) => {
    setShowProductModal(product);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setLocation(userLoc);
          fetchProducts(userLoc);
          fetchCartItems();
        },
        (geoError) => {
          console.error('Geolocation error:', geoError);
          const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
          setLocation(defaultLoc);
          fetchProducts(defaultLoc);
          fetchCartItems();
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
      );
    } else {
      const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
      setLocation(defaultLoc);
      fetchProducts(defaultLoc);
      fetchCartItems();
    }
  }, [fetchProducts]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error" style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="products-page">
      {products.length === 0 ? (
        <div className="no-products" style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
          No products found within 40km for this category.
        </div>
      ) : (
        <>
          <h1 className="page-title">FreshCart Products in Category</h1>
          {message && <p className="message" style={{ color: 'green' }}>{message}</p>}

          <div className="product-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product)}
              >
                <img
                  src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'}
                  alt={product.name}
                  onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
                />
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">
                  ₹{product.price.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="product-distance">
                  {product.distance_km
                    ? `${product.distance_km.toFixed(1)} km away`
                    : 'Distance unavailable'}
                </p>
                <div className="product-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="add-to-cart-btn"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuyNow(product);
                    }}
                    className="buy-now-btn"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showProductModal && (
            <div className="modal" onClick={() => setShowProductModal(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{showProductModal.name}</h2>
                <img
                  src={
                    showProductModal.images?.[0]
                      ? showProductModal.images[0]
                      : 'https://dummyimage.com/300'
                  }
                  alt={showProductModal.name}
                  onError={(e) => { e.target.src = 'https://dummyimage.com/300'; }}
                />
                <p className="modal-price">
                  ₹{showProductModal.price.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="modal-distance">
                  {showProductModal.distance_km
                    ? `${showProductModal.distance_km.toFixed(1)} km away`
                    : 'Distance unavailable'}
                </p>
                <div className="modal-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(showProductModal);
                      setShowProductModal(null);
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuyNow(showProductModal);
                      setShowProductModal(null);
                    }}
                  >
                    Buy Now
                  </button>
                  <button onClick={() => setShowProductModal(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="footer">
        <div className="footer-icons">
          <span className="icon-circle">🏠</span>
          <span className="icon-circle">🛒</span>
        </div>
        <p className="footer-text">Categories</p>
      </div>
    </div>
  );
}

export default Products;