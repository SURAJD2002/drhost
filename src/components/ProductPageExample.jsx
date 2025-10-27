// import React, { useState, useEffect } from 'react';
// import CheckoutButton from './CheckoutButton';
// import toast from 'react-hot-toast';

// /**
//  * ProductPageExample Component
//  * Shows how to integrate CheckoutButton into a typical product page
//  * This is an example - modify according to your actual product page structure
//  */
// const ProductPageExample = ({ productId }) => {
//   const [product, setProduct] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [customerDetails, setCustomerDetails] = useState({
//     name: '',
//     email: '',
//     contact: ''
//   });

//   // Simulate fetching product data
//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         // Replace this with your actual API call
//         const mockProduct = {
//           id: productId || 'prod_123',
//           name: 'Premium Wireless Headphones',
//           price: 299900, // ₹2999 in paise
//           currency: 'INR',
//           description: 'High-quality wireless headphones with noise cancellation',
//           images: ['headphone1.jpg', 'headphone2.jpg'],
//           features: [
//             'Active Noise Cancellation',
//             '40-hour battery life',
//             'Bluetooth 5.0',
//             'Premium build quality'
//           ]
//         };
        
//         setProduct(mockProduct);
//       } catch (error) {
//         console.error('Error fetching product:', error);
//         toast.error('Failed to load product details');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProduct();
//   }, [productId]);

//   // Handle payment success
//   const handlePaymentSuccess = () => {
//     toast.success('Payment successful! Your order has been placed.');
//     // Add your success logic here:
//     // - Update order status
//     // - Clear cart
//     // - Redirect to order confirmation
//     // - Send confirmation email
//   };

//   // Handle payment error
//   const handlePaymentError = (error) => {
//     console.error('Payment failed:', error);
//     toast.error('Payment failed. Please try again or contact support.');
//     // Add your error handling logic here:
//     // - Log error for debugging
//     // - Show retry options
//     // - Contact support option
//   };

//   // Handle payment start
//   const handlePaymentStart = () => {
//     toast.info('Initiating payment...');
//     // Add your pre-payment logic here:
//     // - Validate customer details
//     // - Check inventory
//     // - Update cart/order status
//   };

//   // Validate customer details before payment
//   const validateCustomerDetails = () => {
//     if (!customerDetails.name || !customerDetails.email || !customerDetails.contact) {
//       toast.error('Please fill in all customer details');
//       return false;
//     }
    
//     // Basic email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(customerDetails.email)) {
//       toast.error('Please enter a valid email address');
//       return false;
//     }
    
//     // Basic phone validation (Indian format)
//     const phoneRegex = /^(\+91|0)?[789]\d{9}$/;
//     if (!phoneRegex.test(customerDetails.contact.replace(/\s/g, ''))) {
//       toast.error('Please enter a valid phone number');
//       return false;
//     }
    
//     return true;
//   };

//   // Custom payment handler with validation
//   const handleBuyNow = () => {
//     if (!validateCustomerDetails()) {
//       return;
//     }
    
//     // Payment will be handled by CheckoutButton component
//     toast.success('Proceeding to payment...');
//   };

//   if (loading) {
//     return (
//       <div style={{ textAlign: 'center', padding: '50px' }}>
//         <div style={{ 
//           display: 'inline-block',
//           width: '40px',
//           height: '40px',
//           border: '4px solid #f3f3f3',
//           borderTop: '4px solid #3498db',
//           borderRadius: '50%',
//           animation: 'spin 1s linear infinite'
//         }}></div>
//         <style>{`
//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }
//         `}</style>
//         <p>Loading product details...</p>
//       </div>
//     );
//   }

//   if (!product) {
//     return (
//       <div style={{ textAlign: 'center', padding: '50px' }}>
//         <h2>Product not found</h2>
//         <p>The requested product could not be loaded.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="product-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
//         {/* Product Images */}
//         <div className="product-images">
//           <div style={{ 
//             backgroundColor: '#f8f9fa', 
//             height: '400px', 
//             borderRadius: '8px',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             border: '1px solid #e9ecef'
//           }}>
//             <span style={{ color: '#6c757d', fontSize: '18px' }}>
//               Product Images Placeholder
//             </span>
//           </div>
//         </div>

//         {/* Product Details */}
//         <div className="product-details">
//           <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#333' }}>
//             {product.name}
//           </h1>
          
