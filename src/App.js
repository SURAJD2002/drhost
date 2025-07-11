



// import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import mapboxgl from 'mapbox-gl';
// import 'mapbox-gl/dist/mapbox-gl.css';
// import { supabase } from './supabaseClient';
// import Header from './components/Header';
// import Footer from './components/Footer';
// import Home from './components/Home';
// import ProductPage from './components/ProductPage';
// import Cart from './components/Cart';
// import Checkout from './components/Checkout';
// import Auth from './components/Auth';
// import Categories from './components/Categories';
// import Products from './components/Products';
// import Account from './components/Account';
// import OrderDetails from './components/OrderDetails';
// import Orders from './components/Orders';
// import CancelOrder from './components/CancelOrder';
// import Support from './components/Support';
// import ErrorBoundary from './components/ErrorBoundary';
// import SellerDashboard from './components/SellerDashboard';
// import Policy from './components/Policy';
// import Privacy from './components/Privacy';
// import AddProductPage from './components/AddProductPage';
// import './App.css';

// export const LocationContext = createContext({
//   buyerLocation: null,
//   sellerLocation: null,
//   setBuyerLocation: () => {},
//   setSellerLocation: () => {},
//   session: null,
//   cartCount: 0,
//   setCartCount: () => {},
// });

// function App() {
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(0);
//   const [isSeller, setIsSeller] = useState(false);
//   const [buyerLocation, setBuyerLocation] = useState(null);
//   const [sellerLocation, setSellerLocation] = useState(null);
//   const [locationError, setLocationError] = useState('');
//   const [error, setError] = useState(null);
//   const [initialized, setInitialized] = useState(false);
//   const [sessionResolved, setSessionResolved] = useState(false);
//   const [locationReady, setLocationReady] = useState(false);

//   const lastUserId = useRef(null);
//   const authSubscription = useRef(null);
//   const hasInitialized = useRef(false);

//   mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

//   const detectLocation = useCallback(async () => {
//     if (buyerLocation || sellerLocation) {
//       return buyerLocation || sellerLocation;
//     }
//     try {
//       if (!navigator.geolocation) {
//         throw new Error('Geolocation not supported');
//       }
//       const pos = await new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(
//           (position) => resolve(position),
//           (err) => reject(err),
//           { enableHighAccuracy: true, timeout: 10000 }
//         );
//       });
//       if (!process.env.REACT_APP_MAPBOX_TOKEN) {
//         console.warn('Mapbox token missing; using raw coordinates.');
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       }
//       try {
//         const response = await fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
//         );
//         if (!response.ok) {
//           throw new Error(`Mapbox Geocoding failed: ${response.statusText}`);
//         }
//         const data = await response.json();
//         if (data.features?.length > 0) {
//           const [lon, lat] = data.features[0].center;
//           return { lat, lon };
//         }
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       } catch (e) {
//         console.warn('Mapbox Geocoding error:', e);
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       }
//     } catch (e) {
//       console.error('Geolocation failed:', e);
//       setLocationError(`Geolocation error: ${e.message}—using default Bengaluru.`);
//       return { lat: 12.9753, lon: 77.591 };
//     }
//   }, [buyerLocation, sellerLocation]);

//   const fetchCart = useCallback(async (userId) => {
//     if (!userId) return;
//     try {
//       const { data, error } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', userId);
//       if (error) throw error;
//       setCartCount(data.length);
//     } catch (e) {
//       console.error('Cart fetch error:', e);
//       setError('Failed to load cart count.');
//     }
//   }, []);

//   const fetchSeller = useCallback(
//     async (userId) => {
//       if (!userId) return;
//       try {
//         const { data: prof, error: profError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', userId)
//           .maybeSingle();
//         if (profError) throw profError;
//         setIsSeller(prof?.is_seller || false);

//         if (prof?.is_seller) {
//           const { data: sd, error: sdError } = await supabase
//             .from('sellers')
//             .select('latitude, longitude, store_name')
//             .eq('id', userId)
//             .maybeSingle();
//           if (sdError) throw sdError;
//           if (sd?.latitude && sd?.longitude) {
//             setSellerLocation({ lat: sd.latitude, lon: sd.longitude });
//           } else {
//             const loc = await detectLocation();
//             let storeName = sd?.store_name;
//             if (!storeName) {
//               storeName = `Store-${userId}`;
//             }
//             setSellerLocation(loc);
//             const { error: updateError } = await supabase
//               .from('sellers')
//               .upsert({ id: userId, latitude: loc.lat, longitude: loc.lon, store_name: storeName });
//             if (updateError) throw updateError;
//           }
//         }
//       } catch (e) {
//         console.error('Seller fetch error:', e);
//         setError('Failed to verify seller status.');
//       }
//     },
//     [detectLocation]
//   );

//   const initialize = useCallback(async () => {
//     if (hasInitialized.current) return;
//     hasInitialized.current = true;

//     try {
//       console.log('Initializing session...');
//       const {
//         data: { session: sess },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError) {
//         console.error('Session error:', sessionError);
//         throw sessionError;
//       }
//       console.log('Session resolved:', sess);
//       setSession(sess);
//       setSessionResolved(true);

//       if (sess && sess.user?.id !== lastUserId.current) {
//         lastUserId.current = sess.user.id;
//         await Promise.all([fetchCart(sess.user.id), fetchSeller(sess.user.id)]);

//         if (!isSeller) {
//           const { data: profile, error: profileError } = await supabase
//             .from('profiles')
//             .select('latitude, longitude')
//             .eq('id', sess.user.id)
//             .maybeSingle();
//           if (profileError) {
//             console.error('Profile fetch error:', profileError);
//             setError('Failed to fetch user location.');
//             setLocationReady(true);
//             return;
//           }
//           if (profile?.latitude && profile?.longitude) {
//             setBuyerLocation({ lat: profile.latitude, lon: profile.longitude });
//             setLocationReady(true);
//           } else {
//             const loc = await detectLocation();
//             setBuyerLocation(loc);
//             setLocationReady(true);
//             const { error: updateError } = await supabase
//               .from('profiles')
//               .upsert({ id: sess.user.id, latitude: loc.lat, longitude: loc.lon });
//             if (updateError) {
//               console.error('Profile update error:', updateError);
//               setError('Failed to update user location.');
//             }
//           }
//         } else {
//           setLocationReady(true);
//         }
//       } else {
//         setLocationReady(true);
//       }
//     } catch (e) {
//       console.error('Initialization error:', e);
//       setError(`Initialization failed: ${e.message}`);
//       setSessionResolved(true);
//       setLocationReady(true);
//     } finally {
//       setInitialized(true);
//       console.log('Initialization complete:', { initialized: true, sessionResolved: true, locationReady: true });
//     }
//   }, [fetchCart, fetchSeller, detectLocation, isSeller]);

//   useEffect(() => {
//     if (!authSubscription.current) {
//       authSubscription.current = supabase.auth.onAuthStateChange((_e, ns) => {
//         console.log('App.js: Auth state changed:', ns);
//         const sessionId = session?.user?.id;
//         const newSessionId = ns?.user?.id;
//         const hasSessionChanged = sessionId !== newSessionId;

//         if (hasSessionChanged) {
//           setSession(ns);
//           if (!ns) {
//             setCartCount(0);
//             setIsSeller(false);
//             setBuyerLocation(null);
//             setSellerLocation(null);
//             setLocationError('');
//             lastUserId.current = null;
//             setLocationReady(true);
//             hasInitialized.current = false;
//           }
//           initialize();
//         }
//       }).data.subscription;
//     }

