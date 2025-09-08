import React, { useState, useEffect } from 'react';
import CheckoutButton from './CheckoutButton';
import toast from 'react-hot-toast';

/**
 * ProductPageExample Component
 * Shows how to integrate CheckoutButton into a typical product page
 * This is an example - modify according to your actual product page structure
 */
const ProductPageExample = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    contact: ''
  });

  // Simulate fetching product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Replace this with your actual API call
        const mockProduct = {
          id: productId || 'prod_123',
          name: 'Premium Wireless Headphones',
          price: 299900, // ₹2999 in paise
          currency: 'INR',
          description: 'High-quality wireless headphones with noise cancellation',
          images: ['headphone1.jpg', 'headphone2.jpg'],
          features: [
            'Active Noise Cancellation',
            '40-hour battery life',
            'Bluetooth 5.0',
            'Premium build quality'
          ]
        };
        
        setProduct(mockProduct);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Handle payment success
  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Your order has been placed.');
    // Add your success logic here:
    // - Update order status
    // - Clear cart
    // - Redirect to order confirmation
    // - Send confirmation email
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    toast.error('Payment failed. Please try again or contact support.');
    // Add your error handling logic here:
    // - Log error for debugging
    // - Show retry options
    // - Contact support option
  };

  // Handle payment start
  const handlePaymentStart = () => {
    toast.info('Initiating payment...');
    // Add your pre-payment logic here:
    // - Validate customer details
    // - Check inventory
    // - Update cart/order status
  };

  // Validate customer details before payment
  const validateCustomerDetails = () => {
    if (!customerDetails.name || !customerDetails.email || !customerDetails.contact) {
      toast.error('Please fill in all customer details');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerDetails.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    // Basic phone validation (Indian format)
    const phoneRegex = /^(\+91|0)?[789]\d{9}$/;
    if (!phoneRegex.test(customerDetails.contact.replace(/\s/g, ''))) {
      toast.error('Please enter a valid phone number');
      return false;
    }
    
    return true;
  };

  // Custom payment handler with validation
  const handleBuyNow = () => {
    if (!validateCustomerDetails()) {
      return;
    }
    
    // Payment will be handled by CheckoutButton component
    toast.success('Proceeding to payment...');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ 
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Product not found</h2>
        <p>The requested product could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="product-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Product Images */}
        <div className="product-images">
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            height: '400px', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e9ecef'
          }}>
            <span style={{ color: '#6c757d', fontSize: '18px' }}>
              Product Images Placeholder
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="product-details">
          <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#333' }}>
            {product.name}
          </h1>
          
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '20px' }}>
            ₹{(product.price / 100).toFixed(2)}
          </div>
          
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
            {product.description}
          </p>

          {/* Product Features */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Key Features</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {product.features.map((feature, index) => (
                <li key={index} style={{ 
                  padding: '8px 0', 
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    color: '#27ae60', 
                    marginRight: '10px',
                    fontSize: '18px'
                  }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Details Form */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '30px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Customer Details</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              <input
                type="text"
                placeholder="Full Name"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                style={{ 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <input
                type="email"
                placeholder="Email Address"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                style={{ 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={customerDetails.contact}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, contact: e.target.value }))}
                style={{ 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Checkout Button */}
          <div className="checkout-section">
            <CheckoutButton
              amount={product.price}
              currency={product.currency}
              productName={product.name}
              productId={product.id}
              customerDetails={customerDetails}
              buttonText="Buy Now"
              buttonClassName="large primary"
              onPaymentStart={handlePaymentStart}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>

          {/* Additional Information */}
          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '8px',
            border: '1px solid #c3e6c3'
          }}>
            <h4 style={{ marginBottom: '10px', color: '#2d5a2d' }}>Why Choose Us?</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#2d5a2d' }}>
              <li>Free shipping on orders above ₹999</li>
              <li>30-day money-back guarantee</li>
              <li>24/7 customer support</li>
              <li>Secure payment processing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPageExample; 