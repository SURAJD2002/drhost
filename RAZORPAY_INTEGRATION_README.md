# Razorpay Integration for React E-commerce App

This document provides comprehensive instructions for integrating Razorpay payment gateway into your React e-commerce application.

## 🚀 Features

- **Secure Payment Processing**: Integrates with Razorpay's secure checkout system
- **Dynamic Script Loading**: Automatically loads Razorpay Checkout.js when needed
- **Comprehensive Error Handling**: Handles all payment states and errors gracefully
- **Customizable UI**: Flexible button styling and configuration options
- **Production Ready**: Includes proper error handling, loading states, and user feedback
- **TypeScript Support**: Full TypeScript definitions and JSDoc comments

## 📁 File Structure

```
src/
├── hooks/
│   └── useRazorpayPayment.js          # Custom hook for Razorpay integration
├── components/
│   ├── CheckoutButton.jsx             # Reusable checkout button component
│   └── RazorpayDemo.jsx              # Demo component (remove in production)
└── style/
    └── CheckoutButton.css             # Styling for checkout button
```

## 🛠️ Setup Instructions

### 1. Environment Variables

Create a `.env` file in your project root:

```bash
# Razorpay Configuration
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_test_key_here
REACT_APP_RAZORPAY_KEY_SECRET=your_secret_key_here

# Backend API URLs (if different from default)
REACT_APP_API_BASE_URL=http://localhost:3001
```

### 2. Backend API Endpoints

Ensure your backend has these endpoints:

#### Create Order Endpoint
```http
POST /create-order
Content-Type: application/json

{
  "amount": 100000,
  "currency": "INR",
  "product_id": "prod_123",
  "product_name": "Sample Product",
  "customer_details": {
    "name": "John Doe",
    "email": "john@example.com",
    "contact": "+919876543210"
  }
}
```

**Response:**
```json
{
  "order_id": "order_abc123",
  "amount": 100000,
  "currency": "INR",
  "status": "created"
}
```

#### Verify Payment Endpoint
```http
POST /verify-payment
Content-Type: application/json

{
  "razorpay_payment_id": "pay_abc123",
  "razorpay_order_id": "order_abc123",
  "razorpay_signature": "signature_hash_here"
}
```

**Response:**
```json
{
  "verified": true,
  "message": "Payment verified successfully"
}
```

## 🎯 Usage Examples

### Basic Implementation

```jsx
import CheckoutButton from './components/CheckoutButton';

function ProductPage() {
  const handlePaymentSuccess = () => {
    console.log('Payment successful!');
    // Handle success (e.g., redirect, update UI)
  };

  return (
    <div>
      <h1>Product Name</h1>
      <p>Price: ₹1000</p>
      
      <CheckoutButton
        amount={100000} // 1000 INR in paise
        currency="INR"
        productName="Product Name"
        productId="prod_123"
        customerDetails={{
          name: "John Doe",
          email: "john@example.com",
          contact: "+919876543210"
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
```

### Advanced Configuration

```jsx
<CheckoutButton
  amount={50000}
  currency="INR"
  productName="Premium Product"
  productId="prod_premium_456"
  customerDetails={{
    name: "Jane Smith",
    email: "jane@example.com",
    contact: "+919876543211"
  }}
  buttonText="Buy Premium"
  buttonClassName="large success"
  onPaymentStart={() => console.log('Payment starting...')}
  onPaymentSuccess={() => console.log('Payment successful!')}
  onPaymentError={(error) => console.error('Payment failed:', error)}
/>
```

### Using the Hook Directly

```jsx
import { useRazorpayPayment } from './hooks/useRazorpayPayment';

function CustomPaymentComponent() {
  const { loading, error, initiatePayment } = useRazorpayPayment();

  const handleCustomPayment = async () => {
    try {
      await initiatePayment({
        orderData: {
          amount: 100000,
          currency: 'INR',
          product_id: 'prod_123',
          // ... other order data
        },
        checkoutOptions: {
          key_id: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: 100000,
          currency: 'INR',
          name: 'Your Company',
          description: 'Product Purchase',
          // ... other checkout options
        }
      });
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <button onClick={handleCustomPayment} disabled={loading}>
      {loading ? 'Processing...' : 'Custom Payment'}
    </button>
  );
}
```

## 🔧 Component Props

