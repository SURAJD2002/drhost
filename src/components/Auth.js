

// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Auth.css';

// function Auth() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [phone, setPhone] = useState(''); // Phone number for OTP
//   const [fullName, setFullName] = useState(''); // Full name input
//   const [otp, setOtp] = useState(''); // OTP for phone verification
//   const [isSignUp, setIsSignUp] = useState(false);
//   const [isSeller, setIsSeller] = useState(false); // Seller role
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showOtp, setShowOtp] = useState(false); // Show OTP input after phone submission
//   const navigate = useNavigate();

//   // Monitor and refresh session on mount to ensure valid authentication
//   useEffect(() => {
//     const checkSession = async () => {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       console.log('Checking session on Auth mount:', session);
//       if (session?.user) {
//         // If user is already logged in, redirect to account
//         setMessage('You are already logged in. Redirecting...');
//         navigate('/account');
//         return;
//       }
//     };
//     checkSession();

//     // Subscribe to auth state changes
//     const subscription = supabase.auth.onAuthStateChange((event, session) => {
//       if (event === 'SIGNED_OUT') {
//         setMessage('You have been signed out. Please log in again.');
//         navigate('/auth');
//       } else if (event === 'SIGNED_IN' && session?.user) {
//         setMessage('Logged in successfully!');
//         navigate('/account');
//       }
//     });

//     // Cleanup function to unsubscribe the listener
//     return () => {
//       if (subscription && typeof subscription.unsubscribe === 'function') {
//         subscription.unsubscribe();
//       }
//     };
//   }, [navigate]);

//   const handleGoogleLogin = async () => {
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: `${window.location.origin}/auth/callback`,
//         },
//       });
//       if (error) throw error;
//     } catch (error) {
//       console.error('Google login error:', error);
//       setMessage(`Error: ${error.message} (Details: ${JSON.stringify(error)})`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePhoneAuth = async () => {
//     if (!phone || !/^\+?[0-9]{10,13}$/.test(phone)) {
//       setMessage('Please enter a valid phone number (e.g., +919876543210).');
//       return;
//     }
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOtp({ phone });
//       if (error) throw error;
//       setMessage('OTP sent to your phone. Please enter it below.');
//       setShowOtp(true);
//     } catch (error) {
//       console.error('Phone OTP error:', error);
//       setMessage(`Error sending OTP: ${error.message} (Details: ${JSON.stringify(error)})`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const verifyOtp = async () => {
//     if (!otp) {
//       setMessage('Please enter the OTP.');
//       return;
//     }
//     setLoading(true);
//     setMessage('');
//     try {
//       const { data, error } = await supabase.auth.verifyOtp({
//         phone,
//         token: otp,
//         type: 'sms',
//       });
//       if (error) throw error;
//       setMessage('Phone verified successfully! You can now sign up or log in.');
//       if (isSignUp) {
//         await handleEmailAuthForPhone(data.session.user);
//       } else {
//         navigate('/account');
//       }
//     } catch (error) {
//       console.error('OTP verification error:', error);
//       setMessage(`Error verifying OTP: ${error.message} (Details: ${JSON.stringify(error)})`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEmailAuth = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage('');
//     console.log('Attempting auth with:', { email, password, phone, fullName, isSignUp, isSeller });
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (session?.user) {
//         setMessage('You are already logged in. Redirecting...');
//         navigate('/account');
//         return;
//       }

//       if (isSignUp) {
//         if (!email && !phone) {
//           setMessage('Please provide either an email or phone number.');
//           setLoading(false);
//           return;
//         }
//         if (phone && !showOtp) {
//           setMessage('Please verify your phone number with OTP before signing up.');
//           setLoading(false);
//           return;
//         }
//         if (!password) {
//           setMessage('Password is required for sign-up.');
//           setLoading(false);
//           return;
//         }

//         let userData;
//         if (email) {
//           const { data, error } = await supabase.auth.signUp({
//             email,
//             password,
//           });
//           if (error) {
//             console.error('Sign-up error details:', error);
//             if (error.message.includes('duplicate key value violates unique constraint')) {
//               setMessage('This email is already registered. Please log in or use a different email.');
//             } else if (error.message.includes('Database error')) {
//               setMessage('Database error saving new user. Please check your details or contact support. Error details: ' + JSON.stringify(error));
//             } else if (error.message.includes('foreign key violation')) {
//               setMessage('An error occurred linking your account. Please contact support. Error details: ' + JSON.stringify(error));
//             } else if (error.message.includes('Network error') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
//               setMessage('Network issue detected. Please check your internet connection or try again later.');
//             } else {
//               setMessage(`Error: ${error.message} (Details: ${JSON.stringify(error)})`);
//             }
//             throw error;
//           }
//           userData = data.user;
//         } else {
//           const { data, error } = await supabase.auth.signInWithOtp({ phone });
//           if (error) throw error;
//           userData = data.user;
//         }

//         // Wait for session propagation
//         await new Promise(resolve => setTimeout(resolve, 2000));

//         // Use a default full name if not provided
//         const defaultFullName = fullName.trim() !== '' ? fullName : (email ? email.split('@')[0] : 'User');

//         // Upsert the profile
//         const { error: profileError } = await supabase
//           .from('profiles')
//           .upsert({
//             id: userData.id,
//             email: email || null,
//             full_name: defaultFullName,
//             name: defaultFullName, // Legacy field; adjust as needed
//             is_seller: isSeller,
//             phone_number: phone || null,
//             shipping_address: null, // Default to null, editable later
//           }, { onConflict: 'id' });

//         if (profileError) {
//           console.error('Profile upsert error:', profileError);
//           if (profileError.message.includes('duplicate key value violates unique constraint')) {
//             setMessage('This email or phone is already in use. Please log in or use different credentials.');
//           } else if (profileError.message.includes('Database error')) {
//             setMessage('Database error updating profile. Please contact support. Error details: ' + JSON.stringify(profileError));
//           } else if (profileError.message.includes('foreign key violation')) {
//             setMessage('Foreign key violation in profiles. Please contact support. Error details: ' + JSON.stringify(profileError));
//           } else if (profileError.message.includes('unique constraint violation')) {
//             setMessage('Duplicate email or phone detected. Please use different credentials.');
//           } else {
//             setMessage(`Error creating profile: ${profileError.message} (Details: ${JSON.stringify(profileError)})`);
//           }
//           throw profileError;
//         }

//         if (isSeller) {
//           const { error: sellerError } = await supabase
//             .from('sellers')
//             .upsert({
//               id: userData.id,
//               store_name: `${defaultFullName} Store`,
//               location: null,
//               allows_long_distance: false,
//             }, { onConflict: 'id' });

//           if (sellerError) {
//             console.error('Seller upsert error:', sellerError);
//             setMessage(`Error creating seller profile: ${sellerError.message} (Details: ${JSON.stringify(sellerError)})`);
//             throw sellerError;
//           }
//         }

//         setMessage('Account created successfully! Check your email for a confirmation link (if using email).');
//         navigate('/account');
//       } else {
//         const { data, error } = await supabase.auth.signInWithPassword({
//           email,
//           password,
//         });
//         if (error) {
//           console.error('Login error:', error);
//           if (error.message === 'Invalid login credentials') {
//             setMessage('Invalid email or password. Please check your credentials or sign up if you don’t have an account.');
//           } else {
//             setMessage(`Error: ${error.message} (Details: ${JSON.stringify(error)})`);
//           }
//           throw error;
//         }
//         setMessage('Logged in successfully!');
//         navigate('/account');
//       }
//     } catch (error) {
//       console.error('Auth error:', error);
//       if (!message) {
//         setMessage('An unexpected error occurred. Please try again or contact support.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEmailAuthForPhone = async (user) => {
//     setLoading(true);
//     setMessage('');
//     try {
//       const defaultFullName = fullName.trim() !== '' ? fullName : (user.email ? user.email.split('@')[0] : 'User');
//       const { error: profileError } = await supabase
//         .from('profiles')
//         .upsert({
//           id: user.id,
//           email: user.email || null,
//           full_name: defaultFullName,
//           name: defaultFullName, // Legacy field; adjust as needed
//           is_seller: isSeller,
//           phone_number: phone || null,
//           shipping_address: null,
//         }, { onConflict: 'id' });
//       if (profileError) {
//         console.error('Profile upsert error:', profileError);
//         setMessage(`Error creating profile: ${profileError.message} (Details: ${JSON.stringify(profileError)})`);
//         throw profileError;
//       }
//       if (isSeller) {
//         const { error: sellerError } = await supabase
//           .from('sellers')
//           .upsert({
//             id: user.id,
//             store_name: `${defaultFullName} Store`,
//             location: null,
//             allows_long_distance: false,
//           }, { onConflict: 'id' });
//         if (sellerError) {
//           console.error('Seller upsert error:', sellerError);
//           setMessage(`Error creating seller profile: ${sellerError.message} (Details: ${JSON.stringify(sellerError)})`);
//           throw sellerError;
//         }
//       }
//       setMessage('Phone verified and account created successfully! Check your email for confirmation (if applicable).');
//       navigate('/account');
//     } catch (error) {
//       console.error('Phone auth error:', error);
//       setMessage('An error occurred during phone authentication. Please try again or contact support.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth">
//       <h1 style={{ color: '#007bff' }}>{isSignUp ? 'FreshCart Sign Up' : 'FreshCart Login'}</h1>
//       <button 
//         onClick={handleGoogleLogin} 
//         className="google-btn" 
//         disabled={loading}
//         style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
//       >
//         {loading ? 'Loading...' : 'Sign in with Google'}
//       </button>
//       <p style={{ color: '#666' }}>Or use email/phone and password:</p>
//       {isSignUp && (
//         <>
//           <label style={{ color: '#666' }}>
//             Full Name:
//             <input
//               type="text"
//               placeholder="Full Name"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               disabled={loading}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//           </label>
//           <label style={{ color: '#666' }}>
//             Are you a Seller?
//             <input
//               type="checkbox"
//               checked={isSeller}
//               onChange={(e) => setIsSeller(e.target.checked)}
//               disabled={loading}
//               style={{ marginLeft: '10px' }}
//             />
//           </label>
//           <label style={{ color: '#666' }}>
//             Phone Number (Optional):
//             <input
//               type="tel"
//               placeholder="Phone Number (e.g., +919876543210)"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               disabled={loading || showOtp}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//             {!showOtp && phone && (
//               <button 
//                 onClick={handlePhoneAuth} 
//                 className="otp-btn" 
//                 disabled={loading || !phone}
//                 style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//               >
//                 {loading ? 'Sending...' : 'Send OTP'}
//               </button>
//             )}
//           </label>
//           {showOtp && (
//             <label style={{ color: '#666' }}>
//               OTP:
//               <input
//                 type="text"
//                 placeholder="Enter OTP"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value)}
//                 required
//                 disabled={loading}
//                 className="auth-input"
//                 style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//               />
//               <button 
//                 onClick={verifyOtp} 
//                 className="otp-btn" 
//                 disabled={loading || !otp}
//                 style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//               >
//                 {loading ? 'Verifying...' : 'Verify OTP'}
//               </button>
//             </label>
//           )}
//           <label style={{ color: '#666' }}>
//             Email (Optional if using Phone):
//             <input
//               type="email"
//               placeholder="Email (Optional)"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               disabled={loading}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//           </label>
//           <label style={{ color: '#666' }}>
//             Password:
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               disabled={loading}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//           </label>
//         </>
//       )}
//       {!isSignUp && (
//         <>
//           <label style={{ color: '#666' }}>
//             Phone Number or Email:
//             <input
//               type="text"
//               placeholder="Phone (e.g., +919876543210) or Email"
//               value={phone || email}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^\+?[0-9]{10,13}$/.test(value)) {
//                   setPhone(value);
//                   setEmail('');
//                 } else {
//                   setEmail(value);
//                   setPhone('');
//                 }
//               }}
//               required
//               disabled={loading}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//           </label>
//           <label style={{ color: '#666' }}>
//             Password:
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               disabled={loading}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//           </label>
//         </>
//       )}
//       <form onSubmit={handleEmailAuth}>
//         <button 
//           type="submit" 
//           disabled={loading || (isSignUp && (!email && !phone) || (phone && !showOtp))}
//           style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
//         >
//           {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
//         </button>
//       </form>
//       <p style={{ color: '#666', marginTop: '10px' }}>{message}</p>
//       <button 
//         onClick={() => {
//           setIsSignUp(!isSignUp);
//           setShowOtp(false); // Reset OTP state when toggling
//           setOtp(''); // Clear OTP
//           setPhone(''); // Clear phone
//           setEmail(''); // Clear email
//           setPassword(''); // Clear password
//         }} 
//         className="toggle-btn" 
//         disabled={loading}
//         style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
//       >
//         {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
//       </button>
//       <Link to="/" className="back-link" style={{ color: '#007bff', marginTop: '10px', display: 'block' }}>Back to Home</Link>

//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Auth;




// import React, { useState, useEffect, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import '../style/Auth.css';

// function Auth() {
//   const { session } = useContext(LocationContext); // Get session from App.js
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [phone, setPhone] = useState('');
//   const [fullName, setFullName] = useState('');
//   const [otp, setOtp] = useState('');
//   const [isSignUp, setIsSignUp] = useState(false);
//   const [isSeller, setIsSeller] = useState(false);
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showOtp, setShowOtp] = useState(false);
//   const navigate = useNavigate();

//   // Redirect if already logged in
//   useEffect(() => {
//     if (session?.user) {
//       setMessage('You are already logged in. Redirecting...');
//       navigate('/account', { replace: true }); // Use replace to avoid navigation stack issues
//     }
//   }, [session, navigate]);

//   // Handle auth state changes (e.g., after signup/login)
//   useEffect(() => {
//     const subscription = supabase.auth.onAuthStateChange((event, newSession) => {
//       if (event === 'SIGNED_OUT') {
//         setMessage('You have been signed out. Please log in again.');
//         if (window.location.pathname !== '/auth') {
//           navigate('/auth', { replace: true });
//         }
//       } else if (event === 'SIGNED_IN' && newSession?.user) {
//         setMessage('Logged in successfully!');
//         if (window.location.pathname !== '/account') {
//           navigate('/account', { replace: true });
//         }
//       }
//     });

//     return () => {
//       if (subscription?.data?.subscription && typeof subscription.data.subscription.unsubscribe === 'function') {
//         subscription.data.subscription.unsubscribe();
//       }
//     };
//   }, [navigate]);

//   const handleGoogleLogin = async () => {
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: `${window.location.origin}/auth/callback`,
//         },
//       });
//       if (error) throw error;
//     } catch (error) {
//       console.error('Google login error:', error);
//       setMessage('Error signing in with Google. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePhoneAuth = async () => {
//     if (!phone || !/^\+?[0-9]{10,13}$/.test(phone)) {
//       setMessage('Please enter a valid phone number (e.g., +919876543210).');
//       return;
//     }
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOtp({ phone });
//       if (error) throw error;
//       setMessage('OTP sent to your phone. Please enter it below.');
//       setShowOtp(true);
//     } catch (error) {
//       console.error('Phone OTP error:', error);
//       setMessage('Error sending OTP. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resendOtp = async () => {
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOtp({ phone });
//       if (error) throw error;
//       setMessage('OTP resent to your phone. Please enter it below.');
//     } catch (error) {
//       console.error('Resend OTP error:', error);
//       setMessage('Error resending OTP. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const verifyOtp = async () => {
//     if (!otp) {
//       setMessage('Please enter the OTP.');
//       return;
//     }
//     setLoading(true);
//     setMessage('');
//     try {
//       const { data, error } = await supabase.auth.verifyOtp({
//         phone,
//         token: otp,
//         type: 'sms',
//       });
//       if (error) throw error;
//       setMessage('Phone verified successfully!');
//       if (isSignUp) {
//         await handleEmailAuthForPhone(data.session.user);
//       }
//     } catch (error) {
//       console.error('OTP verification error:', error);
//       setMessage('Error verifying OTP. Please check the code or resend a new one.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEmailAuth = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage('');

//     try {
//       if (isSignUp) {
//         if (!email && !phone) {
//           setMessage('Please provide either an email or phone number.');
//           setLoading(false);
//           return;
//         }
//         if (phone && !showOtp) {
//           setMessage('Please verify your phone number with OTP before signing up.');
//           setLoading(false);
//           return;
//         }
//         if (!password) {
//           setMessage('Password is required for sign-up.');
//           setLoading(false);
//           return;
//         }