//           <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '20px' }}>
//             ₹{(product.price / 100).toFixed(2)}
//           </div>
          
//           <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
//             {product.description}
//           </p>

//           {/* Product Features */}
//           <div style={{ marginBottom: '30px' }}>
//             <h3 style={{ marginBottom: '15px', color: '#333' }}>Key Features</h3>
//             <ul style={{ listStyle: 'none', padding: 0 }}>
//               {product.features.map((feature, index) => (
//                 <li key={index} style={{ 
//                   padding: '8px 0', 
//                   borderBottom: '1px solid #f0f0f0',
//                   display: 'flex',
//                   alignItems: 'center'
//                 }}>
//                   <span style={{ 
//                     color: '#27ae60', 
//                     marginRight: '10px',
//                     fontSize: '18px'
//                   }}>✓</span>
//                   {feature}
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* Customer Details Form */}
//           <div style={{ 
//             backgroundColor: '#f8f9fa', 
//             padding: '20px', 
//             borderRadius: '8px',
//             marginBottom: '30px',
//             border: '1px solid #e9ecef'
//           }}>
//             <h3 style={{ marginBottom: '15px', color: '#333' }}>Customer Details</h3>
//             <div style={{ display: 'grid', gap: '15px' }}>
//               <input
//                 type="text"
//                 placeholder="Full Name"
//                 value={customerDetails.name}
//                 onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
//                 style={{ 
//                   padding: '10px', 
//                   border: '1px solid #ddd', 
//                   borderRadius: '4px',
//                   fontSize: '14px'
//                 }}
//               />
//               <input
//                 type="email"
//                 placeholder="Email Address"
//                 value={customerDetails.email}
//                 onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
//                 style={{ 
//                   padding: '10px', 
//                   border: '1px solid #ddd', 
//                   borderRadius: '4px',
//                   fontSize: '14px'
//                 }}
//               />
//               <input
//                 type="tel"
//                 placeholder="Phone Number"
//                 value={customerDetails.contact}
//                 onChange={(e) => setCustomerDetails(prev => ({ ...prev, contact: e.target.value }))}
//                 style={{ 
//                   padding: '10px', 
//                   border: '1px solid #ddd', 
//                   borderRadius: '4px',
//                   fontSize: '14px'
//                 }}
//               />
//             </div>
//           </div>

//           {/* Checkout Button */}
//           <div className="checkout-section">
//             <CheckoutButton
//               amount={product.price}
//               currency={product.currency}
//               productName={product.name}
//               productId={product.id}
//               customerDetails={customerDetails}
//               buttonText="Buy Now"
//               buttonClassName="large primary"
//               onPaymentStart={handlePaymentStart}
//               onPaymentSuccess={handlePaymentSuccess}
//               onPaymentError={handlePaymentError}
//             />
//           </div>

