

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



import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/Auth.css';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Checking session on Auth mount:', session);
      if (session?.user) {
        setMessage('You are already logged in. Redirecting...');
        navigate('/account');
        return;
      }
    };
    checkSession();

    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setMessage('You have been signed out. Please log in again.');
        navigate('/auth');
      } else if (event === 'SIGNED_IN' && session?.user) {
        setMessage('Logged in successfully!');
        navigate('/account');
      }
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
      setMessage(`Error: ${error.message} (Details: ${JSON.stringify(error)})`);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    if (!phone || !/^\+?[0-9]{10,13}$/.test(phone)) {
      setMessage('Please enter a valid phone number (e.g., +919876543210).');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setMessage('OTP sent to your phone. Please enter it below.');
      setShowOtp(true);
    } catch (error) {
      console.error('Phone OTP error:', error);
      setMessage(`Error sending OTP: ${error.message} (Details: ${JSON.stringify(error)})`);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      setMessage('Please enter the OTP.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      setMessage('Phone verified successfully! You can now sign up or log in.');
      if (isSignUp) {
        await handleEmailAuthForPhone(data.session.user);
      } else {
        navigate('/account');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setMessage(`Error verifying OTP: ${error.message} (Details: ${JSON.stringify(error)})`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    console.log('Attempting auth with:', { email, password, phone, fullName, isSignUp, isSeller });
    try {
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (session?.user) {
        setMessage('You are already logged in. Redirecting...');
        navigate('/account');
        return;
      }

      if (isSignUp) {
        if (!email && !phone) {
          setMessage('Please provide either an email or phone number.');
          setLoading(false);
          return;
        }
        if (phone && !showOtp) {
          setMessage('Please verify your phone number with OTP before signing up.');
          setLoading(false);
          return;
        }
        if (!password) {
          setMessage('Password is required for sign-up.');
          setLoading(false);
          return;
        }

        let userData;
        if (email) {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) {
            console.error('Sign-up error details:', error);
            if (error.message.includes('duplicate key value violates unique constraint')) {
              setMessage('This email is already registered. Please log in or use a different email.');
            } else if (error.message.includes('Database error')) {
              setMessage('Database error saving new user. Please check your details or contact support. Error details: ' + JSON.stringify(error));
            } else if (error.message.includes('foreign key violation')) {
              setMessage('An error occurred linking your account. Please contact support. Error details: ' + JSON.stringify(error));
            } else if (error.message.includes('Network error') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
              setMessage('Network issue detected. Please check your internet connection or try again later.');
            } else {
              setMessage(`Error: ${error.message} (Details: ${JSON.stringify(error)})`);
            }
            throw error;
          }
          userData = data.user;
        } else {
          const { data, error } = await supabase.auth.signInWithOtp({ phone });
          if (error) throw error;
          userData = data.user;
        }

        await new Promise(resolve => setTimeout(resolve, 3000)); // Increased delay for session propagation

        let profileUpsertSuccess = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: userData.id,
              email: email || null,
              full_name: fullName.trim() !== '' ? fullName : (email ? email.split('@')[0] : 'User'),
              name: fullName.trim() !== '' ? fullName : (email ? email.split('@')[0] : 'User'),
              is_seller: isSeller,
              phone_number: phone || null,
              shipping_address: null,
            }, { onConflict: 'id' })
            .eq('id', userData.id);
          if (!profileError) {
            profileUpsertSuccess = true;
            break;
          }
          console.warn(`Profile upsert attempt ${attempt + 1} failed, retrying...`, profileError);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
        if (!profileUpsertSuccess) throw new Error('Failed to upsert profile after multiple attempts');

        if (isSeller) {
          const { error: sellerError } = await supabase
            .from('sellers')
            .upsert({
              id: userData.id,
              store_name: `${fullName.trim() !== '' ? fullName : (email ? email.split('@')[0] : 'User')} Store`,
              location: null,
              allows_long_distance: false,
            }, { onConflict: 'id' })
            .eq('id', userData.id);
          if (sellerError) {
            console.error('Seller upsert error for user:', userData.id, sellerError);
            setMessage(`Error creating seller profile: ${sellerError.message} (Details: ${JSON.stringify(sellerError)})`);
            throw sellerError;
          }
        }

        setMessage('Account created successfully! Check your email for a confirmation link (if using email).');
        navigate('/account');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error('Login error:', error);
          if (error.message === 'Invalid login credentials') {
            setMessage('Invalid email or password. Please check your credentials or sign up if you don’t have an account.');
          } else {
            setMessage(`Error: ${error.message} (Details: ${JSON.stringify(error)})`);
          }
          throw error;
        }
        setMessage('Logged in successfully!');
        navigate('/account');
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (!message) {
        setMessage('An unexpected error occurred. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthForPhone = async (user) => {
    setLoading(true);
    setMessage('');
    try {
      const defaultFullName = fullName.trim() !== '' ? fullName : (user.email ? user.email.split('@')[0] : 'User');
      let profileUpsertSuccess = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email || null,
            full_name: defaultFullName,
            name: defaultFullName,
            is_seller: isSeller,
            phone_number: phone || null,
            shipping_address: null,
          }, { onConflict: 'id' })
          .eq('id', user.id);
        if (!profileError) {
          profileUpsertSuccess = true;
          break;
        }
        console.warn(`Profile upsert attempt ${attempt + 1} failed, retrying...`, profileError);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
      if (!profileUpsertSuccess) throw new Error('Failed to upsert profile after multiple attempts');

      if (isSeller) {
        const { error: sellerError } = await supabase
          .from('sellers')
          .upsert({
            id: user.id,
            store_name: `${defaultFullName} Store`,
            location: null,
            allows_long_distance: false,
          }, { onConflict: 'id' })
          .eq('id', user.id);
        if (sellerError) {
          console.error('Seller upsert error for user:', user.id, sellerError);
          setMessage(`Error creating seller profile: ${sellerError.message} (Details: ${JSON.stringify(sellerError)})`);
          throw sellerError;
        }
      }
      setMessage('Phone verified and account created successfully! Check your email for confirmation (if applicable).');
      navigate('/account');
    } catch (error) {
      console.error('Phone auth error:', error);
      setMessage('An error occurred during phone authentication. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <h1 style={{ color: '#007bff' }}>{isSignUp ? 'FreshCart Sign Up' : 'FreshCart Login'}</h1>
      <button 
        onClick={handleGoogleLogin} 
        className="google-btn" 
        disabled={loading}
        style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
      >
        {loading ? 'Loading...' : 'Sign in with Google'}
      </button>
      <p style={{ color: '#666' }}>Or use email/phone and password:</p>
      {isSignUp && (
        <>
          <label style={{ color: '#666' }}>
            Full Name:
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              className="auth-input"
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
            />
          </label>
          <label style={{ color: '#666' }}>
            Are you a Seller?
            <input
              type="checkbox"
              checked={isSeller}
              onChange={(e) => setIsSeller(e.target.checked)}
              disabled={loading}
              style={{ marginLeft: '10px' }}
            />
          </label>
          <label style={{ color: '#666' }}>
            Phone Number (Optional):
            <input
              type="tel"
              placeholder="Phone Number (e.g., +919876543210)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading || showOtp}
              className="auth-input"
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
            />
            {!showOtp && phone && (
              <button 
                onClick={handlePhoneAuth} 
                className="otp-btn" 
                disabled={loading || !phone}
                style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            )}
          </label>
          {showOtp && (
            <label style={{ color: '#666' }}>
              OTP:
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={loading}
                className="auth-input"
                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
              />
              <button 
                onClick={verifyOtp} 
                className="otp-btn" 
                disabled={loading || !otp}
                style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </label>
          )}
          <label style={{ color: '#666' }}>
            Email (Optional if using Phone):
            <input
              type="email"
              placeholder="Email (Optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="auth-input"
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
            />
          </label>
          <label style={{ color: '#666' }}>
            Password:
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="auth-input"
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
            />
          </label>
        </>
      )}
      {!isSignUp && (
        <>
          <label style={{ color: '#666' }}>
            Phone Number or Email:
            <input
              type="text"
              placeholder="Phone (e.g., +919876543210) or Email"
              value={phone || email}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\+?[0-9]{10,13}$/.test(value)) {
                  setPhone(value);
                  setEmail('');
                } else {
                  setEmail(value);
                  setPhone('');
                }
              }}
              required
              disabled={loading}
              className="auth-input"
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
            />
          </label>
          <label style={{ color: '#666' }}>
            Password:
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="auth-input"
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
            />
          </label>
        </>
      )}
      <form onSubmit={handleEmailAuth}>
        <button 
          type="submit" 
          disabled={loading || (isSignUp && (!email && !phone) || (phone && !showOtp))}
          style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
        >
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
        </button>
      </form>
      <p style={{ color: '#666', marginTop: '10px' }}>{message}</p>
      <button 
        onClick={() => {
          setIsSignUp(!isSignUp);
          setShowOtp(false);
          setOtp('');
          setPhone('');
          setEmail('');
          setPassword('');
        }} 
        className="toggle-btn" 
        disabled={loading}
        style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
      >
        {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
      </button>
      <Link to="/" className="back-link" style={{ color: '#007bff', marginTop: '10px', display: 'block' }}>Back to Home</Link>

      <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
        <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            🏠
          </span>
          <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            🛒
          </span>
        </div>
        <p style={{ color: '#007bff' }}>Categories</p>
      </div>
    </div>
  );
}

export default Auth;