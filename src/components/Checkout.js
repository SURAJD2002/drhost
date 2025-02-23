import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../style/Checkout.css';

function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [location, setLocation] = useState(null); // Detected coordinates
  const [address, setAddress] = useState(''); // Detected or manual address
  const [manualAddress, setManualAddress] = useState(''); // Manual address input
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch cart items from localStorage
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart);
    fetchCartProducts(storedCart);

    // Auto-detect user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(userLocation);
          console.log('Detected location (coordinates):', userLocation);
          const detectedAddress = await reverseGeocode(userLocation.lat, userLocation.lon);
          setAddress(detectedAddress || 'Address not found. Please enter manually.');
        },
        (geoError) => {
          console.error('Geolocation error:', geoError);
          setError('Unable to detect your location. Please enter your address manually.');
          setLocation(null);
          setAddress('');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please enter your address manually.');
      setLocation(null);
      setAddress('');
    }
  }, []);

  const fetchCartProducts = async (cart) => {
    setLoading(true);
    try {
      if (cart.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch product details from Supabase using product IDs from cart
      const productIds = cart.map(item => item.id);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, images, seller_id')
        .in('id', productIds)
        .eq('is_approved', true);

      if (error) throw error;

      if (data) {
        console.log('Checkout products with images:', data);
        setProducts(data.map(product => ({
          ...product,
          images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
        })));
      }
    } catch (error) {
      console.error('Error fetching checkout products:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const total = products.reduce((sum, product) => sum + (product.price || 0), 0);

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      if (!response.ok) throw new Error('Reverse geocoding failed');
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name; // e.g., "123 Main St, Bangalore, Karnataka, India"
      }
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  };

  const handleManualAddressChange = (e) => {
    setManualAddress(e.target.value);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to place an order.');
        setLoading(false);
        return;
      }

      // Use detected coordinates if available, otherwise use a default
      const shippingLocation = location || {
        lat: 12.9753, // Default to Bengaluru
        lon: 77.591,
      };

      // Use detected address or manual address if provided
      const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India'; // Fallback

      // Simulate payment processing (replace with real payment gateway in production)
      if (!simulatePayment()) {
        throw new Error('Payment failed. Please try again.');
      }

      // Save order to Supabase (store both coordinates and address)
      const orderItems = products.map(product => ({
        product_id: product.id,
        quantity: 1, // Assuming 1 item per product in cart (adjust if quantities are tracked)
        price_at_time: product.price,
      }));

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          seller_id: products[0]?.seller_id, // Assuming all products have the same seller (adjust if needed)
          total_amount: total,
          payment_method: paymentMethod,
          order_status: 'Pending',
          shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`,
          shipping_address: finalAddress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(); // Add .select() to return the inserted data

      if (orderError) throw orderError;

      // Insert order items
      const orderItemsPayload = orderItems.map(item => ({
        order_id: orderData[0].id, // Use the ID from the inserted order
        ...item,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsPayload);

      if (itemsError) throw itemsError;

      // Clear cart
      setCartItems([]);
      setProducts([]);
      localStorage.setItem('cart', JSON.stringify([]));
      setOrderConfirmed(true);
      setError(null);

      // Redirect to the "My Orders" section of the Account page immediately
      navigate('/account');
    } catch (error) {
      console.error('Error during checkout:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = () => {
    // Simulate payment processing (replace with real payment gateway like Stripe)
    return Math.random() > 0.1; // 90% success rate for simulation
  };

  if (loading) return <div className="checkout-loading">Processing...</div>;
  if (error) return <div className="checkout-error">{error}</div>;
  if (orderConfirmed) return (
    <div className="checkout-success">
      <h1 style={{ color: '#007bff' }}>Order Confirmed!</h1>
      <p style={{ color: '#666' }}>Your order has been placed successfully. Redirecting to your account...</p>
    </div>
  );

  return (
    <div className="checkout">
      <h1 style={{ color: '#007bff' }}>Checkout</h1>
      {cartItems.length === 0 ? (
        <p style={{ color: '#666' }}>Your cart is empty</p>
      ) : (
        <>
          <div className="checkout-items">
            {products.map((product) => (
              <div key={product.id} className="checkout-item">
                <img 
                  src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
                  alt={product.name} 
                  onError={(e) => { 
                    e.target.src = 'https://dummyimage.com/150'; 
                    console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
                  }}
                  className="checkout-item-image"
                />
                <div className="checkout-item-details">
                  <h3 style={{ color: '#007bff' }}>{product.name}</h3>
                  <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="checkout-details">
            <h2 style={{ color: '#007bff' }}>Order Summary</h2>
            <p style={{ color: '#666' }}>Total: ₹{total.toFixed(2).toLocaleString('en-IN')}</p>

            <h3 style={{ color: '#007bff' }}>Shipping Address</h3>
            {location && address ? (
              <p style={{ color: '#666' }}>
                Detected Address: {address} (Coordinates: Lat {location.lat.toFixed(4)}, Lon {location.lon.toFixed(4)})
              </p>
            ) : (
              <p style={{ color: '#666' }}>Address not detected. Please enter manually.</p>
            )}
            <textarea
              value={manualAddress}
              onChange={handleManualAddressChange}
              placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
              className="address-input"
              rows="3"
            />

            <h3 style={{ color: '#007bff' }}>Payment Method</h3>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="payment-select"
            >
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="cash_on_delivery">Cash on Delivery</option>
            </select>

            <button onClick={handleCheckout} className="checkout-btn" disabled={loading}>
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Checkout;