//           {/* Additional Information */}
//           <div style={{ 
//             marginTop: '30px', 
//             padding: '20px', 
//             backgroundColor: '#e8f5e8', 
//             borderRadius: '8px',
//             border: '1px solid #c3e6c3'
//           }}>
//             <h4 style={{ marginBottom: '10px', color: '#2d5a2d' }}>Why Choose Us?</h4>
//             <ul style={{ margin: 0, paddingLeft: '20px', color: '#2d5a2d' }}>
//               <li>Free shipping on orders above ₹999</li>
//               <li>30-day money-back guarantee</li>
//               <li>24/7 customer support</li>
//               <li>Secure payment processing</li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductPageExample; 


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CheckoutButton from './CheckoutButton';
import toast from 'react-hot-toast';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: '50px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProductPageExample = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    contact: '',
  });

  // Minimum loading duration to prevent rapid state changes
  const MIN_LOADING_DURATION = 500;

  // Simulate fetching product data with minimum loading duration
  useEffect(() => {
    let isMounted = true;
    const fetchProduct = async () => {
      const startTime = Date.now();
      try {
        // Replace with your actual API call
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
            'Premium build quality',
          ],
        };

        // Ensure minimum loading duration
        const elapsed = Date.now() - startTime;
        const remaining = MIN_LOADING_DURATION - elapsed;
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        if (isMounted) {
          setProduct(mockProduct);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        if (isMounted) {
          toast.error('Failed to load product details', {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: '500',
              borderRadius: '8px',
              padding: '12px',
            },
          });
          setProduct(null);
          setLoading(false);
        }
      }
    };

    if (!productId) {
      toast.error('Invalid product ID', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '8px',
          padding: '12px',
        },
      });
      setLoading(false);
      return;
    }

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Memoized event handlers
  const handlePaymentSuccess = useCallback(() => {
    toast.success('Payment successful! Your order has been placed.', {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#27ae60',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px',
      },
    });
    // Add success logic (e.g., update order, clear cart, redirect)
  }, []);

  const handlePaymentError = useCallback((error) => {
    console.error('Payment failed:', error);
    toast.error('Payment failed. Please try again or contact support.', {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#ff4d4f',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px',
      },
    });
    // Add error handling logic
  }, []);

  const handlePaymentStart = useCallback(() => {
    toast.info('Initiating payment...', {
      duration: 2000,
      position: 'top-center',
      style: {
        background: '#3498db',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px',
      },
    });
    // Add pre-payment logic
  }, []);

  const validateCustomerDetails = useCallback(() => {
    if (!customerDetails.name || !customerDetails.email || !customerDetails.contact) {
      toast.error('Please fill in all customer details', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '8px',
          padding: '12px',
        },
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerDetails.email)) {
      toast.error('Please enter a valid email address', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '8px',
          padding: '12px',
        },
      });
      return false;
    }

    const phoneRegex = /^(\+91|0)?[789]\d{9}$/;
    if (!phoneRegex.test(customerDetails.contact.replace(/\s/g, ''))) {
      toast.error('Please enter a valid phone number', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '8px',
          padding: '12px',
        },
      });
      return false;
    }

    return true;
  }, [customerDetails]);

  const handleBuyNow = useCallback(() => {
    if (!validateCustomerDetails()) {
      return;
    }
    toast.success('Proceeding to payment...', {
      duration: 2000,
      position: 'top-center',
      style: {
        background: '#27ae60',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px',
      },
    });
  }, [validateCustomerDetails]);

  // Memoized product data
  const productData = useMemo(() => product, [product]);

  // Unified render function with CSS transitions
  const renderContent = () => {
    if (loading) {
      return (
        <div
          className="loading-container"
          style={{
            textAlign: 'center',
            padding: '50px',
            opacity: loading ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
          <p style={{ marginTop: '10px', color: '#666' }}>Loading product details...</p>
        </div>
      );
    }

    if (!productData) {
      return (
        <div
          className="error-container"
          style={{
            textAlign: 'center',
            padding: '50px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            opacity: !loading ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <h2>Product not found</h2>
          <p>The requested product could not be loaded.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div
        className="product-page"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px',
          opacity: !loading ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* Product Images */}
          <div
            className="product-images"
            style={{
              backgroundColor: '#f8f9fa',
              height: '400px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e9ecef',
            }}
          >
            <span style={{ color: '#6c757d', fontSize: '18px' }}>
              Product Images Placeholder
            </span>
          </div>

          {/* Product Details */}
          <div className="product-details">
            <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#333' }}>
              {productData.name}
            </h1>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '20px' }}>
              ₹{(productData.price / 100).toFixed(2)}
            </div>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
              {productData.description}
            </p>

            {/* Product Features */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>Key Features</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {productData.features.map((feature, index) => (
                  <li
                    key={index}
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#27ae60', marginRight: '10px', fontSize: '18px' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Details Form */}
            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '30px',
                border: '1px solid #e9ecef',
              }}
            >
              <h3 style={{ marginBottom: '15px', color: '#333' }}>Customer Details</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={customerDetails.email}
                  onChange={(e) => setCustomerDetails((prev) => ({ ...prev, email: e.target.value }))}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={customerDetails.contact}
                  onChange={(e) => setCustomerDetails((prev) => ({ ...prev, contact: e.target.value }))}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Checkout Button */}
            <div className="checkout-section">
              <CheckoutButton
                amount={productData.price}
                currency={productData.currency}
                productName={productData.name}
                productId={productData.id}
                customerDetails={customerDetails}
                buttonText="Buy Now"
                buttonClassName="large primary"
                onPaymentStart={handlePaymentStart}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onClick={handleBuyNow}
              />
            </div>

            {/* Additional Information */}
            <div
              style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#e8f5e8',
                borderRadius: '8px',
                border: '1px solid #c3e6c3',
              }}
            >
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

  return (
    <ErrorBoundary>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-container, .error-container, .product-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
      `}</style>
      {renderContent()}
    </ErrorBoundary>
  );
};

export default React.memo(ProductPageExample);