//     initialize();

//     return () => {
//       if (authSubscription.current) {
//         authSubscription.current.unsubscribe();
//         authSubscription.current = null;
//       }
//     };
//   }, [initialize]);

//   const handleLogout = async () => {
//     try {
//       await supabase.auth.signOut();
//       window.location.href = '/auth';
//     } catch (e) {
//       console.error('Logout error:', e);
//       setError(`Logout failed: ${e.message}`);
//     }
//   };

//   if (!initialized || !sessionResolved || !locationReady) {
//     return <div className="app-loading">Loading… <span>{error || 'Waiting for session...'}</span></div>;
//   }

//   return (
//     <LocationContext.Provider value={{ buyerLocation, setBuyerLocation, sellerLocation, setSellerLocation, session, cartCount, setCartCount }}>
//       <ErrorBoundary>
//         <Header error={error} />
//         {error && <div className="app-error">{error}</div>}
//         {locationError && (
//           <div className="location-notice">
//             {locationError} <button onClick={initialize}>Retry</button>
//           </div>
//         )}
//         <main>
//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/product/:id" element={<ProductPage />} />
//             <Route
//               path="/cart"
//               element={session ? <Cart /> : <Navigate to="/auth" />}
//             />
//             <Route
//               path="/checkout"
//               element={
//                 session && !isSeller && buyerLocation ? (
//                   <Checkout />
//                 ) : (
//                   <Navigate to={isSeller ? '/seller' : '/auth'} />
//                 )
//               }
//             />
//             <Route
//               path="/account"
//               element={session ? <Account /> : <Navigate to="/auth" />}
//             />
//             <Route
//               path="/orders"
//               element={session ? <Orders /> : <Navigate to="/auth" />}
//             />
//             <Route
//               path="/orders/cancel/:id"
//               element={session ? <CancelOrder /> : <Navigate to="/auth" />}
//             />
//             <Route
//               path="/order-details/:orderId"
//               element={session ? <OrderDetails /> : <Navigate to="/auth" />}
//             />
//             <Route
//               path="/seller"
//               element={session && isSeller ? <SellerDashboard /> : <Navigate to={session ? '/account' : '/auth'} />}
//             />
//             <Route
//               path="/seller/add-product"
//               element={session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />}
//             />
//             <Route path="/auth" element={<Auth />} />
//             <Route path="/categories" element={<Categories />} />
//             <Route path="/products" element={<Products />} />
//             <Route path="/support" element={<Support />} />
//             <Route path="*" element={<Navigate to="/" />} />
//             <Route path="/policy" element={<Policy />} />
//             <Route path="/privacy" element={<Privacy />} />
//           </Routes>
//         </main>
//         <Footer />
//       </ErrorBoundary>
//     </LocationContext.Provider>
//   );
// }

// export default App;



// import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import mapboxgl from 'mapbox-gl';
// import 'mapbox-gl/dist/mapbox-gl.css';
// import { supabase } from './supabaseClient';
// import { HelmetProvider } from 'react-helmet-async'; // Added
// import Header from './components/Header';
// import Footer from './components/Footer';
// import Home from './components/Home';
// import ProductPage from './components/ProductPage';
// import Cart from './components/Cart';
// import Checkout from './components/Checkout';
// import Auth from './components/Auth';
// import Categories from './components/Categories';
// import Products from './components/Products';
// import Account from './components/Account';
// import OrderDetails from './components/OrderDetails';
// import Orders from './components/Orders';
// import CancelOrder from './components/CancelOrder';
// import Support from './components/Support';
// import ErrorBoundary from './components/ErrorBoundary';
// import SellerDashboard from './components/SellerDashboard';
// import Policy from './components/Policy';
// import Privacy from './components/Privacy';
// import AddProductPage from './components/AddProductPage';
// import './App.css';

// export const LocationContext = createContext({
//   buyerLocation: null,
//   sellerLocation: null,
//   setBuyerLocation: () => {},
//   setSellerLocation: () => {},
//   session: null,
//   cartCount: 0,
//   setCartCount: () => {},
// });

// function App() {
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(0);
//   const [isSeller, setIsSeller] = useState(false);
//   const [buyerLocation, setBuyerLocation] = useState(null);
//   const [sellerLocation, setSellerLocation] = useState(null);
//   const [locationError, setLocationError] = useState('');
//   const [error, setError] = useState(null);
//   const [initialized, setInitialized] = useState(false);
//   const [sessionResolved, setSessionResolved] = useState(false);
//   const [locationReady, setLocationReady] = useState(false);

//   const lastUserId = useRef(null);
//   const authSubscription = useRef(null);
//   const hasInitialized = useRef(false);

//   mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

//   const detectLocation = useCallback(async () => {
//     if (buyerLocation || sellerLocation) {
//       return buyerLocation || sellerLocation;
//     }
//     try {
//       if (!navigator.geolocation) {
//         throw new Error('Geolocation not supported');
//       }
//       const pos = await new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(
//           (position) => resolve(position),
//           (err) => reject(err),
//           { enableHighAccuracy: true, timeout: 10000 }
//         );
//       });
//       if (!process.env.REACT_APP_MAPBOX_TOKEN) {
//         console.warn('Mapbox token missing; using raw coordinates.');
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       }
//       try {
//         const response = await fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
//         );
//         if (!response.ok) {
//           throw new Error(`Mapbox Geocoding failed: ${response.statusText}`);
//         }
//         const data = await response.json();
//         if (data.features?.length > 0) {
//           const [lon, lat] = data.features[0].center;
//           return { lat, lon };
//         }
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       } catch (e) {
//         console.warn('Mapbox Geocoding error:', e);
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       }
//     } catch (e) {
//       console.error('Geolocation failed:', e);
//       setLocationError(`Geolocation error: ${e.message}—using default Bengaluru.`);
//       return { lat: 12.9753, lon: 77.591 };
//     }
//   }, [buyerLocation, sellerLocation]);

//   const fetchCart = useCallback(async (userId) => {
//     if (!userId) return;
//     try {
//       const { data, error } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', userId);
//       if (error) throw error;
//       setCartCount(data.length);
//     } catch (e) {
//       console.error('Cart fetch error:', e);
//       setError('Failed to load cart count.');
//     }
//   }, []);

//   const fetchSeller = useCallback(
//     async (userId) => {
//       if (!userId) return;
//       try {
//         const { data: prof, error: profError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', userId)
//           .maybeSingle();
//         if (profError) throw profError;
//         setIsSeller(prof?.is_seller || false);

//         if (prof?.is_seller) {
//           const { data: sd, error: sdError } = await supabase
//             .from('sellers')
//             .select('latitude, longitude, store_name')
//             .eq('id', userId)
//             .maybeSingle();
//           if (sdError) throw sdError;
//           if (sd?.latitude && sd?.longitude) {
//             setSellerLocation({ lat: sd.latitude, lon: sd.longitude });
//           } else {
//             const loc = await detectLocation();
//             let storeName = sd?.store_name;
//             if (!storeName) {
//               storeName = `Store-${userId}`;
//             }
//             setSellerLocation(loc);
//             const { error: updateError } = await supabase
//               .from('sellers')
//               .upsert({ id: userId, latitude: loc.lat, longitude: loc.lon, store_name: storeName });
//             if (updateError) throw updateError;
//           }
//         }
//       } catch (e) {
//         console.error('Seller fetch error:', e);
//         setError('Failed to verify seller status.');
//       }
//     },
//     [detectLocation]
//   );

