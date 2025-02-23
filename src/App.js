import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
import Seller from './components/Seller';
import Account from './components/Account';
import OrderDetails from './components/OrderDetails';
import Orders from './components/Orders';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCartCount();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchCartCount();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCartCount(0);
    setError(null);
  };

  const fetchCartCount = async () => {
    if (session) {
      const { data, error } = await supabase
        .from('cart')
        .select('count', { count: 'exact' })
        .eq('user_id', session.user.id);
      if (error) console.error('Error fetching cart count:', error);
      else setCartCount(data[0]?.count || 0);
    }
  };

  const isSeller = async () => {
    if (!session) return false;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', session.user.id)
        .single();
      if (error) {
        console.error('Supabase error checking seller status:', error);
        if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          setError('Network DNS issue detected. Please check your internet connection or DNS settings.');
        } else {
          setError(`Error checking seller status: ${error.message}`);
        }
        return false;
      }
      return data.is_seller;
    } catch (err) {
      console.error('Unexpected error in isSeller:', err);
      setError('An unexpected error occurred while checking seller status.');
      return false;
    }
  };

  const isSellerMemo = useMemo(() => isSeller(), [session]);

  return (
    <Router>
      <div className="App">
        <Header cartCount={cartCount} onLogout={handleLogout} error={error} />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route
              path="/cart"
              element={session ? <Cart setCartCount={setCartCount} /> : <Navigate to="/auth" />}
            />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/explore" element={<div>Explore Page (Coming Soon)</div>} />
            <Route path="/categories" element={<Categories />} />
            <Route
              path="/account"
              element={
                session ? (
                  <Account />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/seller/:sellerId"
              element={
                session ? (
                  isSellerMemo ? (
                    <Seller />
                  ) : (
                    <Navigate to="/" />
                  )
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/order-details/:orderId"
              element={
                session ? (
                  <OrderDetails />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/orders"
              element={
                session ? (
                  <Orders />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route path="/products" element={<Products />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;