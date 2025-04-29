


// import React, { useState, useEffect, useCallback } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { supabase } from './supabaseClient';
// import Header from './components/Header';
// import Footer from './components/Footer';
// import Checkout from './components/Checkout';
// import Home from './components/Home';
// import ProductPage from './components/ProductPage';
// import Cart from './components/Cart';
// import Auth from './components/Auth';
// import Categories from './components/Categories';
// import Products from './components/Products';
// import Seller from './components/Seller';
// import Account from './components/Account';
// import OrderDetails from './components/OrderDetails';
// import Orders from './components/Orders';
// import CancelOrder from './components/CancelOrder';
// import Support from './components/Support';
// import ErrorBoundary from './components/ErrorBoundary'; // Ensure this file exists
// import './App.css';

// function App() {
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(0);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       if (session) {
//         fetchCartCount();
//         checkSellerStatus();
//       }
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//       if (session) {
//         fetchCartCount();
//         checkSellerStatus();
//       } else {
//         setCartCount(0);
//         setIsSeller(false);
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const handleLogout = async () => {
//     try {
//       await supabase.auth.signOut();
//       setSession(null);
//       setCartCount(0);
//       setError(null);
//       setIsSeller(false);
//     } catch (err) {
//       setError('Error logging out: ' + err.message);
//     }
//   };

//   const fetchCartCount = async () => {
//     if (!session) return;
//     try {
//       const { data, error } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', session.user.id);
//       if (error) throw error;
//       setCartCount(data.length || 0);
//     } catch (err) {
//       console.error('Error fetching cart count:', err);
//       setError('Failed to fetch cart count: ' + err.message);
//     }
//   };

//   const checkSellerStatus = useCallback(async () => {
//     if (!session) return;
//     let attempt = 0;
//     const maxAttempts = 3;
//     while (attempt < maxAttempts) {
//       try {
//         const { data, error } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (error) throw error;
//         setIsSeller(data.is_seller);
//         setError(null); // Clear any previous errors
//         return;
//       } catch (err) {
//         attempt++;
//         console.warn(`Attempt ${attempt} failed:`, err);
//         if (attempt < maxAttempts) {
//           await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // Exponential backoff
//           continue;
//         }
//         setError('Failed to check seller status after retries: ' + err.message);
//         setIsSeller(false);
//         return;
//       }
//     }
//   }, [session]);

//   return (
//     <Router>
//       <div className="App">
//         <Header cartCount={cartCount} onLogout={handleLogout} error={error} />
//         {error && <div className="app-error" style={{ color: '#ff0000', padding: '10px' }}>{error}</div>}
//         <main>
//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/product/:id" element={<ProductPage />} />
//             <Route
//               path="/cart"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Cart setCartCount={setCartCount} /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route path="/checkout" element={<Checkout />} />
//             <Route path="/auth" element={<Auth />} />
//             <Route path="/explore" element={<div>Explore Page (Coming Soon)</div>} />
//             <Route path="/categories" element={<Categories />} />
//             <Route
//               path="/account"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Account /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/seller/:sellerId"
//               element={
//                 <ErrorBoundary>
//                   {session && isSeller ? <Seller /> : <Navigate to={session ? "/" : "/auth"} />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/order-details/:orderId"
//               element={
//                 <ErrorBoundary>
//                   {session ? <OrderDetails /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/orders"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Orders /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route path="/products" element={<Products />} />
//             <Route
//               path="/orders/cancel/:id"
//               element={
//                 <ErrorBoundary>
//                   {session ? <CancelOrder /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route path="/support" element={<Support />} />
//           </Routes>
//         </main>
//         <Footer />
//       </div>
//     </Router>
//   );
// }

// export default App;



// import React, { useState, useEffect, useCallback } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { supabase } from './supabaseClient';
// import Header from './components/Header';
// import Footer from './components/Footer';
// import Checkout from './components/Checkout';
// import Home from './components/Home';
// import ProductPage from './components/ProductPage';
// import Cart from './components/Cart';
// import Auth from './components/Auth';
// import Categories from './components/Categories';
// import Products from './components/Products';
// import Seller from './components/Seller'; // Old Seller component if needed
// import Account from './components/Account';
// import OrderDetails from './components/OrderDetails';
// import Orders from './components/Orders';
// import CancelOrder from './components/CancelOrder';
// import Support from './components/Support';
// import ErrorBoundary from './components/ErrorBoundary';
// import SellerDashboard from './components/SellerDashboard';
// import './App.css';

// function App() {
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(0);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       if (session) {
//         fetchCartCount();
//         checkSellerStatus();
//       }
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//       if (session) {
//         fetchCartCount();
//         checkSellerStatus();
//       } else {
//         setCartCount(0);
//         setIsSeller(false);
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const handleLogout = async () => {
//     try {
//       await supabase.auth.signOut();
//       setSession(null);
//       setCartCount(0);
//       setError(null);
//       setIsSeller(false);
//     } catch (err) {
//       setError('Error logging out: ' + err.message);
//     }
//   };

//   const fetchCartCount = async () => {
//     if (!session) return;
//     try {
//       const { data, error } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', session.user.id);
//       if (error) throw error;
//       setCartCount(data.length || 0);
//     } catch (err) {
//       console.error('Error fetching cart count:', err);
//       setError('Failed to fetch cart count: ' + err.message);
//     }
//   };

//   const checkSellerStatus = useCallback(async () => {
//     if (!session) return;
//     let attempt = 0;
//     const maxAttempts = 3;
//     while (attempt < maxAttempts) {
//       try {
//         const { data, error } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (error) throw error;
//         setIsSeller(data.is_seller);
//         setError(null);
//         return;
//       } catch (err) {
//         attempt++;
//         console.warn(`Attempt ${attempt} failed:`, err);
//         if (attempt < maxAttempts) {
//           await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
//           continue;
//         }
//         setError('Failed to check seller status after retries: ' + err.message);
//         setIsSeller(false);
//         return;
//       }
//     }
//   }, [session]);

//   return (
//     <Router>
//       <div className="App">
//         <Header cartCount={cartCount} onLogout={handleLogout} error={error} />
//         {error && <div className="app-error" style={{ color: '#ff0000', padding: '10px' }}>{error}</div>}
//         <main>
//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/product/:id" element={<ProductPage />} />
//             <Route
//               path="/cart"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Cart setCartCount={setCartCount} /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route path="/checkout" element={<Checkout />} />
//             <Route path="/auth" element={<Auth />} />
//             <Route path="/explore" element={<div>Explore Page (Coming Soon)</div>} />
//             <Route path="/categories" element={<Categories />} />
//             <Route
//               path="/account"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Account /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             {/* New routes for separate Account and Seller Dashboard pages */}
//             <Route path="/seller/*" element={<SellerDashboard />} />
//             <Route
//               path="/order-details/:orderId"
//               element={
//                 <ErrorBoundary>
//                   {session ? <OrderDetails /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/orders"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Orders /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route path="/products" element={<Products />} />
//             <Route
//               path="/orders/cancel/:id"
//               element={
//                 <ErrorBoundary>
//                   {session ? <CancelOrder /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route path="/support" element={<Support />} />
//           </Routes>
//         </main>
//         <Footer />
//       </div>
//     </Router>
//   );
// }

// export default App;



// import React, { useState, useEffect, useCallback } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { supabase } from './supabaseClient';
// import Header from './components/Header';
// import Footer from './components/Footer';
// import Checkout from './components/Checkout';
// import Home from './components/Home';
// import ProductPage from './components/ProductPage';
// import Cart from './components/Cart';
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
// import AddProductPage from './components/AddProductPage'; // <-- New Add-Product page
// import './App.css';

// function App() {
//   // Application-wide state
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(0);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);

//   // Check if user is logged in & set session
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       if (session) {
//         fetchCartCount();
//         checkSellerStatus();
//       }
//     });

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//       if (session) {
//         fetchCartCount();
//         checkSellerStatus();
//       } else {
//         setCartCount(0);
//         setIsSeller(false);
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   // Handle logout
//   const handleLogout = async () => {
//     try {
//       await supabase.auth.signOut();
//       setSession(null);
//       setCartCount(0);
//       setError(null);
//       setIsSeller(false);
//     } catch (err) {
//       setError('Error logging out: ' + err.message);
//     }
//   };

//   // Fetch cart item count for current user
//   const fetchCartCount = async () => {
//     if (!session) return;
//     try {
//       const { data, error } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', session.user.id);
//       if (error) throw error;
//       setCartCount(data.length || 0);
//     } catch (err) {
//       console.error('Error fetching cart count:', err);
//       setError('Failed to fetch cart count: ' + err.message);
//     }
//   };

//   // Check if the user is a seller
//   const checkSellerStatus = useCallback(async () => {
//     if (!session) return;
//     let attempt = 0;
//     const maxAttempts = 3;

//     while (attempt < maxAttempts) {
//       try {
//         const { data, error } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();

//         if (error) throw error;
//         setIsSeller(data.is_seller);
//         setError(null);
//         return;
//       } catch (err) {
//         attempt++;
//         console.warn(`Attempt ${attempt} failed:`, err);
//         if (attempt < maxAttempts) {
//           // Exponential backoff
//           await new Promise((resolve) =>
//             setTimeout(resolve, 1000 * Math.pow(2, attempt))
//           );
//           continue;
//         }
//         setError('Failed to check seller status after retries: ' + err.message);
//         setIsSeller(false);
//         return;
//       }
//     }
//   }, [session]);

//   return (
//     <Router>
//       <div className="App">
//         {/* Pass cartCount, logout handler, and error to Header */}
//         <Header cartCount={cartCount} onLogout={handleLogout} error={error} />

//         {/* Show global error (if any) */}
//         {error && (
//           <div className="app-error" style={{ color: '#ff0000', padding: '10px' }}>
//             {error}
//           </div>
//         )}

//         <main>
//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/product/:id" element={<ProductPage />} />

//             {/* Cart requires user to be logged in */}
//             <Route
//               path="/cart"
//               element={
//                 <ErrorBoundary>
//                   {session ? (
//                     <Cart setCartCount={setCartCount} />
//                   ) : (
//                     <Navigate to="/auth" />
//                   )}
//                 </ErrorBoundary>
//               }
//             />

//             <Route path="/checkout" element={<Checkout />} />
//             <Route path="/auth" element={<Auth />} />
//             <Route path="/categories" element={<Categories />} />
//             <Route path="/products" element={<Products />} />
//             <Route path="/support" element={<Support />} />

//             {/* Seller Dashboard */}
//             <Route path="/seller" element={<SellerDashboard />} />

//             {/* Separate Add Product Page (only if logged in) */}
//             <Route
//               path="/seller/add-product"
//               element={
//                 <ErrorBoundary>
//                   {session ? <AddProductPage /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />

//             {/* Account & Orders */}
//             <Route
//               path="/account"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Account /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/order-details/:orderId"
//               element={
//                 <ErrorBoundary>
//                   {session ? <OrderDetails /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/orders"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Orders /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/orders/cancel/:id"
//               element={
//                 <ErrorBoundary>
//                   {session ? <CancelOrder /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//           </Routes>
//         </main>

//         <Footer />
//       </div>
//     </Router>
//   );
// }

// export default App;



// import React, { useState, useEffect, useCallback } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { supabase } from './supabaseClient';
// import Header from './components/Header';
// import Footer from './components/Footer';
// import Checkout from './components/Checkout';
// import Home from './components/Home';
// import ProductPage from './components/ProductPage';
// import Cart from './components/Cart';
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
// import AddProductPage from './components/AddProductPage';
// import './App.css';

// function App() {
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(0);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);

//   useEffect(() => {
//     const fetchSession = async () => {
//       const { data: { session } } = await supabase.auth.getSession();
//       setSession(session);
//       if (session) {
//         fetchCartCount(session.user.id);
//         checkSellerStatus(session.user.id);
//       }
//     };

//     fetchSession();

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//       if (session) {
//         fetchCartCount(session.user.id);
//         checkSellerStatus(session.user.id);
//       } else {
//         setCartCount(0);
//         setIsSeller(false);
//         setError(null);
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const fetchCartCount = async (userId) => {
//     if (!userId) return;
//     try {
//       const { data, error } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', userId);
//       if (error) throw error;
//       setCartCount(data.length || 0);
//     } catch (err) {
//       console.error('Error fetching cart count:', err);
//       setError('Cart count fetch karne mein error: ' + err.message);
//     }
//   };

//   const checkSellerStatus = useCallback(async (userId) => {
//     if (!userId) return;
//     let attempt = 0;
//     const maxAttempts = 3;

//     while (attempt < maxAttempts) {
//       try {
//         const { data, error } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', userId)
//           .single();

//         if (error) throw error;
//         setIsSeller(data.is_seller);
//         setError(null);
//         return;
//       } catch (err) {
//         attempt++;
//         console.warn(`Attempt ${attempt} failed:`, err);
//         if (attempt < maxAttempts) {
//           await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
//           continue;
//         }
//         setError('Seller status check karne mein error: ' + err.message);
//         setIsSeller(false);
//         return;
//       }
//     }
//   }, []);

//   const handleLogout = async () => {
//     try {
//       // Ensure the token is valid before attempting logout
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         console.warn('No active session found before logout.');
//       }

//       // Attempt to sign out
//       const { error: signOutError } = await supabase.auth.signOut();
//       if (signOutError) {
//         console.error('Supabase signOut error:', signOutError);
//         throw signOutError;
//       }

//       // Clear all Supabase-related local storage
//       localStorage.removeItem('supabase.auth.token');
//       localStorage.removeItem('supabase.auth.refresh_token'); // If refresh token is stored separately
//       Object.keys(localStorage).forEach((key) => {
//         if (key.startsWith('supabase.')) {
//           localStorage.removeItem(key);
//         }
//       });

//       // Reset app state
//       setSession(null);
//       setCartCount(0);
//       setError(null);
//       setIsSeller(false);

//       // Force page reload and redirect to auth
//       window.location.replace('/auth');
//     } catch (err) {
//       console.error('Logout error details:', err);
//       setError('Logout karne mein error: ' + (err.message || 'Unknown error'));
//     }
//   };

//   return (
//     <Router>
//       <div className="App">
//         <Header cartCount={cartCount} onLogout={handleLogout} error={error} />

//         {error && (
//           <div className="app-error" style={{ color: '#dc3545', padding: '10px', textAlign: 'center' }}>
//             {error}
//           </div>
//         )}

//         <main>
//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/product/:id" element={<ProductPage />} />
//             <Route
//               path="/cart"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Cart setCartCount={setCartCount} /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/checkout"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Checkout /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/account"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Account /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/order-details/:orderId"
//               element={
//                 <ErrorBoundary>
//                   {session ? <OrderDetails /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/orders"
//               element={
//                 <ErrorBoundary>
//                   {session ? <Orders /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/orders/cancel/:id"
//               element={
//                 <ErrorBoundary>
//                   {session ? <CancelOrder /> : <Navigate to="/auth" />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/seller"
//               element={
//                 <ErrorBoundary>
//                   {session && isSeller ? <SellerDashboard /> : <Navigate to={session ? '/account' : '/auth'} />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route
//               path="/seller/add-product"
//               element={
//                 <ErrorBoundary>
//                   {session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />}
//                 </ErrorBoundary>
//               }
//             />
//             <Route path="/auth" element={<Auth />} />
//             <Route path="/categories" element={<Categories />} />
//             <Route path="/products" element={<Products />} />
//             <Route path="/support" element={<Support />} />
//             <Route path="*" element={<Navigate to="/" />} />
//           </Routes>
//         </main>

//         <Footer />
//       </div>
//     </Router>
//   );
// }

// export default App;



// import React, { createContext, useState, useEffect, useCallback } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { supabase } from './supabaseClient';
// import Header from './components/Header';
// import Footer from './components/Footer';
// import Checkout from './components/Checkout';
// import Home from './components/Home';
// import ProductPage from './components/ProductPage';
// import Cart from './components/Cart';
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
// import AddProductPage from './components/AddProductPage';
// import './App.css';

// export const LocationContext = createContext();

// function App() {
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(0);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [buyerLocation, setBuyerLocation] = useState(null);
//   const [sellerLocation, setSellerLocation] = useState(null);

//   const fetchCartCount = useCallback(async (userId) => {
//     if (!userId) return;
//     try {
//       const { data, error } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', userId);
//       if (error) throw error;
//       setCartCount(data.length || 0);
//     } catch (err) {
//       console.error('Error fetching cart count:', err);
//       setError('Cart count fetch karne mein error: ' + err.message);
//     }
//   }, []);

//   const checkSellerStatus = useCallback(async (userId) => {
//     if (!userId) return;
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', userId)
//         .single();
//       if (error) throw error;
//       setIsSeller(data.is_seller);
//       if (data.is_seller) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', userId)
//           .single();
//         if (sellerError) throw sellerError;
//         if (sellerData.latitude && sellerData.longitude) {
//           setSellerLocation({ lat: sellerData.latitude, lon: sellerData.longitude });
//         }
//       }
//     } catch (err) {
//       console.error('Error checking seller status:', err);
//       setError('Seller status check karne mein error: ' + err.message);
//     }
//   }, []);

//   useEffect(() => {
//     let subscription;

//     const initializeSession = async () => {
//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         setSession(session);
//         if (session) {
//           await Promise.all([fetchCartCount(session.user.id), checkSellerStatus(session.user.id)]);
//           if (!session.user.is_seller) {
//             navigator.geolocation.getCurrentPosition(
//               (pos) => setBuyerLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
//               () => setBuyerLocation({ lat: 12.9753, lon: 77.591 }),
//               { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
//             );
//           }
//         }
//         setIsInitialized(true);
//       } catch (err) {
//         console.error('Error initializing session:', err);
//         setError('Session initialize karne mein error: ' + err.message);
//         setIsInitialized(true);
//       }

//       subscription = supabase.auth.onAuthStateChange((_event, newSession) => {
//         setSession(newSession);
//         if (newSession) {
//           fetchCartCount(newSession.user.id);
//           checkSellerStatus(newSession.user.id);
//         } else {
//           setCartCount(0);
//           setIsSeller(false);
//           setError(null);
//           setBuyerLocation(null);
//           setSellerLocation(null);
//         }
//       }).data.subscription;
//     };

//     initializeSession();

//     return () => subscription && subscription.unsubscribe();
//   }, [fetchCartCount, checkSellerStatus]);

//   const handleLogout = async () => {
//     try {
//       const { error: signOutError } = await supabase.auth.signOut();
//       if (signOutError) throw signOutError;
//       localStorage.clear();
//       setSession(null);
//       setCartCount(0);
//       setError(null);
//       setIsSeller(false);
//       setBuyerLocation(null);
//       setSellerLocation(null);
//       window.location.replace('/auth');
//     } catch (err) {
//       setError('Logout karne mein error: ' + (err.message || 'Unknown error'));
//     }
//   };

//   if (!isInitialized) {
//     return <div className="app-loading">Loading...</div>;
//   }

//   return (
//     <LocationContext.Provider value={{ buyerLocation, sellerLocation, setSellerLocation }}>
//       <Router>
//         <div className="App">
//           <Header cartCount={cartCount} onLogout={handleLogout} error={error} />
//           {error && (
//             <div className="app-error" style={{ color: '#dc3545', padding: '10px', textAlign: 'center' }}>
//               {error}
//             </div>
//           )}
//           <main>
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/product/:id" element={<ProductPage />} />
//               <Route path="/cart" element={<ErrorBoundary>{session ? <Cart setCartCount={setCartCount} /> : <Navigate to="/auth" />}</ErrorBoundary>} />
//               <Route path="/checkout" element={<ErrorBoundary>{session ? <Checkout /> : <Navigate to="/auth" />}</ErrorBoundary>} />
//               <Route path="/account" element={<ErrorBoundary>{session ? <Account /> : <Navigate to="/auth" />}</ErrorBoundary>} />
//               <Route path="/order-details/:orderId" element={<ErrorBoundary>{session ? <OrderDetails /> : <Navigate to="/auth" />}</ErrorBoundary>} />
//               <Route path="/orders" element={<ErrorBoundary>{session ? <Orders /> : <Navigate to="/auth" />}</ErrorBoundary>} />
//               <Route path="/orders/cancel/:id" element={<ErrorBoundary>{session ? <CancelOrder /> : <Navigate to="/auth" />}</ErrorBoundary>} />
//               <Route path="/seller" element={<ErrorBoundary>{session && isSeller ? <SellerDashboard /> : <Navigate to={session ? '/account' : '/auth'} />}</ErrorBoundary>} />
//               <Route path="/seller/add-product" element={<ErrorBoundary>{session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />}</ErrorBoundary>} />
//               <Route path="/auth" element={<Auth />} />
//               <Route path="/categories" element={<Categories />} />
//               <Route path="/products" element={<Products />} />
//               <Route path="/support" element={<Support />} />
//               <Route path="*" element={<Navigate to="/" />} />
//             </Routes>
//           </main>
//           <Footer />
//         </div>
//       </Router>
//     </LocationContext.Provider>
//   );
// }

// export default App;



// import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
// import AddProductPage from './components/AddProductPage';
// import './App.css';

// export const LocationContext = createContext({
//   buyerLocation: null,
//   sellerLocation: null,
//   setSellerLocation: () => {},
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

//   const lastUserId = useRef(null);

//   // Set Mapbox access token
//   mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

//   // Detect location using Mapbox Geocoding API or navigator.geolocation
//   const detectLocation = useCallback(async () => {
//     if (buyerLocation || sellerLocation) {
//       return buyerLocation || sellerLocation;
//     }
//     try {
//       if (!navigator.geolocation) {
//         throw new Error('Geolocation not supported');
//       }
//       return new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(
//           async (pos) => {
//             if (!process.env.REACT_APP_MAPBOX_TOKEN) {
//               console.warn('Mapbox token missing; using raw coordinates.');
//               resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
//               return;
//             }
//             try {
//               const response = await fetch(
//                 `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
//               );
//               if (!response.ok) {
//                 throw new Error(`Mapbox Geocoding failed: ${response.statusText}`);
//               }
//               const data = await response.json();
//               if (data.features?.length > 0) {
//                 const [lon, lat] = data.features[0].center;
//                 resolve({ lat, lon });
//               } else {
//                 resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
//               }
//             } catch (e) {
//               console.warn('Mapbox Geocoding error:', e);
//               resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
//             }
//           },
//           (err) => {
//             console.warn('Geolocation failed:', err);
//             setLocationError('Could not get location—using default Bengaluru.');
//             resolve({ lat: 12.9753, lon: 77.591 });
//           },
//           { enableHighAccuracy: true, timeout: 10000 }
//         );
//       });
//     } catch (e) {
//       console.error('Location detection error:', e);
//       setLocationError('Location detection failed—using default Bengaluru.');
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
//             .select('latitude, longitude')
//             .eq('id', userId)
//             .maybeSingle();
//           if (sdError) throw sdError;
//           if (sd?.latitude && sd?.longitude) {
//             setSellerLocation({ lat: sd.latitude, lon: sd.longitude });
//           } else {
//             const loc = await detectLocation();
//             setSellerLocation(loc);
//             const { error: updateError } = await supabase
//               .from('sellers')
//               .upsert({ id: userId, latitude: loc.lat, longitude: loc.lon });
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
//     try {
//       const {
//         data: { session: sess },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError) throw sessionError;
//       setSession(sess);

//       if (sess && sess.user?.id !== lastUserId.current) {
//         lastUserId.current = sess.user.id;
//         await Promise.all([fetchCart(sess.user.id), fetchSeller(sess.user.id)]);

//         if (!sess.user.is_seller) {
//           const { data: profile, error: profileError } = await supabase
//             .from('profiles')
//             .select('latitude, longitude')
//             .eq('id', sess.user.id)
//             .maybeSingle();
//           if (profileError) {
//             console.error('Profile fetch error:', profileError);
//             setError('Failed to fetch user location.');
//             return;
//           }
//           if (profile?.latitude && profile?.longitude) {
//             setBuyerLocation({ lat: profile.latitude, lon: profile.longitude });
//           } else {
//             const loc = await detectLocation();
//             setBuyerLocation(loc);
//             const { error: updateError } = await supabase
//               .from('profiles')
//               .upsert({ id: sess.user.id, latitude: loc.lat, longitude: loc.lon });
//             if (updateError) {
//               console.error('Profile update error:', updateError);
//               setError('Failed to update user location.');
//             }
//           }
//         }
//       }
//     } catch (e) {
//       console.error('Initialization error:', e);
//       setError('Initialization failed.');
//     } finally {
//       setInitialized(true);
//     }
//   }, [fetchCart, fetchSeller, detectLocation]);

//   useEffect(() => {
//     initialize();
//     const sub = supabase.auth.onAuthStateChange((_e, ns) => {
//       setSession(ns);
//       if (!ns) {
//         setCartCount(0);
//         setIsSeller(false);
//         setBuyerLocation(null);
//         setSellerLocation(null);
//         setLocationError('');
//         lastUserId.current = null;
//       } else {
//         initialize();
//       }
//     }).data.subscription;
//     return () => sub?.unsubscribe();
//   }, [initialize]);

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     window.location.href = '/auth';
//   };

//   if (!initialized) {
//     return <div className="app-loading">Loading…</div>;
//   }

//   return (
//     <LocationContext.Provider value={{ buyerLocation, sellerLocation, setSellerLocation }}>
//       <ErrorBoundary>
//         <Router>
//           <Header cartCount={cartCount} onLogout={handleLogout} error={error} />
//           {error && <div className="app-error">{error}</div>}
//           {locationError && (
//             <div className="location-notice">
//               {locationError}{' '}
//               <button onClick={initialize}>Retry</button>
//             </div>
//           )}
//           <main>
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/product/:id" element={<ProductPage />} />
//               <Route path="/cart" element={session ? <Cart setCartCount={setCartCount} /> : <Navigate to="/auth" />} />
//               <Route path="/checkout" element={session ? <Checkout /> : <Navigate to="/auth" />} />
//               <Route path="/account" element={session ? <Account /> : <Navigate to="/auth" />} />
//               <Route path="/orders" element={session ? <Orders /> : <Navigate to="/auth" />} />
//               <Route path="/orders/cancel/:id" element={session ? <CancelOrder /> : <Navigate to="/auth" />} />
//               <Route path="/order-details/:orderId" element={session ? <OrderDetails /> : <Navigate to="/auth" />} />
//               <Route path="/seller" element={session && isSeller ? <SellerDashboard /> : <Navigate to={session ? '/account' : '/auth'} />} />
//               <Route path="/seller/add-product" element={session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />} />
//               <Route path="/auth" element={<Auth />} />
//               <Route path="/categories" element={<Categories />} />
//               <Route path="/products" element={<Products />} />
//               <Route path="/support" element={<Support />} />
//               <Route path="*" element={<Navigate to="/" />} />
//             </Routes>
//           </main>
//           <Footer />
//         </Router>
//       </ErrorBoundary>
//     </LocationContext.Provider>
//   );
// }

// export default App;


// import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
// import AddProductPage from './components/AddProductPage';
// import './App.css';

// export const LocationContext = createContext({
//   buyerLocation: null,
//   sellerLocation: null,
//   setSellerLocation: () => {},
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
//   const [sessionResolved, setSessionResolved] = useState(false); // New state to track session resolution

//   const lastUserId = useRef(null);

//   mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

//   const detectLocation = useCallback(async () => {
//     if (buyerLocation || sellerLocation) {
//       return buyerLocation || sellerLocation;
//     }
//     try {
//       if (!navigator.geolocation) {
//         throw new Error('Geolocation not supported');
//       }
//       return new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(
//           async (pos) => {
//             if (!process.env.REACT_APP_MAPBOX_TOKEN) {
//               console.warn('Mapbox token missing; using raw coordinates.');
//               resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
//               return;
//             }
//             try {
//               const response = await fetch(
//                 `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
//               );
//               if (!response.ok) {
//                 throw new Error(`Mapbox Geocoding failed: ${response.statusText}`);
//               }
//               const data = await response.json();
//               if (data.features?.length > 0) {
//                 const [lon, lat] = data.features[0].center;
//                 resolve({ lat, lon });
//               } else {
//                 resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
//               }
//             } catch (e) {
//               console.warn('Mapbox Geocoding error:', e);
//               resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
//             }
//           },
//           (err) => {
//             console.warn('Geolocation failed:', err);
//             setLocationError('Could not get location—using default Bengaluru.');
//             resolve({ lat: 12.9753, lon: 77.591 });
//           },
//           { enableHighAccuracy: true, timeout: 10000 }
//         );
//       });
//     } catch (e) {
//       console.error('Location detection error:', e);
//       setLocationError('Location detection failed—using default Bengaluru.');
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
//             .select('latitude, longitude')
//             .eq('id', userId)
//             .maybeSingle();
//           if (sdError) throw sdError;
//           if (sd?.latitude && sd?.longitude) {
//             setSellerLocation({ lat: sd.latitude, lon: sd.longitude });
//           } else {
//             const loc = await detectLocation();
//             setSellerLocation(loc);
//             const { error: updateError } = await supabase
//               .from('sellers')
//               .upsert({ id: userId, latitude: loc.lat, longitude: loc.lon });
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
//     try {
//       const {
//         data: { session: sess },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError) throw sessionError;
//       setSession(sess);
//       setSessionResolved(true); // Mark session as resolved

//       if (sess && sess.user?.id !== lastUserId.current) {
//         lastUserId.current = sess.user.id;
//         await Promise.all([fetchCart(sess.user.id), fetchSeller(sess.user.id)]);

//         if (!sess.user.is_seller) {
//           const { data: profile, error: profileError } = await supabase
//             .from('profiles')
//             .select('latitude, longitude')
//             .eq('id', sess.user.id)
//             .maybeSingle();
//           if (profileError) {
//             console.error('Profile fetch error:', profileError);
//             setError('Failed to fetch user location.');
//             return;
//           }
//           if (profile?.latitude && profile?.longitude) {
//             setBuyerLocation({ lat: profile.latitude, lon: profile.longitude });
//           } else {
//             const loc = await detectLocation();
//             setBuyerLocation(loc);
//             const { error: updateError } = await supabase
//               .from('profiles')
//               .upsert({ id: sess.user.id, latitude: loc.lat, longitude: loc.lon });
//             if (updateError) {
//               console.error('Profile update error:', updateError);
//               setError('Failed to update user location.');
//             }
//           }
//         }
//       }
//     } catch (e) {
//       console.error('Initialization error:', e);
//       setError('Initialization failed.');
//       setSessionResolved(true); // Resolve even on error to allow rendering
//     } finally {
//       setInitialized(true);
//     }
//   }, [fetchCart, fetchSeller, detectLocation]);

//   useEffect(() => {
//     console.log('App.js: Initializing with session:', session);
//     initialize();
//     const sub = supabase.auth.onAuthStateChange((_e, ns) => {
//       console.log('App.js: Auth state changed:', ns);
//       setSession(ns);
//       setSessionResolved(true); // Resolve session on auth state change
//       if (!ns) {
//         setCartCount(0);
//         setIsSeller(false);
//         setBuyerLocation(null);
//         setSellerLocation(null);
//         setLocationError('');
//         lastUserId.current = null;
//       } else {
//         initialize();
//       }
//     }).data.subscription;
//     return () => sub?.unsubscribe();
//   }, [initialize]);

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     window.location.href = '/auth';
//   };

//   if (!initialized || !sessionResolved) {
//     return <div className="app-loading">Loading…</div>;
//   }

//   return (
//     <LocationContext.Provider value={{ buyerLocation, sellerLocation, setSellerLocation }}>
//       <ErrorBoundary>
//         <Router>
//           <Header cartCount={cartCount} onLogout={handleLogout} error={error} />
//           {error && <div className="app-error">{error}</div>}
//           {locationError && (
//             <div className="location-notice">
//               {locationError}{' '}
//               <button onClick={initialize}>Retry</button>
//             </div>
//           )}
//           <main>
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/product/:id" element={<ProductPage />} />
//               <Route path="/cart" element={session ? <Cart setCartCount={setCartCount} /> : <Navigate to="/auth" />} />
//               <Route path="/checkout" element={session ? <Checkout /> : <Navigate to="/auth" />} />
//               <Route path="/account" element={session ? <Account /> : <Navigate to="/auth" />} />
//               <Route path="/orders" element={session ? <Orders /> : <Navigate to="/auth" />} />
//               <Route path="/orders/cancel/:id" element={session ? <CancelOrder /> : <Navigate to="/auth" />} />
//               <Route path="/order-details/:orderId" element={session ? <OrderDetails /> : <Navigate to="/auth" />} />
//               <Route path="/seller" element={session && isSeller ? <SellerDashboard /> : <Navigate to={session ? '/account' : '/auth'} />} />
//               <Route path="/seller/add-product" element={session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />} />
//               <Route path="/auth" element={<Auth />} />
//               <Route path="/categories" element={<Categories />} />
//               <Route path="/products" element={<Products />} />
//               <Route path="/support" element={<Support />} />
//               <Route path="*" element={<Navigate to="/" />} />
//             </Routes>
//           </main>
//           <Footer />
//         </Router>
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
// import AddProductPage from './components/AddProductPage';
// import './App.css';

// export const LocationContext = createContext({
//   buyerLocation: null,
//   sellerLocation: null,
//   setSellerLocation: () => {},
//   session: null,
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
//               // Use a default store name or prompt the user (for now, using a default)
//               storeName = `Store-${userId}`; // Default name; ideally, prompt the user
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
//         setLocationReady(true); // Allow rendering even with no session
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
//           } else if (!initialized) {
//             initialize();
//           }
//         }
//       }).data.subscription;
//     }

//     return () => {
//       if (authSubscription.current) {
//         authSubscription.current.unsubscribe();
//         authSubscription.current = null;
//       }
//     };
//   }, []); // Empty dependency array to run only on mount/unmount

//   useEffect(() => {
//     if (!initialized) {
//       initialize();
//     }
//   }, [initialize, initialized]);

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
//     <LocationContext.Provider value={{ buyerLocation, sellerLocation, setSellerLocation, session }}>
//       <ErrorBoundary>
//         <Header cartCount={cartCount} onLogout={handleLogout} error={error} />
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
//               element={session ? <Cart setCartCount={setCartCount} /> : <Navigate to="/auth" />}
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
//           </Routes>
//         </main>
//         <Footer />
//       </ErrorBoundary>
//     </LocationContext.Provider>
//   );
// }

// export default App;



import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from './supabaseClient';
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
  setSellerLocation: () => {},
  session: null,
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
        console.warn('Mapbox token missing; using raw coordinates.');
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
        console.warn('Mapbox Geocoding error:', e);
        return { lat: pos.coords.latitude, lon: pos.coords.longitude };
      }
    } catch (e) {
      console.error('Geolocation failed:', e);
      setLocationError(`Geolocation error: ${e.message}—using default Bengaluru.`);
      return { lat: 12.9753, lon: 77.591 };
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
      console.error('Cart fetch error:', e);
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
        console.error('Seller fetch error:', e);
        setError('Failed to verify seller status.');
      }
    },
    [detectLocation]
  );

  const initialize = useCallback(async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      console.log('Initializing session...');
      const {
        data: { session: sess },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      console.log('Session resolved:', sess);
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
            console.error('Profile fetch error:', profileError);
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
              console.error('Profile update error:', updateError);
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
      console.error('Initialization error:', e);
      setError(`Initialization failed: ${e.message}`);
      setSessionResolved(true);
      setLocationReady(true);
    } finally {
      setInitialized(true);
      console.log('Initialization complete:', { initialized: true, sessionResolved: true, locationReady: true });
    }
  }, [fetchCart, fetchSeller, detectLocation, isSeller]);

  useEffect(() => {
    if (!authSubscription.current) {
      authSubscription.current = supabase.auth.onAuthStateChange((_e, ns) => {
        console.log('App.js: Auth state changed:', ns);
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
      }).data.subscription;
    }

    initialize();

    return () => {
      if (authSubscription.current) {
        authSubscription.current.unsubscribe();
        authSubscription.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialize]); // Intentionally omitting session?.user?.id to prevent multiple subscriptions

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (e) {
      console.error('Logout error:', e);
      setError(`Logout failed: ${e.message}`);
    }
  };

  if (!initialized || !sessionResolved || !locationReady) {
    return <div className="app-loading">Loading… <span>{error || 'Waiting for session...'}</span></div>;
  }

  return (
    <LocationContext.Provider value={{ buyerLocation, sellerLocation, setSellerLocation, session }}>
      <ErrorBoundary>
        <Header cartCount={cartCount} onLogout={handleLogout} error={error} />
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
              element={session ? <Cart setCartCount={setCartCount} /> : <Navigate to="/auth" />}
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/products" element={<Products />} />
            <Route path="/support" element={<Support />} />
            <Route path="*" element={<Navigate to="/" />} />
            <Route path="/policy" element={<Policy />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </main>
        <Footer />
      </ErrorBoundary>
    </LocationContext.Provider>
  );
}

export default App;