//         let userData;
//         if (email) {
//           const { data, error } = await supabase.auth.signUp({
//             email,
//             password,
//           });
//           if (error) {
//             if (error.message.includes('duplicate key value')) {
//               setMessage('This email is already registered. Please log in or use a different email.');
//             } else if (error.message.includes('Network error')) {
//               setMessage('Network issue detected. Please check your internet connection and try again.');
//             } else {
//               setMessage(`Error signing up: ${error.message}`);
//             }
//             throw error;
//           }
//           userData = data.user;
//         } else {
//           // Phone signup is handled via OTP, so this case is already verified
//           return; // User data is already set via verifyOtp
//         }

//         // Wait for the SIGNED_IN event to handle profile creation (handled by useEffect)
//         const defaultFullName = fullName.trim() !== '' ? fullName : (email ? email.split('@')[0] : 'User');
//         const { error: profileError } = await supabase
//           .from('profiles')
//           .upsert({
//             id: userData.id,
//             email: email || null,
//             full_name: defaultFullName,
//             name: defaultFullName,
//             is_seller: isSeller,
//             phone_number: phone || null,
//             shipping_address: null,
//           }, { onConflict: 'id' });

//         if (profileError) {
//           console.error('Profile upsert error:', profileError);
//           setMessage('Error creating profile. Please try again or contact support.');
//           throw profileError;
//         }

//         if (isSeller) {
//           const { error: sellerError } = await supabase
//             .from('sellers')
//             .upsert({
//               id: userData.id,
//               store_name: `${defaultFullName} Store`,
//               location: null,
//               allows_long_distance: false,
//             }, { onConflict: 'id' });

//           if (sellerError) {
//             console.error('Seller upsert error:', sellerError);
//             setMessage('Error creating seller profile. Please try again or contact support.');
//             throw sellerError;
//           }
//         }

//         setMessage('Account created successfully! Check your email for a confirmation link.');
//       } else {
//         const { error } = await supabase.auth.signInWithPassword({
//           email,
//           password,
//         });
//         if (error) {
//           if (error.message === 'Invalid login credentials') {
//             setMessage('Invalid email or password. Please check your credentials or sign up.');
//           } else {
//             setMessage(`Error logging in: ${error.message}`);
//           }
//           throw error;
//         }
//         // Navigation will be handled by the onAuthStateChange listener
//       }
//     } catch (error) {
//       console.error('Auth error:', error);
//       if (!message) {
//         setMessage('An unexpected error occurred. Please try again or contact support.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEmailAuthForPhone = async (user) => {
//     setLoading(true);
//     setMessage('');
//     try {
//       const defaultFullName = fullName.trim() !== '' ? fullName : (user.email ? user.email.split('@')[0] : 'User');
//       const { error: profileError } = await supabase
//         .from('profiles')
//         .upsert({
//           id: user.id,
//           email: user.email || null,
//           full_name: defaultFullName,
//           name: defaultFullName,
//           is_seller: isSeller,
//           phone_number: phone || null,
//           shipping_address: null,
//         }, { onConflict: 'id' });
//       if (profileError) {
//         console.error('Profile upsert error:', profileError);
//         setMessage('Error creating profile. Please try again or contact support.');
//         throw profileError;
//       }
//       if (isSeller) {
//         const { error: sellerError } = await supabase
//           .from('sellers')
//           .upsert({
//             id: user.id,
//             store_name: `${defaultFullName} Store`,
//             location: null,
//             allows_long_distance: false,
//           }, { onConflict: 'id' });
//         if (sellerError) {
//           console.error('Seller upsert error:', sellerError);
//           setMessage('Error creating seller profile. Please try again or contact support.');
//           throw sellerError;
//         }
//       }
//       setMessage('Phone verified and account created successfully!');
//     } catch (error) {
//       console.error('Phone auth error:', error);
//       setMessage('An error occurred during phone authentication. Please try again or contact support.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth">
//       <h1 style={{ color: '#007bff' }}>{isSignUp ? 'FreshCart Sign Up' : 'FreshCart Login'}</h1>
//       <button 
//         onClick={handleGoogleLogin} 
//         className="google-btn" 
//         disabled={loading}
//         style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
//       >
//         {loading ? 'Loading...' : 'Sign in with Google'}
//       </button>
//       <p style={{ color: '#666' }}>Or use email/phone and password:</p>
//       {isSignUp && (
//         <>
//           <label style={{ color: '#666' }}>
//             Full Name:
//             <input
//               type="text"
//               placeholder="Full Name"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               disabled={loading}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//           </label>
//           <label style={{ color: '#666' }}>
//             Are you a Seller?
//             <input
//               type="checkbox"
//               checked={isSeller}
//               onChange={(e) => setIsSeller(e.target.checked)}
//               disabled={loading}
//               style={{ marginLeft: '10px' }}
//             />
//           </label>
//           <label style={{ color: '#666' }}>
//             Phone Number (Optional):
//             <input
//               type="tel"
//               placeholder="Phone Number (e.g., +919876543210)"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               disabled={loading || showOtp}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//             {!showOtp && phone && (
//               <button 
//                 onClick={handlePhoneAuth} 
//                 className="otp-btn" 
//                 disabled={loading || !phone}
//                 style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//               >
//                 {loading ? 'Sending...' : 'Send OTP'}
//               </button>
//             )}
//           </label>
//           {showOtp && (
//             <label style={{ color: '#666' }}>
//               OTP:
//               <input
//                 type="text"
//                 placeholder="Enter OTP"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value)}
//                 required
//                 disabled={loading}
//                 className="auth-input"
//                 style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//               />
//               <button 
//                 onClick={verifyOtp} 
//                 className="otp-btn" 
//                 disabled={loading || !otp}
//                 style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//               >
//                 {loading ? 'Verifying...' : 'Verify OTP'}
//               </button>
//               <button 
//                 onClick={resendOtp} 
//                 className="otp-btn" 
//                 disabled={loading}
//                 style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//               >
//                 {loading ? 'Resending...' : 'Resend OTP'}
//               </button>
//             </label>
//           )}
//           <label style={{ color: '#666' }}>
//             Email (Optional if using Phone):
//             <input
//               type="email"
//               placeholder="Email (Optional)"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               disabled={loading}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//           </label>
//           <label style={{ color: '#666' }}>
//             Password:
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               disabled={loading}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//           </label>
//         </>
//       )}
//       {!isSignUp && (
//         <>
//           <label style={{ color: '#666' }}>
//             Phone Number or Email:
//             <input
//               type="text"
//               placeholder="Phone (e.g., +919876543210) or Email"
//               value={phone || email}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^\+?[0-9]{10,13}$/.test(value)) {
//                   setPhone(value);
//                   setEmail('');
//                 } else {
//                   setEmail(value);
//                   setPhone('');
//                 }
//               }}
//               required
//               disabled={loading}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//           </label>
//           <label style={{ color: '#666' }}>
//             Password:
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               disabled={loading}
//               className="auth-input"
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//             />
//           </label>
//         </>
//       )}
//       <form onSubmit={handleEmailAuth}>
//         <button 
//           type="submit" 
//           disabled={loading || (isSignUp && (!email && !phone) || (phone && !showOtp))}
//           style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
//         >
//           {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
//         </button>
//       </form>
//       <p style={{ color: '#666', marginTop: '10px' }}>{message}</p>
//       <button 
//         onClick={() => {
//           setIsSignUp(!isSignUp);
//           setShowOtp(false);
//           setOtp('');
//           setPhone('');
//           setEmail('');
//           setPassword('');
//         }} 
//         className="toggle-btn" 
//         disabled={loading}
//         style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
//       >
//         {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
//       </button>
//       <Link to="/" className="back-link" style={{ color: '#007bff', marginTop: '10px', display: 'block' }}>Back to Home</Link>

//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Auth;



// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Auth.css';

// export default function Auth() {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState('login'); // 'login' or 'signup'
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [fullName, setFullName] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [phone, setPhone] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');

//   // on mount, redirect if already authenticated and subscribe to auth events
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session) navigate('/account', { replace: true });
//     });
//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
//       if (event === 'SIGNED_IN') navigate('/account', { replace: true });
//       if (event === 'SIGNED_OUT') navigate('/auth', { replace: true });
//     });
//     return () => subscription.unsubscribe();
//   }, [navigate]);

//   // Google OAuth
//   const handleGoogle = async () => {
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
//       if (error) throw error;
//     } catch (err) {
//       console.error(err);
//       setMessage('Google sign-in failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // send OTP
//   const sendOtp = async () => {
//     if (!/^\+?[0-9]{10,13}$/.test(phone)) {
//       setMessage('Enter a valid phone number');
//       return;
//     }
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOtp({ phone });
//       if (error) throw error;
//       setOtpSent(true);
//       setMessage('OTP sent');
//     } catch (err) {
//       console.error(err);
//       setMessage('Failed to send OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // verify OTP
//   const verifyOtp = async () => {
//     if (!otp) return setMessage('Enter OTP');
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
//       if (error) throw error;
//       setMessage('Phone verified');
//       if (mode === 'signup') await handleEmailAuth();
//     } catch (err) {
//       console.error(err);
//       setMessage('Invalid OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // email/password auth
//   const handleEmailAuth = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     setLoading(true);
//     setMessage('');
//     try {
//       if (mode === 'signup') {
//         if (!email && !phone) {
//           setMessage('Provide email or phone');
//           return;
//         }
//         if (phone && !otpSent) {
//           setMessage('Verify phone first');
//           return;
//         }
//         const { data: { user }, error } = await supabase.auth.signUp({ email, password });
//         if (error) throw error;
//         await supabase.from('profiles').upsert({
//           id: user.id,
//           full_name: fullName || user.email?.split('@')[0],
//           is_seller: isSeller,
//           phone_number: phone || null,
//         });
//         if (isSeller) {
//           await supabase.from('sellers').upsert({ id: user.id, store_name: `${fullName || user.email.split('@')[0]} Store` });
//         }
//         setMessage('Sign-up successful, check your email to confirm.');
//       } else {
//         const { error } = await supabase.auth.signInWithPassword({ email, password });
//         if (error) throw error;
//         // onAuthStateChange will handle redirect
//       }
//     } catch (err) {
//       console.error(err);
//       setMessage(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth">
//       <h1>{mode === 'signup' ? 'FreshCart Sign Up' : 'FreshCart Login'}</h1>
//       <button onClick={handleGoogle} disabled={loading} className="google-btn">
//         {loading ? 'Please wait...' : 'Sign in with Google'}
//       </button>
//       <hr />
//       <form onSubmit={handleEmailAuth} className="auth-form">
//         {mode === 'signup' && (
//           <>
//             <input
//               type="text"
//               placeholder="Full Name"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               disabled={loading}
//               required={!email}
//             />
//             <label className="seller-checkbox">
//               <input type="checkbox" checked={isSeller} onChange={() => setIsSeller(!isSeller)} disabled={loading} />
//               Are you a Seller?
//             </label>
//           </>
//         )}
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           disabled={loading || phone}
//           required={!phone}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           disabled={loading}
//           required={mode === 'signup'}
//         />
//         <button type="submit" disabled={loading} className="auth-button">
//           {mode === 'signup' ? 'Sign Up' : 'Login'}
//         </button>
//       </form>
//       <hr />
//       <div className="otp-section">
//         <input
//           type="tel"
//           placeholder="+91 Phone"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
//           disabled={loading || otpSent}
//           required={!email}
//         />
//         {!otpSent ? (
//           <button onClick={sendOtp} disabled={loading} className="otp-btn">
//             Send OTP
//           </button>
//         ) : (
//           <>
//             <input
//               type="text"
//               placeholder="OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value)}
//               disabled={loading}
//             />
//             <button onClick={verifyOtp} disabled={loading} className="otp-btn">
//               Verify OTP
//             </button>
//           </>
//         )}
//       </div>
//       {message && <p className="auth-message">{message}</p>}
//       <button
//         onClick={() => {
//           setMode(mode === 'signup' ? 'login' : 'signup');
//           setMessage('');
//           setOtpSent(false);
//           setOtp('');
//         }}
//         disabled={loading}
//         className="auth-toggle"
//       >
//         {mode === 'signup' ? 'Have an account? Login' : 'Need an account? Sign Up'}
//       </button>
//       <Link to="/" className="back-link">
//         Back to Home
//       </Link>
//     </div>
//   );
// }



// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Auth.css';

// export default function Auth() {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState('login'); // 'login' or 'signup'
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [fullName, setFullName] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [phone, setPhone] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');

//   // on mount, redirect if already authenticated and subscribe to auth events
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session) navigate('/account', { replace: true });
//     });
//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
//       if (event === 'SIGNED_IN') navigate('/account', { replace: true });
//       if (event === 'SIGNED_OUT') navigate('/auth', { replace: true });
//     });
//     return () => subscription.unsubscribe();
//   }, [navigate]);

//   // Google OAuth
//   const handleGoogle = async () => {
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
//       if (error) throw error;
//     } catch (err) {
//       console.error(err);
//       setMessage('Google sign-in failed. Please try again or use another method.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // send OTP
//   const sendOtp = async () => {
//     if (!/^\+?[0-9]{10,13}$/.test(phone)) {
//       setMessage('Enter a valid phone number (e.g., +919876543210)');
//       return;
//     }
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOtp({ phone });
//       if (error) throw error;
//       setOtpSent(true);
//       setMessage('OTP sent to your phone. Please check.');
//     } catch (err) {
//       console.error(err);
//       setMessage('Failed to send OTP. Please try again or use email.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // verify OTP
//   const verifyOtp = async () => {
//     if (!otp) {
//       setMessage('Please enter the OTP received on your phone.');
//       return;
//     }
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
//       if (error) throw error;
//       setMessage('Phone verified successfully.');
//       if (mode === 'signup') await handleEmailAuth();
//     } catch (err) {
//       console.error(err);
//       setMessage('Invalid OTP. Please try again or request a new one.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // email/password auth
//   const handleEmailAuth = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     setLoading(true);
//     setMessage('');
//     try {
//       if (mode === 'signup') {
//         if (!email && !phone) {
//           setMessage('Please provide an email or phone number.');
//           return;
//         }
//         if (phone && !otpSent) {
//           setMessage('Please verify your phone number first.');
//           return;
//         }
//         const { data: { user }, error } = await supabase.auth.signUp({ email, password });
//         if (error) throw error;
//         await supabase.from('profiles').upsert({
//           id: user.id,
//           full_name: fullName || user.email?.split('@')[0],
//           is_seller: isSeller,
//           phone_number: phone || null,
//         });
//         if (isSeller) {
//           await supabase.from('sellers').upsert({ id: user.id, store_name: `${fullName || user.email.split('@')[0]} Store` });
//         }
//         setMessage('Sign-up successful. Please check your email to confirm your account.');
//       } else {
//         const { error } = await supabase.auth.signInWithPassword({ email, password });
//         if (error) throw error;
//         // onAuthStateChange will handle redirect
//       }
//     } catch (err) {
//       console.error(err);
//       setMessage(err.message || 'Authentication failed. Please check your credentials.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth">
//       <h1>{mode === 'signup' ? 'FreshCart Sign Up' : 'FreshCart Login'}</h1>
//       <button onClick={handleGoogle} disabled={loading} className="google-btn">
//         {loading ? 'Please wait...' : 'Sign in with Google'}
//       </button>
//       <hr />
//       <form onSubmit={handleEmailAuth} className="auth-form">
//         {mode === 'signup' && (
//           <>
//             <input
//               type="text"
//               placeholder="Full Name"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               disabled={loading}
//               required={!email}
//             />
//             <label className="seller-checkbox">
//               <input type="checkbox" checked={isSeller} onChange={() => setIsSeller(!isSeller)} disabled={loading} />
//               Are you a Seller?
//             </label>
//           </>
//         )}
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           disabled={loading || phone}
//           required={!phone}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           disabled={loading}
//           required={mode === 'signup'}
//         />
//         <button type="submit" disabled={loading} className="auth-button">
//           {mode === 'signup' ? 'Sign Up' : 'Login'}
//         </button>
//       </form>
//       <hr />
//       <div className="otp-section">
//         <input
//           type="tel"
//           placeholder="+91 Phone"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
//           disabled={loading || otpSent}
//           required={!email}
//         />
//         {!otpSent ? (
//           <button onClick={sendOtp} disabled={loading} className="otp-btn">
//             Send OTP
//           </button>
//         ) : (
//           <>
//             <input
//               type="text"
//               placeholder="OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value)}
//               disabled={loading}
//             />
//             <button onClick={verifyOtp} disabled={loading} className="otp-btn">
//               Verify OTP
//             </button>
//           </>
//         )}
//       </div>
//       {message && <p className="auth-message">{message}</p>}
//       <button
//         onClick={() => {
//           setMode(mode === 'signup' ? 'login' : 'signup');
//           setMessage('');
//           setOtpSent(false);
//           setOtp('');
//         }}
//         disabled={loading}
//         className="auth-toggle"
//       >
//         {mode === 'signup' ? 'Have an account? Login' : 'Need an account? Sign Up'}
//       </button>
//       <div className="auth-footer">
//         <Link to="/policy" style={{ color: '#007bff', marginRight: '10px' }}>
//           Policies
//         </Link>
//         <Link to="/privacy" style={{ color: '#007bff' }}>
//           Privacy Policy
//         </Link>
//       </div>
//       <Link to="/" className="back-link">
//         Back to Home
//       </Link>
//     </div>
//   );
// }



// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Auth.css';

// export default function Auth() {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState('login'); // 'login' or 'signup'
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [fullName, setFullName] = useState('');
//   const [isSeller, setIsSeller] = useState(false);
//   const [phone, setPhone] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [resendCooldown, setResendCooldown] = useState(0);

//   // Redirect if already authenticated and subscribe to auth events
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session) navigate('/account', { replace: true });
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
//       if (event === 'SIGNED_IN') navigate('/account', { replace: true });
//       if (event === 'SIGNED_OUT') navigate('/auth', { replace: true });
//     });

//     return () => subscription.unsubscribe();
//   }, [navigate]);

//   // Handle resend OTP cooldown
//   useEffect(() => {
//     if (resendCooldown > 0) {
//       const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [resendCooldown]);

//   // Google OAuth
//   const handleGoogle = async () => {
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
//       if (error) throw error;
//     } catch (err) {
//       console.error('Google sign-in error:', err);
//       setMessage('Google sign-in failed. Please try again or use another method.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Send OTP
//   const sendOtp = useCallback(async () => {
//     if (!/^\+?[0-9]{10,13}$/.test(phone)) {
//       setMessage('Enter a valid phone number (e.g., +919876543210)');
//       return;
//     }
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOtp({ phone });
//       if (error) throw error;
//       setOtpSent(true);
//       setResendCooldown(30); // 30-second cooldown for resend
//       setMessage('OTP sent to your phone. Please check.');
//     } catch (err) {
//       console.error('Send OTP error:', err);
//       setMessage('Failed to send OTP. Please try again or use email.');
//     } finally {
//       setLoading(false);
//     }
//   }, [phone]);

//   // Verify OTP
//   const verifyOtp = async () => {
//     if (!otp) {
//       setMessage('Please enter the OTP received on your phone.');
//       return;
//     }
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
//       if (error) throw error;
//       setMessage('Phone verified successfully.');
//       if (mode === 'signup') await handleEmailAuth();
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//       setMessage('Invalid OTP. Please try again or request a new one.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Email/password auth
//   const handleEmailAuth = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     setLoading(true);
//     setMessage('');
//     try {
//       if (mode === 'signup') {
//         if (!email && !phone) {
//           setMessage('Please provide an email or phone number.');
//           return;
//         }
//         if (phone && !otpSent) {
//           setMessage('Please verify your phone number first.');
//           return;
//         }
//         const { data: { user }, error } = await supabase.auth.signUp({ email, password });
//         if (error) throw error;
//         await supabase.from('profiles').upsert({
//           id: user.id,
//           full_name: fullName || user.email?.split('@')[0],
//           is_seller: isSeller,
//           phone_number: phone || null,
//         });
//         if (isSeller) {
//           await supabase.from('sellers').upsert({ id: user.id, store_name: `${fullName || user.email.split('@')[0]} Store` });
//         }
//         setMessage('Sign-up successful. Please check your email to confirm your account.');
//       } else {
//         const { error } = await supabase.auth.signInWithPassword({ email, password });
//         if (error) throw error;
//         // onAuthStateChange will handle redirect
//       }
//     } catch (err) {
//       console.error('Email auth error:', err);
//       setMessage(err.message || 'Authentication failed. Please check your credentials.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset form fields on mode toggle
//   const handleModeToggle = () => {
//     setMode(mode === 'signup' ? 'login' : 'signup');
//     setEmail('');
//     setPassword('');
//     setFullName('');
//     setIsSeller(false);
//     setPhone('');
//     setOtp('');
//     setOtpSent(false);
//     setMessage('');
//     setResendCooldown(0);
//   };

//   return (
//     <div className="auth-container">
//       <h1 className="auth-title">{mode === 'signup' ? 'Think & Deliver Sign Up' : 'Think & Deliver Login'}</h1>
//       <button
//         onClick={handleGoogle}
//         disabled={loading}
//         className="google-btn"
//         aria-label="Sign in with Google"
//       >
//         {loading ? 'Please wait...' : 'Sign in with Google'}
//       </button>
//       <hr />
//       <form onSubmit={handleEmailAuth} className="auth-form">
//         {mode === 'signup' && (
//           <>
//             <input
//               type="text"
//               placeholder="Full Name"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               disabled={loading}
//               required={!email}
//               className="auth-input"
//               aria-label="Full Name"
//             />
//             <label className="seller-checkbox">
//               <input
//                 type="checkbox"
//                 checked={isSeller}
//                 onChange={() => setIsSeller(!isSeller)}
//                 disabled={loading}
//                 aria-label="Register as a Seller"
//               />
//               Are you a Seller?
//             </label>
//           </>
//         )}
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           disabled={loading || phone}
//           required={!phone}
//           className="auth-input"
//           aria-label="Email Address"
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           disabled={loading}
//           required={mode === 'signup'}
//           className="auth-input"
//           aria-label="Password"
//         />
//         <button
//           type="submit"
//           disabled={loading}
//           className="auth-button"
//           aria-label={mode === 'signup' ? 'Sign Up' : 'Login'}
//         >
//           {loading ? 'Processing...' : mode === 'signup' ? 'Sign Up' : 'Login'}
//         </button>
//       </form>
//       <hr />
//       <div className="otp-section">
//         <input
//           type="tel"
//           placeholder="+91 Phone (e.g., +919876543210)"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
//           disabled={loading || otpSent}
//           required={!email}
//           className="auth-input"
//           aria-label="Phone Number"
//         />
//         {!otpSent ? (
//           <button
//             onClick={sendOtp}
//             disabled={loading}
//             className="otp-btn"
//             aria-label="Send OTP"
//           >
//             {loading ? 'Sending...' : 'Send OTP'}
//           </button>
//         ) : (
//           <>
//             <input
//               type="text"
//               placeholder="Enter OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value)}
//               disabled={loading}
//               className="auth-input"
//               aria-label="OTP Code"
//             />
//             <button
//               onClick={verifyOtp}
//               disabled={loading}
//               className="otp-btn"
//               aria-label="Verify OTP"
//             >
//               {loading ? 'Verifying...' : 'Verify OTP'}
//             </button>
//             <button
//               onClick={sendOtp}
//               disabled={loading || resendCooldown > 0}
//               className="otp-btn resend-btn"
//               aria-label="Resend OTP"
//             >
//               {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
//             </button>
//           </>
//         )}
//       </div>
//       {message && <p className="auth-message">{message}</p>}
//       <button
//         onClick={handleModeToggle}
//         disabled={loading}
//         className="auth-toggle"
//         aria-label={mode === 'signup' ? 'Switch to Login' : 'Switch to Sign Up'}
//       >
//         {mode === 'signup' ? 'Have an account? Login' : 'Need an account? Sign Up'}
//       </button>
//       <div className="auth-footer">
//         <Link to="/policy" className="footer-link" aria-label="View Policies">
//           Policies
//         </Link>
//         <Link to="/privacy" className="footer-link" aria-label="View Privacy Policy">
//           Privacy Policy
//         </Link>
//       </div>
//       <Link to="/" className="back-link" aria-label="Back to Home">
//         Back to Home
//       </Link>
//     </div>
//   );
// }




// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Auth.css';

// export default function Auth() {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState('login'); // 'login' or 'signup'
//   const [fullName, setFullName] = useState('');
//   const [phone, setPhone] = useState('+91');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [resendCooldown, setResendCooldown] = useState(0);

//   // Redirect if already authenticated and subscribe to auth events
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session) navigate('/account', { replace: true });
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
//       if (event === 'SIGNED_IN') navigate('/account', { replace: true });
//       if (event === 'SIGNED_OUT') navigate('/auth', { replace: true });
//     });

//     return () => subscription.unsubscribe();
//   }, [navigate]);

//   // Handle resend OTP cooldown
//   useEffect(() => {
//     if (resendCooldown > 0) {
//       const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [resendCooldown]);

//   // Send OTP
//   const sendOtp = useCallback(async () => {
//     if (!/^\+91[0-9]{10}$/.test(phone)) {
//       setMessage('Enter a valid 10-digit phone number (e.g., +919876543210)');
//       return;
//     }
//     setLoading(true);
//     setMessage('');
//     try {
//       const { error } = await supabase.auth.signInWithOtp({ phone });
//       if (error) throw error;
//       setOtpSent(true);
//       setResendCooldown(30); // 30-second cooldown for resend
//       setMessage('OTP sent to your phone. Please check.');
//     } catch (err) {
//       console.error('Send OTP error:', err);
//       setMessage('Failed to send OTP. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [phone]);

//   // Verify OTP
//   const verifyOtp = async () => {
//     if (!otp) {
//       setMessage('Please enter the OTP received on your phone.');
//       return;
//     }
//     setLoading(true);
//     setMessage('');
//     try {
//       const { data: { user }, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
//       if (error) throw error;
//       if (mode === 'signup') {
//         await supabase.from('profiles').upsert({
//           id: user.id,
//           full_name: fullName || phone.split('+91')[1],
//           phone_number: phone,
//         });
//         setMessage('Sign-up successful. Welcome!');
//       } else {
//         setMessage('Login successful. Welcome back!');
//       }
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//       setMessage('Invalid OTP. Please try again or request a new one.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset form fields on mode toggle
//   const handleModeToggle = () => {
//     setMode(mode === 'signup' ? 'login' : 'signup');
//     setFullName('');
//     setPhone('+91');
//     setOtp('');
//     setOtpSent(false);
//     setMessage('');
//     setResendCooldown(0);
//   };

//   return (
//     <div className="auth-container">
//       <h1 className="auth-title">{mode === 'signup' ? 'Think & Deliver Sign Up' : 'Think & Deliver Login'}</h1>
//       <div className="auth-form">
//         {mode === 'signup' && (
//           <input
//             type="text"
//             placeholder="Full Name"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//             disabled={loading}
//             required
//             className="auth-input"
//             aria-label="Full Name"
//           />
//         )}
//         <input
//           type="tel"
//           placeholder="+91 Phone (e.g., +919876543210)"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value.startsWith('+91') ? e.target.value : '+91' + e.target.value.replace(/^\+91/, ''))}
//           disabled={loading || otpSent}
//           required
//           className="auth-input"
//           aria-label="Phone Number"
//         />
//         {!otpSent ? (
//           <button
//             onClick={sendOtp}
//             disabled={loading}
//             className="auth-button"
//             aria-label="Send OTP"
//           >
//             {loading ? 'Sending...' : 'Send OTP'}
//           </button>
//         ) : (
//           <>
//             <input
//               type="text"
//               placeholder="Enter OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value)}
//               disabled={loading}
//               required
//               className="auth-input"
//               aria-label="OTP Code"
//             />
//             <button
//               onClick={verifyOtp}
//               disabled={loading}
//               className="auth-button"
//               aria-label="Verify OTP"
//             >
//               {loading ? 'Verifying...' : 'Verify OTP'}
//             </button>
//             <button
//               onClick={sendOtp}
//               disabled={loading || resendCooldown > 0}
//               className="auth-button resend-btn"
//               aria-label="Resend OTP"
//             >
//               {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
//             </button>
//           </>
//         )}
//       </div>
//       {message && <p className="auth-message">{message}</p>}
//       <button
//         onClick={handleModeToggle}
//         disabled={loading}
//         className="auth-toggle"
//         aria-label={mode === 'signup' ? 'Switch to Login' : 'Switch to Sign Up'}
//       >
//         {mode === 'signup' ? 'Have an account? Login' : 'Need an account? Sign Up'}
//       </button>
//       <div className="auth-footer">
//         <Link to="/policy" className="footer-link" aria-label="View Policies">
//           Policies
//         </Link>
//         <Link to="/privacy" className="footer-link" aria-label="View Privacy Policy">
//           Privacy Policy
//         </Link>
//       </div>
//       <Link to="/" className="back-link" aria-label="Back to Home">
//         Back to Home
//       </Link>
//     </div>
//   );
// }


// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/Auth.css';

// export default function Auth() {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState('signup'); // Default to signup
//   const [fullName, setFullName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [resendCooldown, setResendCooldown] = useState(0);

//   // Redirect if already authenticated and subscribe to auth events
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session) navigate('/account', { replace: true });
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
//       if (event === 'SIGNED_IN') navigate('/account', { replace: true });
//       if (event === 'SIGNED_OUT') navigate('/auth', { replace: true });
//     });

//     return () => subscription.unsubscribe();
//   }, [navigate]);

//   // Handle resend OTP cooldown
//   useEffect(() => {
//     if (resendCooldown > 0) {
//       const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [resendCooldown]);

//   // Send OTP
//   const sendOtp = useCallback(async () => {
//     if (!/^[0-9]{10}$/.test(phone)) {
//       toast.error('Enter a valid 10-digit phone number (e.g., 9876543210)', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
//       if (error) throw error;
//       setOtpSent(true);
//       setResendCooldown(30); // 30-second cooldown for resend
//       toast.success('OTP sent to your phone. Please check.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#2ecc71',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } catch (err) {
//       toast.error('Failed to send OTP. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [phone]);

//   // Verify OTP and handle auth
//   const handleAuth = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     if (!otpSent || !otp) {
//       toast.error('Please request and enter the OTP.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (mode === 'signup' && !fullName.trim()) {
//       toast.error('Full name is required for sign-up.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: 'sms' });
//       if (error) throw error;
//       if (mode === 'signup') {
//         const { data: { user }, error: signUpError } = await supabase.auth.signUp({ phone: fullPhone });
//         if (signUpError) throw signUpError;
//         await supabase.from('profiles').upsert({
//           id: user.id,
//           full_name: fullName,
//           phone_number: fullPhone,
//         });
//         toast.success('Sign-up successful. You are now logged in.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#2ecc71',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       } else {
//         toast.success('Login successful.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#2ecc71',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       }
//     } catch (err) {
//       toast.error('Invalid OTP or authentication failed. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset form fields on mode toggle
//   const handleModeToggle = () => {
//     setMode(mode === 'signup' ? 'login' : 'signup');
//     setFullName('');
//     setPhone('');
//     setOtp('');
//     setOtpSent(false);
//     setResendCooldown(0);
//   };

