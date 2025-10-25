// import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import useScrollMemory from '../hooks/useScrollMemory';
// import Home from './Home';
// import ProductPage from './ProductPage';
// import Cart from './Cart';
// import Checkout from './Checkout';
// import CheckoutDebug from './CheckoutDebug';
// import Auth from './Auth';
// import Categories from './Categories';
// import Products from './Products';
// import CategoryPage from './CategoryPage';
// import Account from './Account';
// import OrderDetails from './OrderDetails';
// import ModernOrderDetails from './ModernOrderDetails';
// import OrderDetailsDemo from './OrderDetailsDemo';
// import PerfectNavigationDemo from './PerfectNavigationDemo';
// import Orders from './Orders';
// import CancelOrder from './CancelOrder';
// import Support from './Support';
// import SellerDashboard from './SellerDashboard';
// import Policy from './Policy';
// import Privacy from './Privacy';
// import AddProductPage from './AddProductPage';


// /**
//  * Router wrapper component that provides scroll restoration and navigation state management
//  * This component should be used instead of directly using Routes in the main App component
//  */
// const AppRouter = ({ session, isSeller, buyerLocation }) => {
//   // Initialize enhanced scroll memory hook
//   useScrollMemory();

//   return (
//     <Routes>
//       <Route path="/" element={<Home />} />
//       <Route path="/product/:id" element={<ProductPage />} />
//       <Route 
//         path="/cart" 
//         element={session ? <Cart /> : <Navigate to="/auth" />} 
//       />
//       <Route
//         path="/checkout"
//         element={
//           session && !isSeller && buyerLocation ? (
//             <Checkout />
//           ) : (
//             <Navigate to={isSeller ? '/seller' : '/auth'} />
//           )
//         }
//       />
//       <Route path="/checkout-debug" element={<CheckoutDebug />} />
//       <Route 
//         path="/account" 
//         element={session ? <Account /> : <Navigate to="/auth" />} 
//       />
//       <Route 
//         path="/orders" 
//         element={session ? <Orders /> : <Navigate to="/auth" />} 
//       />
//       <Route 
//         path="/orders/cancel/:id" 
//         element={session ? <CancelOrder /> : <Navigate to="/auth" />} 
//       />
//       <Route 
//         path="/order-details/:orderId" 
//         element={session ? <OrderDetails /> : <Navigate to="/auth" />} 
//       />
//       <Route 
//         path="/modern-order-details/:orderId" 
//         element={session ? <ModernOrderDetails /> : <Navigate to="/auth" />} 
//       />
//       <Route
//         path="/seller"
//         element={
//           session && isSeller ? (
//             <SellerDashboard />
//           ) : (
//             <Navigate to={session ? '/account' : '/auth'} />
//           )
//         }
//       />
//       <Route
//         path="/seller/add-product"
//         element={
//           session && isSeller ? (
//             <AddProductPage />
//           ) : (
//             <Navigate to={session ? '/account' : '/auth'} />
//           )
//         }
//       />
//       <Route
//         path="/edit-product/:productId"
//         element={
//           session && isSeller ? (
//             <AddProductPage />
//           ) : (
//             <Navigate to={session ? '/account' : '/auth'} />
//           )
//         }
//       />
//       <Route path="/auth" element={<Auth />} />
//       <Route path="/categories" element={<Categories />} />
//       <Route path="/products" element={<Products />} />
//       <Route path="/category/:categoryId" element={<CategoryPage />} />
//       <Route path="/order-details-demo" element={<OrderDetailsDemo />} />
//       <Route path="/perfect-navigation-demo" element={<PerfectNavigationDemo />} />
//       <Route path="/support" element={<Support />} />
//       <Route path="/policy" element={<Policy />} />
//       <Route path="/privacy" element={<Privacy />} />
//       <Route path="*" element={<Navigate to="/" />} />
//     </Routes>
//   );
// };

// export default AppRouter;


// import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import { useScrollPosition } from '../hooks/useScrollManager'; // Import specific hook
// import Home from './Home';
// import ProductPage from './ProductPage';
// import Cart from './Cart';
// import Checkout from './Checkout';
// import CheckoutDebug from './CheckoutDebug';
// import Auth from './Auth';
// import Categories from './Categories';
// import Products from './Products';
// import CategoryPage from './CategoryPage';
// import Account from './Account';
// import OrderDetails from './OrderDetails';
// import ModernOrderDetails from './ModernOrderDetails';
// import OrderDetailsDemo from './OrderDetailsDemo';
// import PerfectNavigationDemo from './PerfectNavigationDemo';
// import Orders from './Orders';
// import CancelOrder from './CancelOrder';
// import Support from './Support';
// import SellerDashboard from './SellerDashboard';
// import Policy from './Policy';
// import Privacy from './Privacy';
// import AddProductPage from './AddProductPage';

// /**
//  * Router wrapper component that provides scroll restoration and navigation state management
//  * This component should be used instead of directly using Routes in the main App component
//  */
// const AppRouter = ({ session, isSeller, buyerLocation }) => {
//   // Initialize scroll position management with automatic key generation
//   useScrollPosition(); // Use useScrollPosition to handle scroll restoration globally