//   const initialize = useCallback(async () => {
//     if (hasInitialized.current) return;
//     hasInitialized.current = true;

//     try {
//       console.log('Initializing session...');
//       const {
//         data: { session: sess },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError) {
//         console.error('Session error:', sessionError);
//         throw sessionError;
//       }
//       console.log('Session resolved:', sess);
//       setSession(sess);
//       setSessionResolved(true);

//       if (sess && sess.user?.id !== lastUserId.current) {
//         lastUserId.current = sess.user.id;
//         await Promise.all([fetchCart(sess.user.id), fetchSeller(sess.user.id)]);

//         if (!isSeller) {
//           const { data: profile, error: profileError } = await supabase
//             .from('profiles')
//             .select('latitude, longitude')
//             .eq('id', sess.user.id)
//             .maybeSingle();
//           if (profileError) {
//             console.error('Profile fetch error:', profileError);
//             setError('Failed to fetch user location.');
//             setLocationReady(true);
//             return;
//           }
//           if (profile?.latitude && profile?.longitude) {
//             setBuyerLocation({ lat: profile.latitude, lon: profile.longitude });
//             setLocationReady(true);
//           } else {
//             const loc = await detectLocation();
//             setBuyerLocation(loc);
//             setLocationReady(true);
//             const { error: updateError } = await supabase
//               .from('profiles')
//               .upsert({ id: sess.user.id, latitude: loc.lat, longitude: loc.lon });
//             if (updateError) {
//               console.error('Profile update error:', updateError);
//               setError('Failed to update user location.');
//             }
//           }
//         } else {
//           setLocationReady(true);
//         }
//       } else {
//         setLocationReady(true);
//       }
//     } catch (e) {
//       console.error('Initialization error:', e);
//       setError(`Initialization failed: ${e.message}`);
//       setSessionResolved(true);
//       setLocationReady(true);
//     } finally {
//       setInitialized(true);
//       console.log('Initialization complete:', { initialized: true, sessionResolved: true, locationReady: true });
//     }
//   }, [fetchCart, fetchSeller, detectLocation, isSeller]);

//   useEffect(() => {
//     if (!authSubscription.current) {
//       authSubscription.current = supabase.auth.onAuthStateChange((_e, ns) => {
//         console.log('App.js: Auth state changed:', ns);
//         const sessionId = session?.user?.id;
//         const newSessionId = ns?.user?.id;
//         const hasSessionChanged = sessionId !== newSessionId;

//         if (hasSessionChanged) {
//           setSession(ns);
//           if (!ns) {
//             setCartCount(0);
//             setIsSeller(false);
//             setBuyerLocation(null);
//             setSellerLocation(null);
//             setLocationError('');
//             lastUserId.current = null;
//             setLocationReady(true);
//             hasInitialized.current = false;
//           }
//           initialize();
//         }
//       }).data.subscription;
//     }

//     initialize();

//     return () => {
//       if (authSubscription.current) {
//         authSubscription.current.unsubscribe();
//         authSubscription.current = null;
//       }
//     };
//   }, [initialize]);

//   const handleLogout = async () => {
//     try {
//       await supabase.auth.signOut();
//       window.location.href = '/auth';
//     } catch (e) {
//       console.error('Logout error:', e);
//       setError(`Logout failed: ${e.message}`);
//     }
//   };

//   if (!initialized || !sessionResolved || !locationReady) {
//     return <div className="app-loading">Loading… <span>{error || 'Waiting for session...'}</span></div>;
//   }

//   return (
//     <HelmetProvider> {/* Added */}
//       <LocationContext.Provider value={{ buyerLocation, setBuyerLocation, sellerLocation, setSellerLocation, session, cartCount, setCartCount }}>
//         <ErrorBoundary>
//           <Header error={error} />
//           {error && <div className="app-error">{error}</div>}
//           {locationError && (
//             <div className="location-notice">
//               {locationError} <button onClick={initialize}>Retry</button>
//             </div>
//           )}
//           <main>
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/product/:id" element={<ProductPage />} />
//               <Route
//                 path="/cart"
//                 element={session ? <Cart /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/checkout"
//                 element={
//                   session && !isSeller && buyerLocation ? (
//                     <Checkout />
//                   ) : (
//                     <Navigate to={isSeller ? '/seller' : '/auth'} />
//                   )
//                 }
//               />
//               <Route
//                 path="/account"
//                 element={session ? <Account /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/orders"
//                 element={session ? <Orders /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/orders/cancel/:id"
//                 element={session ? <CancelOrder /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/order-details/:orderId"
//                 element={session ? <OrderDetails /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/seller"
//                 element={session && isSeller ? <SellerDashboard /> : <Navigate to={session ? '/account' : '/auth'} />}
//               />
//               <Route
//                 path="/seller/add-product"
//                 element={session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />}
//               />
//               <Route path="/auth" element={<Auth />} />
//               <Route path="/categories" element={<Categories />} />
//               <Route path="/products" element={<Products />} />
//               <Route path="/support" element={<Support />} />
//               <Route path="*" element={<Navigate to="/" />} />
//               <Route path="/policy" element={<Policy />} />
//               <Route path="/privacy" element={<Privacy />} />
//             </Routes>
//           </main>
//           <Footer />
//         </ErrorBoundary>
//       </LocationContext.Provider>
//     </HelmetProvider>
//   );
// }

// export default App;



// import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import mapboxgl from 'mapbox-gl';
// import 'mapbox-gl/dist/mapbox-gl.css';
// import { supabase } from './supabaseClient';
// import { HelmetProvider } from 'react-helmet-async';
// import Header from './components/Header';
// import Footer from './components/Footer';
// import Home from './components/Home';
// import ProductPage from './components/ProductPage';
// import Cart from './components/Cart';
// import Checkout from './components/Checkout';
// import Auth from './components/Auth';
// import Categories from './components/Categories';
// import Products from './components/Products';
// import Account from './components/Account';
// import OrderDetails from './components/OrderDetails';
// import Orders from './components/Orders';
// import CancelOrder from './components/CancelOrder';
// import Support from './components/Support';
// import ErrorBoundary from './components/ErrorBoundary';
// import SellerDashboard from './components/SellerDashboard';
// import Policy from './components/Policy';
// import Privacy from './components/Privacy';
// import AddProductPage from './components/AddProductPage';
// import './App.css';

// export const LocationContext = createContext({
//   buyerLocation: null,
//   sellerLocation: null,
//   setBuyerLocation: () => {},
//   setSellerLocation: () => {},
//   session: null,
//   cartCount: 0,
//   setCartCount: () => {},
//   handleLogout: () => {},
// });

// function App() {
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(0);
//   const [isSeller, setIsSeller] = useState(false);
//   const [buyerLocation, setBuyerLocation] = useState(null);
//   const [sellerLocation, setSellerLocation] = useState(null);
//   const [locationError, setLocationError] = useState('');
//   const [error, setError] = useState(null);
//   const [initialized, setInitialized] = useState(false);
//   const [sessionResolved, setSessionResolved] = useState(false);
//   const [locationReady, setLocationReady] = useState(false);

//   const lastUserId = useRef(null);
//   const authSubscription = useRef(null);
//   const hasInitialized = useRef(false);

//   mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

