import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationContext } from '../App';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import './Checkout.css';

const DEFAULT_LOCATION = { lat: 23.7408, lon: 86.4145 }; // Jharia, Dhanbad
const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';

// Helper function to group cart items by seller_id
const groupBySeller = (cartItems) => {
  return cartItems.reduce((acc, item) => {
    const sellerId = item.seller_id;
    if (!acc[sellerId]) {
      acc[sellerId] = {
        seller_id: sellerId,
        seller_name: item.seller_name || 'Unknown Seller',
        items: [],
        subtotal: 0
      };
    }
    acc[sellerId].items.push(item);
    acc[sellerId].subtotal += (item.price * item.qty);
    return acc;
  }, {});
};

// Reverse geocoding function using OpenStreetMap Nominatim
const reverseGeocode = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'Markeet/1.0' } }
    );
    
    if (!response.ok) throw new Error('Reverse geocoding failed');
    
    const data = await response.json();
    if (!data?.address) return null;

    const city = data.address.city || 
                 data.address.town || 
                 data.address.village || 
                 data.address.county || 
                 data.address.state || 
                 'Unknown City';
    
    const postalCode = data.address.postcode || '828111';
    const state = data.address.state || 'Jharkhand';
    const country = data.address.country || 'India';

    return `${city}, ${state} ${postalCode}, ${country}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

function Checkout() {
  const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
  const navigate = useNavigate();
  
  // State management
  const [cartItems, setCartItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [manualAddress, setManualAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newOrder, setNewOrder] = useState(null);

  // Initialize cart and location
  useEffect(() => {
    const initializeCheckout = async () => {
      // Get cart from localStorage
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      
      // Validate cart items format
      const validCart = storedCart.filter(
        item => item.id && typeof item.qty === 'number' && item.qty > 0 && item.seller_id
      );
      
      if (validCart.length === 0) {
        toast.error('Your cart is empty');
        navigate('/cart');
        return;
      }
      
      setCartItems(validCart);

      // Handle location
      if (buyerLocation) {
        setUserLocation(buyerLocation);
        const detectedAddress = await reverseGeocode(buyerLocation.lat, buyerLocation.lon);
        if (detectedAddress) {
          setManualAddress(detectedAddress);
        } else {
          setManualAddress(DEFAULT_ADDRESS);
        }
      } else {
        setUserLocation(DEFAULT_LOCATION);
        setManualAddress(DEFAULT_ADDRESS);
        toast.error('Unable to detect location; using default address.');
      }
    };

    initializeCheckout();
  }, [buyerLocation, navigate]);

  // Location detection handler
  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    toast.loading('Detecting location...', { duration: 2000 });

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;
      const newLocation = { lat: latitude, lon: longitude };
      
      setBuyerLocation(newLocation);
      setUserLocation(newLocation);
      
      const detectedAddress = await reverseGeocode(latitude, longitude);
      if (detectedAddress) {
        setManualAddress(detectedAddress);
        setAddressError('');
        toast.success('Address detected successfully!');
      } else {
        toast.error('Unable to detect your location. Please enter manually.');
      }
    } catch (error) {
      console.error('Location detection error:', error);
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location permissions.');
      } else if (error.code === 2) {
        toast.error('Location unavailable. Please try again.');
      } else if (error.code === 3) {
        toast.error('Location request timed out. Please try again.');
      } else {
        toast.error('Unable to detect your location. Please enter manually.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Address validation
  const validateAddress = useCallback((address) => {
    if (!address || address.trim().length < 10) {
      setAddressError('Please enter a complete address (at least 10 characters)');
      return false;
    } else if (address.trim().length > 500) {
      setAddressError('Address is too long. Please keep it under 500 characters.');
      return false;
    } else {
      setAddressError('');
      return true;
    }
  }, []);

  // Create orders in Supabase
  const createOrders = useCallback(async () => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const groupedCart = groupBySeller(cartItems);
    const newOrderIds = [];
    let orderTotal = 0;

    try {
      for (const [sellerId, sellerGroup] of Object.entries(groupedCart)) {
        console.log(`Creating order for seller: ${sellerId} with ${sellerGroup.items.length} items`);

        // Create order in Supabase
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: session.user.id,
            seller_id: sellerId,
            total: sellerGroup.subtotal,
            order_status: 'pending',
            payment_method: 'cash_on_delivery',
            shipping_address: manualAddress,
            estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (orderError) {
          throw new Error(`Failed to create order for seller ${sellerId}: ${orderError.message}`);
        }

        const orderId = orderData.id;
        newOrderIds.push(orderId);
        orderTotal += sellerGroup.subtotal;

        // Create order items
        const orderItems = sellerGroup.items.map(item => ({
          order_id: orderId,
          product_id: item.id,
          variant_id: item.variantId || null,
          quantity: item.qty || 1,
          price: item.price,
          title: item.title,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          throw new Error(`Failed to insert order items for order ${orderId}: ${itemsError.message}`);
        }

        console.log(`✅ Order created successfully: ID ${orderId} for seller ${sellerId}`);
      }

      console.log(`🎉 All orders created successfully! Total orders: ${newOrderIds.length}, Total amount: ₹${orderTotal}`);
      return { newOrderIds, total: orderTotal };
    } catch (error) {
      // Clean up partial orders if any
      if (newOrderIds.length > 0) {
        await supabase.from('orders').delete().in('id', newOrderIds);
        await supabase.from('order_items').delete().in('order_id', newOrderIds);
      }
      throw error;
    }
  }, [session, cartItems, manualAddress]);

  // Handle checkout
  const handleCheckout = async () => {
    if (!session?.user?.id) {
      toast.error('Please log in to proceed with checkout');
      navigate('/auth');
      return;
    }

    if (!validateAddress(manualAddress)) {
      return;
    }

    setLoading(true);
    try {
      const { newOrderIds, total: orderTotal } = await createOrders();
      
      setNewOrder({
        orderIds: newOrderIds,
        total: orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        shippingAddress: manualAddress,
      });
      
      setShowSuccess(true);
      localStorage.removeItem('cart');
      setCartItems([]);
      
      toast.success('Order placed successfully!');
      
      setTimeout(() => {
        navigate('/account', { state: { newOrderIds } });
      }, 3000);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(`Failed to place order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const groupedCart = groupBySeller(cartItems);
  const grandTotal = Object.values(groupedCart).reduce((sum, group) => sum + group.subtotal, 0);

  // Success screen
  if (showSuccess && newOrder) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <Helmet>
          <title>Order Successfully Placed - Markeet</title>
          <meta name="description" content="Your order has been successfully placed!" />
        </Helmet>
        
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-6">Thank you for your purchase! Your order has been confirmed.</p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
              <p className="text-sm text-gray-600 mb-1"><strong>Order ID(s):</strong> {newOrder.orderIds.join(', ')}</p>
              <p className="text-sm text-gray-600 mb-1"><strong>Total:</strong> ₹{newOrder.total}</p>
              <p className="text-sm text-gray-600"><strong>Shipping Address:</strong> {newOrder.shippingAddress}</p>
            </div>
            
            <p className="text-sm text-gray-500">Redirecting to your orders in a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart check
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some amazing products to your cart to proceed with checkout.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              🛍️ Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <title>Checkout - Markeet</title>
        <meta name="description" content="Complete your purchase with Cash on Delivery" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🛒 Secure Checkout</h1>
          <p className="text-gray-600">Complete your purchase with confidence</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Shipping Address */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">📍 Shipping Address</h2>
            
            <div className="space-y-4">
              <button
                onClick={handleDetectLocation}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                {loading ? '⏳ Detecting...' : '📍 Detect My Location'}
              </button>

              {userLocation && (
                <p className="text-sm text-gray-500">
                  Current location: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                </p>
              )}

              <div>
                <label htmlFor="shipping-address" className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Address *
                </label>
                <textarea
                  id="shipping-address"
                  value={manualAddress}
                  onChange={(e) => {
                    setManualAddress(e.target.value);
                    validateAddress(e.target.value);
                  }}
                  placeholder="Enter your full address (e.g., 123 Main St, Jharia, Dhanbad, Jharkhand, India)"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
                {addressError && <p className="text-red-500 text-sm mt-1">{addressError}</p>}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">📦 Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {Object.values(groupedCart).map((sellerGroup) => (
                <div key={sellerGroup.seller_id} className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    🏪 {sellerGroup.seller_name}
                  </h3>
                  
                  <div className="space-y-3">
                    {sellerGroup.items.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex items-center space-x-3">
                        <img
                          src={item.images?.[0] || '/default-product.jpg'}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = '/default-product.jpg';
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          ₹{(item.price * item.qty).toLocaleString('en-IN', { 
                            minimumFractionDigits: 2 
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 text-right">
                      Subtotal: ₹{sellerGroup.subtotal.toLocaleString('en-IN', { 
                        minimumFractionDigits: 2 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Method */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">💳 Payment Method</h3>
              <p className="text-sm text-gray-600">💵 Cash on Delivery (COD)</p>
            </div>

            {/* Total */}
            <div className="mb-6 p-4 bg-green-50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                <span className="text-xl font-bold text-green-600">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handleCheckout}
              disabled={loading || addressError || cartItems.length === 0 || grandTotal <= 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
            >
              {loading ? '⏳ Processing...' : '💵 Place Order (Cash on Delivery)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