//   return (
//     <div className="auth-container">
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
//       <h1 className="auth-title">{mode === 'signup' ? 'Think & Deliver Sign Up' : 'Think & Deliver Login'}</h1>
//       <form onSubmit={handleAuth} className="auth-form">
//         {mode === 'signup' && (
//           <input
//             type="text"
//             placeholder="Full Name"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//             disabled={loading}
//             required
//             className="auth-input"
//             aria-label="Full Name"
//           />
//         )}
//         <div className="phone-input-wrapper">
//           <span className="phone-prefix">+91</span>
//           <input
//             type="tel"
//             placeholder="9876543210"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
//             disabled={loading || otpSent}
//             required
//             className="auth-input phone-input"
//             aria-label="Phone Number"
//           />
//         </div>
//         {!otpSent ? (
//           <button
//             onClick={sendOtp}
//             disabled={loading}
//             className="otp-btn"
//             aria-label="Send OTP"
//           >
//             {loading ? (
//               <span className="loading-spinner">Sending...</span>
//             ) : (
//               'Send OTP'
//             )}
//           </button>
//         ) : (
//           <>
//             <input
//               type="text"
//               placeholder="Enter OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
//               disabled={loading}
//               required
//               className="auth-input"
//               aria-label="OTP Code"
//             />
//             <button
//               type="submit"
//               disabled={loading}
//               className="auth-button"
//               aria-label={mode === 'signup' ? 'Sign Up with OTP' : 'Login with OTP'}
//             >
//               {loading ? (
//                 <span className="loading-spinner">Processing...</span>
//               ) : mode === 'signup' ? (
//                 'Sign Up'
//               ) : (
//                 'Login'
//               )}
//             </button>
//             <button
//               onClick={sendOtp}
//               disabled={loading || resendCooldown > 0}
//               className="otp-btn resend-btn"
//               aria-label="Resend OTP"
//             >
//               {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
//             </button>
//           </>
//         )}
//       </form>
//       <button
//         onClick={handleModeToggle}
//         disabled={loading}
//         className="auth-toggle"
//         aria-label={mode === 'signup' ? 'Switch to Login' : 'Switch to Sign Up'}
//       >
//         {mode === 'signup' ? 'Have an account? Login' : 'Need an account? Sign Up'}
//       </button>
//       <div className="auth-footer">
//         <Link to="/policy" className="footer-link" aria-label="View Policies">
//           Policies
//         </Link>
//         <Link to="/privacy" className="footer-link" aria-label="View Privacy Policy">
//           Privacy Policy
//         </Link>
//       </div>
//       <Link to="/" className="back-link" aria-label="Back to Home">
//         Back to Home
//       </Link>
//     </div>
//   );
// }

// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import icon from '../assets/icon.png';
// import '../style/Auth.css';

// export default function Auth() {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState('signup'); // Default to signup
//   const [fullName, setFullName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [resendCooldown, setResendCooldown] = useState(0);

//   // Redirect if already authenticated and subscribe to auth events
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session) navigate('/account', { replace: true });
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
//       if (event === 'SIGNED_IN') navigate('/account', { replace: true });
//       if (event === 'SIGNED_OUT') navigate('/auth', { replace: true });
//     });

//     return () => subscription.unsubscribe();
//   }, [navigate]);

//   // Handle resend OTP cooldown
//   useEffect(() => {
//     if (resendCooldown > 0) {
//       const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [resendCooldown]);

//   // Send OTP
//   const sendOtp = useCallback(async () => {
//     if (!/^[0-9]{10}$/.test(phone)) {
//       toast.error('Enter a valid 10-digit phone number (e.g., 9876543210)', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
//       if (error) throw error;
//       setOtpSent(true);
//       setResendCooldown(30); // 30-second cooldown for resend
//       toast.success('OTP sent to your phone. Please check.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#2ecc71',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } catch (err) {
//       toast.error('Failed to send OTP. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [phone]);

//   // Verify OTP and handle auth
//   const handleAuth = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     if (!otpSent || !otp) {
//       toast.error('Please request and enter the OTP.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (mode === 'signup' && !fullName.trim()) {
//       toast.error('Full name is required for sign-up.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: 'sms' });
//       if (error) throw error;
//       if (mode === 'signup') {
//         const { data: { user }, error: signUpError } = await supabase.auth.signUp({ phone: fullPhone });
//         if (signUpError) throw signUpError;
//         await supabase.from('profiles').upsert({
//           id: user.id,
//           full_name: fullName,
//           phone_number: fullPhone,
//         });
//         toast.success('Sign-up successful. You are now logged in.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#2ecc71',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       } else {
//         toast.success('Login successful.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#2ecc71',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       }
//     } catch (err) {
//       toast.error('Invalid OTP or authentication failed. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset form fields on mode toggle
//   const handleModeToggle = () => {
//     setMode(mode === 'signup' ? 'login' : 'signup');
//     setFullName('');
//     setPhone('');
//     setOtp('');
//     setOtpSent(false);
//     setResendCooldown(0);
//   };

//   return (
//     <div className="auth-container">
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
//       <h1 className="auth-title">{mode === 'signup' ? 'Think & Deliver Sign Up' : 'Think & Deliver Login'}</h1>
//       <form onSubmit={handleAuth} className="auth-form">
//         {mode === 'signup' && (
//           <input
//             type="text"
//             placeholder="Full Name"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//             disabled={loading}
//             required
//             className="auth-input"
//             aria-label="Full Name"
//           />
//         )}
//         <div className="phone-input-wrapper">
//           <span className="phone-prefix">+91</span>
//           <input
//             type="tel"
//             placeholder="9876543210"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
//             disabled={loading || otpSent}
//             required
//             className="auth-input phone-input"
//             aria-label="Phone Number"
//           />
//         </div>
//         {!otpSent ? (
//           <button
//             onClick={sendOtp}
//             disabled={loading}
//             className="otp-btn"
//             aria-label="Send OTP"
//           >
//             {loading ? (
//               <span className="loading-spinner">Sending...</span>
//             ) : (
//               'Send OTP'
//             )}
//           </button>
//         ) : (
//           <>
//             <input
//               type="text"
//               placeholder="Enter OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
//               disabled={loading}
//               required
//               className="auth-input"
//               aria-label="OTP Code"
//             />
//             <button
//               type="submit"
//               disabled={loading}
//               className="auth-button"
//               aria-label={mode === 'signup' ? 'Sign Up with OTP' : 'Login with OTP'}
//             >
//               {loading ? (
//                 <span className="loading-spinner">Processing...</span>
//               ) : mode === 'signup' ? (
//                 'Sign Up'
//               ) : (
//                 'Login'
//               )}
//             </button>
//             <button
//               onClick={sendOtp}
//               disabled={loading || resendCooldown > 0}
//               className="otp-btn resend-btn"
//               aria-label="Resend OTP"
//             >
//               {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
//             </button>
//           </>
//         )}
//       </form>
//       <img
//         src={icon}
//         alt="Think & Deliver Logo"
//         className="auth-icon"
//       />
//       <button
//         onClick={handleModeToggle}
//         disabled={loading}
//         className="auth-toggle"
//         aria-label={mode === 'signup' ? 'Switch to Login' : 'Switch to Sign Up'}
//       >
//         {mode === 'signup' ? 'Have an account? Login' : 'Need an account? Sign Up'}
//       </button>
//       <div className="auth-footer">
//         <Link to="/policy" className="footer-link" aria-label="View Policies">
//           Policies
//         </Link>
//         <Link to="/privacy" className="footer-link" aria-label="View Privacy Policy">
//           Privacy Policy
//         </Link>
//       </div>
//       <Link to="/" className="back-link" aria-label="Back to Home">
//         Back to Home
//       </Link>
//     </div>
//   );
// }


// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import icon from '../assets/icon.png';
// import '../style/Auth.css';

// export default function Auth() {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState('signup'); // Default to signup
//   const [fullName, setFullName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [resendCooldown, setResendCooldown] = useState(0);

//   // Redirect if already authenticated and subscribe to auth events
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session) navigate('/account', { replace: true });
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
//       if (event === 'SIGNED_IN') navigate('/account', { replace: true });
//       if (event === 'SIGNED_OUT') navigate('/auth', { replace: true });
//     });

//     return () => subscription.unsubscribe();
//   }, [navigate]);

//   // Handle resend OTP cooldown
//   useEffect(() => {
//     if (resendCooldown > 0) {
//       const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [resendCooldown]);

//   // Send OTP
//   const sendOtp = useCallback(async () => {
//     if (!/^[0-9]{10}$/.test(phone)) {
//       toast.error('Enter a valid 10-digit phone number (e.g., 9876543210)', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
//       if (error) throw error;
//       setOtpSent(true);
//       setResendCooldown(30); // 30-second cooldown for resend
//       toast.success('OTP sent to your phone. Please check.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#2ecc71',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } catch (err) {
//       toast.error('Failed to send OTP. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [phone]);

//   // Verify OTP and handle auth
//   const handleAuth = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     if (!otpSent || !otp) {
//       toast.error('Please request and enter the OTP.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (mode === 'signup' && !fullName.trim()) {
//       toast.error('Full name is required for sign-up.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       if (mode === 'login') {
//         // Check if user exists
//         const { data: profile, error: profileError } = await supabase
//           .from('profiles')
//           .select('id')
//           .eq('phone_number', phone)
//           .maybeSingle();
//         if (profileError) throw profileError;
//         if (!profile) {
//           toast.error('This phone number is not registered. Please sign up first.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ef4444',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           setMode('signup');
//           setOtp('');
//           setOtpSent(false);
//           setResendCooldown(0);
//           return;
//         }
//       }

//       const { data: { user }, error } = await supabase.auth.verifyOtp({
//         phone: fullPhone,
//         token: otp,
//         type: 'sms',
//       });
//       if (error) throw error;

//       if (mode === 'signup') {
//         // Sign up and update profile
//         await supabase.from('profiles').upsert({
//           id: user.id,
//           full_name: fullName.trim(),
//           phone_number: phone, // Store only the 10-digit number
//         });
//         toast.success('Sign-up successful. You are now logged in.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#2ecc71',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       } else {
//         toast.success('Login successful.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#2ecc71',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       }
//     } catch (err) {
//       toast.error('Invalid OTP or authentication failed. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset form fields on mode toggle
//   const handleModeToggle = () => {
//     setMode(mode === 'signup' ? 'login' : 'signup');
//     setFullName('');
//     setPhone('');
//     setOtp('');
//     setOtpSent(false);
//     setResendCooldown(0);
//   };

//   return (
//     <div className="auth-container">
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
//       <h1 className="auth-title">{mode === 'signup' ? 'Think & Deliver Sign Up' : 'Think & Deliver Login'}</h1>
//       <form onSubmit={handleAuth} className="auth-form">
//         {mode === 'signup' && (
//           <input
//             type="text"
//             placeholder="Full Name"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//             disabled={loading}
//             required
//             className="auth-input"
//             aria-label="Full Name"
//           />
//         )}
//         <div className="phone-input-wrapper">
//           <span className="phone-prefix">+91</span>
//           <input
//             type="tel"
//             placeholder="9876543210"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
//             disabled={loading || otpSent}
//             required
//             className="auth-input phone-input"
//             aria-label="Phone Number"
//           />
//         </div>
//         {!otpSent ? (
//           <button
//             onClick={sendOtp}
//             disabled={loading}
//             className="otp-btn"
//             aria-label="Send OTP"
//           >
//             {loading ? (
//               <span className="loading-spinner">Sending...</span>
//             ) : (
//               'Send OTP'
//             )}
//           </button>
//         ) : (
//           <>
//             <input
//               type="text"
//               placeholder="Enter OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
//               disabled={loading}
//               required
//               className="auth-input"
//               aria-label="OTP Code"
//             />
//             <button
//               type="submit"
//               disabled={loading}
//               className="auth-button"
//               aria-label={mode === 'signup' ? 'Sign Up with OTP' : 'Login with OTP'}
//             >
//               {loading ? (
//                 <span className="loading-spinner">Processing...</span>
//               ) : mode === 'signup' ? (
//                 'Sign Up'
//               ) : (
//                 'Login'
//               )}
//             </button>
//             <button
//               onClick={sendOtp}
//               disabled={loading || resendCooldown > 0}
//               className="otp-btn resend-btn"
//               aria-label="Resend OTP"
//             >
//               {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
//             </button>
//           </>
//         )}
//       </form>
//       <img
//         src={icon}
//         alt="Think & Deliver Logo"
//         className="auth-icon"
//       />
//       <button
//         onClick={handleModeToggle}
//         disabled={loading}
//         className="auth-toggle"
//         aria-label={mode === 'signup' ? 'Switch to Login' : 'Switch to Sign Up'}
//       >
//         {mode === 'signup' ? 'Have an account? Login' : 'Need an account? Sign Up'}
//       </button>
//       <div className="auth-footer">
//         <Link to="/policy" className="footer-link" aria-label="View Policies">
//           Policies
//         </Link>
//         <Link to="/privacy" className="footer-link" aria-label="View Privacy Policy">
//           Privacy Policy
//         </Link>
//       </div>
//       <Link to="/" className="back-link" aria-label="Back to Home">
//         Back to Home
//       </Link>
//     </div>
//   );
// }



// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import icon from '../assets/icon.png';
// import '../style/Auth.css';

// export default function Auth() {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState('signup'); // Default to signup
//   const [fullName, setFullName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [resendCooldown, setResendCooldown] = useState(0);

//   // Redirect if already authenticated and subscribe to auth events
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session) navigate('/', { replace: true });
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
//       if (event === 'SIGNED_IN') navigate('/', { replace: true });
//       if (event === 'SIGNED_OUT') navigate('/auth', { replace: true });
//     });

//     return () => subscription.unsubscribe();
//   }, [navigate]);

//   // Handle resend OTP cooldown
//   useEffect(() => {
//     if (resendCooldown > 0) {
//       const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [resendCooldown]);

//   // Send OTP
//   const sendOtp = useCallback(async () => {
//     if (!/^[0-9]{10}$/.test(phone)) {
//       toast.error('Enter a valid 10-digit phone number (e.g., 9876543210)', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
//       if (error) throw error;
//       setOtpSent(true);
//       setResendCooldown(30); // 30-second cooldown for resend
//       toast.success('OTP sent to your phone. Please check.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#2ecc71',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } catch (err) {
//       toast.error('Failed to send OTP. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [phone]);

//   // Verify OTP and handle auth
//   const handleAuth = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     if (!otpSent || !otp) {
//       toast.error('Please request and enter the OTP.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (mode === 'signup' && !fullName.trim()) {
//       toast.error('Full name is required for sign-up.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       if (mode === 'login') {
//         // Check if user exists
//         const { data: profile, error: profileError } = await supabase
//           .from('profiles')
//           .select('id')
//           .eq('phone_number', phone)
//           .maybeSingle();
//         if (profileError) throw profileError;
//         if (!profile) {
//           toast.error('This phone number is not registered. Please sign up first.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ef4444',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           setMode('signup');
//           setOtp('');
//           setOtpSent(false);
//           setResendCooldown(0);
//           return;
//         }
//       }

//       const { data: { user }, error } = await supabase.auth.verifyOtp({
//         phone: fullPhone,
//         token: otp,
//         type: 'sms',
//       });
//       if (error) throw error;

//       if (mode === 'signup') {
//         // Sign up and update profile
//         await supabase.from('profiles').upsert({
//           id: user.id,
//           full_name: fullName.trim(),
//           phone_number: phone, // Store only the 10-digit number
//         });
//         toast.success('Sign-up successful. You are now logged in.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#2ecc71',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       } else {
//         toast.success('Login successful.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#2ecc71',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//       }

//       // Redirect to home page after successful auth
//       navigate('/', { replace: true });
//     } catch (err) {
//       toast.error('Invalid OTP or authentication failed. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset form fields on mode toggle
//   const handleModeToggle = () => {
//     setMode(mode === 'signup' ? 'login' : 'signup');
//     setFullName('');
//     setPhone('');
//     setOtp('');
//     setOtpSent(false);
//     setResendCooldown(0);
//   };

//   return (
//     <div className="auth-container">
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
//       <h1 className="auth-title">{mode === 'signup' ? 'Think & Deliver Sign Up' : 'Think & Deliver Login'}</h1>
//       <form onSubmit={handleAuth} className="auth-form">
//         {mode === 'signup' && (
//           <input
//             type="text"
//             placeholder="Full Name"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//             disabled={loading}
//             required
//             className="auth-input"
//             aria-label="Full Name"
//           />
//         )}
//         <div className="phone-input-wrapper">
//           <span className="phone-prefix">+91</span>
//           <input
//             type="tel"
//             placeholder="9876543210"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
//             disabled={loading || otpSent}
//             required
//             className="auth-input phone-input"
//             aria-label="Phone Number"
//           />
//         </div>
//         {!otpSent ? (
//           <button
//             onClick={sendOtp}
//             disabled={loading}
//             className="otp-btn"
//             aria-label="Send OTP"
//           >
//             {loading ? (
//               <span className="loading-spinner">Sending...</span>
//             ) : (
//               'Send OTP'
//             )}
//           </button>
//         ) : (
//           <>
//             <input
//               type="text"
//               placeholder="Enter OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
//               disabled={loading}
//               required
//               className="auth-input"
//               aria-label="OTP Code"
//             />
//             <button
//               type="submit"
//               disabled={loading}
//               className="auth-button"
//               aria-label={mode === 'signup' ? 'Sign Up with OTP' : 'Login with OTP'}
//             >
//               {loading ? (
//                 <span className="loading-spinner">Processing...</span>
//               ) : mode === 'signup' ? (
//                 'Sign Up'
//               ) : (
//                 'Login'
//               )}
//             </button>
//             <button
//               onClick={sendOtp}
//               disabled={loading || resendCooldown > 0}
//               className="otp-btn resend-btn"
//               aria-label="Resend OTP"
//             >
//               {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
//             </button>
//           </>
//         )}
//       </form>
//       <img
//         src={icon}
//         alt="Think & Deliver Logo"
//         className="auth-icon"
//       />
//       <button
//         onClick={handleModeToggle}
//         disabled={loading}
//         className="auth-toggle"
//         aria-label={mode === 'signup' ? 'Switch to Login' : 'Switch to Sign Up'}
//       >
//         {mode === 'signup' ? 'Have an account? Login' : 'Need an account? Sign Up'}
//       </button>
//       <div className="auth-footer">
//         <Link to="/policy" className="footer-link" aria-label="View Policies">
//           Policies
//         </Link>
//         <Link to="/privacy" className="footer-link" aria-label="View Privacy Policy">
//           Privacy Policy
//         </Link>
//       </div>
//       <Link to="/" className="back-link" aria-label="Back to Home">
//         Back to Home
//       </Link>
//     </div>
//   );
// }

// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import icon from '../assets/icon.png';
// import '../style/Auth.css';

// export default function Auth() {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState('signup'); // signup, login, or forgot
//   const [fullName, setFullName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [resendCooldown, setResendCooldown] = useState(0);
//   const [phoneVerified, setPhoneVerified] = useState(false);

//   // Redirect if already authenticated and subscribe to auth events
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session) navigate('/', { replace: true });
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
//       if (event === 'SIGNED_IN') navigate('/', { replace: true });
//       if (event === 'SIGNED_OUT') navigate('/auth', { replace: true });
//     });

//     return () => subscription.unsubscribe();
//   }, [navigate]);

//   // Handle resend OTP cooldown
//   useEffect(() => {
//     if (resendCooldown > 0) {
//       const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [resendCooldown]);

//   // Send OTP
//   const sendOtp = useCallback(async () => {
//     if (!/^[0-9]{10}$/.test(phone)) {
//       toast.error('Enter a valid 10-digit phone number (e.g., 9876543210)', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
//       if (error) throw error;
//       setOtpSent(true);
//       setResendCooldown(30);
//       toast.success('OTP sent to your phone. Please check.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#2ecc71',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } catch (err) {
//       toast.error('Failed to send OTP. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [phone]);

//   // Verify OTP
//   const verifyOtp = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     if (!otpSent || !otp) {
//       toast.error('Please request and enter the OTP.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       const { error } = await supabase.auth.verifyOtp({
//         phone: fullPhone,
//         token: otp,
//         type: 'sms',
//       });
//       if (error) throw error;
//       setPhoneVerified(true);
//       setOtp('');
//       setOtpSent(false);
//       toast.success('Phone number verified successfully.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#2ecc71',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       // Automatically proceed to signup after OTP verification
//       if (mode === 'signup') {
//         await handleAuth();
//       }
//     } catch (err) {
//       toast.error('Invalid OTP. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle authentication (signup/login)
//   const handleAuth = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     setLoading(true);

//     try {
//       if (mode === 'signup') {
//         if (!fullName.trim()) {
//           throw new Error('Full name is required.');
//         }
//         if (!/^[0-9]{10}$/.test(phone)) {
//           throw new Error('Enter a valid 10-digit phone number.');
//         }
//         if (!phoneVerified) {
//           throw new Error('Please verify your phone number first.');
//         }
//         if (password.length < 6) {
//           throw new Error('Password must be at least 6 characters long.');
//         }
//         if (password !== confirmPassword) {
//           throw new Error('Passwords do not match.');
//         }

//         const fullPhone = `+91${phone}`;
//         const { data: { user }, error } = await supabase.auth.signUp({
//           phone: fullPhone,
//           password,
//         });
//         if (error) throw error;

//         await supabase.from('profiles').upsert({
//           id: user.id,
//           full_name: fullName.trim(),
//           phone_number: phone,
//         });

//         toast.success('Sign-up successful. You are now logged in.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#2ecc71',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         navigate('/', { replace: true });
//       } else if (mode === 'login') {
//         if (!/^[0-9]{10}$/.test(phone)) {
//           throw new Error('Enter a valid 10-digit phone number.');
//         }
//         if (!password) {
//           throw new Error('Password is required.');
//         }

//         const fullPhone = `+91${phone}`;
//         const { error } = await supabase.auth.signInWithPassword({
//           phone: fullPhone,
//           password,
//         });
//         if (error) throw error;

//         toast.success('Login successful.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#2ecc71',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         navigate('/', { replace: true });
//       }
//     } catch (err) {
//       toast.error(err.message || 'Authentication failed. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle password reset
//   const handlePasswordReset = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     if (!otpSent || !otp || !password || !confirmPassword) {
//       toast.error('Please enter OTP and new password.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (password.length < 6) {
//       toast.error('Password must be at least 6 characters long.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (password !== confirmPassword) {
//       toast.error('Passwords do not match.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }

//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
//         phone: fullPhone,
//         token: otp,
//         type: 'sms',
//       });
//       if (verifyError) throw verifyError;

//       if (!session) {
//         throw new Error('No active session found. Please try again.');
//       }

//       const { error: updateError } = await supabase.auth.updateUser({ password });
//       if (updateError) throw updateError;

//       toast.success('Password reset successful. Please login with your new password.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#2ecc71',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       setMode('login');
//       resetForm();
//     } catch (err) {
//       toast.error(err.message || 'Password reset failed. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset form fields
//   const resetForm = () => {
//     setFullName('');
//     setPhone('');
//     setPassword('');
//     setConfirmPassword('');
//     setOtp('');
//     setOtpSent(false);
//     setResendCooldown(0);
//     setPhoneVerified(false);
//   };

//   // Handle mode toggle
//   const handleModeToggle = (newMode) => {
//     setMode(newMode);
//     resetForm();
//   };

//   return (
//     <div className="auth-container">
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
//       <h1 className="auth-title">
//         {mode === 'signup' ? 'Think & Deliver Sign Up' : 
//          mode === 'login' ? 'Think & Deliver Login' : 'Reset Password'}
//       </h1>
//       <form onSubmit={mode === 'forgot' ? handlePasswordReset : (otpSent && mode === 'signup' ? verifyOtp : handleAuth)} className="auth-form">
//         {mode === 'signup' && (
//           <input
//             type="text"
//             placeholder="Full Name"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//             disabled={loading || phoneVerified}
//             required
//             className="auth-input"
//             aria-label="Full Name"
//           />
//         )}
//         <div className="phone-input-wrapper">
//           <span className="phone-prefix">+91</span>
//           <input
//             type="tel"
//             placeholder="9876543210"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
//             disabled={loading || (mode === 'signup' && phoneVerified) || (mode === 'forgot' && otpSent)}
//             required
//             className="auth-input phone-input"
//             aria-label="Phone Number"
//           />
//         </div>
//         {mode !== 'forgot' ? (
//           <>
//             {mode === 'signup' && !phoneVerified ? (
//               <>
//                 <input
//                   type="password"
//                   placeholder="Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   disabled={loading}
//                   required
//                   className="auth-input"
//                   aria-label="Password"
//                 />
//                 <input
//                   type="password"
//                   placeholder="Confirm Password"
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   disabled={loading}
//                   required
//                   className="auth-input"
//                   aria-label="Confirm Password"
//                 />
//                 {!otpSent ? (
//                   <button
//                     onClick={sendOtp}
//                     disabled={loading || !fullName.trim() || !password || password !== confirmPassword || password.length < 6}
//                     className="otp-btn"
//                     aria-label="Send OTP"
//                   >
//                     {loading ? (
//                       <span className="loading-spinner">Sending...</span>
//                     ) : (
//                       'Send OTP'
//                     )}
//                   </button>
//                 ) : (
//                   <>
//                     <input
//                       type="text"
//                       placeholder="Enter OTP"
//                       value={otp}
//                       onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
//                       disabled={loading}
//                       required
//                       className="auth-input"
//                       aria-label="OTP Code"
//                     />
//                     <button
//                       type="submit"
//                       disabled={loading}
//                       className="auth-button"
//                       aria-label="Verify OTP"
//                     >
//                       {loading ? (
//                         <span className="loading-spinner">Verifying...</span>
//                       ) : (
//                         'Verify OTP'
//                       )}
//                     </button>
//                     <button
//                       onClick={sendOtp}
//                       disabled={loading || resendCooldown > 0}
//                       className="otp-btn resend-btn"
//                       aria-label="Resend OTP"
//                     >
//                       {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
//                     </button>
//                   </>
//                 )}
//               </>
//             ) : (
//               <>
//                 <input
//                   type="password"
//                   placeholder="Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   disabled={loading}
//                   required
//                   className="auth-input"
//                   aria-label="Password"
//                 />
//                 {mode === 'signup' && (
//                   <input
//                     type="password"
//                     placeholder="Confirm Password"
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     disabled={loading}
//                     required
//                     className="auth-input"
//                     aria-label="Confirm Password"
//                   />
//                 )}
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="auth-button"
//                   aria-label={mode === 'signup' ? 'Sign Up' : 'Login'}
//                 >
//                   {loading ? (
//                     <span className="loading-spinner">Processing...</span>
//                   ) : mode === 'signup' ? (
//                     'Sign Up'
//                   ) : (
//                     'Login'
//                   )}
//                 </button>
//               </>
//             )}
//           </>
//         ) : (
//           <>
//             {!otpSent ? (
//               <button
//                 onClick={sendOtp}
//                 disabled={loading}
//                 className="otp-btn"
//                 aria-label="Send OTP"
//               >
//                 {loading ? (
//                   <span className="loading-spinner">Sending...</span>
//                 ) : (
//                   'Send OTP'
//                 )}
//               </button>
//             ) : (
//               <>
//                 <input
//                   type="text"
//                   placeholder="Enter OTP"
//                   value={otp}
//                   onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
//                   disabled={loading}
//                   required
//                   className="auth-input"
//                   aria-label="OTP Code"
//                 />
//                 <input
//                   type="password"
//                   placeholder="New Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   disabled={loading}
//                   required
//                   className="auth-input"
//                   aria-label="New Password"
//                 />
//                 <input
//                   type="password"
//                   placeholder="Confirm New Password"
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   disabled={loading}
//                   required
//                   className="auth-input"
//                   aria-label="Confirm New Password"
//                 />
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="auth-button"
//                   aria-label="Reset Password"
//                 >
//                   {loading ? (
//                     <span className="loading-spinner">Processing...</span>
//                   ) : (
//                     'Reset Password'
//                   )}
//                 </button>
//                 <button
//                   onClick={sendOtp}
//                   disabled={loading || resendCooldown > 0}
//                   className="otp-btn resend-btn"
//                   aria-label="Resend OTP"
//                 >
//                   {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
//                 </button>
//               </>
//             )}
//           </>
//         )}
//       </form>
//       <img
//         src={icon}
//         alt="Think & Deliver Logo"
//         className="auth-icon"
//       />
//       <div className="auth-toggle-buttons">
//         {mode !== 'signup' && (
//           <button
//             onClick={() => handleModeToggle('signup')}
//             disabled={loading}
//             className="auth-toggle"
//             aria-label="Switch to Sign Up"
//           >
//             Need an account? Sign Up
//           </button>
//         )}
//         {mode !== 'login' && (
//           <button
//             onClick={() => handleModeToggle('login')}
//             disabled={loading}
//             className="auth-toggle"
//             aria-label="Switch to Login"
//           >
//             Have an account? Login
//           </button>
//         )}
//         {mode !== 'forgot' && (
//           <button
//             onClick={() => handleModeToggle('forgot')}
//             disabled={loading}
//             className="auth-toggle"
//             aria-label="Forgot Password"
//           >
//             Forgot Password?
//           </button>
//         )}
//       </div>
//       <div className="auth-footer">
//         <Link to="/policy" className="footer-link" aria-label="View Policies">
//           Policies
//         </Link>
//         <Link to="/privacy" className="footer-link" aria-label="View Privacy Policy">
//           Privacy Policy
//         </Link>
//       </div>
//       <Link to="/" className="back-link" aria-label="Back to Home">
//         Back to Home
//       </Link>
//     </div>
//   );
// }

// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import icon from '../assets/icon.png';
// import '../style/Auth.css';

// export default function Auth() {
//   const navigate = useNavigate();
//   const [mode, setMode] = useState('signup'); // signup, login, forgot, or edit
//   const [fullName, setFullName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [resendCooldown, setResendCooldown] = useState(0);
//   const [phoneVerified, setPhoneVerified] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   // Redirect if already authenticated and load profile in edit mode
//   useEffect(() => {
//     const fetchSession = async () => {
//       const { data: { session }, error } = await supabase.auth.getSession();
//       if (error) {
//         console.error('Session fetch error:', error);
//         toast.error('Failed to fetch session. Please try again.');
//         return;
//       }
//       if (session) {
//         if (mode === 'edit') {
//           const { data, error } = await supabase.from('profiles').select('full_name, phone_number').eq('id', session.user.id).single();
//           if (error) {
//             console.error('Profile fetch error:', error);
//             toast.error('Failed to load profile. Please try again.');
//             return;
//           }
//           setFullName(data.full_name || '');
//           setPhone(data.phone_number || '');
//         } else {
//           navigate('/', { replace: true });
//         }
//       }
//     };
//     fetchSession();

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
//       if (event === 'SIGNED_IN' && mode !== 'edit') {
//         navigate('/', { replace: true });
//       }
//       if (event === 'SIGNED_OUT') {
//         navigate('/auth', { replace: true });
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, [navigate, mode]);

//   // Handle resend OTP cooldown
//   useEffect(() => {
//     if (resendCooldown > 0) {
//       const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [resendCooldown]);

//   // Send OTP
//   const sendOtp = useCallback(async () => {
//     if (!/^[0-9]{10}$/.test(phone)) {
//       toast.error('Please enter a valid 10-digit phone number (e.g., 9876543210).', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (mode === 'signup' && (!fullName.trim() || fullName.trim().toLowerCase() === 'user' || fullName.trim().length < 2)) {
//       toast.error('Please enter a valid full name (minimum 2 characters, not "User").', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (mode === 'signup' && (password.length < 6 || password !== confirmPassword)) {
//       toast.error('Passwords must be at least 6 characters and match.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       console.log('Sending OTP to phone:', fullPhone);
//       const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
//       if (error) {
//         console.error('OTP send error:', error);
//         if (error.message.includes('already registered')) {
//           toast.error('This phone number is already registered. Please log in or use a different number.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ef4444',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//         }
//         throw error;
//       }
//       setOtpSent(true);
//       setResendCooldown(30);
//       toast.success('OTP sent to your phone. Please check.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#2ecc71',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } catch (err) {
//       console.error('OTP send error:', err);
//       toast.error(err.message || 'Failed to send OTP. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [phone, fullName, password, confirmPassword, mode]);

//   // Verify OTP
//   const verifyOtp = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     if (!otpSent || !otp) {
//       toast.error('Please request and enter the OTP.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       console.log('Verifying OTP for phone:', fullPhone, 'with OTP:', otp);
//       const { error } = await supabase.auth.verifyOtp({
//         phone: fullPhone,
//         token: otp,
//         type: 'sms',
//       });
//       if (error) {
//         console.error('OTP verify error:', error);
//         throw error;
//       }
//       setPhoneVerified(true);
//       setOtp('');
//       setOtpSent(false);
//       toast.success('Phone number verified successfully.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#2ecc71',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       if (mode === 'signup') {
//         await handleAuth();
//       }
//     } catch (err) {
//       console.error('OTP verify error:', err);
//       toast.error(err.message || 'Invalid OTP. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle authentication (signup/login)
//   const handleAuth = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     console.log('Signup attempt with fullName:', fullName, 'phone:', phone, 'password length:', password.length);
//     if (!fullName.trim()) {
//       toast.error('Full name is required.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);

//     try {
//       if (mode === 'signup') {
//         if (!fullName.trim() || fullName.trim().toLowerCase() === 'user' || fullName.trim().length < 2) {
//           throw new Error('Please enter a valid full name (minimum 2 characters, not "User").');
//         }
//         if (!/^[0-9]{10}$/.test(phone)) {
//           throw new Error('Please enter a valid 10-digit phone number.');
//         }
//         if (!phoneVerified) {
//           throw new Error('Please verify your phone number first.');
//         }
//         if (password.length < 6) {
//           throw new Error('Password must be at least 6 characters long.');
//         }
//         if (password !== confirmPassword) {
//           throw new Error('Passwords do not match.');
//         }