### CheckoutButton Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `amount` | `number` | ✅ | - | Amount in smallest currency unit (paise for INR) |
| `currency` | `string` | ❌ | `'INR'` | Currency code (INR, USD, EUR, etc.) |
| `productName` | `string` | ❌ | - | Name of the product being purchased |
| `productId` | `string` | ✅ | - | Unique identifier for the product |
| `keyId` | `string` | ❌ | `process.env.REACT_APP_RAZORPAY_KEY_ID` | Razorpay public key |
| `customerDetails` | `object` | ❌ | `{}` | Customer information for prefill |
| `buttonText` | `string` | ❌ | `'Buy Now'` | Custom button text |
| `buttonClassName` | `string` | ❌ | `''` | Additional CSS classes |
| `disabled` | `boolean` | ❌ | `false` | Whether button should be disabled |
| `onPaymentStart` | `function` | ❌ | - | Callback when payment starts |
| `onPaymentSuccess` | `function` | ❌ | - | Callback on successful payment |
| `onPaymentError` | `function` | ❌ | - | Callback on payment error |

### Customer Details Object

```typescript
interface CustomerDetails {
  name?: string;      // Customer name
  email?: string;     // Customer email
  contact?: string;   // Customer phone number
}
```

## 🎨 Styling

The component includes comprehensive CSS with:

- **Responsive Design**: Works on all screen sizes
- **Loading States**: Visual feedback during payment processing
- **Error States**: Clear error message display
- **Hover Effects**: Interactive button animations
- **Accessibility**: Proper focus states and ARIA support

### Custom Styling

```css
/* Override default styles */
.checkout-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  border-radius: 25px;
  font-family: 'Your Custom Font', sans-serif;
}

/* Custom button variants */
.checkout-button.premium {
  background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
}
```

## 🔒 Security Considerations

### Frontend Security
- **Public Key Only**: Only the public key is exposed in frontend code
- **No Sensitive Data**: Payment details are handled by Razorpay's secure checkout
- **HTTPS Required**: Always use HTTPS in production

### Backend Security
- **Signature Verification**: Always verify payment signatures on backend
- **Secret Key Protection**: Keep secret keys secure and never expose them
- **Input Validation**: Validate all incoming data before processing

## 🧪 Testing

### Test Keys
Use Razorpay test keys for development:
- Test cards: 4111 1111 1111 1111
- Test UPI: success@razorpay
- Test netbanking: Test Bank

### Test Scenarios
1. **Successful Payment**: Use test card with valid details
2. **Failed Payment**: Use test card with insufficient funds
3. **Network Issues**: Test with slow/poor network conditions
4. **User Cancellation**: Test modal dismissal behavior

## 🚨 Error Handling

The integration handles various error scenarios:

- **Network Errors**: Connection failures and timeouts
- **API Errors**: Backend endpoint failures
- **Payment Failures**: Declined transactions
- **User Cancellation**: Modal dismissal
- **Script Loading Errors**: Razorpay script loading failures

## 📱 Mobile Support

- **Responsive Design**: Works on all mobile devices
- **Touch Optimized**: Proper touch targets and interactions
- **Mobile Checkout**: Razorpay's mobile-optimized checkout flow

## 🔄 State Management

The hook provides these states:

- `loading`: Payment processing state
- `error`: Error message if payment fails
- `initiatePayment`: Function to start payment flow
- `openCheckout`: Function to open Razorpay checkout directly

## 🎯 Best Practices

1. **Always verify payments** on your backend
2. **Use environment variables** for configuration
3. **Handle all payment states** (success, failure, cancellation)
4. **Provide clear user feedback** during payment process
5. **Test thoroughly** with Razorpay test keys
6. **Monitor payment logs** for debugging
7. **Implement retry logic** for failed payments
8. **Use proper error boundaries** in React

## 🐛 Troubleshooting

### Common Issues

1. **Script Loading Failed**
   - Check internet connection
   - Verify Razorpay CDN accessibility
   - Check browser console for errors

2. **Payment Verification Failed**
   - Verify backend endpoint is working
   - Check signature verification logic
   - Ensure correct secret key is used

3. **Order Creation Failed**
   - Verify backend API endpoint
   - Check request payload format
   - Ensure backend is running

4. **Checkout Not Opening**
   - Verify Razorpay key is correct
   - Check browser console for errors
   - Ensure all required props are provided

### Debug Mode

Enable debug information in development:

```jsx
// Debug info is automatically shown in development mode
<CheckoutButton
  // ... other props
  // Debug info will appear below the button
/>
```

## 📚 Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Checkout.js Reference](https://razorpay.com/docs/payments/payment-gateway/web-integration/checkout/)
- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
- [Payment Security Best Practices](https://razorpay.com/docs/payments/payment-gateway/web-integration/checkout/#security)

## 🤝 Support

For issues related to:
- **Razorpay Integration**: Check Razorpay documentation
- **React Component**: Review this README and code comments
- **Backend API**: Verify your backend implementation

## 📄 License

This integration is provided as-is for educational and commercial use. Ensure compliance with Razorpay's terms of service and your local payment regulations. 