//   return (
//     <Routes>
//       <Route path="/" element={<Home />} />
//       <Route path="/product/:id" element={<ProductPage />} />
//       <Route 
//         path="/cart" 
//         element={session ? <Cart /> : <Navigate to="/auth" />} 
//       />
//       <Route
//         path="/checkout"
//         element={
//           session && !isSeller && buyerLocation ? (
//             <Checkout />
//           ) : (
//             <Navigate to={isSeller ? '/seller' : '/auth'} />
//           )
//         }
//       />
//       <Route path="/checkout-debug" element={<CheckoutDebug />} />
//       <Route 
//         path="/account" 
//         element={session ? <Account /> : <Navigate to="/auth" />} 
//       />
//       <Route 
//         path="/orders" 
//         element={session ? <Orders /> : <Navigate to="/auth" />} 
//       />
//       <Route 
//         path="/orders/cancel/:id" 
//         element={session ? <CancelOrder /> : <Navigate to="/auth" />} 
//       />
//       <Route 
//         path="/order-details/:orderId" 
//         element={session ? <OrderDetails /> : <Navigate to="/auth" />} 
//       />
//       <Route 
//         path="/modern-order-details/:orderId" 
//         element={session ? <ModernOrderDetails /> : <Navigate to="/auth" />} 
//       />
//       <Route
//         path="/seller"
//         element={
//           session && isSeller ? (
//             <SellerDashboard />
//           ) : (
//             <Navigate to={session ? '/account' : '/auth'} />
//           )
//         }
//       />
//       <Route
//         path="/seller/add-product"
//         element={
//           session && isSeller ? (
//             <AddProductPage />
//           ) : (
//             <Navigate to={session ? '/account' : '/auth'} />
//           )
//         }
//       />
//       <Route
//         path="/edit-product/:productId"
//         element={
//           session && isSeller ? (
//             <AddProductPage />
//           ) : (
//             <Navigate to={session ? '/account' : '/auth'} />
//           )
//         }
//       />
//       <Route path="/auth" element={<Auth />} />
//       <Route path="/categories" element={<Categories />} />
//       <Route path="/products" element={<Products />} />
//       <Route path="/category/:categoryId" element={<CategoryPage />} />
//       <Route path="/order-details-demo" element={<OrderDetailsDemo />} />
//       <Route path="/perfect-navigation-demo" element={<PerfectNavigationDemo />} />
//       <Route path="/support" element={<Support />} />
//       <Route path="/policy" element={<Policy />} />
//       <Route path="/privacy" element={<Privacy />} />
//       <Route path="*" element={<Navigate to="/" />} />
//     </Routes>
//   );
// };

// export default AppRouter;



// src/components/AppRouter.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useScrollPosition } from '../hooks/scrollManager'; // Updated import
import Home from './Home';
import ProductPage from './ProductPage';
import Cart from './Cart';
import Checkout from './Checkout';
import CheckoutDebug from './CheckoutDebug';
import Auth from './Auth';
import Categories from './Categories';
import Products from './Products';
import CategoryPage from './CategoryPage';
import Account from './Account';
import OrderDetails from './OrderDetails';
import ModernOrderDetails from './ModernOrderDetails';
import OrderDetailsDemo from './OrderDetailsDemo';
import PerfectNavigationDemo from './PerfectNavigationDemo';
import Orders from './Orders';
import CancelOrder from './CancelOrder';
import Support from './Support';
import SellerDashboard from './SellerDashboard';
import Policy from './Policy';
import Privacy from './Privacy';
import AddProductPage from './AddProductPage';

/**
 * Router wrapper component that provides scroll restoration and navigation state management
 * This component should be used instead of directly using Routes in the main App component
 */
const AppRouter = ({ session, isSeller, buyerLocation }) => {
  // Initialize scroll position management with automatic key generation
  useScrollPosition(); // Use useScrollPosition to handle scroll restoration globally

  return (
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
      <Route path="/checkout-debug" element={<CheckoutDebug />} />
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
        path="/modern-order-details/:orderId" 
        element={session ? <ModernOrderDetails /> : <Navigate to="/auth" />} 
      />
      <Route
        path="/seller"
        element={
          session && isSeller ? (
            <SellerDashboard />
          ) : (
            <Navigate to={session ? '/account' : '/auth'} />
          )
        }
      />
      <Route
        path="/seller/add-product"
        element={
          session && isSeller ? (
            <AddProductPage />
          ) : (
            <Navigate to={session ? '/account' : '/auth'} />
          )
        }
      />
      <Route
        path="/edit-product/:productId"
        element={
          session && isSeller ? (
            <AddProductPage />
          ) : (
            <Navigate to={session ? '/account' : '/auth'} />
          )
        }
      />
      <Route path="/auth" element={<Auth />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/products" element={<Products />} />
      <Route path="/category/:categoryId" element={<CategoryPage />} />
      <Route path="/order-details-demo" element={<OrderDetailsDemo />} />
      <Route path="/perfect-navigation-demo" element={<PerfectNavigationDemo />} />
      <Route path="/support" element={<Support />} />
      <Route path="/policy" element={<Policy />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;