//   const detectLocation = useCallback(async () => {
//     if (buyerLocation || sellerLocation) {
//       return buyerLocation || sellerLocation;
//     }
//     try {
//       if (!navigator.geolocation) {
//         throw new Error('Geolocation not supported');
//       }
//       const pos = await new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(
//           (position) => resolve(position),
//           (err) => reject(err),
//           { enableHighAccuracy: true, timeout: 10000 }
//         );
//       });
//       if (!process.env.REACT_APP_MAPBOX_TOKEN) {
//         console.warn('Mapbox token missing; using raw coordinates.');
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       }
//       try {
//         const response = await fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
//         );
//         if (!response.ok) {
//           throw new Error(`Mapbox Geocoding failed: ${response.statusText}`);
//         }
//         const data = await response.json();
//         if (data.features?.length > 0) {
//           const [lon, lat] = data.features[0].center;
//           return { lat, lon };
//         }
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       } catch (e) {
//         console.warn('Mapbox Geocoding error:', e);
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       }
//     } catch (e) {
//       console.error('Geolocation failed:', e);
//       setLocationError(`Geolocation error: ${e.message}—using default Bengaluru.`);
//       return { lat: 12.9753, lon: 77.591 };
//     }
//   }, [buyerLocation, sellerLocation]);

//   const fetchCart = useCallback(async (userId) => {
//     if (!userId) return;
//     try {
//       const { data, error } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', userId);
//       if (error) throw error;
//       setCartCount(data.length);
//     } catch (e) {
//       console.error('Cart fetch error:', e);
//       setError('Failed to load cart count.');
//     }
//   }, []);

//   const fetchSeller = useCallback(
//     async (userId) => {
//       if (!userId) return;
//       try {
//         const { data: prof, error: profError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', userId)
//           .maybeSingle();
//         if (profError) throw profError;
//         setIsSeller(prof?.is_seller || false);

//         if (prof?.is_seller) {
//           const { data: sd, error: sdError } = await supabase
//             .from('sellers')
//             .select('latitude, longitude, store_name')
//             .eq('id', userId)
//             .maybeSingle();
//           if (sdError) throw sdError;
//           if (sd?.latitude && sd?.longitude) {
//             setSellerLocation({ lat: sd.latitude, lon: sd.longitude });
//           } else {
//             const loc = await detectLocation();
//             let storeName = sd?.store_name;
//             if (!storeName) {
//               storeName = `Store-${userId}`;
//             }
//             setSellerLocation(loc);
//             const { error: updateError } = await supabase
//               .from('sellers')
//               .upsert({ id: userId, latitude: loc.lat, longitude: loc.lon, store_name: storeName });
//             if (updateError) throw updateError;
//           }
//         }
//       } catch (e) {
//         console.error('Seller fetch error:', e);
//         setError('Failed to verify seller status.');
//       }
//     },
//     [detectLocation]
//   );

//   const initialize = useCallback(async () => {
//     if (hasInitialized.current) return;
//     hasInitialized.current = true;

//     try {
//       console.log('Initializing session...');
//       const {
//         data: { session: sess },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError) throw sessionError;
//       setSession(sess);
//       setSessionResolved(true);

//       if (sess && sess.user?.id !== lastUserId.current) {
//         lastUserId.current = sess.user.id;
//         await Promise.all([fetchCart(sess.user.id), fetchSeller(sess.user.id)]);

//         if (!isSeller) {
//           const { data: profile, error: profileError } = await supabase
//             .from('profiles')
//             .select('latitude, longitude')
//             .eq('id', sess.user.id)
//             .maybeSingle();
//           if (profileError) {
//             console.error('Profile fetch error:', profileError);
//             setError('Failed to fetch user location.');
//             setLocationReady(true);
//             return;
//           }
//           if (profile?.latitude && profile?.longitude) {
//             setBuyerLocation({ lat: profile.latitude, lon: profile.longitude });
//             setLocationReady(true);
//           } else {
//             const loc = await detectLocation();
//             setBuyerLocation(loc);
//             setLocationReady(true);
//             const { error: updateError } = await supabase
//               .from('profiles')
//               .upsert({ id: sess.user.id, latitude: loc.lat, longitude: loc.lon });
//             if (updateError) {
//               console.error('Profile update error:', updateError);
//               setError('Failed to update user location.');
//             }
//           }
//         } else {
//           setLocationReady(true);
//         }
//       } else {
//         setLocationReady(true);
//       }
//     } catch (e) {
//       console.error('Initialization error:', e);
//       setError(`Initialization failed: ${e.message}`);
//       setSessionResolved(true);
//       setLocationReady(true);
//     } finally {
//       setInitialized(true);
//       console.log('Initialization complete:', { initialized: true, sessionResolved: true, locationReady: true });
//     }
//   }, [fetchCart, fetchSeller, detectLocation, isSeller]);

//   const handleLogout = useCallback(async () => {
//     try {
//       await supabase.auth.signOut();
//       window.location.href = '/auth';
//     } catch (e) {
//       console.error('Logout error:', e);
//       setError(`Logout failed: ${e.message}`);
//     }
//   }, []);

//   useEffect(() => {
//     initialize();

//     const { data: authListener } = supabase.auth.onAuthStateChange((_e, ns) => {
//       console.log('App.js: Auth state changed:', ns);
//       const sessionId = session?.user?.id;
//       const newSessionId = ns?.user?.id;
//       const hasSessionChanged = sessionId !== newSessionId;

//       if (hasSessionChanged) {
//         setSession(ns);
//         if (!ns) {
//           setCartCount(0);
//           setIsSeller(false);
//           setBuyerLocation(null);
//           setSellerLocation(null);
//           setLocationError('');
//           lastUserId.current = null;
//           setLocationReady(true);
//           hasInitialized.current = false;
//         }
//         initialize();
//       }
//     });

//     authSubscription.current = authListener.subscription;

//     return () => {
//       if (authSubscription.current) {
//         authSubscription.current.unsubscribe();
//         authSubscription.current = null;
//       }
//     };
//   }, [initialize, session]);

//   if (!initialized || !sessionResolved || !locationReady) {
//     return <div className="app-loading">Loading… <span>{error || 'Waiting for session...'}</span></div>;
//   }

//   return (
//     <HelmetProvider>
//       <LocationContext.Provider
//         value={{ buyerLocation, setBuyerLocation, sellerLocation, setSellerLocation, session, cartCount, setCartCount, handleLogout }}
//       >
//         <ErrorBoundary>
//           <Header error={error} />
//           {error && <div className="app-error">{error}</div>}
//           {locationError && (
//             <div className="location-notice">
//               {locationError} <button onClick={initialize}>Retry</button>
//             </div>
//           )}
//           <main>
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/product/:id" element={<ProductPage />} />
//               <Route
//                 path="/cart"
//                 element={session ? <Cart /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/checkout"
//                 element={
//                   session && !isSeller && buyerLocation ? (
//                     <Checkout />
//                   ) : (
//                     <Navigate to={isSeller ? '/seller' : '/auth'} />
//                   )
//                 }
//               />
//               <Route
//                 path="/account"
//                 element={session ? <Account /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/orders"
//                 element={session ? <Orders /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/orders/cancel/:id"
//                 element={session ? <CancelOrder /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/order-details/:orderId"
//                 element={session ? <OrderDetails /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/seller"
//                 element={session && isSeller ? <SellerDashboard /> : <Navigate to={session ? '/account' : '/auth'} />}
//               />
//               <Route
//                 path="/seller/add-product"
//                 element={session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />}
//               />
//               <Route path="/auth" element={<Auth />} />
//               <Route path="/categories" element={<Categories />} />
//               <Route path="/products" element={<Products />} />
//               <Route path="/support" element={<Support />} />
//               <Route path="*" element={<Navigate to="/" />} />
//               <Route path="/policy" element={<Policy />} />
//               <Route path="/privacy" element={<Privacy />} />
//             </Routes>
//           </main>
//           <Footer />
//         </ErrorBoundary>
//       </LocationContext.Provider>
//     </HelmetProvider>
//   );
// }