//         const fullPhone = `+91${phone}`;
//         console.log('Attempting signup with phone:', fullPhone);
//         const { data: { user }, error } = await supabase.auth.signUp({
//           phone: fullPhone,
//           password,
//         });
//         if (error) {
//           console.error('Signup error:', error);
//           if (error.message.includes('already registered')) {
//             throw new Error('This phone number is already registered. Please log in or use a different number.');
//           }
//           throw error;
//         }

//         const { error: profileError } = await supabase.from('profiles').upsert({
//           id: user.id,
//           full_name: fullName.trim(),
//           phone_number: phone,
//           is_seller: false,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         });
//         if (profileError) {
//           console.error('Profile upsert error:', profileError);
//           throw profileError;
//         }

//         // Verify the saved profile
//         const { data: profile, error: fetchError } = await supabase.from('profiles').select('full_name, phone_number').eq('id', user.id).single();
//         if (fetchError) {
//           console.error('Profile fetch error:', fetchError);
//           throw fetchError;
//         }
//         console.log('Saved profile:', profile);
//         if (!profile || !profile.full_name || profile.full_name.toLowerCase() === 'user' || !profile.phone_number) {
//           toast.warn('Please complete your profile details.', {
//             duration: 5000,
//             position: 'top-center',
//             style: {
//               background: '#f1c40f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           setMode('edit');
//         } else {
//           toast.success('Sign-up successful. You are now logged in.', {
//             duration: 3000,
//             position: 'top-center',
//             style: {
//               background: '#2ecc71',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//             },
//           });
//           navigate('/', { replace: true });
//         }
//       } else if (mode === 'login') {
//         if (!/^[0-9]{10}$/.test(phone)) {
//           throw new Error('Please enter a valid 10-digit phone number.');
//         }
//         if (!password) {
//           throw new Error('Password is required.');
//         }

//         const fullPhone = `+91${phone}`;
//         console.log('Attempting login with phone:', fullPhone);
//         const { error } = await supabase.auth.signInWithPassword({
//           phone: fullPhone,
//           password,
//         });
//         if (error) {
//           console.error('Login error:', error);
//           throw error;
//         }

//         toast.success('Login successful.', {
//           duration: 3000,
//           position: 'top-center',
//           style: {
//             background: '#2ecc71',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//           },
//         });
//         navigate('/', { replace: true });
//       }
//     } catch (err) {
//       console.error('Auth error:', err);
//       toast.error(err.message || 'Authentication failed. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle profile update
//   const handleProfileUpdate = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     if (!fullName.trim() || fullName.trim().toLowerCase() === 'user' || fullName.trim().length < 2) {
//       toast.error('Please enter a valid full name (minimum 2 characters, not "User").', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (!/^[0-9]{10}$/.test(phone)) {
//       toast.error('Please enter a valid 10-digit phone number (e.g., 9876543210).', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     setLoading(true);
//     try {
//       const { data: { user }, error: userError } = await supabase.auth.getUser();
//       if (userError) {
//         console.error('User fetch error:', userError);
//         throw userError;
//       }
//       const { error } = await supabase.from('profiles').upsert({
//         id: user.id,
//         full_name: fullName.trim(),
//         phone_number: phone,
//         is_seller: false,
//         updated_at: new Date().toISOString(),
//       });
//       if (error) {
//         console.error('Profile update error:', error);
//         throw error;
//       }
//       toast.success('Profile updated successfully.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#2ecc71',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       navigate('/', { replace: true });
//     } catch (err) {
//       console.error('Profile update error:', err);
//       toast.error(err.message || 'Failed to update profile. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle password reset
//   const handlePasswordReset = async (e) => {
//     if (e?.preventDefault) e.preventDefault();
//     if (!otpSent || !otp || !password || !confirmPassword) {
//       toast.error('Please enter OTP and new password.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (password.length < 6) {
//       toast.error('Password must be at least 6 characters long.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (password !== confirmPassword) {
//       toast.error('Passwords do not match.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }

//     setLoading(true);
//     try {
//       const fullPhone = `+91${phone}`;
//       console.log('Resetting password for phone:', fullPhone);
//       const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
//         phone: fullPhone,
//         token: otp,
//         type: 'sms',
//       });
//       if (verifyError) {
//         console.error('OTP verify error:', verifyError);
//         throw verifyError;
//       }

//       if (!session) {
//         throw new Error('No active session found. Please try again.');
//       }

//       const { error: updateError } = await supabase.auth.updateUser({ password });
//       if (updateError) {
//         console.error('Password update error:', updateError);
//         throw updateError;
//       }

//       // Update phone_number in profiles table if not already set
//       const { data: profile, error: profileFetchError } = await supabase.from('profiles').select('phone_number').eq('id', session.user.id).single();
//       if (profileFetchError) {
//         console.error('Profile fetch error:', profileFetchError);
//         throw profileFetchError;
//       }
//       if (!profile || !profile.phone_number) {
//         const { error: profileError } = await supabase.from('profiles').upsert({
//           id: session.user.id,
//           phone_number: phone,
//           is_seller: false,
//           updated_at: new Date().toISOString(),
//         });
//         if (profileError) {
//           console.error('Profile upsert error:', profileError);
//           throw profileError;
//         }
//       }

//       toast.success('Password reset successful. Please login with your new password.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#2ecc71',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//       setMode('login');
//       resetForm();
//     } catch (err) {
//       console.error('Password reset error:', err);
//       toast.error(err.message || 'Password reset failed. Please try again.', {
//         duration: 3000,
//         position: 'top-center',
//         style: {
//           background: '#ef4444',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset form fields
//   const resetForm = () => {
//     setFullName('');
//     setPhone('');
//     setPassword('');
//     setConfirmPassword('');
//     setOtp('');
//     setOtpSent(false);
//     setResendCooldown(0);
//     setPhoneVerified(false);
//     setShowPassword(false);
//     setShowConfirmPassword(false);
//   };

//   // Handle mode toggle
//   const handleModeToggle = (newMode) => {
//     setMode(newMode);
//     resetForm();
//   };

//   return (
//     <div className="auth-container">
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
//       <h1 className="auth-title">
//         {mode === 'signup' ? 'Think & Deliver Sign Up' : 
//          mode === 'login' ? 'Think & Deliver Login' : 
//          mode === 'forgot' ? 'Reset Password' : 'Update Profile'}
//       </h1>
//       <form 
//         onSubmit={
//           mode === 'forgot' ? handlePasswordReset : 
//           mode === 'edit' ? handleProfileUpdate : 
//           (otpSent && mode === 'signup' ? verifyOtp : handleAuth)
//         } 
//         className="auth-form"
//       >
//         {(mode === 'signup' || mode === 'edit') && (
//           <div className="input-wrapper">
//             <input
//               type="text"
//               placeholder="Enter your full name (e.g., Suraj Kumar)"
//               value={fullName}
//               onChange={(e) => {
//                 console.log('Full name input:', e.target.value);
//                 setFullName(e.target.value);
//               }}
//               disabled={loading || (mode === 'signup' && phoneVerified)}
//               required
//               minLength={2}
//               pattern="^(?!User$|user$).*$"
//               title="Full name cannot be 'User' and must be at least 2 characters."
//               className="auth-input"
//               aria-label="Full Name"
//             />
//           </div>
//         )}
//         <div className="input-wrapper phone-input-wrapper">
//           <span className="phone-prefix">+91</span>
//           <input
//             type="tel"
//             placeholder="9876543210"
//             value={phone}
//             onChange={(e) => {
//               console.log('Phone input:', e.target.value);
//               setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10));
//             }}
//             disabled={loading || (mode === 'signup' && phoneVerified) || (mode === 'forgot' && otpSent)}
//             required
//             pattern="[0-9]{10}"
//             title="Enter a valid 10-digit phone number"
//             className="auth-input phone-input"
//             aria-label="Phone Number"
//           />
//         </div>
//         {mode !== 'edit' ? (
//           <>
//             {mode !== 'forgot' ? (
//               <>
//                 {mode === 'signup' && !phoneVerified ? (
//                   <>
//                     <div className="input-wrapper password-input-wrapper">
//                       <input
//                         type={showPassword ? 'text' : 'password'}
//                         placeholder="Password (minimum 6 characters)"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         disabled={loading}
//                         required
//                         minLength={6}
//                         className="auth-input"
//                         aria-label="Password"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="password-toggle"
//                         aria-label={showPassword ? 'Hide password' : 'Show password'}
//                       >
//                         {showPassword ? '🙈' : '👁️'}
//                       </button>
//                     </div>
//                     <div className="input-wrapper password-input-wrapper">
//                       <input
//                         type={showConfirmPassword ? 'text' : 'password'}
//                         placeholder="Confirm Password"
//                         value={confirmPassword}
//                         onChange={(e) => setConfirmPassword(e.target.value)}
//                         disabled={loading}
//                         required
//                         minLength={6}
//                         className="auth-input"
//                         aria-label="Confirm Password"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                         className="password-toggle"
//                         aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
//                       >
//                         {showConfirmPassword ? '🙈' : '👁️'}
//                       </button>
//                     </div>
//                     {!otpSent ? (
//                       <button
//                         onClick={sendOtp}
//                         disabled={
//                           loading ||
//                           (mode === 'signup' && (!fullName.trim() || fullName.trim().toLowerCase() === 'user' || fullName.trim().length < 2)) ||
//                           (mode === 'signup' && (!password || password !== confirmPassword || password.length < 6)) ||
//                           !/^[0-9]{10}$/.test(phone)
//                         }
//                         className="otp-btn"
//                         aria-label="Send OTP"
//                       >
//                         {loading ? (
//                           <span className="loading-spinner">Sending...</span>
//                         ) : (
//                           'Send OTP'
//                         )}
//                       </button>
//                     ) : (
//                       <>
//                         <div className="input-wrapper">
//                           <input
//                             type="text"
//                             placeholder="Enter OTP"
//                             value={otp}
//                             onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
//                             disabled={loading}
//                             required
//                             className="auth-input"
//                             aria-label="OTP Code"
//                           />
//                         </div>
//                         <button
//                           type="submit"
//                           disabled={loading}
//                           className="auth-button"
//                           aria-label="Verify OTP"
//                         >
//                           {loading ? (
//                             <span className="loading-spinner">Verifying...</span>
//                           ) : (
//                             'Verify OTP'
//                           )}
//                         </button>
//                         <button
//                           onClick={sendOtp}
//                           disabled={loading || resendCooldown > 0}
//                           className="otp-btn resend-btn"
//                           aria-label="Resend OTP"
//                         >
//                           {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
//                         </button>
//                       </>
//                     )}
//                   </>
//                 ) : (
//                   <>
//                     <div className="input-wrapper password-input-wrapper">
//                       <input
//                         type={showPassword ? 'text' : 'password'}
//                         placeholder="Password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         disabled={loading}
//                         required
//                         minLength={6}
//                         className="auth-input"
//                         aria-label="Password"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="password-toggle"
//                         aria-label={showPassword ? 'Hide password' : 'Show password'}
//                       >
//                         {showPassword ? '🙈' : '👁️'}
//                       </button>
//                     </div>
//                     {mode === 'signup' && (
//                       <div className="input-wrapper password-input-wrapper">
//                         <input
//                           type={showConfirmPassword ? 'text' : 'password'}
//                           placeholder="Confirm Password"
//                           value={confirmPassword}
//                           onChange={(e) => setConfirmPassword(e.target.value)}
//                           disabled={loading}
//                           required
//                           minLength={6}
//                           className="auth-input"
//                           aria-label="Confirm Password"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                           className="password-toggle"
//                           aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
//                         >
//                           {showConfirmPassword ? '🙈' : '👁️'}
//                         </button>
//                       </div>
//                     )}
//                     <button
//                       type="submit"
//                       disabled={loading}
//                       className="auth-button"
//                       aria-label={mode === 'signup' ? 'Sign Up' : 'Login'}
//                     >
//                       {loading ? (
//                         <span className="loading-spinner">Processing...</span>
//                       ) : mode === 'signup' ? (
//                         'Sign Up'
//                       ) : (
//                         'Login'
//                       )}
//                     </button>
//                   </>
//                 )}
//               </>
//             ) : (
//               <>
//                 {!otpSent ? (
//                   <button
//                     onClick={sendOtp}
//                     disabled={loading || !/^[0-9]{10}$/.test(phone)}
//                     className="otp-btn"
//                     aria-label="Send OTP"
//                   >
//                     {loading ? (
//                       <span className="loading-spinner">Sending...</span>
//                     ) : (
//                       'Send OTP'
//                     )}
//                   </button>
//                 ) : (
//                   <>
//                     <div className="input-wrapper">
//                       <input
//                         type="text"
//                         placeholder="Enter OTP"
//                         value={otp}
//                         onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
//                         disabled={loading}
//                         required
//                         className="auth-input"
//                         aria-label="OTP Code"
//                       />
//                     </div>
//                     <div className="input-wrapper password-input-wrapper">
//                       <input
//                         type={showPassword ? 'text' : 'password'}
//                         placeholder="New Password (minimum 6 characters)"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         disabled={loading}
//                         required
//                         minLength={6}
//                         className="auth-input"
//                         aria-label="New Password"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="password-toggle"
//                         aria-label={showPassword ? 'Hide new password' : 'Show new password'}
//                       >
//                         {showPassword ? '🙈' : '👁️'}
//                       </button>
//                     </div>
//                     <div className="input-wrapper password-input-wrapper">
//                       <input
//                         type={showConfirmPassword ? 'text' : 'password'}
//                         placeholder="Confirm New Password"
//                         value={confirmPassword}
//                         onChange={(e) => setConfirmPassword(e.target.value)}
//                         disabled={loading}
//                         required
//                         minLength={6}
//                         className="auth-input"
//                         aria-label="Confirm New Password"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                         className="password-toggle"
//                         aria-label={showConfirmPassword ? 'Hide confirm new password' : 'Show confirm new password'}
//                       >
//                         {showConfirmPassword ? '🙈' : '👁️'}
//                       </button>
//                     </div>
//                     <button
//                       type="submit"
//                       disabled={loading}
//                       className="auth-button"
//                       aria-label="Reset Password"
//                     >
//                       {loading ? (
//                         <span className="loading-spinner">Processing...</span>
//                       ) : (
//                         'Reset Password'
//                       )}
//                     </button>
//                     <button
//                       onClick={sendOtp}
//                       disabled={loading || resendCooldown > 0}
//                       className="otp-btn resend-btn"
//                       aria-label="Resend OTP"
//                     >
//                       {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
//                     </button>
//                   </>
//                 )}
//               </>
//             )}
//           </>
//         ) : (
//           <button
//             type="submit"
//             disabled={loading}
//             className="auth-button"
//             aria-label="Update Profile"
//           >
//             {loading ? (
//               <span className="loading-spinner">Updating...</span>
//             ) : (
//               'Update Profile'
//             )}
//           </button>
//         )}
//       </form>
//       <img
//         src={icon}
//         alt="Think & Deliver Logo"
//         className="auth-icon"
//       />
//       <div className="auth-toggle-buttons">
//         {mode !== 'signup' && mode !== 'edit' && (
//           <button
//             onClick={() => handleModeToggle('signup')}
//             disabled={loading}
//             className="auth-toggle"
//             aria-label="Switch to Sign Up"
//           >
//             Need an account? Sign Up
//           </button>
//         )}
//         {mode !== 'login' && mode !== 'edit' && (
//           <button
//             onClick={() => handleModeToggle('login')}
//             disabled={loading}
//             className="auth-toggle"
//             aria-label="Switch to Login"
//           >
//             Have an account? Login
//           </button>
//         )}
//         {mode !== 'forgot' && mode !== 'edit' && (
//           <button
//             onClick={() => handleModeToggle('forgot')}
//             disabled={loading}
//             className="auth-toggle"
//             aria-label="Forgot Password"
//           >
//             Forgot Password?
//           </button>
//         )}
//         {mode === 'edit' && (
//           <button
//             onClick={() => navigate('/', { replace: true })}
//             disabled={loading}
//             className="auth-toggle"
//             aria-label="Back to Home"
//           >
//             Back to Home
//           </button>
//         )}
//       </div>
//       <div className="auth-footer">
//         <Link to="/policy" className="footer-link" aria-label="View Policies">
//           Policies
//         </Link>
//         <Link to="/privacy" className="footer-link" aria-label="View Privacy Policy">
//           Privacy Policy
//         </Link>
//       </div>
//       <Link to="/" className="back-link" aria-label="Back to Home">
//         Back to Home
//       </Link>
//     </div>
//   );
// }


