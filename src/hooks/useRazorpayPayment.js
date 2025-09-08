import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * Custom hook for Razorpay payment integration
 * Handles order creation, checkout opening, and payment verification
 */
export const useRazorpayPayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  /**
   * Dynamically loads Razorpay Checkout.js script
   * @returns {Promise<boolean>} - Whether script was loaded successfully
   */
  const loadRazorpayScript = useCallback(async () => {
    // Check if script is already loaded
    if (window.Razorpay) {
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        resolve(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        resolve(false);
      };
      
      document.head.appendChild(script);
    });
  }, []);

  /**
   * Creates a Razorpay order via our backend API
   * @param {Object} orderData - Order details (amount, currency, etc.)
   * @returns {Promise<Object>} - Order response with razorpay_order_id
   */
  const createOrder = useCallback(async (orderData) => {
    try {
      console.log('🔍 Creating order with data:', orderData);
      
      // Step 1: Create Razorpay order via our backend
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      const requestBody = {
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: `order_${Date.now()}`,
        notes: {
          source: 'react_web_app',
          user_id: orderData.user_id
        }
      };
      
      console.log('🔍 Sending to backend API:', {
        url: `${backendUrl}/api/create-order`,
        method: 'POST',
        body: requestBody
      });
      
      const response = await fetch(`${backendUrl}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Backend API error:', errorData);
        throw new Error(`Order creation failed: ${errorData.error || `HTTP ${response.status}`}`);
      }

      const orderResponse = await response.json();
      console.log('✅ Order created successfully via backend:', orderResponse);
      
      // Validate the response
      if (!orderResponse.success || !orderResponse.order?.id) {
        throw new Error('Invalid backend response: missing order ID');
      }

      // Step 2: Store order in our database (optional - you can do this in backend)
      try {
        const { supabase } = await import('../supabaseClient');
        
        const { data: dbOrderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: orderData.user_id || 'temp_user_id',
            total: orderData.amount / 100, // Convert from paise to rupees
            total_amount: orderData.amount / 100,
            order_status: 'pending',
            payment_method: 'razorpay',
            shipping_address: orderData.shipping_address,
            razorpay_order_id: orderResponse.order.id,
            buyer_name: orderData.customer_details?.name,
            buyer_phone: orderData.customer_details?.contact,
            buyer_address: orderData.shipping_address,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (orderError) {
          console.error('Error creating order in database:', orderError);
          // Don't throw error here as Razorpay order is created
        } else {
          console.log('✅ Order stored in database:', dbOrderData);
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        // Continue with payment flow even if DB fails
      }

      // Return the order data for Razorpay checkout
      const finalResponse = {
        order_id: orderResponse.order.id,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        status: orderResponse.order.status
      };
      
      console.log('✅ Returning order response for Razorpay:', finalResponse);
      return finalResponse;

    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }, []);

  /**
   * Verifies payment via our backend API
   * @param {Object} paymentData - Payment response from Razorpay
   * @returns {Promise<boolean>} - Whether verification was successful
   */
  const verifyPayment = useCallback(async (paymentData) => {
    try {
      console.log('🔍 Verifying payment with backend:', paymentData);
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Backend verification error:', errorData);
        throw new Error(`Payment verification failed: ${errorData.error || `HTTP ${response.status}`}`);
      }

      const verificationResponse = await response.json();
      console.log('✅ Payment verification response:', verificationResponse);
      
      if (verificationResponse.success && verificationResponse.verified) {
        // Update local database if verification successful
        try {
          const { supabase } = await import('../supabaseClient');
          
          const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({ 
              order_status: 'confirmed',
              payment_id: paymentData.razorpay_payment_id,
              updated_at: new Date().toISOString()
            })
            .eq('razorpay_order_id', paymentData.razorpay_order_id);

          if (orderUpdateError) {
            console.error('Error updating order status in database:', orderUpdateError);
            // Don't throw error as payment is verified
          } else {
            console.log('✅ Order status updated in database');
          }
        } catch (dbError) {
          console.error('Database update failed:', dbError);
          // Continue as payment is verified
        }
        
        return true;
      } else {
        throw new Error(verificationResponse.error || 'Payment verification failed');
      }
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }, []);

  /**
   * Opens Razorpay checkout with the given order details
   * @param {Object} options - Checkout configuration options
   * @param {string} options.key_id - Razorpay public key
   * @param {number} options.amount - Amount in smallest currency unit (paise for INR)
   * @param {string} options.currency - Currency code (e.g., 'INR')
   * @param {string} options.order_id - Order ID from backend
   * @param {string} options.name - Company/App name
   * @param {string} options.description - Order description
   * @param {Object} options.prefill - Prefill customer details
   * @param {string} options.prefill.name - Customer name
   * @param {string} options.prefill.email - Customer email
   * @param {string} options.prefill.contact - Customer phone
   * @param {Object} options.theme - UI theme options
   * @returns {Promise<void>}
   */
  const openCheckout = useCallback(async (options) => {
    setLoading(true);
    setError(null);

    try {
      // Load Razorpay script if not already loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Validate required options
      if (!options.key_id || !options.amount || !options.currency || !options.order_id) {
        console.error('Missing Razorpay options:', options);
        throw new Error('Missing required Razorpay options');
      }

      // Ensure amount is an integer (Razorpay expects amount in paise)
      const amount = parseInt(options.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid amount: ${options.amount}. Amount must be a positive number in paise.`);
      }

      console.log('🔍 Razorpay checkout options:', {
        key: options.key_id,
        amount: amount,
        currency: options.currency,
        order_id: options.order_id,
        name: options.name,
        description: options.description,
        prefill: options.prefill
      });

      // Create Razorpay instance with options
      const razorpay = new window.Razorpay({
        key: options.key_id,
        amount: amount, // Use validated amount
        currency: options.currency,
        order_id: options.order_id,
        name: options.name || 'FreshCart',
        description: options.description || 'Order Payment',
        prefill: {
          name: options.prefill?.name || '',
          email: options.prefill?.email || '',
          contact: options.prefill?.contact || '',
        },
        theme: {
          color: options.theme?.color || '#3399cc',
        },
        handler: async (response) => {
          try {
            console.log('Payment successful:', response);
            
            // Verify payment with backend
            const isVerified = await verifyPayment(response);
            
            if (isVerified) {
              toast.success('Payment successful! Redirecting to success page...');
              // Redirect to success page after a short delay
              setTimeout(() => {
                navigate('/success');
              }, 1500);
            } else {
              toast.error('Payment verification failed. Please contact support.');
              setError('Payment verification failed');
            }
          } catch (verificationError) {
            console.error('Payment verification error:', verificationError);
            toast.error('Payment verification failed. Please contact support.');
            setError(verificationError.message);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Checkout modal dismissed');
            setLoading(false);
          },
        },
        // Additional options for better UX
        retry: {
          enabled: true,
          max_count: 3,
        },
        remember_customer: true,
        callback_url: window.location.origin + '/success',
      });

      // Open the checkout
      razorpay.open();
      
    } catch (error) {
      console.error('Error opening Razorpay checkout:', error);
      setError(error.message);
      toast.error(`Payment error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [loadRazorpayScript, verifyPayment, navigate]);

  /**
   * Initiates payment flow: creates order and opens checkout
   * @param {Object} paymentDetails - Payment details including order data and checkout options
   * @returns {Promise<void>}
   */
  const initiatePayment = useCallback(async (paymentDetails) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 initiatePayment called with:', paymentDetails);
      
      // Step 1: Create order via backend
      const orderResponse = await createOrder(paymentDetails.orderData);
      console.log('✅ Order created successfully:', orderResponse);
      
      // Step 2: Open Razorpay checkout with order details
      const checkoutOptions = {
        ...paymentDetails.checkoutOptions,
        order_id: orderResponse.order_id,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
      };
      
      console.log('🔍 Opening checkout with options:', checkoutOptions);
      await openCheckout(checkoutOptions);
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      setError(error.message);
      toast.error(`Payment initiation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [createOrder, openCheckout]);

  return {
    loading,
    error,
    initiatePayment,
    openCheckout,
    createOrder,
    verifyPayment,
  };
}; 