import React, { useState } from 'react';
import CheckoutButton from './CheckoutButton';
import toast from 'react-hot-toast';

/**
 * RazorpayDemo Component
 * Demonstrates how to use the CheckoutButton component with different configurations
 * This is for demonstration purposes - you can remove this file in production
 */
const RazorpayDemo = () => {
  const [customerDetails, setCustomerDetails] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    contact: '+919876543210'
  });

  const [productDetails, setProductDetails] = useState({
    name: 'Sample Product',
    id: 'prod_123',
    price: 100000, // 1000 INR in paise
    currency: 'INR'
  });

  // Example usage of CheckoutButton with different configurations
  const handlePaymentStart = () => {
    console.log('Payment started for:', productDetails.name);
    toast.info('Initiating payment...');
  };

  const handlePaymentSuccess = () => {
    console.log('Payment successful!');
    toast.success('Payment completed successfully!');
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
  };

  return (
    <div className="razorpay-demo" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        Razorpay Integration Demo
      </h1>

      {/* Configuration Section */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#495057' }}>Configuration</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Product Name:</label>
            <input
              type="text"
              value={productDetails.name}
              onChange={(e) => setProductDetails(prev => ({ ...prev, name: e.target.value }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Product ID:</label>
            <input
              type="text"
              value={productDetails.id}
              onChange={(e) => setProductDetails(prev => ({ ...prev, id: e.target.value }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Amount (in paise):</label>
            <input
              type="number"
              value={productDetails.price}
              onChange={(e) => setProductDetails(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <small style={{ color: '#6c757d' }}>Amount in paise (100 paise = 1 INR)</small>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Currency:</label>
            <select
              value={productDetails.currency}
              onChange={(e) => setProductDetails(prev => ({ ...prev, currency: e.target.value }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="INR">INR (Indian Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Customer Name:</label>
            <input
              type="text"
              value={customerDetails.name}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email:</label>
            <input
              type="email"
              value={customerDetails.email}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone:</label>
            <input
              type="tel"
              value={customerDetails.contact}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, contact: e.target.value }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>

      {/* Demo Buttons Section */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '20px', color: '#495057' }}>Demo Buttons</h3>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Basic CheckoutButton */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ marginBottom: '15px', color: '#495057' }}>Basic Checkout Button</h4>
            <CheckoutButton
              amount={productDetails.price}
              currency={productDetails.currency}
              productName={productDetails.name}
              productId={productDetails.id}
              customerDetails={customerDetails}
              onPaymentStart={handlePaymentStart}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>

          {/* Custom Styled Button */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ marginBottom: '15px', color: '#495057' }}>Custom Styled Button</h4>
            <CheckoutButton
              amount={productDetails.price}
              currency={productDetails.currency}
              productName={productDetails.name}
              productId={productDetails.id}
              customerDetails={customerDetails}
              buttonText="Pay Now"
              buttonClassName="large success"
              onPaymentStart={handlePaymentStart}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>

          {/* Disabled Button Example */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ marginBottom: '15px', color: '#495057' }}>Disabled Button (Example)</h4>
            <CheckoutButton
              amount={productDetails.price}
              currency={productDetails.currency}
              productName={productDetails.name}
              productId={productDetails.id}
              customerDetails={customerDetails}
              buttonText="Disabled Button"
              disabled={true}
            />
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #bbdefb'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#1976d2' }}>Usage Instructions</h3>
        <ol style={{ marginLeft: '20px', lineHeight: '1.6' }}>
          <li><strong>Set Environment Variables:</strong> Add <code>REACT_APP_RAZORPAY_KEY_ID</code> to your .env file</li>
          <li><strong>Backend API:</strong> Ensure your backend has <code>/create-order</code> and <code>/verify-payment</code> endpoints</li>
          <li><strong>Amount:</strong> Pass amount in smallest currency unit (paise for INR, cents for USD)</li>
          <li><strong>Customer Details:</strong> Prefill customer information for better UX</li>
          <li><strong>Error Handling:</strong> Use callback functions to handle different payment states</li>
        </ol>
      </div>

      {/* Environment Setup */}
      <div style={{ 
        backgroundColor: '#fff3e0', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #ffcc02',
        marginTop: '20px'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#f57c00' }}>Environment Setup</h3>
        <p style={{ marginBottom: '10px' }}>Create a <code>.env</code> file in your project root:</p>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '4px', 
          overflow: 'auto',
          fontSize: '14px'
        }}>
{`REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_test_key_here
REACT_APP_RAZORPAY_KEY_SECRET=your_secret_key_here`}
        </pre>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          <strong>Note:</strong> Use test keys for development and live keys for production.
        </p>
      </div>
    </div>
  );
};

export default RazorpayDemo; 