// export default App;


// import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import mapboxgl from 'mapbox-gl';
// import 'mapbox-gl/dist/mapbox-gl.css';
// import { supabase } from './supabaseClient';
// import { HelmetProvider } from 'react-helmet-async';
// import { Toaster } from 'react-hot-toast'; // Add this import
// import Header from './components/Header';
// import Footer from './components/Footer';
// import Home from './components/Home';
// import ProductPage from './components/ProductPage';
// import Cart from './components/Cart';
// import Checkout from './components/Checkout';
// import Auth from './components/Auth';
// import Categories from './components/Categories';
// import Products from './components/Products';
// import Account from './components/Account';
// import OrderDetails from './components/OrderDetails';
// import Orders from './components/Orders';
// import CancelOrder from './components/CancelOrder';
// import Support from './components/Support';
// import ErrorBoundary from './components/ErrorBoundary';
// import SellerDashboard from './components/SellerDashboard';
// import Policy from './components/Policy';
// import Privacy from './components/Privacy';
// import AddProductPage from './components/AddProductPage';
// import './App.css';

// export const LocationContext = createContext({
//   buyerLocation: null,
//   sellerLocation: null,
//   setBuyerLocation: () => {},
//   setSellerLocation: () => {},
//   session: null,
//   cartCount: 0,
//   setCartCount: () => {},
//   handleLogout: () => {},
// });

// function App() {
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(0);
//   const [isSeller, setIsSeller] = useState(false);
//   const [buyerLocation, setBuyerLocation] = useState(null);
//   const [sellerLocation, setSellerLocation] = useState(null);
//   const [locationError, setLocationError] = useState('');
//   const [error, setError] = useState(null);
//   const [initialized, setInitialized] = useState(false);
//   const [sessionResolved, setSessionResolved] = useState(false);
//   const [locationReady, setLocationReady] = useState(false);

//   const lastUserId = useRef(null);
//   const authSubscription = useRef(null);
//   const hasInitialized = useRef(false);

//   mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

//   const detectLocation = useCallback(async () => {
//     if (buyerLocation || sellerLocation) {
//       return buyerLocation || sellerLocation;
//     }
//     try {
//       if (!navigator.geolocation) {
//         throw new Error('Geolocation not supported');
//       }
//       const pos = await new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(
//           (position) => resolve(position),
//           (err) => reject(err),
//           { enableHighAccuracy: true, timeout: 10000 }
//         );
//       });
//       if (!process.env.REACT_APP_MAPBOX_TOKEN) {
//         console.warn('Mapbox token missing; using raw coordinates.');
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       }
//       try {
//         const response = await fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
//         );
//         if (!response.ok) {
//           throw new Error(`Mapbox Geocoding failed: ${response.statusText}`);
//         }
//         const data = await response.json();
//         if (data.features?.length > 0) {
//           const [lon, lat] = data.features[0].center;
//           return { lat, lon };
//         }
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       } catch (e) {
//         console.warn('Mapbox Geocoding error:', e);
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       }
//     } catch (e) {
//       console.error('Geolocation failed:', e);
//       setLocationError(`Geolocation error: ${e.message}—using default Bengaluru.`);
//       return { lat: 12.9753, lon: 77.591 };
//     }
//   }, [buyerLocation, sellerLocation]);

//   const fetchCart = useCallback(async (userId) => {
//     if (!userId) return;
//     try {
//       const { data, error } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', userId);
//       if (error) throw error;
//       setCartCount(data.length);
//     } catch (e) {
//       console.error('Cart fetch error:', e);
//       setError('Failed to load cart count.');
//     }
//   }, []);

//   const fetchSeller = useCallback(
//     async (userId) => {
//       if (!userId) return;
//       try {
//         const { data: prof, error: profError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', userId)
//           .maybeSingle();
//         if (profError) throw profError;
//         setIsSeller(prof?.is_seller || false);

//         if (prof?.is_seller) {
//           const { data: sd, error: sdError } = await supabase
//             .from('sellers')
//             .select('latitude, longitude, store_name')
//             .eq('id', userId)
//             .maybeSingle();
//           if (sdError) throw sdError;
//           if (sd?.latitude && sd?.longitude) {
//             setSellerLocation({ lat: sd.latitude, lon: sd.longitude });
//           } else {
//             const loc = await detectLocation();
//             let storeName = sd?.store_name;
//             if (!storeName) {
//               storeName = `Store-${userId}`;
//             }
//             setSellerLocation(loc);
//             const { error: updateError } = await supabase
//               .from('sellers')
//               .upsert({ id: userId, latitude: loc.lat, longitude: loc.lon, store_name: storeName });
//             if (updateError) throw updateError;
//           }
//         }
//       } catch (e) {
//         console.error('Seller fetch error:', e);
//         setError('Failed to verify seller status.');
//       }
//     },
//     [detectLocation]
//   );

//   const initialize = useCallback(async () => {
//     if (hasInitialized.current) return;
//     hasInitialized.current = true;

//     try {
//       console.log('Initializing session...');
//       const {
//         data: { session: sess },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError) throw sessionError;
//       setSession(sess);
//       setSessionResolved(true);

//       if (sess && sess.user?.id !== lastUserId.current) {
//         lastUserId.current = sess.user.id;
//         await Promise.all([fetchCart(sess.user.id), fetchSeller(sess.user.id)]);

//         if (!isSeller) {
//           const { data: profile, error: profileError } = await supabase
//             .from('profiles')
//             .select('latitude, longitude')
//             .eq('id', sess.user.id)
//             .maybeSingle();
//           if (profileError) {
//             console.error('Profile fetch error:', profileError);
//             setError('Failed to fetch user location.');
//             setLocationReady(true);
//             return;
//           }
//           if (profile?.latitude && profile?.longitude) {
//             setBuyerLocation({ lat: profile.latitude, lon: profile.longitude });
//             setLocationReady(true);
//           } else {
//             const loc = await detectLocation();
//             setBuyerLocation(loc);
//             setLocationReady(true);
//             const { error: updateError } = await supabase
//               .from('profiles')
//               .upsert({ id: sess.user.id, latitude: loc.lat, longitude: loc.lon });
//             if (updateError) {
//               console.error('Profile update error:', updateError);
//               setError('Failed to update user location.');
//             }
//           }
//         } else {
//           setLocationReady(true);
//         }
//       } else {
//         setLocationReady(true);
//       }
//     } catch (e) {
//       console.error('Initialization error:', e);
//       setError(`Initialization failed: ${e.message}`);
//       setSessionResolved(true);
//       setLocationReady(true);
//     } finally {
//       setInitialized(true);
//       console.log('Initialization complete:', { initialized: true, sessionResolved: true, locationReady: true });
//     }
//   }, [fetchCart, fetchSeller, detectLocation, isSeller]);

