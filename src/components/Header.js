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


// import React, { useState, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// // import { 
// //   FaHome, 
// //   FaCompass, 
// //   FaTh, // Four-dot grid icon for Categories (matches image)
// //   FaUser, 
// //   FaShoppingCart 
// // } from 'react-icons/fa';
// import logo from '../assets/logo.png'; // Importing the logo
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
//           <img src={logo} alt="JustOrder Logo" className="logo-img" />
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


// import React, { useState, useEffect, useContext } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { IoCartOutline } from 'react-icons/io5';
// import { LocationContext } from '../App'; // Import LocationContext
// import logo from '../assets/logo.png'; // Importing the logo
// import '../style/Header.css';

// function Header() {
//   const { session, cartCount } = useContext(LocationContext); // Get cartCount from context

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       // No need to manage session locally since it's in context
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       // Session is managed in App.js, so this can be simplified if needed
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   return (
//     <header className="navbar">
//       <div className="nav-container">
//         <Link to="/" className="logo-container">
//           <img src={logo} alt="JustOrder Logo" className="logo-img" />
//         </Link>
        
//         <div className="auth-buttons">
//           {!session && (
//             <>
//               <Link to="/auth" className="auth-link">Sign Up</Link>
//               <Link to="/auth" className="auth-link">Login</Link>
//             </>
//           )}
//           <Link to="/cart" className="cart-icon">
//             <IoCartOutline />
//             {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
//           </Link>
//         </div>
//       </div>
//     </header>
//   );
// }

// export default Header;



// import React, { useEffect, useContext } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { IoCartOutline } from 'react-icons/io5';
// import { FaShoppingBag } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Header.css';

// function Header() {
//   const { session, cartCount } = useContext(LocationContext);

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       // Session is managed in context
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       // Session updates handled in App.js via LocationContext
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   return (
//     <header className="navbar">
//       <div className="nav-container">
//         <Link to="/" className="logo-container">
//           <FaShoppingBag className="logo-icon" />
//           <span className="logo-text">JustOrder</span>
//         </Link>
        
//         <div className="auth-buttons">
//           {!session && (
//             <>
//               <Link to="/auth" className="auth-link" aria-label="Sign Up">Sign Up</Link>
//               <Link to="/auth" className="auth-link" aria-label="Login">Login</Link>
//             </>
//           )}
//           <Link to="/cart" className="cart-icon" aria-label={`Cart with ${cartCount} items`}>
//             <IoCartOutline />
//             {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
//           </Link>
//         </div>
//       </div>
//     </header>
//   );
// }

// export default Header;


// import React, { useEffect, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { IoCartOutline } from 'react-icons/io5';
// import { FaShoppingBag } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Header.css';

// function Header() {
//   const { session, cartCount } = useContext(LocationContext);
//   const navigate = useNavigate();

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       // Session is managed in context
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       // Session updates handled in App.js via LocationContext
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const handleLogout = async () => {
//     try {
//       await supabase.auth.signOut();
//       navigate('/', { replace: true });
//     } catch (err) {
//       console.error('Logout error:', err);
//     }
//   };

//   return (
//     <header className="navbar">
//       <div className="nav-container">
//         <Link to="/" className="logo-container" aria-label="JustOrder Home">
//           <FaShoppingBag className="logo-icon" />
//           <span className="logo-text">JustOrder</span>
//         </Link>
//         <div className="auth-buttons">
//           {session ? (
//             <>
//               <Link to="/account" className="auth-link" aria-label="Go to Account">
//                 Account
//               </Link>
//               <button
//                 onClick={handleLogout}
//                 className="auth-link logout-btn"
//                 aria-label="Log Out"
//               >
//                 Logout
//               </button>
//               <Link to="/cart" className="cart-icon" aria-label={`Cart with ${cartCount} items`}>
//                 <IoCartOutline />
//                 {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
//               </Link>
//             </>
//           ) : (
//             <>
//               <Link to="/auth" className="auth-link" aria-label="Sign Up">
//                 Sign Up
//               </Link>
//               <Link to="/auth" className="auth-link" aria-label="Login">
//                 Login
//               </Link>
//             </>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }

// export default Header;


import React, { useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { IoCartOutline } from 'react-icons/io5';
import { FaShoppingBag } from 'react-icons/fa';
import { LocationContext } from '../App';
import '../style/Header.css';

function Header() {
  const { session, cartCount } = useContext(LocationContext);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Session is managed in context
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Session updates handled in App.js via LocationContext
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo-container" aria-label="JustOrder Home">
          <FaShoppingBag className="logo-icon" />
          <span className="logo-text">JustOrder</span>
        </Link>
        <div className="auth-buttons">
          {session ? (
            <Link to="/cart" className="cart-icon" aria-label={`Cart with ${cartCount} items`}>
              <IoCartOutline />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          ) : (
            <>
              <Link to="/auth" className="auth-link" aria-label="Sign Up">
                Sign Up
              </Link>
              <Link to="/auth" className="auth-link" aria-label="Login">
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;