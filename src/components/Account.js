
// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function Account() {
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
  
//   const navigate = useNavigate();

//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (loading) return <div className="account-loading">Loading...</div>;
//   if (error) return <div className="account-error">{error}</div>;

//   return (
//     <div className="account">
//       <h1 style={{ color: '#007bff' }}>FreshCart Account Dashboard</h1>
//       <section className="account-section">
//         <h2 style={{ color: '#007bff' }}><FaUser /> My Profile</h2>
//         <p style={{ color: '#666' }}>Email: {user?.email}</p>
//         <p style={{ color: '#666' }}>Full Name: {profile?.full_name || 'Not set'}</p>
//         <p style={{ color: '#666' }}>Phone: {profile?.phone_number || 'Not set'}</p>
//         <Link to="/auth" className="edit-profile-btn">Edit Profile</Link>
//       </section>
//       {profile?.is_seller && (
//         <div style={{ marginTop: '20px' }}>
//           <button
//             onClick={() => navigate('/seller')}
//             style={{
//               backgroundColor: '#007bff',
//               color: '#fff',
//               padding: '10px 20px',
//               border: 'none',
//               borderRadius: '5px',
//               cursor: 'pointer'
//             }}
//           >
//             Go to Seller Dashboard
//           </button>
//         </div>
//       )}
//       {/* You can also add buyer-specific orders or other sections for non-seller users here */}
//     </div>
//   );
// }

// export default Account;


// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function Account() {
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
  
//   const navigate = useNavigate();

//   // Fetch user profile and, if buyer, fetch their orders.
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);
      
//       // Fetch the user's profile
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       // If the user is not a seller, fetch their orders (as buyer)
//       if (!profileData.is_seller) {
//         const { data: ordersData, error: ordersError } = await supabase
//           .from('orders')
//           .select('*')
//           .eq('user_id', session.user.id);
//         if (ordersError) throw ordersError;
//         setOrders(ordersData || []);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (loading) return <div className="account-loading">Loading...</div>;
//   if (error) return <div className="account-error" style={{ color: 'red' }}>{error}</div>;

//   return (
//     <div className="account">
//       <h1 style={{ color: '#007bff' }}>FreshCart Account Dashboard</h1>
      
//       {/* Profile Section */}
//       <section className="account-section">
//         <h2 style={{ color: '#007bff' }}><FaUser /> My Profile</h2>
//         <p style={{ color: '#666' }}>Email: {user?.email}</p>
//         <p style={{ color: '#666' }}>Full Name: {profile?.full_name || 'Not set'}</p>
//         <p style={{ color: '#666' }}>Phone: {profile?.phone_number || 'Not set'}</p>
//         <Link to="/auth" className="edit-profile-btn">Edit Profile</Link>
//       </section>
      
//       {/* Orders Section for Buyers */}
//       {!profile?.is_seller && (
//         <section className="account-section">
//           <h2 style={{ color: '#007bff' }}>My Orders</h2>
//           {orders.length === 0 ? (
//             <p style={{ color: '#666' }}>You have not placed any orders yet.</p>
//           ) : (
//             <div className="orders-list">
//               {orders.map(order => (
//                 <div key={order.id} className="order-item" style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
//                   <h3>Order #{order.id}</h3>
//                   <p style={{ color: '#666' }}>Total: ₹{order.total}</p>
//                   <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//                   <Link to={`/order-details/${order.id}`}>View Details</Link>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       )}
      
//       {/* Seller Section */}
//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 style={{ color: '#007bff' }}>Seller Dashboard</h2>
//           <button
//             onClick={() => navigate('/seller')}
//             className="seller-dashboard-btn"
//             style={{
//               backgroundColor: '#007bff',
//               color: '#fff',
//               padding: '10px 20px',
//               border: 'none',
//               borderRadius: '5px',
//               cursor: 'pointer'
//             }}
//           >
//             Go to Seller Dashboard
//           </button>
//         </section>
//       )}
//     </div>
//   );
// }

// export default Account;





// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function Account() {
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
  
//   const navigate = useNavigate();

//   // Fetch user profile and orders.
//   // For a buyer, fetch orders where user_id equals the logged-in user's id.
//   // For a seller, fetch orders where seller_id equals the logged-in user's id.
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);
      
//       // Fetch the user's profile
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       // Fetch orders based on user role.
//       if (profileData.is_seller) {
//         // Seller: fetch orders for which they are the seller
//         const { data: sellerOrders, error: sellerOrdersError } = await supabase
//           .from('orders')
//           .select('*')
//           .eq('seller_id', session.user.id);
//         if (sellerOrdersError) throw sellerOrdersError;
//         setOrders(sellerOrders || []);
//       } else {
//         // Buyer: fetch orders where they are the buyer
//         const { data: buyerOrders, error: buyerOrdersError } = await supabase
//           .from('orders')
//           .select('*')
//           .eq('user_id', session.user.id);
//         if (buyerOrdersError) throw buyerOrdersError;
//         setOrders(buyerOrders || []);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (loading) return <div className="account-loading">Loading...</div>;
//   if (error) return <div className="account-error" style={{ color: 'red' }}>{error}</div>;

//   return (
//     <div className="account">
//       <h1 style={{ color: '#007bff' }}>FreshCart Account Dashboard</h1>
      