//   const handleLogout = useCallback(async () => {
//     try {
//       await supabase.auth.signOut();
//       window.location.href = '/auth';
//     } catch (e) {
//       console.error('Logout error:', e);
//       setError(`Logout failed: ${e.message}`);
//     }
//   }, []);

//   useEffect(() => {
//     initialize();

//     const { data: authListener } = supabase.auth.onAuthStateChange((_e, ns) => {
//       console.log('App.js: Auth state changed:', ns);
//       const sessionId = session?.user?.id;
//       const newSessionId = ns?.user?.id;
//       const hasSessionChanged = sessionId !== newSessionId;

//       if (hasSessionChanged) {
//         setSession(ns);
//         if (!ns) {
//           setCartCount(0);
//           setIsSeller(false);
//           setBuyerLocation(null);
//           setSellerLocation(null);
//           setLocationError('');
//           lastUserId.current = null;
//           setLocationReady(true);
//           hasInitialized.current = false;
//         }
//         initialize();
//       }
//     });

//     authSubscription.current = authListener.subscription;

//     return () => {
//       if (authSubscription.current) {
//         authSubscription.current.unsubscribe();
//         authSubscription.current = null;
//       }
//     };
//   }, [initialize, session]);

//   if (!initialized || !sessionResolved || !locationReady) {
//     return <div className="app-loading">Loading… <span>{error || 'Waiting for session...'}</span></div>;
//   }

//   return (
//     <HelmetProvider>
//       <LocationContext.Provider
//         value={{ buyerLocation, setBuyerLocation, sellerLocation, setSellerLocation, session, cartCount, setCartCount, handleLogout }}
//       >
//         <ErrorBoundary>
//           <Header error={error} />
//           {error && <div className="app-error">{error}</div>}
//           {locationError && (
//             <div className="location-notice">
//               {locationError} <button onClick={initialize}>Retry</button>
//             </div>
//           )}
//           <main>
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/product/:id" element={<ProductPage />} />
//               <Route
//                 path="/cart"
//                 element={session ? <Cart /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/checkout"
//                 element={
//                   session && !isSeller && buyerLocation ? (
//                     <Checkout />
//                   ) : (
//                     <Navigate to={isSeller ? '/seller' : '/auth'} />
//                   )
//                 }
//               />
//               <Route
//                 path="/account"
//                 element={session ? <Account /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/orders"
//                 element={session ? <Orders /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/orders/cancel/:id"
//                 element={session ? <CancelOrder /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/order-details/:orderId"
//                 element={session ? <OrderDetails /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/seller"
//                 element={session && isSeller ? <SellerDashboard /> : <Navigate to={session ? '/account' : '/auth'} />}
//               />
//               <Route
//                 path="/seller/add-product"
//                 element={session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />}
//               />
//               <Route path="/auth" element={<Auth />} />
//               <Route path="/categories" element={<Categories />} />
//               <Route path="/products" element={<Products />} />
//               <Route path="/support" element={<Support />} />
//               <Route path="*" element={<Navigate to="/" />} />
//               <Route path="/policy" element={<Policy />} />
//               <Route path="/privacy" element={<Privacy />} />
//             </Routes>
//           </main>
//           <Toaster
//             position="top-right"
//             toastOptions={{
//               duration: 3000,
//               style: {
//                 background: '#333',
//                 color: '#fff',
//               },
//             }}
//           />
//           <Footer />
//         </ErrorBoundary>
//       </LocationContext.Provider>
//     </HelmetProvider>
//   );
// }

// export default App;




// import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import mapboxgl from 'mapbox-gl';
// import 'mapbox-gl/dist/mapbox-gl.css';
// import { supabase } from './supabaseClient';
// import { HelmetProvider } from 'react-helmet-async';
// import { Toaster } from 'react-hot-toast';
// import Header from './components/Header';
// import Footer from './components/Footer';
// import Home from './components/Home';
// import ProductPage from './components/ProductPage';
// import Cart from './components/Cart';
// import Checkout from './components/Checkout';
// import Auth from './components/Auth';
// import Categories from './components/Categories';
// import Products from './components/Products';
// import Account from './components/Account';
// import OrderDetails from './components/OrderDetails';
// import Orders from './components/Orders';
// import CancelOrder from './components/CancelOrder';
// import Support from './components/Support';
// import ErrorBoundary from './components/ErrorBoundary';
// import SellerDashboard from './components/SellerDashboard';
// import Policy from './components/Policy';
// import Privacy from './components/Privacy';
// import AddProductPage from './components/AddProductPage';
// import './App.css';

// export const LocationContext = createContext({
//   buyerLocation: null,
//   sellerLocation: null,
//   setBuyerLocation: () => {},
//   setSellerLocation: () => {},
//   session: null,
//   cartCount: 0,
//   setCartCount: () => {},
//   handleLogout: () => {},
// });

// function App() {
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(0);
//   const [isSeller, setIsSeller] = useState(false);
//   const [buyerLocation, setBuyerLocation] = useState(null);
//   const [sellerLocation, setSellerLocation] = useState(null);
//   const [locationError, setLocationError] = useState('');
//   const [error, setError] = useState(null);
//   const [initialized, setInitialized] = useState(false);
//   const [sessionResolved, setSessionResolved] = useState(false);
//   const [locationReady, setLocationReady] = useState(false);

//   const lastUserId = useRef(null);
//   const authSubscription = useRef(null);
//   const hasInitialized = useRef(false);

//   mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

