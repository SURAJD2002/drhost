


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



import React, { useState, useEffect, useCallback } from 'react';
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
import Seller from './components/Seller'; // Old Seller component if needed
import Account from './components/Account';
import OrderDetails from './components/OrderDetails';
import Orders from './components/Orders';
import CancelOrder from './components/CancelOrder';
import Support from './components/Support';
import ErrorBoundary from './components/ErrorBoundary';
import SellerDashboard from './components/SellerDashboard';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [error, setError] = useState(null);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchCartCount();
        checkSellerStatus();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchCartCount();
        checkSellerStatus();
      } else {
        setCartCount(0);
        setIsSeller(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setCartCount(0);
      setError(null);
      setIsSeller(false);
    } catch (err) {
      setError('Error logging out: ' + err.message);
    }
  };

  const fetchCartCount = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('cart')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id);
      if (error) throw error;
      setCartCount(data.length || 0);
    } catch (err) {
      console.error('Error fetching cart count:', err);
      setError('Failed to fetch cart count: ' + err.message);
    }
  };

  const checkSellerStatus = useCallback(async () => {
    if (!session) return;
    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('id', session.user.id)
          .single();
        if (error) throw error;
        setIsSeller(data.is_seller);
        setError(null);
        return;
      } catch (err) {
        attempt++;
        console.warn(`Attempt ${attempt} failed:`, err);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          continue;
        }
        setError('Failed to check seller status after retries: ' + err.message);
        setIsSeller(false);
        return;
      }
    }
  }, [session]);

  return (
    <Router>
      <div className="App">
        <Header cartCount={cartCount} onLogout={handleLogout} error={error} />
        {error && <div className="app-error" style={{ color: '#ff0000', padding: '10px' }}>{error}</div>}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route
              path="/cart"
              element={
                <ErrorBoundary>
                  {session ? <Cart setCartCount={setCartCount} /> : <Navigate to="/auth" />}
                </ErrorBoundary>
              }
            />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/explore" element={<div>Explore Page (Coming Soon)</div>} />
            <Route path="/categories" element={<Categories />} />
            <Route
              path="/account"
              element={
                <ErrorBoundary>
                  {session ? <Account /> : <Navigate to="/auth" />}
                </ErrorBoundary>
              }
            />
            {/* New routes for separate Account and Seller Dashboard pages */}
            <Route path="/seller/*" element={<SellerDashboard />} />
            <Route
              path="/order-details/:orderId"
              element={
                <ErrorBoundary>
                  {session ? <OrderDetails /> : <Navigate to="/auth" />}
                </ErrorBoundary>
              }
            />
            <Route
              path="/orders"
              element={
                <ErrorBoundary>
                  {session ? <Orders /> : <Navigate to="/auth" />}
                </ErrorBoundary>
              }
            />
            <Route path="/products" element={<Products />} />
            <Route
              path="/orders/cancel/:id"
              element={
                <ErrorBoundary>
                  {session ? <CancelOrder /> : <Navigate to="/auth" />}
                </ErrorBoundary>
              }
            />
            <Route path="/support" element={<Support />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
