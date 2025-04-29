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
// import '../style/Header.css';

// function Header() {
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(11); // Mock cart count (replace with real data)
//   const location = useLocation();

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     setSession(null);
//   };

//   const isActive = (path) => location.pathname === path;

//   return (
//     <header className="navbar">
//       <div className="nav-container">
//         <div className="app-name">JustOrder</div>
        
//         <div className="auth-buttons">
//           {session ? (
//             <>
//               <span className="user-info">Welcome, {session.user.email}</span>
//               <button onClick={handleLogout} className="logout-btn">Logout</button>
//             </>
//           ) : (
//             <>
//               <Link to="/auth" className="auth-link">Sign Up</Link>
//               <Link to="/auth" className="auth-link">Login</Link>
//             </>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }

// export default Header;


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
// import '../style/Header.css';

// function Header() {
//   const [session, setSession] = useState(null);
//   const [cartCount, setCartCount] = useState(11); // Mock cart count (replace with real data)
//   const location = useLocation();

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     setSession(null);
//   };

//   const isActive = (path) => location.pathname === path;

//   return (
//     <header className="navbar">
//       <div className="nav-container">
//         <Link to="/" className="logo-container">
//           <span className="logo-text">JustOrder</span>
//         </Link>
        
//         <div className="auth-buttons">
//           {session ? (
//             <>
//               <span className="user-info">Welcome, {session.user.email}</span>
//               <button onClick={handleLogout} className="logout-btn">Logout</button>
//             </>
//           ) : (
//             <>
//               <Link to="/auth" className="auth-link">Sign Up</Link>
//               <Link to="/auth" className="auth-link">Login</Link>
//             </>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }

// export default Header;


import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
// import { 
//   FaHome, 
//   FaCompass, 
//   FaTh, // Four-dot grid icon for Categories (matches image)
//   FaUser, 
//   FaShoppingCart 
// } from 'react-icons/fa';
import logo from '../assets/logo.png'; // Importing the logo
import '../style/Header.css';

function Header() {
  const [session, setSession] = useState(null);
  const [cartCount, setCartCount] = useState(11); // Mock cart count (replace with real data)
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo-container">
          <img src={logo} alt="JustOrder Logo" className="logo-img" />
        </Link>
        
        <div className="auth-buttons">
          {session ? (
            <>
              <span className="user-info">Welcome, {session.user.email}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/auth" className="auth-link">Sign Up</Link>
              <Link to="/auth" className="auth-link">Login</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;