//       {/* Profile Section */}
//       <section className="account-section">
//         <h2 style={{ color: '#007bff' }}><FaUser /> My Profile</h2>
//         <p style={{ color: '#666' }}>Email: {user?.email}</p>
//         <p style={{ color: '#666' }}>Full Name: {profile?.full_name || 'Not set'}</p>
//         <p style={{ color: '#666' }}>Phone: {profile?.phone_number || 'Not set'}</p>
//         <Link to="/auth" className="edit-profile-btn">Edit Profile</Link>
//       </section>
      
//       {/* Orders Section */}
//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 style={{ color: '#007bff' }}>Orders for Your Products</h2>
//             {orders.length === 0 ? (
//               <p style={{ color: '#666' }}>No orders have been placed on your products yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map(order => (
//                   <div key={order.id} className="order-item" style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
//                     <h3>Order #{order.id}</h3>
//                     <p style={{ color: '#666' }}>Total: ₹{order.total}</p>
//                     <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//                     <Link to={`/order-details/${order.id}`}>View Details</Link>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             <h2 style={{ color: '#007bff' }}>My Orders</h2>
//             {orders.length === 0 ? (
//               <p style={{ color: '#666' }}>You have not placed any orders yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map(order => (
//                   <div key={order.id} className="order-item" style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
//                     <h3>Order #{order.id}</h3>
//                     <p style={{ color: '#666' }}>Total: ₹{order.total}</p>
//                     <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//                     <Link to={`/order-details/${order.id}`}>View Details</Link>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </section>
      
//       {/* Seller Navigation Section */}
//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 style={{ color: '#007bff' }}>Seller Dashboard</h2>
//           <button
//             onClick={() => navigate('/seller')}
//             className="seller-dashboard-btn"
//             style={{
//               backgroundColor: '#007bff',
//               color: '#fff',
//               padding: '10px 20px',
//               border: 'none',
//               borderRadius: '5px',
//               cursor: 'pointer'
//             }}
//           >
//             Go to Seller Dashboard
//           </button>
//         </section>
//       )}
//     </div>
//   );
// }

// export default Account;




// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function Account() {
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null); // Seller details (from the view)
//   const [orders, setOrders] = useState([]);
//   const [locationMessage, setLocationMessage] = useState(''); // Feedback for location updates
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
  
//   const navigate = useNavigate();

//   // Fetch user data, profile, seller details, and orders.
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     try {
//       // Get current session
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);