// import React, { useState, useEffect, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/Auth.css';

// const INDIAN_PHONE = /^\+91\d{10}$/;
// const MIN_NAME_LENGTH = 2;
// const MIN_PASSWORD_LENGTH = 6;

// export default function Auth() {
//   const nav = useNavigate();

//   /* State */
//   const [mode, setMode] = useState('login'); // login | signup | forgot | edit
//   const [fullName, setFullName] = useState('');
//   const [phone, setPhone] = useState('+91');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPwd] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [otpVerified, setOtpVerified] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [cooldown, setCooldown] = useState(0);
//   const [showPwd, setShowPwd] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   /* Helpers */
//   const resetUI = () => {
//     setOtp('');
//     setOtpSent(false);
//     setOtpVerified(false);
//     setCooldown(0);
//   };

//   const switchMode = (m) => {
//     setMode(m);
//     setPassword('');
//     setConfirmPwd('');
//     setFullName('');
//     setPhone('+91');
//     resetUI();
//   };

//   const validPhone = (p) => INDIAN_PHONE.test(p);
//   const validName = (n) =>
//     n.trim() &&
//     n.trim().toLowerCase() !== 'user' &&
//     n.trim().length >= MIN_NAME_LENGTH;

//   const showError = (message) =>
//     toast.error(message, {
//       duration: 3000,
//       position: 'top-center',
//       style: {
//         background: '#ef4444',
//         color: '#fff',
//         fontWeight: 'bold',
//         borderRadius: '8px',
//         padding: '16px',
//         boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//       },
//     });

//   const showSuccess = (message) =>
//     toast.success(message, {
//       duration: 3000,
//       position: 'top-center',
//       style: {
//         background: '#2ecc71',
//         color: '#fff',
//         fontWeight: 'bold',
//         borderRadius: '8px',
//         padding: '16px',
//         boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
//       },
//     });

//   /* Supabase Session Watch */
//   useEffect(() => {
//     const fetchSession = async () => {
//       const { data: { session }, error } = await supabase.auth.getSession();
//       if (error) {
//         console.error('Session fetch error:', error);
//         showError('Failed to fetch session. Please try again.');
//         return;
//       }
//       if (session) {
//         if (mode === 'edit') {
//           const { data, error } = await supabase
//             .from('profiles')
//             .select('full_name, phone_number')
//             .eq('id', session.user.id)
//             .single();
//           if (error) {
//             console.error('Profile fetch error:', error);
//             showError('Failed to load profile. Please try again.');
//             return;
//           }
//           setFullName(data.full_name || '');
//           setPhone(data.phone_number || '+91');
//         } else {
//           nav('/account', { replace: true });
//         }
//       }
//     };
//     fetchSession();

//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       (event, sess) => {
//         if (event === 'SIGNED_IN' && mode !== 'edit') {
//           nav('/account', { replace: true });
//         }
//         if (event === 'SIGNED_OUT') {
//           nav('/auth', { replace: true });
//         }
//       }
//     );
//     return () => subscription.unsubscribe();
//   }, [nav, mode]);

//   /* Resend Timer */
//   useEffect(() => {
//     if (cooldown === 0) return;
//     const id = setTimeout(() => setCooldown(cooldown - 1), 1000);
//     return () => clearTimeout(id);
//   }, [cooldown]);

//   /* DB Util */
//   const phoneExists = useCallback(async (ph) => {
//     const { data, error } = await supabase
//       .from('profiles')
//       .select('id')
//       .eq('phone_number', ph)
//       .maybeSingle();
//     if (error && error.code !== 'PGRST116') {
//       console.error('Phone check error:', error);
//       throw new Error('Database error while checking phone');
//     }
//     return !!data;
//   }, []);

//   /* OTP Handlers */
//   const sendOtp = useCallback(async () => {
//     if (!validPhone(phone)) {
//       showError('Enter a valid +91 phone number (e.g., +919876543210)');
//       return;
//     }
//     if (cooldown) {
//       showError(`Please wait ${cooldown}s to resend OTP`);
//       return;
//     }
//     if (mode === 'signup') {
//       if (!validName(fullName)) {
//         showError('Full name must be at least 2 characters and not "User"');
//         return;
//       }
//       if (password.length < MIN_PASSWORD_LENGTH) {
//         showError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
//         return;
//       }
//       if (password !== confirmPassword) {
//         showError('Passwords do not match');
//         return;
//       }
//     }
//     setLoading(true);
//     try {
//       const { error } = await supabase.auth.signInWithOtp({
//         phone,
//         options: { data: mode === 'signup' ? { full_name: fullName } : undefined },
//       });
//       if (error) {
//         console.error('OTP send error:', error);
//         if (error.message.includes('already registered')) {
//           showError(
//             'This phone number is already registered. Please log in or use a different number.'
//           );
//         } else {
//           showError(error.message || 'Failed to send OTP');
//         }
//         return;
//       }
//       setOtpSent(true);
//       setCooldown(30);
//       showSuccess('OTP sent to your phone');
//     } catch (err) {
//       console.error('OTP send error:', err);
//       showError(err.message || 'Failed to send OTP');
//     } finally {
//       setLoading(false);
//     }
//   }, [phone, fullName, password, confirmPassword, mode, cooldown]);

//   const verifyOtp = async () => {
//     if (!otp) {
//       showError('Please enter the OTP');
//       return;
//     }
//     setLoading(true);
//     try {
//       const { data, error } = await supabase.auth.verifyOtp({
//         phone,
//         token: otp,
//         type: 'sms',
//       });
//       if (error) {
//         console.error('OTP verify error:', error);
//         showError('Invalid OTP');
//         return;
//       }
//       setOtpVerified(true);
//       setOtp('');
//       setOtpSent(false);
//       showSuccess('Phone number verified');
//       if (mode === 'signup') {
//         await finishSignup(data.user);
//       } else if (mode === 'forgot') {
//         // Wait for password reset
//       } else {
//         nav('/account', { replace: true });
//       }
//     } catch (err) {
//       console.error('OTP verify error:', err);
//       showError(err.message || 'Invalid OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* Signup Flow */
//   const finishSignup = async (user) => {
//     try {
//       const { error: profErr } = await supabase.from('profiles').upsert({
//         id: user.id,
//         full_name: fullName.trim(),
//         phone_number: phone,
//         is_seller: false,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       });
//       if (profErr) {
//         console.error('Profile upsert error:', profErr);
//         showError('Could not save profile');
//         return;
//       }

//       const { error: pwErr } = await supabase.auth.updateUser({ password });
//       if (pwErr) {
//         console.error('Password update error:', pwErr);
//         showError(pwErr.message || 'Could not set password');
//         return;
//       }