//   const detectLocation = useCallback(async () => {
//     if (buyerLocation || sellerLocation) {
//       return buyerLocation || sellerLocation;
//     }
//     try {
//       if (!navigator.geolocation) {
//         throw new Error('Geolocation not supported');
//       }
//       const pos = await new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(
//           (position) => resolve(position),
//           (err) => reject(err),
//           { enableHighAccuracy: true, timeout: 10000 }
//         );
//       });
//       if (!process.env.REACT_APP_MAPBOX_TOKEN) {
//         console.warn('Mapbox token missing; using raw coordinates.');
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       }
//       try {
//         const response = await fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
//         );
//         if (!response.ok) {
//           throw new Error(`Mapbox Geocoding failed: ${response.statusText}`);
//         }
//         const data = await response.json();
//         if (data.features?.length > 0) {
//           const [lon, lat] = data.features[0].center;
//           return { lat, lon };
//         }
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       } catch (e) {
//         console.warn('Mapbox Geocoding error:', e);
//         return { lat: pos.coords.latitude, lon: pos.coords.longitude };
//       }
//     } catch (e) {
//       console.error('Geolocation failed:', e);
//       setLocationError(`Geolocation error: ${e.message}—using default Bengaluru.`);
//       return { lat: 12.9753, lon: 77.591 };
//     }
//   }, [buyerLocation, sellerLocation]);

//   const fetchCart = useCallback(async (userId) => {
//     if (!userId) return;
//     try {
//       const { data, error } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', userId);
//       if (error) throw error;
//       setCartCount(data.length);
//     } catch (e) {
//       console.error('Cart fetch error:', e);
//       setError('Failed to load cart count.');
//     }
//   }, []);

//   const fetchSeller = useCallback(
//     async (userId) => {
//       if (!userId) return;
//       try {
//         const { data: prof, error: profError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', userId)
//           .maybeSingle();
//         if (profError) throw profError;
//         setIsSeller(prof?.is_seller || false);

//         if (prof?.is_seller) {
//           const { data: sd, error: sdError } = await supabase
//             .from('sellers')
//             .select('latitude, longitude, store_name')
//             .eq('id', userId)
//             .maybeSingle();
//           if (sdError) throw sdError;
//           if (sd?.latitude && sd?.longitude) {
//             setSellerLocation({ lat: sd.latitude, lon: sd.longitude });
//           } else {
//             const loc = await detectLocation();
//             let storeName = sd?.store_name;
//             if (!storeName) {
//               storeName = `Store-${userId}`;
//             }
//             setSellerLocation(loc);
//             const { error: updateError } = await supabase
//               .from('sellers')
//               .upsert({ id: userId, latitude: loc.lat, longitude: loc.lon, store_name: storeName });
//             if (updateError) throw updateError;
//           }
//         }
//       } catch (e) {
//         console.error('Seller fetch error:', e);
//         setError('Failed to verify seller status.');
//       }
//     },
//     [detectLocation]
//   );

//   const initialize = useCallback(async () => {
//     if (hasInitialized.current) return;
//     hasInitialized.current = true;

//     try {
//       console.log('Initializing session...');
//       const {
//         data: { session: sess },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError) throw sessionError;
//       setSession(sess);
//       setSessionResolved(true);

//       if (sess && sess.user?.id !== lastUserId.current) {
//         lastUserId.current = sess.user.id;
//         await Promise.all([fetchCart(sess.user.id), fetchSeller(sess.user.id)]);

//         if (!isSeller) {
//           const { data: profile, error: profileError } = await supabase
//             .from('profiles')
//             .select('latitude, longitude')
//             .eq('id', sess.user.id)
//             .maybeSingle();
//           if (profileError) {
//             console.error('Profile fetch error:', profileError);
//             setError('Failed to fetch user location.');
//             setLocationReady(true);
//             return;
//           }
//           if (profile?.latitude && profile?.longitude) {
//             setBuyerLocation({ lat: profile.latitude, lon: profile.longitude });
//             setLocationReady(true);
//           } else {
//             const loc = await detectLocation();
//             setBuyerLocation(loc);
//             setLocationReady(true);
//             const { error: updateError } = await supabase
//               .from('profiles')
//               .upsert({ id: sess.user.id, latitude: loc.lat, longitude: loc.lon });
//             if (updateError) {
//               console.error('Profile update error:', updateError);
//               setError('Failed to update user location.');
//             }
//           }
//         } else {
//           setLocationReady(true);
//         }
//       } else {
//         setLocationReady(true);
//       }
//     } catch (e) {
//       console.error('Initialization error:', e);
//       setError(`Initialization failed: ${e.message}`);
//       setSessionResolved(true);
//       setLocationReady(true);
//     } finally {
//       setInitialized(true);
//       console.log('Initialization complete:', { initialized: true, sessionResolved: true, locationReady: true });
//     }
//   }, [fetchCart, fetchSeller, detectLocation, isSeller]);

//   const handleLogout = useCallback(async () => {
//     try {
//       await supabase.auth.signOut();
//       window.location.href = '/auth';
//     } catch (e) {
//       console.error('Logout error:', e);
//       setError(`Logout failed: ${e.message}`);
//     }
//   }, []);

//   useEffect(() => {
//     initialize();

//     const { data: authListener } = supabase.auth.onAuthStateChange((_e, ns) => {
//       console.log('App.js: Auth state changed:', ns);
//       const sessionId = session?.user?.id;
//       const newSessionId = ns?.user?.id;
//       const hasSessionChanged = sessionId !== newSessionId;

//       if (hasSessionChanged) {
//         setSession(ns);
//         if (!ns) {
//           setCartCount(0);
//           setIsSeller(false);
//           setBuyerLocation(null);
//           setSellerLocation(null);
//           setLocationError('');
//           lastUserId.current = null;
//           setLocationReady(true);
//           hasInitialized.current = false;
//         }
//         initialize();
//       }
//     });

//     authSubscription.current = authListener.subscription;

//     return () => {
//       if (authSubscription.current) {
//         authSubscription.current.unsubscribe();
//         authSubscription.current = null;
//       }
//     };
//   }, [initialize, session]);

//   if (!initialized || !sessionResolved || !locationReady) {
//     return <div className="app-loading">Loading… <span>{error || 'Waiting for session...'}</span></div>;
//   }

//   return (
//     <HelmetProvider>
//       <LocationContext.Provider
//         value={{ buyerLocation, setBuyerLocation, sellerLocation, setSellerLocation, session, cartCount, setCartCount, handleLogout }}
//       >
//         <ErrorBoundary>
//           <Header error={error} />
//           {error && <div className="app-error">{error}</div>}
//           {locationError && (
//             <div className="location-notice">
//               {locationError} <button onClick={initialize}>Retry</button>
//             </div>
//           )}
//           <main>
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/product/:id" element={<ProductPage />} />
//               <Route
//                 path="/cart"
//                 element={session ? <Cart /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/checkout"
//                 element={
//                   session && !isSeller && buyerLocation ? (
//                     <Checkout />
//                   ) : (
//                     <Navigate to={isSeller ? '/seller' : '/auth'} />
//                   )
//                 }
//               />
//               <Route
//                 path="/account"
//                 element={session ? <Account /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/orders"
//                 element={session ? <Orders /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/orders/cancel/:id"
//                 element={session ? <CancelOrder /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/order-details/:orderId"
//                 element={session ? <OrderDetails /> : <Navigate to="/auth" />}
//               />
//               <Route
//                 path="/seller"
//                 element={session && isSeller ? <SellerDashboard /> : <Navigate to={session ? '/account' : '/auth'} />}
//               />
//               <Route
//                 path="/seller/add-product"
//                 element={session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />}
//               />
//               <Route
//                 path="/edit-product/:productId"
//                 element={session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />}
//               />
//               <Route path="/auth" element={<Auth />} />
//               <Route path="/categories" element={<Categories />} />
//               <Route path="/products" element={<Products />} />
//               <Route path="/support" element={<Support />} />
//               <Route path="*" element={<Navigate to="/" />} />
//               <Route path="/policy" element={<Policy />} />
//               <Route path="/privacy" element={<Privacy />} />
//             </Routes>
//           </main>
//           <Toaster
//             position="top-center"
//             toastOptions={{
//               success: {
//                 duration: 4000,
//                 style: {
//                   background: '#52c41a',
//                   color: '#fff',
//                   fontWeight: 'bold',
//                   borderRadius: '8px',
//                   padding: '16px',
//                   boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//                 },
//               },
//               error: {
//                 duration: 4000,
//                 style: {
//                   background: '#ff4d4f',
//                   color: '#fff',
//                   fontWeight: 'bold',
//                   borderRadius: '8px',
//                   padding: '16px',
//                   boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//                 },
//               },
//             }}
//           />
//           <Footer />
//         </ErrorBoundary>
//       </LocationContext.Provider>
//     </HelmetProvider>
//   );
// }

// export default App;

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from './supabaseClient';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import ProductPage from './components/ProductPage';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Auth from './components/Auth';
import Categories from './components/Categories';
import Products from './components/Products';
import Account from './components/Account';
import OrderDetails from './components/OrderDetails';
import Orders from './components/Orders';
import CancelOrder from './components/CancelOrder';
import Support from './components/Support';
import ErrorBoundary from './components/ErrorBoundary';
import SellerDashboard from './components/SellerDashboard';
import Policy from './components/Policy';
import Privacy from './components/Privacy';
import AddProductPage from './components/AddProductPage';
import './App.css';

export const LocationContext = createContext({
  buyerLocation: null,
  sellerLocation: null,
  setBuyerLocation: () => {},
  setSellerLocation: () => {},
  session: null,
  cartCount: 0,
  setCartCount: () => {},
  handleLogout: () => {},
});

function App() {
  const [session, setSession] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isSeller, setIsSeller] = useState(false);
  const [buyerLocation, setBuyerLocation] = useState(null);
  const [sellerLocation, setSellerLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [locationReady, setLocationReady] = useState(false);

  const lastUserId = useRef(null);
  const authSubscription = useRef(null);
  const hasInitialized = useRef(false);

  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

  const detectLocation = useCallback(async () => {
    if (buyerLocation || sellerLocation) {
      return buyerLocation || sellerLocation;
    }
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
      if (!process.env.REACT_APP_MAPBOX_TOKEN) {
        return { lat: pos.coords.latitude, lon: pos.coords.longitude };
      }
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
        );
        if (!response.ok) {
          throw new Error(`Mapbox Geocoding failed: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.features?.length > 0) {
          const [lon, lat] = data.features[0].center;
          return { lat, lon };
        }
        return { lat: pos.coords.latitude, lon: pos.coords.longitude };
      } catch (e) {
        return { lat: pos.coords.latitude, lon: pos.coords.longitude };
      }
    } catch (e) {
      setLocationError(`Geolocation error: ${e.message}—using default Jharia, Dhanbad.`);
      return { lat: 23.7407, lon: 86.4146 };
    }
  }, [buyerLocation, sellerLocation]);

  const fetchCart = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('cart')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);
      if (error) throw error;
      setCartCount(data.length);
    } catch (e) {
      setError('Failed to load cart count.');
    }
  }, []);

  const fetchSeller = useCallback(
    async (userId) => {
      if (!userId) return;
      try {
        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('id', userId)
          .maybeSingle();
        if (profError) throw profError;
        setIsSeller(prof?.is_seller || false);

        if (prof?.is_seller) {
          const { data: sd, error: sdError } = await supabase
            .from('sellers')
            .select('latitude, longitude, store_name')
            .eq('id', userId)
            .maybeSingle();
          if (sdError) throw sdError;
          if (sd?.latitude && sd?.longitude) {
            setSellerLocation({ lat: sd.latitude, lon: sd.longitude });
          } else {
            const loc = await detectLocation();
            let storeName = sd?.store_name;
            if (!storeName) {
              storeName = `Store-${userId}`;
            }
            setSellerLocation(loc);
            const { error: updateError } = await supabase
              .from('sellers')
              .upsert({ id: userId, latitude: loc.lat, longitude: loc.lon, store_name: storeName });
            if (updateError) throw updateError;
          }
        }
      } catch (e) {
        setError('Failed to verify seller status.');
      }
    },
    [detectLocation]
  );

  const initialize = useCallback(async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      const {
        data: { session: sess },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      setSession(sess);
      setSessionResolved(true);

      if (sess && sess.user?.id !== lastUserId.current) {
        lastUserId.current = sess.user.id;
        await Promise.all([fetchCart(sess.user.id), fetchSeller(sess.user.id)]);

        if (!isSeller) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('latitude, longitude')
            .eq('id', sess.user.id)
            .maybeSingle();
          if (profileError) {
            setError('Failed to fetch user location.');
            setLocationReady(true);
            return;
          }
          if (profile?.latitude && profile?.longitude) {
            setBuyerLocation({ lat: profile.latitude, lon: profile.longitude });
            setLocationReady(true);
          } else {
            const loc = await detectLocation();
            setBuyerLocation(loc);
            setLocationReady(true);
            const { error: updateError } = await supabase
              .from('profiles')
              .upsert({ id: sess.user.id, latitude: loc.lat, longitude: loc.lon });
            if (updateError) {
              setError('Failed to update user location.');
            }
          }
        } else {
          setLocationReady(true);
        }
      } else {
        setLocationReady(true);
      }
    } catch (e) {
      setError(`Initialization failed: ${e.message}`);
      setSessionResolved(true);
      setLocationReady(true);
    } finally {
      setInitialized(true);
    }
  }, [fetchCart, fetchSeller, detectLocation, isSeller]);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (e) {
      setError(`Logout failed: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange((_e, ns) => {
      const sessionId = session?.user?.id;
      const newSessionId = ns?.user?.id;
      const hasSessionChanged = sessionId !== newSessionId;

      if (hasSessionChanged) {
        setSession(ns);
        if (!ns) {
          setCartCount(0);
          setIsSeller(false);
          setBuyerLocation(null);
          setSellerLocation(null);
          setLocationError('');
          lastUserId.current = null;
          setLocationReady(true);
          hasInitialized.current = false;
        }
        initialize();
      }
    });

    authSubscription.current = authListener.subscription;

    return () => {
      if (authSubscription.current) {
        authSubscription.current.unsubscribe();
        authSubscription.current = null;
      }
    };
  }, [initialize, session]);

  if (!initialized || !sessionResolved || !locationReady) {
    return <div className="app-loading">Loading… <span>{error || 'Waiting for session...'}</span></div>;
  }

  return (
    <HelmetProvider>
      <LocationContext.Provider
        value={{ buyerLocation, setBuyerLocation, sellerLocation, setSellerLocation, session, cartCount, setCartCount, handleLogout }}
      >
        <ErrorBoundary>
          <Header error={error} />
          {error && <div className="app-error">{error}</div>}
          {locationError && (
            <div className="location-notice">
              {locationError} <button onClick={initialize}>Retry</button>
            </div>
          )}
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route
                path="/cart"
                element={session ? <Cart /> : <Navigate to="/auth" />}
              />
              <Route
                path="/checkout"
                element={
                  session && !isSeller && buyerLocation ? (
                    <Checkout />
                  ) : (
                    <Navigate to={isSeller ? '/seller' : '/auth'} />
                  )
                }
              />
              <Route
                path="/account"
                element={session ? <Account /> : <Navigate to="/auth" />}
              />
              <Route
                path="/orders"
                element={session ? <Orders /> : <Navigate to="/auth" />}
              />
              <Route
                path="/orders/cancel/:id"
                element={session ? <CancelOrder /> : <Navigate to="/auth" />}
              />
              <Route
                path="/order-details/:orderId"
                element={session ? <OrderDetails /> : <Navigate to="/auth" />}
              />
              <Route
                path="/seller"
                element={session && isSeller ? <SellerDashboard /> : <Navigate to={session ? '/account' : '/auth'} />}
              />
              <Route
                path="/seller/add-product"
                element={session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />}
              />
              <Route
                path="/edit-product/:productId"
                element={session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />}
              />
              <Route path="/auth" element={<Auth />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/products" element={<Products />} />
              <Route path="/support" element={<Support />} />
              <Route path="*" element={<Navigate to="/" />} />
              <Route path="/policy" element={<Policy />} />
              <Route path="/privacy" element={<Privacy />} />
            </Routes>
          </main>
          <Toaster
            position="top-center"
            toastOptions={{
              success: {
                duration: 4000,
                style: {
                  background: '#52c41a',
                  color: '#fff',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#ff4d4f',
                  color: '#fff',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                },
              },
            }}
          />
          <Footer />
        </ErrorBoundary>
      </LocationContext.Provider>
    </HelmetProvider>
  );
}

export default App;