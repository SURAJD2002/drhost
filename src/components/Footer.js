// import React, { useState, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { 
//   FaHome, 
//   FaCompass, 
//   FaTh, // Four-dot grid icon for Categories (matches image)
//   FaUser, 
//   FaShoppingCart 
// } from 'react-icons/fa';
// import '../style/Footer.css';

// function Footer() {
//   const [cartCount, setCartCount] = useState(0); // Mock cart count (replace with real data)
//   const location = useLocation();

//   useEffect(() => {
//     // Fetch cart count from Supabase or localStorage (optional for real implementation)
//     // For now, keep it mocked as 11
//     // Example: Fetch from Supabase
//     /*
//     const fetchCartCount = async () => {
//       const { data, error } = await supabase
//         .from('cart_items')
//         .select('quantity', { count: 'exact' })
//         .eq('cart_id', (await supabase.from('cart').select('id').eq('user_id', session.user.id).single()).data.id);
//       if (!error) setCartCount(data.reduce((sum, item) => sum + item.quantity, 0));
//     };
//     fetchCartCount();
//     */
//   }, []);

//   const isActive = (path) => location.pathname === path;

//   return (
//     <footer className="footer">
//       <div className="nav-container">
//         <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
//           <FaHome /> Home
//         </Link>
//         {/* <Link to="/explore" className={`nav-item ${isActive('/explore') ? 'active' : ''}`}>
//           <FaCompass /> Explore
//         </Link> */}
//         <Link to="/categories" className={`nav-item ${isActive('/categories') ? 'active' : ''}`}>
//           <FaTh /> Categories
//         </Link>
//         <Link to="/account" className={`nav-item ${isActive('/account') ? 'active' : ''}`}>
//           <FaUser /> Account
//         </Link>
//         <Link to="/cart" className={`nav-item ${isActive('/cart') ? 'active' : ''}`}>
//           <FaShoppingCart /> Cart
//           {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
//         </Link>
//       </div>
//     </footer>
//   );
// }

// export default Footer;


// import React, { useState, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { 
//   FaHome, 
//   FaCompass, 
//   FaTh, 
//   FaUser, 
//   FaShoppingCart 
// } from 'react-icons/fa';
// import '../style/Footer.css';

// function Footer() {
//   const [cartCount, setCartCount] = useState(0);
//   const location = useLocation();

//   useEffect(() => {
//     // Fetch cart count from Supabase or localStorage (optional for real implementation)
//     // For now, keep it mocked as 11
//     /*
//     const fetchCartCount = async () => {
//       const { data, error } = await supabase
//         .from('cart_items')
//         .select('quantity', { count: 'exact' })
//         .eq('cart_id', (await supabase.from('cart').select('id').eq('user_id', session.user.id).single()).data.id);
//       if (!error) setCartCount(data.reduce((sum, item) => sum + item.quantity, 0));
//     };
//     fetchCartCount();
//     */
//   }, []);

//   const isActive = (path) => location.pathname === path;

//   return (
//     <footer className="footer">
//       <div className="nav-container">
//         <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
//           <FaHome /> Home
//         </Link>
//         <Link to="/categories" className={`nav-item ${isActive('/categories') ? 'active' : ''}`}>
//           <FaTh /> Categories
//         </Link>
//         <Link to="/account" className={`nav-item ${isActive('/account') ? 'active' : ''}`}>
//           <FaUser /> Account
//         </Link>
//         <Link to="/cart" className={`nav-item ${isActive('/cart') ? 'active' : ''}`}>
//           <FaShoppingCart /> Cart
//           {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
//         </Link>
//       </div>
//     </footer>
//   );
// }

// export default Footer;




import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  FaHome, 
  FaCompass, 
  FaTh, 
  FaUser, 
  FaShoppingCart 
} from 'react-icons/fa';
import '../style/Footer.css';

function Footer() {
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Fetch cart count from Supabase or localStorage (optional for real implementation)
    // For now, keep it mocked as 11
    /*
    const fetchCartCount = async () => {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity', { count: 'exact' })
        .eq('cart_id', (await supabase.from('cart').select('id').eq('user_id', session.user.id).single()).data.id);
      if (!error) setCartCount(data.reduce((sum, item) => sum + item.quantity, 0));
    };
    fetchCartCount();
    */
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <footer className="footer">
      <div className="nav-container">
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          <FaHome /> Home
        </Link>
        <Link to="/categories" className={`nav-item ${isActive('/categories') ? 'active' : ''}`}>
          <FaTh /> Categories
        </Link>
        <Link to="/account" className={`nav-item ${isActive('/account') ? 'active' : ''}`}>
          <FaUser /> Account
        </Link>
        <Link to="/cart" className={`nav-item ${isActive('/cart') ? 'active' : ''}`}>
          <FaShoppingCart /> Cart
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
      </div>
    </footer>
  );
}

export default Footer;