//       const { data: profile, error: fetchErr } = await supabase
//         .from('profiles')
//         .select('full_name, phone_number')
//         .eq('id', user.id)
//         .single();
//       if (fetchErr) {
//         console.error('Profile fetch error:', fetchErr);
//         showError('Failed to verify profile');
//         return;
//       }
//       if (!profile.full_name || !profile.phone_number) {
//         showError('Please complete your profile details');
//         setMode('edit');
//       } else {
//         showSuccess('Signed up successfully');
//         nav('/account', { replace: true });
//       }
//     } catch (err) {
//       console.error('Signup finish error:', err);
//       showError(err.message || 'Signup failed');
//     }
//   };

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     if (!validName(fullName)) {
//       showError('Full name must be at least 2 characters and not "User"');
//       return;
//     }
//     if (!validPhone(phone)) {
//       showError('Enter a valid +91 phone number');
//       return;
//     }
//     if (password.length < MIN_PASSWORD_LENGTH) {
//       showError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
//       return;
//     }
//     if (password !== confirmPassword) {
//       showError('Passwords do not match');
//       return;
//     }
//     setLoading(true);
//     try {
//       if (await phoneExists(phone)) {
//         /* 🔔 already registered ─ switch to Login view */
//         setLoading(false);
//         setMode('login'); // keep the phone filled so they can just enter pwd
//         setOtpSent(false);
//         showError('You already have an account – please log in.');
//         return;
//       }

//       /* brand-new user → normal OTP flow */
//       showSuccess('Sending OTP…');
//       await sendOtp();
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* Login & Reset */
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     if (!validPhone(phone)) {
//       showError('Enter a valid +91 phone number');
//       return;
//     }
//     if (!password) {
//       showError('Password is required');
//       return;
//     }
//     setLoading(true);
//     try {
//       const { error } = await supabase.auth.signInWithPassword({
//         phone,
//         password,
//       });
//       if (error) {
//         console.error('Login error:', error);
//         showError('Invalid credentials');
//         return;
//       }
//       showSuccess('Login successful');
//       nav('/account', { replace: true });
//     } catch (err) {
//       console.error('Login error:', err);
//       showError(err.message || 'Login failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const forgotStart = async (e) => {
//     e.preventDefault();
//     if (!validPhone(phone)) {
//       showError('Enter a valid +91 phone number');
//       return;
//     }
//     if (!(await phoneExists(phone))) {
//       showError('No account found for this phone number');
//       return;
//     }
//     await sendOtp();
//   };

//   const resetPw = async (e) => {
//     e.preventDefault();
//     if (!otpVerified) {
//       showError('Please verify OTP first');
//       return;
//     }
//     if (password !== confirmPassword) {
//       showError('Passwords do not match');
//       return;
//     }
//     if (password.length < MIN_PASSWORD_LENGTH) {
//       showError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
//       return;
//     }
//     setLoading(true);
//     try {
//       const { error } = await supabase.auth.updateUser({ password });
//       if (error) {
//         console.error('Password update error:', error);
//         showError(error.message || 'Password reset failed');
//         return;
//       }
//       const { data: { user } } = await supabase.auth.getUser();
//       const { data: profile, error: profileErr } = await supabase
//         .from('profiles')
//         .select('phone_number')
//         .eq('id', user.id)
//         .single();
//       if (profileErr) {
//         console.error('Profile fetch error:', profileErr);
//         showError('Failed to verify profile');
//         return;
//       }
//       if (!profile.phone_number) {
//         const { error: upsertErr } = await supabase.from('profiles').upsert({
//           id: user.id,
//           phone_number: phone,
//           is_seller: false,
//           updated_at: new Date().toISOString(),
//         });
//         if (upsertErr) {
//           console.error('Profile upsert error:', upsertErr);
//           showError('Failed to update profile');
//           return;
//         }
//       }
//       showSuccess('Password reset successful. Please log in.');
//       switchMode('login');
//     } catch (err) {
//       console.error('Password reset error:', err);
//       showError(err.message || 'Password reset failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* Profile Update */
//   const handleProfileUpdate = async (e) => {
//     e.preventDefault();
//     if (!validName(fullName)) {
//       showError('Full name must be at least 2 characters and not "User"');
//       return;
//     }
//     if (!validPhone(phone)) {
//       showError('Enter a valid +91 phone number');
//       return;
//     }
//     setLoading(true);
//     try {
//       const { data: { user }, error: userErr } = await supabase.auth.getUser();
//       if (userErr) {
//         console.error('User fetch error:', userErr);
//         showError('Failed to fetch user');
//         return;
//       }
//       const { error } = await supabase.from('profiles').upsert({
//         id: user.id,
//         full_name: fullName.trim(),
//         phone_number: phone,
//         is_seller: false,
//         updated_at: new Date().toISOString(),
//       });
//       if (error) {
//         console.error('Profile update error:', error);
//         showError('Failed to update profile');
//         return;
//       }
//       showSuccess('Profile updated successfully');
//       nav('/account', { replace: true });
//     } catch (err) {
//       console.error('Profile update error:', err);
//       showError(err.message || 'Failed to update profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* UI */
//   return (
//     <div className="auth-container">
//       <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
//       <h1 className="auth-title">
//         {mode === 'signup'
//           ? 'Sign Up'
//           : mode === 'forgot'
//           ? 'Reset Password'
//           : mode === 'edit'
//           ? 'Update Profile'
//           : 'Login'}
//       </h1>
//       <form
//         onSubmit={
//           mode === 'signup'
//             ? otpSent
//               ? verifyOtp
//               : handleSignup
//             : mode === 'forgot'
//             ? otpVerified
//               ? resetPw
//               : forgotStart
//             : mode === 'edit'
//             ? handleProfileUpdate
//             : handleLogin
//         }
//         className="auth-form"
//       >
//         {(mode === 'signup' || mode === 'edit') && (
//           <div className="input-wrapper">
//             <input
//               type="text"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//               placeholder="Full name (e.g., Suraj Kumar)"
//               required
//               disabled={loading || (mode === 'signup' && otpVerified)}
//               minLength={MIN_NAME_LENGTH}
//               pattern="^(?!User$|user$).*$"
//               title="Full name cannot be 'User' and must be at least 2 characters"
//               className="auth-input"
//               aria-label="Full Name"
//             />
//           </div>
//         )}
//         <div className="input-wrapper phone-input-wrapper">
//           <input
//             type="tel"
//             value={phone}
//             onChange={(e) =>
//               setPhone(
//                 e.target.value.startsWith('+91')
//                   ? e.target.value.replace(/[^0-9+]/g, '').slice(0, 13)
//                   : '+91'
//               )
//             }
//             maxLength={13}
//             placeholder="+919876543210"
//             required
//             disabled={loading || (mode === 'signup' && otpVerified) || (mode === 'forgot' && otpSent)}
//             className="auth-input phone-input"
//             aria-label="Phone Number"
//           />
//         </div>
//         {(mode === 'signup' || mode === 'login') && !otpSent && (
//           <>
//             <PasswordField
//               val={password}
//               setVal={setPassword}
//               show={showPwd}
//               setShow={setShowPwd}
//               placeholder="Password (minimum 6 characters)"
//               disabled={loading}
//               ariaLabel="Password"
//             />
//             {mode === 'signup' && (
//               <PasswordField
//                 val={confirmPassword}
//                 setVal={setConfirmPwd}
//                 show={showConfirm}
//                 setShow={setShowConfirm}
//                 placeholder="Confirm password"
//                 disabled={loading}
//                 ariaLabel="Confirm Password"
//               />
//             )}
//           </>
//         )}
//         {otpSent && (!otpVerified || mode !== 'forgot') && (
//           <>
//             <div className="input-wrapper">
//               <input
//                 type="text"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
//                 placeholder="Enter OTP"
//                 required
//                 disabled={loading}
//                 className="auth-input"
//                 aria-label="OTP Code"
//               />
//             </div>
//             <button
//               type="button"
//               onClick={verifyOtp}
//               disabled={loading}
//               className="auth-button"
//               aria-label="Verify OTP"
//             >
//               {loading ? <span className="loading-spinner">Verifying...</span> : 'Verify OTP'}
//             </button>
//             <button
//               type="button"
//               onClick={sendOtp}
//               disabled={loading || cooldown}
//               className="otp-btn resend-btn"
//               aria-label="Resend OTP"
//             >
//               {cooldown ? `Resend in ${cooldown}s` : 'Resend OTP'}
//             </button>
//           </>
//         )}
//         {mode === 'forgot' && otpVerified && (
//           <>
//             <PasswordField
//               val={password}
//               setVal={setPassword}
//               show={showPwd}
//               setShow={setShowPwd}
//               placeholder="New password (minimum 6 characters)"
//               disabled={loading}
//               ariaLabel="New Password"
//             />
//             <PasswordField
//               val={confirmPassword}
//               setVal={setConfirmPwd}
//               show={showConfirm}
//               setShow={setShowConfirm}
//               placeholder="Confirm new password"
//               disabled={loading}
//               ariaLabel="Confirm New Password"
//             />
//           </>
//         )}
//         {(!otpSent || (mode === 'forgot' && otpVerified) || mode === 'edit') && (
//           <button
//             type="submit"
//             disabled={loading}
//             className="auth-button"
//             aria-label={
//               mode === 'signup'
//                 ? 'Sign Up'
//                 : mode === 'forgot'
//                 ? 'Save Password'
//                 : mode === 'edit'
//                 ? 'Update Profile'
//                 : 'Login'
//             }
//           >
//             {loading ? (
//               <span className="loading-spinner">Processing...</span>
//             ) : mode === 'signup' ? (
//               'Sign Up'
//             ) : mode === 'forgot' ? (
//               'Save Password'
//             ) : mode === 'edit' ? (
//               'Update Profile'
//             ) : (
//               'Login'
//             )}
//           </button>
//         )}
//       </form>
//       <div className="toggle auth-toggle-buttons">
//         {mode !== 'signup' && mode !== 'edit' && (
//           <button
//             onClick={() => switchMode('signup')}
//             disabled={loading}
//             className="auth-toggle"
//             aria-label="Switch to Sign Up"
//           >
//             Need an account? Sign Up
//           </button>
//         )}
//         {mode !== 'login' && mode !== 'edit' && (
//           <button
//             onClick={() => switchMode('login')}
//             disabled={loading}
//             className="auth-toggle"
//             aria-label="Switch to Login"
//           >
//             Have an account? Login
//           </button>
//         )}
//         {mode !== 'forgot' && mode !== 'edit' && (
//           <button
//             onClick={() => switchMode('forgot')}
//             disabled={loading}
//             className="auth-toggle"
//             aria-label="Forgot Password"
//           >
//             Forgot Password?
//           </button>
//         )}
//         {mode === 'edit' && (
//           <button
//             onClick={() => nav('/account', { replace: true })}
//             disabled={loading}
//             className="auth-toggle"
//             aria-label="Back to Account"
//           >
//             Back to Account
//           </button>
//         )}
//       </div>
//       <footer className="auth-footer">
//         <Link to="/policy" className="footer-link" aria-label="View Policies">
//           Policy
//         </Link>{' '}
//         ·{' '}
//         <Link to="/privacy" className="footer-link" aria-label="View Privacy Policy">
//           Privacy
//         </Link>
//       </footer>
//       <Link to="/" className="back-link" aria-label="Back to Home">
//         Back to Home
//       </Link>
//     </div>
//   );
// }

// /* Reusable Password Field */
// function PasswordField({ val, setVal, show, setShow, placeholder, disabled, ariaLabel }) {
//   return (
//     <div className="pwd-grp input-wrapper password-input-wrapper">
//       <input
//         type={show ? 'text' : 'password'}
//         value={val}
//         onChange={(e) => setVal(e.target.value)}
//         placeholder={placeholder}
//         required
//         disabled={disabled}
//         minLength={MIN_PASSWORD_LENGTH}
//         className="auth-input"
//         aria-label={ariaLabel}
//       />
//       <button
//         type="button"
//         onClick={() => setShow(!show)}
//         className="password-toggle"
//         aria-label={show ? `Hide ${ariaLabel.toLowerCase()}` : `Show ${ariaLabel.toLowerCase()}`}
//       >
//         {show ? '🙈' : '👁️'}
//       </button>
//     </div>
//   );
// }


import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Toaster, toast } from 'react-hot-toast';
import '../style/Auth.css';

const INDIAN_PHONE = /^\+91\d{10}$/;
const MIN_NAME_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 6;

export default function Auth() {
  const nav = useNavigate();

  /* State */
  const [mode, setMode] = useState('login'); // login | signup | forgot | edit
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPwd] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* Helpers */
  const resetUI = () => {
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setCooldown(0);
  };

  const switchMode = (m) => {
    setMode(m);
    setPassword('');
    setConfirmPwd('');
    setFullName('');
    setPhone('+91');
    resetUI();
  };

  const validPhone = (p) => INDIAN_PHONE.test(p);
  const validName = (n) =>
    n.trim() &&
    n.trim().toLowerCase() !== 'user' &&
    n.trim().length >= MIN_NAME_LENGTH;

  const showError = (message) =>
    toast.error(message, {
      duration: 3000,
      position: 'top-center',
      style: {
        background: '#ef4444',
        color: '#fff',
        fontWeight: 'bold',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      },
    });

  const showSuccess = (message) =>
    toast.success(message, {
      duration: 3000,
      position: 'top-center',
      style: {
        background: '#2ecc71',
        color: '#fff',
        fontWeight: 'bold',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      },
    });

  /* Supabase Session Watch */
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session fetch error:', error);
        showError('Failed to fetch session. Please try again.');
        return;
      }
      if (session) {
        if (mode === 'edit') {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, phone_number')
            .eq('id', session.user.id)
            .single();
          if (error) {
            console.error('Profile fetch error:', error);
            showError('Failed to load profile. Please try again.');
            return;
          }
          setFullName(data.full_name || '');
          setPhone(data.phone_number || '+91');
        } else {
          nav('/', { replace: true }); // Changed to /
        }
      }
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        if (event === 'SIGNED_IN' && mode !== 'edit') {
          nav('/', { replace: true }); // Changed to /
        }
        if (event === 'SIGNED_OUT') {
          nav('/auth', { replace: true });
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [nav, mode]);

  /* Resend Timer */
  useEffect(() => {
    if (cooldown === 0) return;
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  /* DB Util */
  const phoneExists = useCallback(async (ph) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_number', ph)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error('Phone check error:', error);
      throw new Error('Database error while checking phone');
    }
    return !!data;
  }, []);

  /* OTP Handlers */
  const sendOtp = useCallback(async () => {
    if (!validPhone(phone)) {
      showError('Enter a valid +91 phone number (e.g., +919876543210)');
      return;
    }
    if (cooldown) {
      showError(`Please wait ${cooldown}s to resend OTP`);
      return;
    }
    if (mode === 'signup') {
      if (!validName(fullName)) {
        showError('Full name must be at least 2 characters and not "User"');
        return;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        showError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
        return;
      }
      if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
      }
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { data: mode === 'signup' ? { full_name: fullName } : undefined },
      });
      if (error) {
        console.error('OTP send error:', error);
        if (error.message.includes('already registered')) {
          showError(
            'This phone number is already registered. Please log in or use a different number.'
          );
        } else {
          showError(error.message || 'Failed to send OTP');
        }
        return;
      }
      setOtpSent(true);
      setCooldown(30);
      showSuccess('OTP sent to your phone');
    } catch (err) {
      console.error('OTP send error:', err);
      showError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }, [phone, fullName, password, confirmPassword, mode, cooldown]);

  const verifyOtp = async () => {
    if (!otp) {
      showError('Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });
      if (error) {
        console.error('OTP verify error:', error);
        showError('Invalid OTP');
        return;
      }
      setOtpVerified(true);
      setOtp('');
      setOtpSent(false);
      showSuccess('Phone number verified');
      if (mode === 'signup') {
        await finishSignup(data.user);
      } else if (mode === 'forgot') {
        // Wait for password reset
      } else {
        nav('/', { replace: true }); // Changed to /
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      showError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  /* Signup Flow */
  const finishSignup = async (user) => {
    try {
      const { error: profErr } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName.trim(),
        phone_number: phone,
        is_seller: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (profErr) {
        console.error('Profile upsert error:', profErr);
        showError('Could not save profile');
        return;
      }

      const { error: pwErr } = await supabase.auth.updateUser({ password });
      if (pwErr) {
        console.error('Password update error:', pwErr);
        showError(pwErr.message || 'Could not set password');
        return;
      }

      const { data: profile, error: fetchErr } = await supabase
        .from('profiles')
        .select('full_name, phone_number')
        .eq('id', user.id)
        .single();
      if (fetchErr) {
        console.error('Profile fetch error:', fetchErr);
        showError('Failed to verify profile');
        return;
      }
      if (!profile.full_name || !profile.phone_number) {
        showError('Please complete your profile details');
        setMode('edit');
      } else {
        showSuccess('Signed up successfully');
        nav('/', { replace: true }); // Changed to /
      }
    } catch (err) {
      console.error('Signup finish error:', err);
      showError(err.message || 'Signup failed');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validName(fullName)) {
      showError('Full name must be at least 2 characters and not "User"');
      return;
    }
    if (!validPhone(phone)) {
      showError('Enter a valid +91 phone number');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      showError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      if (await phoneExists(phone)) {
        /* 🔔 already registered ─ switch to Login view */
        setLoading(false);
        setMode('login'); // keep the phone filled so they can just enter pwd
        setOtpSent(false);
        showError('You already have an account – please log in.');
        return;
      }

      /* brand-new user → normal OTP flow */
      showSuccess('Sending OTP…');
      await sendOtp();
    } finally {
      setLoading(false);
    }
  };

  /* Login & Reset */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validPhone(phone)) {
      showError('Enter a valid +91 phone number');
      return;
    }
    if (!password) {
      showError('Password is required');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });
      if (error) {
        console.error('Login error:', error);
        showError('Invalid credentials');
        return;
      }
      showSuccess('Login successful');
      nav('/', { replace: true }); // Changed to /
    } catch (err) {
      console.error('Login error:', err);
      showError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const forgotStart = async (e) => {
    e.preventDefault();
    if (!validPhone(phone)) {
      showError('Enter a valid +91 phone number');
      return;
    }
    if (!(await phoneExists(phone))) {
      showError('No account found for this phone number');
      return;
    }
    await sendOtp();
  };

  const resetPw = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      showError('Please verify OTP first');
      return;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      showError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.error('Password update error:', error);
        showError(error.message || 'Password reset failed');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', user.id)
        .single();
      if (profileErr) {
        console.error('Profile fetch error:', profileErr);
        showError('Failed to verify profile');
        return;
      }
      if (!profile.phone_number) {
        const { error: upsertErr } = await supabase.from('profiles').upsert({
          id: user.id,
          phone_number: phone,
          is_seller: false,
          updated_at: new Date().toISOString(),
        });
        if (upsertErr) {
          console.error('Profile upsert error:', upsertErr);
          showError('Failed to update profile');
          return;
        }
      }
      showSuccess('Password reset successful. Please log in.');
      switchMode('login');
    } catch (err) {
      console.error('Password reset error:', err);
      showError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  /* Profile Update */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!validName(fullName)) {
      showError('Full name must be at least 2 characters and not "User"');
      return;
    }
    if (!validPhone(phone)) {
      showError('Enter a valid +91 phone number');
      return;
    }
    setLoading(true);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        console.error('User fetch error:', userErr);
        showError('Failed to fetch user');
        return;
      }
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName.trim(),
        phone_number: phone,
        is_seller: false,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Profile update error:', error);
        showError('Failed to update profile');
        return;
      }
      showSuccess('Profile updated successfully');
      nav('/', { replace: true }); // Changed to /
    } catch (err) {
      console.error('Profile update error:', err);
      showError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  /* UI */
  return (
    <div className="auth-container">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <h1 className="auth-title">
        {mode === 'signup'
          ? 'Sign Up'
          : mode === 'forgot'
          ? 'Reset Password'
          : mode === 'edit'
          ? 'Update Profile'
          : 'Login'}
      </h1>
      <form
        onSubmit={
          mode === 'signup'
            ? otpSent
              ? verifyOtp
              : handleSignup
            : mode === 'forgot'
            ? otpVerified
              ? resetPw
              : forgotStart
            : mode === 'edit'
            ? handleProfileUpdate
            : handleLogin
        }
        className="auth-form"
      >
        {(mode === 'signup' || mode === 'edit') && (
          <div className="input-wrapper">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name (e.g., Suraj Kumar)"
              required
              disabled={loading || (mode === 'signup' && otpVerified)}
              minLength={MIN_NAME_LENGTH}
              pattern="^(?!User$|user$).*$"
              title="Full name cannot be 'User' and must be at least 2 characters"
              className="auth-input"
              aria-label="Full Name"
            />
          </div>
        )}
        <div className="input-wrapper phone-input-wrapper">
          <input
            type="tel"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value.startsWith('+91')
                  ? e.target.value.replace(/[^0-9+]/g, '').slice(0, 13)
                  : '+91'
              )
            }
            maxLength={13}
            placeholder="+919876543210"
            required
            disabled={loading || (mode === 'signup' && otpVerified) || (mode === 'forgot' && otpSent)}
            className="auth-input phone-input"
            aria-label="Phone Number"
          />
        </div>
        {(mode === 'signup' || mode === 'login') && !otpSent && (
          <>
            <PasswordField
              val={password}
              setVal={setPassword}
              show={showPwd}
              setShow={setShowPwd}
              placeholder="Password (minimum 6 characters)"
              disabled={loading}
              ariaLabel="Password"
            />
            {mode === 'signup' && (
              <PasswordField
                val={confirmPassword}
                setVal={setConfirmPwd}
                show={showConfirm}
                setShow={setShowConfirm}
                placeholder="Confirm password"
                disabled={loading}
                ariaLabel="Confirm Password"
              />
            )}
          </>
        )}
        {otpSent && (!otpVerified || mode !== 'forgot') && (
          <>
            <div className="input-wrapper">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Enter OTP"
                required
                disabled={loading}
                className="auth-input"
                aria-label="OTP Code"
              />
            </div>
            <button
              type="button"
              onClick={verifyOtp}
              disabled={loading}
              className="auth-button"
              aria-label="Verify OTP"
            >
              {loading ? <span className="loading-spinner">Verifying...</span> : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading || cooldown}
              className="otp-btn resend-btn"
              aria-label="Resend OTP"
            >
              {cooldown ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </button>
          </>
        )}
        {mode === 'forgot' && otpVerified && (
          <>
            <PasswordField
              val={password}
              setVal={setPassword}
              show={showPwd}
              setShow={setShowPwd}
              placeholder="New password (minimum 6 characters)"
              disabled={loading}
              ariaLabel="New Password"
            />
            <PasswordField
              val={confirmPassword}
              setVal={setConfirmPwd}
              show={showConfirm}
              setShow={setShowConfirm}
              placeholder="Confirm new password"
              disabled={loading}
              ariaLabel="Confirm New Password"
            />
          </>
        )}
        {(!otpSent || (mode === 'forgot' && otpVerified) || mode === 'edit') && (
          <button
            type="submit"
            disabled={loading}
            className="auth-button"
            aria-label={
              mode === 'signup'
                ? 'Sign Up'
                : mode === 'forgot'
                ? 'Save Password'
                : mode === 'edit'
                ? 'Update Profile'
                : 'Login'
            }
          >
            {loading ? (
              <span className="loading-spinner">Processing...</span>
            ) : mode === 'signup' ? (
              'Sign Up'
            ) : mode === 'forgot' ? (
              'Save Password'
            ) : mode === 'edit' ? (
              'Update Profile'
            ) : (
              'Login'
            )}
          </button>
        )}
      </form>
      <div className="toggle auth-toggle-buttons">
        {mode !== 'signup' && mode !== 'edit' && (
          <button
            onClick={() => switchMode('signup')}
            disabled={loading}
            className="auth-toggle"
            aria-label="Switch to Sign Up"
          >
            Need an account? Sign Up
          </button>
        )}
        {mode !== 'login' && mode !== 'edit' && (
          <button
            onClick={() => switchMode('login')}
            disabled={loading}
            className="auth-toggle"
            aria-label="Switch to Login"
          >
            Have an account? Login
          </button>
        )}
        {mode !== 'forgot' && mode !== 'edit' && (
          <button
            onClick={() => switchMode('forgot')}
            disabled={loading}
            className="auth-toggle"
            aria-label="Forgot Password"
          >
            Forgot Password?
          </button>
        )}
        {mode === 'edit' && (
          <button
            onClick={() => nav('/account', { replace: true })}
            disabled={loading}
            className="auth-toggle"
            aria-label="Back to Account"
          >
            Back to Account
          </button>
        )}
      </div>
      <footer className="auth-footer">
        <Link to="/policy" className="footer-link" aria-label="View Policies">
          Policy
        </Link>{' '}
        ·{' '}
        <Link to="/privacy" className="footer-link" aria-label="View Privacy Policy">
          Privacy
        </Link>
      </footer>
      <Link to="/" className="back-link" aria-label="Back to Home">
        Back to Home
      </Link>
    </div>
  );
}

/* Reusable Password Field */
function PasswordField({ val, setVal, show, setShow, placeholder, disabled, ariaLabel }) {
  return (
    <div className="pwd-grp input-wrapper password-input-wrapper">
      <input
        type={show ? 'text' : 'password'}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        required
        disabled={disabled}
        minLength={MIN_PASSWORD_LENGTH}
        className="auth-input"
        aria-label={ariaLabel}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="password-toggle"
        aria-label={show ? `Hide ${ariaLabel.toLowerCase()}` : `Show ${ariaLabel.toLowerCase()}`}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}