//       // Fetch the user's profile
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       if (profileData.is_seller) {
//         // For sellers, fetch seller details from the view "sellers_with_location"
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers_with_location')
//           .select('*, profiles(email, name)')
//           .eq('id', session.user.id)
//           .single();
//         if (sellerError) throw sellerError;
//         setSeller(sellerData);

//         // Fetch orders where seller_id equals the logged-in user's id
//         const { data: sellerOrders, error: sellerOrdersError } = await supabase
//           .from('orders')
//           .select('*')
//           .eq('seller_id', session.user.id);
//         if (sellerOrdersError) throw sellerOrdersError;
//         setOrders(sellerOrders || []);
//       } else {
//         // For buyers, fetch orders where user_id equals the logged-in user's id.
//         const { data: buyerOrders, error: buyerOrdersError } = await supabase
//           .from('orders')
//           .select('*')
//           .eq('user_id', session.user.id);
//         if (buyerOrdersError) throw buyerOrdersError;
//         setOrders(buyerOrders || []);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   // Function to detect and update seller location using the RPC function
//   const handleDetectLocation = () => {
//     if (!navigator.geolocation) {
//       setLocationMessage("Geolocation is not supported by your browser.");
//       return;
//     }
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         try {
//           // Call the RPC function 'set_seller_location'
//           const { error } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lon: lon,
//             user_lat: lat,
//           });
//           if (error) {
//             console.error("Error updating location:", error);
//             setLocationMessage(`Error updating location: ${error.message}`);
//           } else {
//             setLocationMessage("Location updated successfully!");
//             // Refresh data to get updated location_text from the view
//             fetchUserData();
//           }
//         } catch (err) {
//           console.error("Unexpected error updating location:", err);
//           setLocationMessage(`Unexpected error: ${err.message}`);
//         }
//       },
//       (geoError) => {
//         console.error("Error detecting location:", geoError);
//         setLocationMessage("Error detecting location. Please try again.");
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   if (loading) return <div className="account-loading">Loading...</div>;
//   if (error) return <div className="account-error" style={{ color: 'red' }}>{error}</div>;

//   return (
//     <div className="account">
//       <h1 style={{ color: '#007bff' }}>FreshCart Account Dashboard</h1>
      
//       {/* Profile Section */}
//       <section className="account-section">
//         <h2 style={{ color: '#007bff' }}><FaUser /> My Profile</h2>
//         <p style={{ color: '#666' }}>Email: {user?.email}</p>
//         <p style={{ color: '#666' }}>Full Name: {profile?.full_name || 'Not set'}</p>
//         <p style={{ color: '#666' }}>Phone: {profile?.phone_number || 'Not set'}</p>
//         <Link to="/auth" className="edit-profile-btn">Edit Profile</Link>

//         {profile?.is_seller && (
//           <div style={{ marginTop: '10px' }}>
//             <p style={{ color: '#666' }}>
//               Store Location: {seller && seller.location_text ? seller.location_text : 'Not set'}
//             </p>
//             <button 
//               onClick={handleDetectLocation}
//               className="btn btn-primary"
//               style={{
//                 backgroundColor: '#28a745',
//                 color: '#fff',
//                 padding: '8px 16px',
//                 border: 'none',
//                 borderRadius: '5px',
//                 cursor: 'pointer'
//               }}
//             >
//               {seller && seller.location_text ? 'Update Location' : 'Detect & Set Location'}
//             </button>
//             {locationMessage && (
//               <p style={{ color: '#666', marginTop: '5px' }}>{locationMessage}</p>
//             )}
//           </div>
//         )}
//       </section>
      
//       {/* Orders Section */}
//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 style={{ color: '#007bff' }}>Orders for Your Products</h2>
//             {orders.length === 0 ? (
//               <p style={{ color: '#666' }}>No orders have been placed on your products yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map(order => (
//                   <div key={order.id} className="order-item" style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
//                     <h3>Order #{order.id}</h3>
//                     <p style={{ color: '#666' }}>Total: ₹{order.total}</p>
//                     <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//                     <Link to={`/order-details/${order.id}`}>View Details</Link>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             <h2 style={{ color: '#007bff' }}>My Orders</h2>
//             {orders.length === 0 ? (
//               <p style={{ color: '#666' }}>You have not placed any orders yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map(order => (
//                   <div key={order.id} className="order-item" style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
//                     <h3>Order #{order.id}</h3>
//                     <p style={{ color: '#666' }}>Total: ₹{order.total}</p>
//                     <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//                     <Link to={`/order-details/${order.id}`}>View Details</Link>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </section>
      
//       {/* Seller Navigation Section */}
//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 style={{ color: '#007bff' }}>Seller Dashboard</h2>
//           <button
//             onClick={() => navigate('/seller')}
//             className="seller-dashboard-btn"
//             style={{
//               backgroundColor: '#007bff',
//               color: '#fff',
//               padding: '10px 20px',
//               border: 'none',
//               borderRadius: '5px',
//               cursor: 'pointer'
//             }}
//           >
//             Go to Seller Dashboard
//           </button>
//         </section>
//       )}
//     </div>
//   );
// }

// export default Account;



// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function Account() {
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set'); // New state for address
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const navigate = useNavigate();

//   // Fetch user data, profile, seller details, and orders
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);

//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       if (profileData.is_seller) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers_with_location')
//           .select('*, profiles(email, name)')
//           .eq('id', session.user.id)
//           .single();
//         if (sellerError) throw sellerError;
//         setSeller(sellerData);

//         // If seller has latitude and longitude, fetch address
//         if (sellerData.latitude && sellerData.longitude) {
//           await fetchAddress(sellerData.latitude, sellerData.longitude);
//         }

//         const { data: sellerOrders, error: sellerOrdersError } = await supabase
//           .from('orders')
//           .select('*')
//           .eq('seller_id', session.user.id);
//         if (sellerOrdersError) throw sellerOrdersError;
//         setOrders(sellerOrders || []);
//       } else {
//         const { data: buyerOrders, error: buyerOrdersError } = await supabase
//           .from('orders')
//           .select('*')
//           .eq('user_id', session.user.id);
//         if (buyerOrdersError) throw buyerOrdersError;
//         setOrders(buyerOrders || []);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]);

//   // Function to fetch address from coordinates using Nominatim (OpenStreetMap)
//   const fetchAddress = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//       );
//       const data = await response.json();
//       if (data && data.display_name) {
//         setAddress(data.display_name);
//       } else {
//         setAddress('Address not found');
//       }
//     } catch (err) {
//       console.error('Error fetching address:', err);
//       setAddress('Error fetching address');
//     }
//   };

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   // Detect and update seller location
//   const handleDetectLocation = () => {
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation is not supported by your browser.');
//       return;
//     }
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         try {
//           const { error } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lon: lon,
//             user_lat: lat,
//           });
//           if (error) {
//             console.error('Error updating location:', error);
//             setLocationMessage(`Error updating location: ${error.message}`);
//           } else {
//             setLocationMessage('Location updated successfully!');
//             await fetchAddress(lat, lon); // Fetch new address after updating
//             fetchUserData(); // Refresh seller data
//           }
//         } catch (err) {
//           console.error('Unexpected error updating location:', err);
//           setLocationMessage(`Unexpected error: ${err.message}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         setLocationMessage('Error detecting location. Please try again.');
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   if (loading) return <div className="account-loading">Loading...</div>;
//   if (error) return <div className="account-error" style={{ color: 'red' }}>{error}</div>;

//   return (
//     <div className="account">
//       <h1 style={{ color: '#007bff' }}>FreshCart Account Dashboard</h1>

//       {/* Profile Section */}
//       <section className="account-section">
//         <h2 style={{ color: '#007bff' }}><FaUser /> My Profile</h2>
//         <p style={{ color: '#666' }}>Email: {user?.email}</p>
//         <p style={{ color: '#666' }}>Full Name: {profile?.full_name || 'Not set'}</p>
//         <p style={{ color: '#666' }}>Phone: {profile?.phone_number || 'Not set'}</p>
//         <Link to="/auth" className="edit-profile-btn">Edit Profile</Link>

//         {profile?.is_seller && (
//           <div style={{ marginTop: '10px' }}>
//             <p style={{ color: '#666' }}>
//               Store Location: {address}
//             </p>
//             <button
//               onClick={handleDetectLocation}
//               className="btn btn-primary"
//               style={{
//                 backgroundColor: '#28a745',
//                 color: '#fff',
//                 padding: '8px 16px',
//                 border: 'none',
//                 borderRadius: '5px',
//                 cursor: 'pointer',
//               }}
//             >
//               {seller && seller.latitude && seller.longitude ? 'Update Location' : 'Detect & Set Location'}
//             </button>
//             {locationMessage && (
//               <p style={{ color: '#666', marginTop: '5px' }}>{locationMessage}</p>
//             )}
//           </div>
//         )}
//       </section>

//       {/* Orders Section */}
//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 style={{ color: '#007bff' }}>Orders for Your Products</h2>
//             {orders.length === 0 ? (
//               <p style={{ color: '#666' }}>No orders have been placed on your products yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item" style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
//                     <h3>Order #{order.id}</h3>
//                     <p style={{ color: '#666' }}>Total: ₹{order.total}</p>
//                     <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//                     <Link to={`/order-details/${order.id}`}>View Details</Link>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             <h2 style={{ color: '#007bff' }}>My Orders</h2>
//             {orders.length === 0 ? (
//               <p style={{ color: '#666' }}>You have not placed any orders yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item" style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
//                     <h3>Order #{order.id}</h3>
//                     <p style={{ color: '#666' }}>Total: ₹{order.total}</p>
//                     <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//                     <Link to={`/order-details/${order.id}`}>View Details</Link>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </section>

//       {/* Seller Navigation Section */}
//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 style={{ color: '#007bff' }}>Seller Dashboard</h2>
//           <button
//             onClick={() => navigate('/seller')}
//             className="seller-dashboard-btn"
//             style={{
//               backgroundColor: '#007bff',
//               color: '#fff',
//               padding: '10px 20px',
//               border: 'none',
//               borderRadius: '5px',
//               cursor: 'pointer',
//             }}
//           >
//             Go to Seller Dashboard
//           </button>
//         </section>
//       )}
//     </div>
//   );
// }

// export default Account;


//upcode is working




// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function Account() {
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [cancelOrderId, setCancelOrderId] = useState(null); // Track which order is being cancelled
//   const [cancelReason, setCancelReason] = useState(''); // Selected or custom reason
//   const [isCustomReason, setIsCustomReason] = useState(false); // Toggle for custom input

//   const navigate = useNavigate();

//   // Predefined cancellation reasons
//   const buyerCancelReasons = [
//     'Changed my mind',
//     'Found a better price elsewhere',
//     'Item no longer needed',
//     'Other (please specify)',
//   ];
//   const sellerCancelReasons = [
//     'Out of stock',
//     'Unable to ship',
//     'Buyer request',
//     'Other (please specify)',
//   ];

//   // Fetch user data, profile, seller details, and orders
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);

//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       if (profileData.is_seller) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers_with_location')
//           .select('*, profiles(email, name)')
//           .eq('id', session.user.id)
//           .single();
//         if (sellerError) throw sellerError;
//         setSeller(sellerData);

//         if (sellerData.latitude && sellerData.longitude) {
//           await fetchAddress(sellerData.latitude, sellerData.longitude);
//         }

//         const { data: sellerOrders, error: sellerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason') // Include cancellation_reason
//           .eq('seller_id', session.user.id);
//         if (sellerOrdersError) throw sellerOrdersError;
//         setOrders(sellerOrders || []);
//       } else {
//         const { data: buyerOrders, error: buyerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason') // Include cancellation_reason
//           .eq('user_id', session.user.id);
//         if (buyerOrdersError) throw buyerOrdersError;
//         setOrders(buyerOrders || []);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]);

//   // Fetch address from coordinates
//   const fetchAddress = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//       );
//       const data = await response.json();
//       if (data && data.display_name) {
//         setAddress(data.display_name);
//       } else {
//         setAddress('Address not found');
//       }
//     } catch (err) {
//       console.error('Error fetching address:', err);
//       setAddress('Error fetching address');
//     }
//   };

//   // Update order status
//   const updateOrderStatus = async (orderId, newStatus) => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId)
//         .eq('seller_id', user.id);
//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId ? { ...order, order_status: newStatus } : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} status updated to "${newStatus}"`);
//     } catch (err) {
//       console.error('Error updating order status:', err);
//       setLocationMessage(`Error updating order status: ${err.message}`);
//     }
//   };

//   // Cancel order with reason
//   const handleCancelOrder = async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select or enter a cancellation reason.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({
//           order_status: 'Cancelled',
//           cancellation_reason: cancelReason,
//         })
//         .eq('id', orderId)
//         .match(profile?.is_seller ? { seller_id: user.id } : { user_id: user.id }); // Restrict to user’s orders

//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId
//             ? { ...order, order_status: 'Cancelled', cancellation_reason: cancelReason }
//             : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} cancelled successfully. Reason: ${cancelReason}`);
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//     } catch (err) {
//       console.error('Error cancelling order:', err);
//       setLocationMessage(`Error cancelling order: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   // Detect and update seller location
//   const handleDetectLocation = () => {
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation is not supported by your browser.');
//       return;
//     }
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         try {
//           const { error } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lon: lon,
//             user_lat: lat,
//           });
//           if (error) {
//             console.error('Error updating location:', error);
//             setLocationMessage(`Error updating location: ${error.message}`);
//           } else {
//             setLocationMessage('Location updated successfully!');
//             await fetchAddress(lat, lon);
//             fetchUserData();
//           }
//         } catch (err) {
//           console.error('Unexpected error updating location:', err);
//           setLocationMessage(`Unexpected error: ${err.message}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         setLocationMessage('Error detecting location. Please try again.');
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   if (loading) return <div className="account-loading">Loading...</div>;
//   if (error) return <div className="account-error" style={{ color: 'red' }}>{error}</div>;

//   const orderStatuses = ['Pending', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   return (
//     <div className="account">
//       <h1 style={{ color: '#007bff' }}>FreshCart Account Dashboard</h1>

//       {/* Profile Section */}
//       <section className="account-section">
//         <h2 style={{ color: '#007bff' }}>
//           <FaUser /> My Profile
//         </h2>
//         <p style={{ color: '#666' }}>Email: {user?.email}</p>
//         <p style={{ color: '#666' }}>Full Name: {profile?.full_name || 'Not set'}</p>
//         <p style={{ color: '#666' }}>Phone: {profile?.phone_number || 'Not set'}</p>
//         <Link to="/auth" className="edit-profile-btn">
//           Edit Profile
//         </Link>

//         {profile?.is_seller && (
//           <div style={{ marginTop: '10px' }}>
//             <p style={{ color: '#666' }}>Store Location: {address}</p>
//             <button
//               onClick={handleDetectLocation}
//               className="btn btn-primary"
//               style={{
//                 backgroundColor: '#28a745',
//                 color: '#fff',
//                 padding: '8px 16px',
//                 border: 'none',
//                 borderRadius: '5px',
//                 cursor: 'pointer',
//               }}
//             >
//               {seller && seller.latitude && seller.longitude
//                 ? 'Update Location'
//                 : 'Detect & Set Location'}
//             </button>
//             {locationMessage && (
//               <p style={{ color: '#666', marginTop: '5px' }}>{locationMessage}</p>
//             )}
//           </div>
//         )}
//       </section>

//       {/* Orders Section */}
//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 style={{ color: '#007bff' }}>Orders for Your Products</h2>
//             {orders.length === 0 ? (
//               <p style={{ color: '#666' }}>No orders have been placed on your products yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div
//                     key={order.id}
//                     className="order-item"
//                     style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}
//                   >
//                     <h3>Order #{order.id}</h3>
//                     <p style={{ color: '#666' }}>Total: ₹{order.total}</p>
//                     <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p style={{ color: '#666' }}>
//                         Cancellation Reason: {order.cancellation_reason}
//                       </p>
//                     )}
//                     {order.order_status !== 'Cancelled' && (
//                       <>
//                         <div style={{ marginTop: '10px' }}>
//                           <label style={{ color: '#666', marginRight: '10px' }}>
//                             Update Status:
//                           </label>
//                           <select
//                             value={order.order_status}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                             style={{
//                               padding: '5px',
//                               borderRadius: '5px',
//                               border: '1px solid #ccc',
//                             }}
//                           >
//                             {orderStatuses.map((status) => (
//                               <option key={status} value={status}>
//                                 {status}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                         <button
//                           onClick={() => setCancelOrderId(order.id)}
//                           style={{
//                             backgroundColor: '#dc3545',
//                             color: '#fff',
//                             padding: '5px 10px',
//                             border: 'none',
//                             borderRadius: '5px',
//                             marginTop: '10px',
//                             cursor: 'pointer',
//                           }}
//                         >
//                           Cancel Order
//                         </button>
//                       </>
//                     )}
//                     <Link to={`/order-details/${order.id}`} style={{ marginTop: '10px', display: 'block' }}>
//                       View Details
//                     </Link>

//                     {/* Cancellation Modal */}
//                     {cancelOrderId === order.id && (
//                       <div
//                         style={{
//                           position: 'fixed',
//                           top: '50%',
//                           left: '50%',
//                           transform: 'translate(-50%, -50%)',
//                           backgroundColor: '#fff',
//                           padding: '20px',
//                           borderRadius: '8px',
//                           boxShadow: '0 0 10px rgba(0,0,0,0.2)',
//                           zIndex: 1000,
//                         }}
//                       >
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label style={{ color: '#666' }}>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                           style={{ width: '100%', padding: '5px', marginTop: '10px' }}
//                         >
//                           <option value="">Select a reason</option>
//                           {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map(
//                             (reason) => (
//                               <option key={reason} value={reason}>
//                                 {reason}
//                               </option>
//                             )
//                           )}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                             style={{
//                               width: '100%',
//                               padding: '5px',
//                               marginTop: '10px',
//                               minHeight: '60px',
//                             }}
//                           />
//                         )}
//                         <div style={{ marginTop: '10px' }}>
//                           <button
//                             onClick={() => handleCancelOrder(order.id)}
//                             style={{
//                               backgroundColor: '#dc3545',
//                               color: '#fff',
//                               padding: '5px 10px',
//                               border: 'none',
//                               borderRadius: '5px',
//                               marginRight: '10px',
//                             }}
//                           >
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             style={{
//                               backgroundColor: '#6c757d',
//                               color: '#fff',
//                               padding: '5px 10px',
//                               border: 'none',
//                               borderRadius: '5px',
//                             }}
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             <h2 style={{ color: '#007bff' }}>My Orders</h2>
//             {orders.length === 0 ? (
//               <p style={{ color: '#666' }}>You have not placed any orders yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div
//                     key={order.id}
//                     className="order-item"
//                     style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}
//                   >
//                     <h3>Order #{order.id}</h3>
//                     <p style={{ color: '#666' }}>Total: ₹{order.total}</p>
//                     <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p style={{ color: '#666' }}>
//                         Cancellation Reason: {order.cancellation_reason}
//                       </p>
//                     )}
//                     {order.order_status !== 'Cancelled' && (
//                       <button
//                         onClick={() => setCancelOrderId(order.id)}
//                         style={{
//                           backgroundColor: '#dc3545',
//                           color: '#fff',
//                           padding: '5px 10px',
//                           border: 'none',
//                           borderRadius: '5px',
//                           marginTop: '10px',
//                           cursor: 'pointer',
//                         }}
//                       >
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link to={`/order-details/${order.id}`} style={{ marginTop: '10px', display: 'block' }}>
//                       View Details
//                     </Link>

//                     {/* Cancellation Modal */}
//                     {cancelOrderId === order.id && (
//                       <div
//                         style={{
//                           position: 'fixed',
//                           top: '50%',
//                           left: '50%',
//                           transform: 'translate(-50%, -50%)',
//                           backgroundColor: '#fff',
//                           padding: '20px',
//                           borderRadius: '8px',
//                           boxShadow: '0 0 10px rgba(0,0,0,0.2)',
//                           zIndex: 1000,
//                         }}
//                       >
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label style={{ color: '#666' }}>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                           style={{ width: '100%', padding: '5px', marginTop: '10px' }}
//                         >
//                           <option value="">Select a reason</option>
//                           {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map(
//                             (reason) => (
//                               <option key={reason} value={reason}>
//                                 {reason}
//                               </option>
//                             )
//                           )}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                             style={{
//                               width: '100%',
//                               padding: '5px',
//                               marginTop: '10px',
//                               minHeight: '60px',
//                             }}
//                           />
//                         )}
//                         <div style={{ marginTop: '10px' }}>
//                           <button
//                             onClick={() => handleCancelOrder(order.id)}
//                             style={{
//                               backgroundColor: '#dc3545',
//                               color: '#fff',
//                               padding: '5px 10px',
//                               border: 'none',
//                               borderRadius: '5px',
//                               marginRight: '10px',
//                             }}
//                           >
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             style={{
//                               backgroundColor: '#6c757d',
//                               color: '#fff',
//                               padding: '5px 10px',
//                               border: 'none',
//                               borderRadius: '5px',
//                             }}
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </section>

//       {/* Seller Navigation Section */}
//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 style={{ color: '#007bff' }}>Seller Dashboard</h2>
//           <button
//             onClick={() => navigate('/seller')}
//             className="seller-dashboard-btn"
//             style={{
//               backgroundColor: '#007bff',
//               color: '#fff',
//               padding: '10px 20px',
//               border: 'none',
//               borderRadius: '5px',
//               cursor: 'pointer',
//             }}
//           >
//             Go to Seller Dashboard
//           </button>
//         </section>
//       )}
//     </div>
//   );
// }

// export default Account;


import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaUser } from 'react-icons/fa';
import '../style/Account.css';

function Account() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [seller, setSeller] = useState(null);
  const [orders, setOrders] = useState([]);
  const [locationMessage, setLocationMessage] = useState('');
  const [address, setAddress] = useState('Not set');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCustomReason, setIsCustomReason] = useState(false);

  const navigate = useNavigate();

  // Predefined cancellation reasons
  const buyerCancelReasons = [
    'Changed my mind',
    'Found a better price elsewhere',
    'Item no longer needed',
    'Other (please specify)',
  ];
  const sellerCancelReasons = [
    'Out of stock',
    'Unable to ship',
    'Buyer request',
    'Other (please specify)',
  ];

  // Fetch user data, profile, seller details, and orders with product images
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Authentication required. Please log in.');
        navigate('/auth');
        return;
      }
      setUser(session.user);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData);

      if (profileData.is_seller) {
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellers_with_location')
          .select('*, profiles(email, name)')
          .eq('id', session.user.id)
          .single();
        if (sellerError) throw sellerError;
        setSeller(sellerData);

        if (sellerData.latitude && sellerData.longitude) {
          await fetchAddress(sellerData.latitude, sellerData.longitude);
        }

        const { data: sellerOrders, error: sellerOrdersError } = await supabase
          .from('orders')
          .select(`
            *,
            cancellation_reason,
            order_items (
              product_id,
              quantity,
              price,
              products (id, title, images)
            )
          `)
          .eq('seller_id', session.user.id);
        if (sellerOrdersError) throw sellerOrdersError;
        setOrders(sellerOrders || []);
      } else {
        const { data: buyerOrders, error: buyerOrdersError } = await supabase
          .from('orders')
          .select(`
            *,
            cancellation_reason,
            order_items (
              product_id,
              quantity,
              price,
              products (id, title, images)
            )
          `)
          .eq('user_id', session.user.id);
        if (buyerOrdersError) throw buyerOrdersError;
        setOrders(buyerOrders || []);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Fetch address from coordinates
  const fetchAddress = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress('Address not found');
      }
    } catch (err) {
      console.error('Error fetching address:', err);
      setAddress('Error fetching address');
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId)
        .eq('seller_id', user.id);
      if (error) throw error;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, order_status: newStatus } : order
        )
      );
      setLocationMessage(`Order #${orderId} status updated to "${newStatus}"`);
    } catch (err) {
      console.error('Error updating order status:', err);
      setLocationMessage(`Error updating order status: ${err.message}`);
    }
  };

  // Cancel order with reason
  const handleCancelOrder = async (orderId) => {
    if (!cancelReason) {
      setLocationMessage('Please select or enter a cancellation reason.');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'Cancelled',
          cancellation_reason: cancelReason,
        })
        .eq('id', orderId)
        .match(profile?.is_seller ? { seller_id: user.id } : { user_id: user.id });

      if (error) throw error;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, order_status: 'Cancelled', cancellation_reason: cancelReason }
            : order
        )
      );
      setLocationMessage(`Order #${orderId} cancelled successfully. Reason: ${cancelReason}`);
      setCancelOrderId(null);
      setCancelReason('');
      setIsCustomReason(false);
    } catch (err) {
      console.error('Error cancelling order:', err);
      setLocationMessage(`Error cancelling order: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Detect and update seller location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const { error } = await supabase.rpc('set_seller_location', {
            seller_uuid: user.id,
            user_lon: lon,
            user_lat: lat,
          });
          if (error) {
            console.error('Error updating location:', error);
            setLocationMessage(`Error updating location: ${error.message}`);
          } else {
            setLocationMessage('Location updated successfully!');
            await fetchAddress(lat, lon);
            fetchUserData();
          }
        } catch (err) {
          console.error('Unexpected error updating location:', err);
          setLocationMessage(`Unexpected error: ${err.message}`);
        }
      },
      (geoError) => {
        console.error('Error detecting location:', geoError);
        setLocationMessage('Error detecting location. Please try again.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (loading) return <div className="account-loading">Loading...</div>;
  if (error) return <div className="account-error" style={{ color: 'red' }}>{error}</div>;

  const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

  return (
    <div className="account">
      <h1 style={{ color: '#007bff' }}>FreshCart Account Dashboard</h1>

      {/* Profile Section */}
      <section className="account-section">
        <h2 style={{ color: '#007bff' }}>
          <FaUser /> My Profile
        </h2>
        <p style={{ color: '#666' }}>Email: {user?.email}</p>
        <p style={{ color: '#666' }}>Full Name: {profile?.full_name || 'Not set'}</p>
        <p style={{ color: '#666' }}>Phone: {profile?.phone_number || 'Not set'}</p>
        <Link to="/auth" className="edit-profile-btn">
          Edit Profile
        </Link>

        {profile?.is_seller && (
          <div style={{ marginTop: '10px' }}>
            <p style={{ color: '#666' }}>Store Location: {address}</p>
            <button
              onClick={handleDetectLocation}
              className="btn btn-primary"
              style={{
                backgroundColor: '#28a745',
                color: '#fff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              {seller && seller.latitude && seller.longitude
                ? 'Update Location'
                : 'Detect & Set Location'}
            </button>
            {locationMessage && (
              <p style={{ color: '#666', marginTop: '5px' }}>{locationMessage}</p>
            )}
          </div>
        )}
      </section>

      {/* Orders Section */}
      <section className="account-section">
        {profile?.is_seller ? (
          <>
            <h2 style={{ color: '#007bff' }}>Orders for Your Products</h2>
            {orders.length === 0 ? (
              <p style={{ color: '#666' }}>No orders have been placed on your products yet.</p>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="order-item"
                    style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}
                  >
                    <h3>Order #{order.id}</h3>
                    <p style={{ color: '#666' }}>Total: ₹{order.total}</p>
                    <p style={{ color: '#666' }}>Status: {order.order_status}</p>
                    {order.order_status === 'Cancelled' && order.cancellation_reason && (
                      <p style={{ color: '#666' }}>
                        Cancellation Reason: {order.cancellation_reason}
                      </p>
                    )}
                    {/* Display ordered products with images */}
                    <div className="order-products" style={{ marginTop: '10px' }}>
                      <h4 style={{ color: '#007bff' }}>Ordered Products</h4>
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item) => (
                          <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
                            <img
                              src={
                                item.products?.images?.[0] ||
                                'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
                              }
                              alt={item.products?.title || 'Product'}
                              onError={(e) => {
                                e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
                              }}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                            />
                            <div>
                              <p style={{ color: '#666', margin: '0' }}>
                                {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{item.price}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#666' }}>No product details available.</p>
                      )}
                    </div>
                    {order.order_status !== 'Cancelled' && (
                      <>
                        <div style={{ marginTop: '10px' }}>
                          <label style={{ color: '#666', marginRight: '10px' }}>
                            Update Status:
                          </label>
                          <select
                            value={order.order_status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            style={{
                              padding: '5px',
                              borderRadius: '5px',
                              border: '1px solid #ccc',
                            }}
                          >
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => setCancelOrderId(order.id)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: '#fff',
                            padding: '5px 10px',
                            border: 'none',
                            borderRadius: '5px',
                            marginTop: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                    <Link to={`/order-details/${order.id}`} style={{ marginTop: '10px', display: 'block' }}>
                      View Details
                    </Link>

                    {/* Cancellation Modal */}
                    {cancelOrderId === order.id && (
                      <div
                        style={{
                          position: 'fixed',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: '#fff',
                          padding: '20px',
                          borderRadius: '8px',
                          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                          zIndex: 1000,
                        }}
                      >
                        <h3>Cancel Order #{order.id}</h3>
                        <label style={{ color: '#666' }}>Reason for Cancellation:</label>
                        <select
                          value={cancelReason}
                          onChange={(e) => {
                            setCancelReason(e.target.value);
                            setIsCustomReason(e.target.value === 'Other (please specify)');
                          }}
                          style={{ width: '100%', padding: '5px', marginTop: '10px' }}
                        >
                          <option value="">Select a reason</option>
                          {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map(
                            (reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            )
                          )}
                        </select>
                        {isCustomReason && (
                          <textarea
                            value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter your custom reason"
                            style={{
                              width: '100%',
                              padding: '5px',
                              marginTop: '10px',
                              minHeight: '60px',
                            }}
                          />
                        )}
                        <div style={{ marginTop: '10px' }}>
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: '#fff',
                              padding: '5px 10px',
                              border: 'none',
                              borderRadius: '5px',
                              marginRight: '10px',
                            }}
                          >
                            Confirm Cancel
                          </button>
                          <button
                            onClick={() => {
                              setCancelOrderId(null);
                              setCancelReason('');
                              setIsCustomReason(false);
                            }}
                            style={{
                              backgroundColor: '#6c757d',
                              color: '#fff',
                              padding: '5px 10px',
                              border: 'none',
                              borderRadius: '5px',
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 style={{ color: '#007bff' }}>My Orders</h2>
            {orders.length === 0 ? (
              <p style={{ color: '#666' }}>You have not placed any orders yet.</p>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="order-item"
                    style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}
                  >
                    <h3>Order #{order.id}</h3>
                    <p style={{ color: '#666' }}>Total: ₹{order.total}</p>
                    <p style={{ color: '#666' }}>Status: {order.order_status}</p>
                    {order.order_status === 'Cancelled' && order.cancellation_reason && (
                      <p style={{ color: '#666' }}>
                        Cancellation Reason: {order.cancellation_reason}
                      </p>
                    )}
                    {/* Display ordered products with images */}
                    <div className="order-products" style={{ marginTop: '10px' }}>
                      <h4 style={{ color: '#007bff' }}>Ordered Products</h4>
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item) => (
                          <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
                            <img
                              src={
                                item.products?.images?.[0] ||
                                'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
                              }
                              alt={item.products?.title || 'Product'}
                              onError={(e) => {
                                e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
                              }}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                            />
                            <div>
                              <p style={{ color: '#666', margin: '0' }}>
                                {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{item.price}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#666' }}>No product details available.</p>
                      )}
                    </div>
                    {order.order_status !== 'Cancelled' && (
                      <button
                        onClick={() => setCancelOrderId(order.id)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '5px',
                          marginTop: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel Order
                      </button>
                    )}
                    <Link to={`/order-details/${order.id}`} style={{ marginTop: '10px', display: 'block' }}>
                      View Details
                    </Link>

                    {/* Cancellation Modal */}
                    {cancelOrderId === order.id && (
                      <div
                        style={{
                          position: 'fixed',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: '#fff',
                          padding: '20px',
                          borderRadius: '8px',
                          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                          zIndex: 1000,
                        }}
                      >
                        <h3>Cancel Order #{order.id}</h3>
                        <label style={{ color: '#666' }}>Reason for Cancellation:</label>
                        <select
                          value={cancelReason}
                          onChange={(e) => {
                            setCancelReason(e.target.value);
                            setIsCustomReason(e.target.value === 'Other (please specify)');
                          }}
                          style={{ width: '100%', padding: '5px', marginTop: '10px' }}
                        >
                          <option value="">Select a reason</option>
                          {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map(
                            (reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            )
                          )}
                        </select>
                        {isCustomReason && (
                          <textarea
                            value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter your custom reason"
                            style={{
                              width: '100%',
                              padding: '5px',
                              marginTop: '10px',
                              minHeight: '60px',
                            }}
                          />
                        )}
                        <div style={{ marginTop: '10px' }}>
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: '#fff',
                              padding: '5px 10px',
                              border: 'none',
                              borderRadius: '5px',
                              marginRight: '10px',
                            }}
                          >
                            Confirm Cancel
                          </button>
                          <button
                            onClick={() => {
                              setCancelOrderId(null);
                              setCancelReason('');
                              setIsCustomReason(false);
                            }}
                            style={{
                              backgroundColor: '#6c757d',
                              color: '#fff',
                              padding: '5px 10px',
                              border: 'none',
                              borderRadius: '5px',
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Seller Navigation Section */}
      {profile?.is_seller && (
        <section className="account-section">
          <h2 style={{ color: '#007bff' }}>Seller Dashboard</h2>
          <button
            onClick={() => navigate('/seller')}
            className="seller-dashboard-btn"
            style={{
              backgroundColor: '#007bff',
              color: '#fff',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Go to Seller Dashboard
          </button>
        </section>
      )}
    </div>
  );
}

export default Account;