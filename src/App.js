


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



import React, { createContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Header from './components/Header';
import Footer from './components/Footer';
import Checkout from './components/Checkout';
import Home from './components/Home';
import ProductPage from './components/ProductPage';
import Cart from './components/Cart';
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
import AddProductPage from './components/AddProductPage';
import './App.css';

export const LocationContext = createContext();

function App() {
  const [session, setSession] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [error, setError] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [buyerLocation, setBuyerLocation] = useState(null);
  const [sellerLocation, setSellerLocation] = useState(null);

  const fetchCartCount = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('cart')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);
      if (error) throw error;
      setCartCount(data.length || 0);
    } catch (err) {
      console.error('Error fetching cart count:', err);
      setError('Cart count fetch karne mein error: ' + err.message);
    }
  }, []);

  const checkSellerStatus = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setIsSeller(data.is_seller);
      if (data.is_seller) {
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellers')
          .select('latitude, longitude')
          .eq('id', userId)
          .single();
        if (sellerError) throw sellerError;
        if (sellerData.latitude && sellerData.longitude) {
          setSellerLocation({ lat: sellerData.latitude, lon: sellerData.longitude });
        }
      }
    } catch (err) {
      console.error('Error checking seller status:', err);
      setError('Seller status check karne mein error: ' + err.message);
    }
  }, []);

  useEffect(() => {
    let subscription;

    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          await Promise.all([fetchCartCount(session.user.id), checkSellerStatus(session.user.id)]);
          if (!session.user.is_seller) {
            navigator.geolocation.getCurrentPosition(
              (pos) => setBuyerLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
              () => setBuyerLocation({ lat: 12.9753, lon: 77.591 }),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
          }
        }
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing session:', err);
        setError('Session initialize karne mein error: ' + err.message);
        setIsInitialized(true);
      }

      subscription = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          fetchCartCount(newSession.user.id);
          checkSellerStatus(newSession.user.id);
        } else {
          setCartCount(0);
          setIsSeller(false);
          setError(null);
          setBuyerLocation(null);
          setSellerLocation(null);
        }
      }).data.subscription;
    };

    initializeSession();

    return () => subscription && subscription.unsubscribe();
  }, [fetchCartCount, checkSellerStatus]);

  const handleLogout = async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      localStorage.clear();
      setSession(null);
      setCartCount(0);
      setError(null);
      setIsSeller(false);
      setBuyerLocation(null);
      setSellerLocation(null);
      window.location.replace('/auth');
    } catch (err) {
      setError('Logout karne mein error: ' + (err.message || 'Unknown error'));
    }
  };

  if (!isInitialized) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <LocationContext.Provider value={{ buyerLocation, sellerLocation, setSellerLocation }}>
      <Router>
        <div className="App">
          <Header cartCount={cartCount} onLogout={handleLogout} error={error} />
          {error && (
            <div className="app-error" style={{ color: '#dc3545', padding: '10px', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<ErrorBoundary>{session ? <Cart setCartCount={setCartCount} /> : <Navigate to="/auth" />}</ErrorBoundary>} />
              <Route path="/checkout" element={<ErrorBoundary>{session ? <Checkout /> : <Navigate to="/auth" />}</ErrorBoundary>} />
              <Route path="/account" element={<ErrorBoundary>{session ? <Account /> : <Navigate to="/auth" />}</ErrorBoundary>} />
              <Route path="/order-details/:orderId" element={<ErrorBoundary>{session ? <OrderDetails /> : <Navigate to="/auth" />}</ErrorBoundary>} />
              <Route path="/orders" element={<ErrorBoundary>{session ? <Orders /> : <Navigate to="/auth" />}</ErrorBoundary>} />
              <Route path="/orders/cancel/:id" element={<ErrorBoundary>{session ? <CancelOrder /> : <Navigate to="/auth" />}</ErrorBoundary>} />
              <Route path="/seller" element={<ErrorBoundary>{session && isSeller ? <SellerDashboard /> : <Navigate to={session ? '/account' : '/auth'} />}</ErrorBoundary>} />
              <Route path="/seller/add-product" element={<ErrorBoundary>{session && isSeller ? <AddProductPage /> : <Navigate to={session ? '/account' : '/auth'} />}</ErrorBoundary>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/products" element={<Products />} />
              <Route path="/support" element={<Support />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </LocationContext.Provider>
  );
}

export default App;