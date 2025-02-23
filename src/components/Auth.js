import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/Auth.css';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(''); // New state for phone number
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSeller, setIsSeller] = useState(false); // Seller role
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
      setMessage(`Error: ${error.message} (Details: ${JSON.stringify(error)})`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    console.log('Attempting auth with:', { email, password, phone, isSignUp, isSeller });
    try {
      if (isSignUp) {
        // Validate phone number
        const phoneRegex = /^[0-9+]{10,13}$/;
        if (phone && !phoneRegex.test(phone)) {
          setMessage('Invalid phone number format. Use +91XXXXXXXXXX or similar (10-13 digits).');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('duplicate key value violates unique constraint')) {
            setMessage('This email is already registered. Please log in or use a different email.');
          } else if (error.message.includes('foreign key violation')) {
            setMessage('An error occurred linking your profile. Please contact support.');
          } else {
            console.error('Sign-up error:', error);
            setMessage(`Error: ${error.message} (Details: ${JSON.stringify(error)})`);
          }
          throw error;
        }

        // Wait for session to propagate
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay

        // Insert profile with the user's ID
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.email.split('@')[0], // Simple name from email
            is_seller: isSeller, // Set seller status
            phone_number: phone || null, // Store phone number (null if not provided)
            shipping_address: null, // Default to null if not provided
          });
        if (profileError) {
          console.error('Profile insert error:', profileError);
          if (profileError.message.includes('duplicate key value violates unique constraint')) {
            setMessage('This email or phone is already in use. Please log in or use different credentials.');
          } else if (profileError.message.includes('foreign key violation')) {
            setMessage('An error occurred linking your profile. Please contact support.');
          } else {
            setMessage(`Error: ${profileError.message} (Details: ${JSON.stringify(profileError)})`);
          }
          throw profileError;
        }

        setMessage('Check your email for a confirmation link!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.error('Full login error:', error);
          if (error.message === 'Invalid login credentials') {
            setMessage('Invalid email or password. Please check your credentials or sign up if you don’t have an account.');
          } else {
            setMessage(`Error: ${error.message} (Details: ${JSON.stringify(error)})`);
          }
          throw error;
        }
        setMessage('Logged in successfully!');
        navigate('/');
      }
    } catch (error) {
      console.error('Email auth error:', error);
      if (!message) setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <h1>{isSignUp ? 'Sign Up' : 'Login'}</h1>
      <button 
        onClick={handleGoogleLogin} 
        className="google-btn" 
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Sign in with Google'}
      </button>
      <p>Or use email and password:</p>
      {isSignUp && (
        <>
          <label>
            Are you a Seller?
            <input
              type="checkbox"
              checked={isSeller}
              onChange={(e) => setIsSeller(e.target.checked)}
            />
          </label>
          <input
            type="tel"
            placeholder="Phone Number (e.g., +919876543210)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </>
      )}
      <form onSubmit={handleEmailAuth}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
        </button>
      </form>
      <p>{message}</p>
      <button 
        onClick={() => setIsSignUp(!isSignUp)} 
        className="toggle-btn" 
        disabled={loading}
      >
        {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
      </button>
      <Link to="/" className="back-link">Back to Home</Link>
    </div>
  );
}

export default Auth;