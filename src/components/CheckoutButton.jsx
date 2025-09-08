import React, { useState } from 'react';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import toast from 'react-hot-toast';
import '../style/CheckoutButton.css';

/**
 * CheckoutButton Component
 * Provides a "Buy Now" button that integrates with Razorpay payment system
 * 
 * @param {Object} props - Component props
 * @param {number} props.amount - Amount in smallest currency unit (paise for INR)
 * @param {string} props.currency - Currency code (default: 'INR')
 * @param {string} props.productName - Name of the product being purchased
 * @param {string} props.productId - Unique identifier for the product
 * @param {string} props.keyId - Razorpay public key (can be passed as prop or use env var)
 * @param {Object} props.customerDetails - Customer information for prefill
 * @param {string} props.customerDetails.name - Customer name
 * @param {string} props.customerDetails.email - Customer email
 * @param {string} props.customerDetails.contact - Customer phone number
 * @param {string} props.buttonText - Custom button text (default: 'Buy Now')
 * @param {string} props.buttonClassName - Custom CSS classes for button styling
 * @param {boolean} props.disabled - Whether the button should be disabled
 * @param {Function} props.onPaymentStart - Callback function called when payment starts
 * @param {Function} props.onPaymentSuccess - Callback function called on successful payment
 * @param {Function} props.onPaymentError - Callback function called on payment error
 */
const CheckoutButton = ({
  amount,
  currency = 'INR',
  productName,
  productId,
  keyId,
  customerDetails = {},
  buttonText = 'Buy Now',
  buttonClassName = '',
  disabled = false,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { loading, error, initiatePayment } = useRazorpayPayment();

  // Get Razorpay key from props or environment variable
  const razorpayKey = keyId || process.env.REACT_APP_RAZORPAY_KEY_ID;

  /**
   * Handles the buy now button click
   * Initiates the payment flow by creating order and opening checkout
   */
  const handleBuyNow = async () => {
    // Validation checks
    if (!amount || amount <= 0) {
      toast.error('Invalid amount specified');
      return;
    }

    if (!razorpayKey) {
      toast.error('Razorpay key not configured');
      return;
    }

    if (!productId) {
      toast.error('Product ID is required');
      return;
    }

    setIsProcessing(true);

    try {
      // Call onPaymentStart callback if provided
      if (onPaymentStart) {
        onPaymentStart();
      }

      // Prepare order data for backend
      const orderData = {
        amount: amount,
        currency: currency,
        product_id: productId,
        product_name: productName,
        customer_details: customerDetails,
        // Add any additional order metadata your backend needs
        metadata: {
          source: 'react_web_app',
          timestamp: new Date().toISOString(),
        },
      };

      // Prepare checkout options for Razorpay
      const checkoutOptions = {
        key_id: razorpayKey,
        amount: amount,
        currency: currency,
        name: 'Your Company Name', // Replace with your actual company name
        description: productName || 'Product Purchase',
        prefill: {
          name: customerDetails.name || '',
          email: customerDetails.email || '',
          contact: customerDetails.contact || '',
        },
        theme: {
          color: '#3399cc', // Customize this color
        },
      };

      // Initiate payment flow
      await initiatePayment({
        orderData,
        checkoutOptions,
      });

      // If we reach here, payment was initiated successfully
      toast.success('Payment initiated successfully!');
      
      // Call onPaymentSuccess callback if provided
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }

    } catch (error) {
      console.error('Payment initiation failed:', error);
      
      // Call onPaymentError callback if provided
      if (onPaymentError) {
        onPaymentError(error);
      }
      
      // Show error toast
      toast.error(`Payment failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine if button should be disabled
  const isButtonDisabled = disabled || loading || isProcessing || !razorpayKey;

  // Generate button text based on state
  const getButtonText = () => {
    if (loading || isProcessing) {
      return 'Processing...';
    }
    return buttonText;
  };

  return (
    <div className="checkout-button-container">
      {/* Error display */}
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      {/* Buy Now Button */}
      <button
        onClick={handleBuyNow}
        disabled={isButtonDisabled}
        className={`checkout-button ${buttonClassName}`}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          backgroundColor: isButtonDisabled ? '#ccc' : '#3399cc',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          minWidth: '120px',
          ...(isButtonDisabled ? {} : {
            ':hover': {
              backgroundColor: '#2980b9',
              transform: 'translateY(-1px)',
            },
          }),
        }}
      >
        {getButtonText()}
      </button>

      {/* Loading indicator */}
      {(loading || isProcessing) && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #3399cc',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Debug information (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginTop: '10px', 
          fontSize: '12px', 
          color: '#666',
          border: '1px solid #ddd',
          padding: '8px',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9'
        }}>
          <strong>Debug Info:</strong><br />
          Amount: {amount} {currency}<br />
          Product ID: {productId}<br />
          Razorpay Key: {razorpayKey ? 'Configured' : 'Missing'}<br />
          Customer: {customerDetails.name || 'Not provided'}
        </div>
      )}
    </div>
  );
};

export default CheckoutButton; 