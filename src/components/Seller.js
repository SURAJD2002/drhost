
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaStore, FaBox, FaTruck, FaPlus, FaTrash } from 'react-icons/fa';

function SellerDashboard() {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [locationStatus, setLocationStatus] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, variant_attributes')
        .order('id');
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Categories load karne mein error.");
    }
  }, []);

  const fetchSellerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Aapko login karna zaroori hai.");
        navigate('/auth');
        return;
      }
      const sellerId = session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', sellerId)
        .single();
      if (profileError) throw profileError;
      if (!profile?.is_seller) {
        setError("Aapke paas seller permissions nahi hain.");
        navigate('/account');
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('id, store_name, latitude, longitude, profiles(email, full_name, phone_number)')
        .eq('id', sellerId)
        .single();
      if (sellerError) throw sellerError;
      
      console.log('Fetched Seller Data:', sellerData);
      setSeller(sellerData);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_approved', true);
      if (productsError) throw productsError;
      setProducts(productsData || []);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*, products(title, price))')
        .eq('seller_id', sellerId);
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      setLocationStatus(sellerData.latitude && sellerData.longitude 
        ? `Location set: ${sellerData.latitude.toFixed(4)}, ${sellerData.longitude.toFixed(4)}`
        : 'Location not set');
    } catch (err) {
      console.error("Error fetching seller data:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const detectAndSetLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Aapka browser geolocation support nahi karta.');
      setLocationStatus('Geolocation not supported');
      return;
    }

    setLocationStatus('Detecting location...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          // Verify seller exists before setting location
          if (!seller?.id) {
            throw new Error('Seller ID not available');
          }

          const { data, error } = await supabase.rpc('set_seller_location', {
            seller_uuid: seller.id,
            user_lon: lon,
            user_lat: lat,
          });
          
          if (error) throw error;
          console.log('Location RPC Response:', data); // Debug RPC response

          setMessage('Location successfully set ya update ho gaya.');
          
          // Force fetch fresh data
          const updatedSeller = await fetchSellerData();
          console.log('Updated Seller after location set:', seller); // Debug updated data

          setLocationStatus(`Location set: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        } catch (err) {
          console.error('Location set error:', err);
          setError(`Location set karne mein error: ${err.message}`);
          setLocationStatus('Failed to set location');
        }
      },
      (geoError) => {
        let errorMsg = 'Location detect karne mein error: ';
        switch(geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMsg += 'Permission denied';
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMsg += 'Position unavailable';
            break;
          case geoError.TIMEOUT:
            errorMsg += 'Request timeout';
            break;
          default:
            errorMsg += 'Unknown error';
        }
        setError(errorMsg);
        setLocationStatus('Location detection failed');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [seller?.id, fetchSellerData]);

  useEffect(() => {
    fetchSellerData();
    fetchCategories();
    return () => {
      setSeller(null);
      setError(null);
    };
  }, [fetchSellerData, fetchCategories]);

  const deleteProduct = async (productId) => {
    if (!window.confirm("Kya aap is product ko delete karna chahte hain?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('seller_id', seller.id);
      if (error) throw error;

      setMessage("Product delete ho gaya!");
      await fetchSellerData();
    } catch (err) {
      setError(`Delete karne mein error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/order-details/${orderId}`);
  };

  const handleAddProduct = () => {
    console.log('Checking location:', {
      latitude: seller?.latitude,
      longitude: seller?.longitude,
      isSet: !!(seller?.latitude && seller?.longitude)
    });
    
    if (!seller?.latitude || !seller?.longitude) {
      setError('Pehle apna store location set karein.');
      return;
    }
    navigate('/seller/add-product');
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (error && !seller) return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;

  return (
    <div className="seller-dashboard" style={{ padding: '20px' }}>
      <h1>Seller Dashboard - {seller?.store_name || 'Loading...'}</h1>
      {message && <p style={{ color: 'green', marginBottom: '10px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

      <section style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h2><FaStore /> Store Details</h2>
        <p>Email: {seller?.profiles.email}</p>
        <p>Name: {seller?.profiles.full_name}</p>
        <p>
          Location: {seller?.latitude && seller?.longitude 
            ? `${seller.latitude.toFixed(4)}, ${seller.longitude.toFixed(4)}` 
            : 'Not Set'}
          <button
            onClick={detectAndSetLocation}
            disabled={loading || !seller}
            style={{
              marginLeft: '10px',
              backgroundColor: (loading || !seller) ? '#gray' : '#28a745',
              color: '#fff',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: (loading || !seller) ? 'not-allowed' : 'pointer',
            }}
          >
            {seller?.latitude && seller?.longitude ? 'Update Location' : 'Set Location'}
          </button>
        </p>
        {locationStatus && <p>Location Status: {locationStatus}</p>}
        {/* Debug info */}
        <p>Debug - Lat: {seller?.latitude || 'unset'}, Lon: {seller?.longitude || 'unset'}</p>
      </section>

      <section style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h2><FaBox /> My Products</h2>
        {!seller?.latitude || !seller?.longitude ? (
          <p style={{ color: 'red' }}>Pehle store location set karein product add karne ke liye.</p>
        ) : (
          <button
            onClick={handleAddProduct}
            disabled={loading}
            style={{
              marginBottom: '10px',
              backgroundColor: loading ? '#gray' : '#007bff',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <FaPlus /> Add Product
          </button>
        )}
        {products.length === 0 ? (
          <p>Koi products nahi hain.</p>
        ) : (
          <div>
            {products.map(prod => (
              <div key={prod.id} style={{ border: '1px solid #ddd', marginBottom: '10px', padding: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{prod.title}</h3>
                  <p>Price: ₹{prod.price || 'N/A'}</p>
                  <p>Stock: {prod.stock || 'N/A'}</p>
                  {prod.images && prod.images.length > 0 && (
                    prod.images.map((img, i) => (
                      <img key={i} src={img} alt={`Product ${i}`} style={{ width: '80px', marginRight: '5px', borderRadius: '3px' }} onError={(e) => (e.target.src = 'https://dummyimage.com/80')} />
                    ))
                  )}
                </div>
                <div>
                  <Link to={`/product/${prod.id}`} style={{ marginRight: '10px', color: '#007bff', textDecoration: 'none' }}>View</Link>
                  <button onClick={() => deleteProduct(prod.id)} disabled={loading} style={{ color: 'red', background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}><FaTrash /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h2><FaTruck /> Buyer Orders</h2>
        {orders.length === 0 ? (
          <p>Koi orders nahi hain.</p>
        ) : (
          <div>
            {orders.map(order => (
              <div key={order.id} style={{ border: '1px solid #ddd', marginBottom: '10px', padding: '10px', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#f9f9f9' }} onClick={() => handleOrderClick(order.id)}>
                <h3>Order #{order.id}</h3>
                <p>Total: ₹{order.total_amount || 'N/A'}</p>
                <p>Status: {order.order_status}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SellerDashboard;