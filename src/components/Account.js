import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  FaUser, FaBox, FaTruck, FaEdit, FaPlus, FaTrash, FaStore, FaUpload, 
  FaMapMarkerAlt, FaEnvelope, FaPhone 
} from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import '../style/Account.css';

function Account() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]); // For sellers only
  const [orders, setOrders] = useState([]);
  const [orderLocations, setOrderLocations] = useState({}); // Store resolved shipping location addresses
  const [buyerDetails, setBuyerDetails] = useState({}); // Store buyer shipping addresses and phone numbers
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false); // For buyer address
  const [showPhoneForm, setShowPhoneForm] = useState(false); // For buyer phone
  const [message, setMessage] = useState('');
  const [previewImages, setPreviewImages] = useState([]); 
  const [userLocation, setUserLocation] = useState(null); 
  const [shippingAddress, setShippingAddress] = useState(''); // Buyer’s shipping address
  const navigate = useNavigate();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchUserData();

    // Auto-detect user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          console.log('Detected location:', { lat: latitude, lon: longitude });
          const detectedAddress = await reverseGeocode(latitude, longitude);
          setShippingAddress(detectedAddress || 'Address not detected. Please enter manually.');
        },
        (geoError) => {
          console.error('Geolocation error:', geoError);
          setError('Unable to detect your location. Please enter your address manually.');
          setUserLocation(null);
          setShippingAddress('');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please enter your address manually.');
      setUserLocation(null);
      setShippingAddress('');
    }
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to access your account.');
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }
      setProfile(profileData);
      setUser(session.user);

      // Fetch orders based on user role (buyer or seller)
      let query = supabase.from('orders').select('*');
      if (profileData.is_seller) {
        query = query
          .eq('seller_id', session.user.id)
          .select('*, order_items!order_items_order_id_fkey(*, products(name, price))');
      } else {
        query = query
          .eq('user_id', session.user.id)
          .select('*, order_items!order_items_order_id_fkey(*, products(name, price))');
      }

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      // Resolve shipping locations for all orders
      const locations = {};
      for (const order of ordersData) {
        if (order.shipping_location) {
          locations[order.id] = await getLocationAddress(order.shipping_location);
        }
      }
      setOrderLocations(locations);

      const enrichedOrders = ordersData.map(order => ({
        ...order,
        order_items: order.order_items || [],
      }));
      setOrders(enrichedOrders);

      // If user is a seller, fetch seller data, products, and buyer details
      if (profileData.is_seller) {
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellers')
          .select('*, profiles(email, name)')
          .eq('id', session.user.id)
          .single();

        if (sellerError) {
          console.error('Error fetching seller data:', sellerError);
          throw sellerError;
        }
        setSeller(sellerData);

        // Fetch seller's products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', session.user.id)
          .eq('is_approved', true);

        if (productsError) {
          console.error('Error fetching products:', productsError);
          throw productsError;
        }
        setProducts(productsData || []);

        // Fetch buyer details (shipping address and phone number) for orders
        const buyerIds = [...new Set(ordersData.map(order => order.user_id))];
        if (buyerIds.length > 0) {
          const { data: buyerProfiles, error: buyerError } = await supabase
            .from('profiles')
            .select('id, shipping_address, phone_number')
            .in('id', buyerIds);

          if (buyerError) {
            console.error('Error fetching buyer details:', buyerError);
            throw buyerError;
          }
          const details = {};
          buyerProfiles.forEach(profile => {
            details[profile.id] = {
              shipping_address: profile.shipping_address || 'Not provided',
              phone_number: profile.phone_number || 'Not provided',
            };
          });
          setBuyerDetails(details);
        }
      }
    } catch (fetchError) {
      console.error('Error fetching account data:', fetchError);
      setError(`Error: ${fetchError.message || 'Failed to load account data. Please check your internet connection or try again later.'}`);
    } finally {
      setLoading(false);
    }
  };

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

  const getLocationAddress = async (point) => {
    try {
      const [lon, lat] = point.match(/[-0-9.]+/g); // Extract lon/lat from POINT
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      if (!response.ok) throw new Error('Geocoding failed');
      const data = await response.json();
      return data.display_name || point;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return point;
    }
  };

  const uploadImage = async (file) => {
    setLoading(true);
    try {
      if (!file) throw new Error('No file selected');
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Image must be less than 5MB');
      }

      // Unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`; // No "public/" prefix

      // Upload to "product-images" bucket
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        if (uploadError.status === 403) {
          throw new Error('Permission denied. You must be a seller to upload images.');
        } else if (uploadError.status === 413) {
          throw new Error('File too large. Maximum size is 5MB.');
        } else {
          throw new Error(uploadError.message || 'Upload failed');
        }
      }

      // Retrieve the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (uploadErr) {
      console.error('Error uploading image:', uploadErr);
      setError(`Error uploading image: ${uploadErr.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const invalidFiles = files.filter(file => 
        !file.type.startsWith('image/') || file.size > maxSize
      );

      if (invalidFiles.length > 0) {
        setError('All files must be images under 5MB');
        setPreviewImages([]);
        setValue('image', []);
        return;
      }

      setValue('image', files);
      setPreviewImages(files.map(file => URL.createObjectURL(file)));
    } else {
      setPreviewImages([]);
      setValue('image', []);
    }
  };

  const onSubmitProduct = async (formData) => {
    setLoading(true);
    try {
      if (!profile.is_seller) {
        setError('You do not have permission to add products.');
        setLoading(false);
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('location')
        .eq('id', user.id)
        .single();

      if (sellerError) {
        console.error('Error checking seller location:', sellerError);
        throw sellerError;
      }
      if (!sellerData.location) {
        setError('Please set your store location before adding products.');
        setLoading(false);
        return;
      }

      let imageUrls = [];
      if (formData.image && formData.image.length > 0) {
        const uploadPromises = formData.image.map(file => uploadImage(file));
        const results = await Promise.all(uploadPromises);
        imageUrls = results.filter(url => url !== null);
        
        if (imageUrls.length === 0 && results.length > 0) {
          throw new Error('Failed to upload all images');
        }
      }

      const { error: insertError } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          category_id: parseInt(formData.category_id, 10),
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
          images: imageUrls,
          is_approved: false, // Waits for admin approval
        });

      if (insertError) {
        console.error('Error inserting product:', insertError);
        throw insertError;
      }
      setMessage('Product added successfully! Awaiting approval.');
      reset();
      setShowProductForm(false);
      setPreviewImages([]);
      fetchUserData(); // Refresh the product list
    } catch (productErr) {
      console.error('Error adding product:', productErr);
      setError(`Error: ${productErr.message || 'Failed to add product. Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitDelivery = async (formData) => {
    setLoading(true);
    try {
      if (!profile.is_seller) {
        setError('You do not have permission to update delivery preferences.');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('sellers')
        .update({
          allows_long_distance: formData.allows_long_distance === 'yes',
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating delivery preferences:', updateError);
        throw updateError;
      }
      setMessage('Delivery preferences updated successfully!');
      setShowDeliveryForm(false);
      fetchUserData();
    } catch (delivErr) {
      console.error('Error updating delivery preferences:', delivErr);
      setError(`Error: ${delivErr.message || 'Failed to update delivery preferences. Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    setLoading(true);
    try {
      if (!profile.is_seller) {
        setError('You do not have permission to delete products.');
        setLoading(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('seller_id', user.id);

      if (deleteError) {
        console.error('Error deleting product:', deleteError);
        throw deleteError;
      }
      setMessage('Product deleted successfully!');
      fetchUserData();
    } catch (deleteErr) {
      console.error('Error deleting product:', deleteErr);
      setError(`Error: ${deleteErr.message || 'Failed to delete product. Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitLocation = async (formData) => {
    setLoading(true);
    try {
      if (!profile.is_seller) {
        setError('You do not have permission to update your store location.');
        setLoading(false);
        return;
      }

      const { error: locationError } = await supabase
        .from('sellers')
        .update({
          location: `POINT(${formData.lon} ${formData.lat})`,
        })
        .eq('id', user.id);

      if (locationError) {
        console.error('Error updating location:', locationError);
        throw locationError;
      }
      setMessage('Location updated successfully!');
      setShowLocationForm(false);
      fetchUserData();
    } catch (locErr) {
      console.error('Error updating location:', locErr);
      setError(`Error: ${locErr.message || 'Failed to update location. Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  };

  const openLocationForm = () => {
    if (userLocation) {
      setValue('lat', userLocation.lat);
      setValue('lon', userLocation.lon);
    }
    setShowLocationForm(true);
  };

  const handleOrderClick = (orderId) => {
    console.log('Navigating to order:', orderId); // Debug log
    navigate(`/order-details/${orderId}`);
  };

  const updateOrderStatus = async (orderId, status) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId)
        .eq('seller_id', user.id);

      if (error) throw error;
      setMessage('Order status updated successfully!');
      fetchUserData(); // Refresh orders
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(`Error: ${err.message || 'Failed to update order status. Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitAddress = async (formData) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to update your address.');
        setLoading(false);
        return;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ shipping_address: formData.address })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // Optionally update orders for consistency
      const { error: ordersError } = await supabase
        .from('orders')
        .update({ shipping_address: formData.address })
        .eq('user_id', session.user.id);

      if (ordersError) throw ordersError;

      setShippingAddress(formData.address);
      setMessage('Shipping address updated successfully!');
      setShowAddressForm(false);
    } catch (addressErr) {
      console.error('Error updating address:', addressErr);
      setError(`Error: ${addressErr.message || 'Failed to update address. Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  };

  const openAddressForm = () => {
    setShowAddressForm(true);
  };

  const onSubmitPhone = async (formData) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to update your phone number.');
        setLoading(false);
        return;
      }

      // Validate phone number
      const phoneRegex = /^[0-9+]{10,13}$/;
      if (!phoneRegex.test(formData.phone_number)) {
        setError('Invalid phone number format. Use +91XXXXXXXXXX or similar (10-13 digits).');
        setLoading(false);
        return;
      }

      // Update profile with new phone number
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone_number: formData.phone_number })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setMessage('Phone number updated successfully!');
      setProfile(prev => ({ ...prev, phone_number: formData.phone_number }));
      setShowPhoneForm(false);
    } catch (phoneErr) {
      console.error('Error updating phone number:', phoneErr);
      setError(`Error: ${phoneErr.message || 'Failed to update phone number. Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  };

  const openPhoneForm = () => {
    setShowPhoneForm(true);
    setValue('phone_number', profile.phone_number || '');
  };

  if (loading) return <div className="account-loading">Loading...</div>;
  if (error) return <div className="account-error">{error}</div>;
  if (!user) return <div className="account-error">You must be logged in to access your account.</div>;

  return (
    <div className="account">
      <h1 style={{ color: '#007bff' }}>Account Dashboard</h1>
      {message && <p className="account-message" style={{ color: '#666' }}>{message}</p>}

      <div className="account-sections">
        {/* Basic Profile Info */}
        <section className="account-section">
          <h2 style={{ color: '#007bff' }}><FaUser /> My Profile</h2>
          <p style={{ color: '#666' }}>Email: {user.email}</p>
          <p style={{ color: '#666' }}>Name: {profile.name || 'Not set (click Edit Profile to add)'}</p>
          <p style={{ color: '#666' }}>Phone Number: {profile.phone_number || 'Not provided'}</p>
          <Link to="/auth" className="edit-profile-btn">Edit Profile</Link>
          {!profile.is_seller && (
            <>
              <p style={{ color: '#666' }}>Shipping Address: {shippingAddress || 'Not set (click Edit Address to update)'}</p>
              <button onClick={openAddressForm} className="edit-btn">
                <FaEdit /> Edit Address
              </button>
              <button onClick={openPhoneForm} className="edit-btn">
                <FaPhone /> Edit Phone Number
              </button>
            </>
          )}
        </section>

        {/* Seller Functions */}
        {profile.is_seller && (
          <>
            <section className="account-section">
              <h2 style={{ color: '#007bff' }}><FaStore /> Store Details</h2>
              <p style={{ color: '#666' }}>Email: {seller.profiles.email}</p>
              <p style={{ color: '#666' }}>Store Name: {seller.store_name}</p>
              <p style={{ color: '#666' }}>Location: {seller.location ? 'Lat/Lon Set' : 'Not Set'}</p>
              <p style={{ color: '#666' }}>Long-Distance Delivery: {seller.allows_long_distance ? 'Yes' : 'No'}</p>
              <button onClick={openLocationForm} className="edit-btn">
                <FaEdit /> Edit Location
              </button>
              <button onClick={() => setShowDeliveryForm(true)} className="edit-btn">
                <FaEdit /> Edit Delivery
              </button>
            </section>

            <section className="account-section">
              <h2 style={{ color: '#007bff' }}><FaBox /> My Products</h2>
              <button onClick={() => setShowProductForm(true)} className="add-btn">
                <FaPlus /> Add Product
              </button>
              <div className="products-list">
                {products.map((product) => (
                  <div key={product.id} className="product-item">
                    <h3 style={{ color: '#007bff' }}>{product.name}</h3>
                    <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - Stock: {product.stock}</p>
                    <p style={{ color: '#666' }}>
                      Images:{' '}
                      {product.images.length > 0 ? (
                        product.images.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`${product.name} ${index + 1}`}
                            onError={(e) => { 
                              e.target.src = 'https://dummyimage.com/150'; 
                              console.error('Image load failed for:', product.name, 'URL:', img); 
                            }}
                            style={{ width: '100px', margin: '5px' }}
                          />
                        ))
                      ) : (
                        'No images'
                      )}
                    </p>
                    <button onClick={() => deleteProduct(product.id)} className="delete-btn">
                      <FaTrash /> Delete
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="account-section">
              <h2 style={{ color: '#007bff' }}><FaTruck /> My Orders</h2>
              <div className="orders-list">
                {orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="order-item" 
                    style={{ cursor: 'pointer' }}
                  >
                    <h3 style={{ color: '#007bff' }}>Order #{order.id}</h3>
                    <p style={{ color: '#666' }}>Total: ₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p style={{ color: '#666' }}>Payment Method: {order.payment_method}</p>
                    <p style={{ color: '#666' }}>Status: {order.order_status}</p>
                    <p style={{ color: '#666' }}>Shipping Location: {orderLocations[order.id] || 'Loading location...'}</p>
                    <p style={{ color: '#666' }}>Buyer Shipping Address: {buyerDetails[order.user_id]?.shipping_address || 'Not provided'}</p>
                    <p style={{ color: '#666' }}>Buyer Phone: {buyerDetails[order.user_id]?.phone_number || 'Not provided'}</p>
                    <select
                      value={order.order_status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      style={{ color: '#666', marginTop: '10px', padding: '5px', borderRadius: '8px' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <ul style={{ color: '#666' }}>
                      {order.order_items.map((item) => (
                        <li key={item.id}>
                          {item.products.name} - Quantity: {item.quantity} - Price: ₹{item.price_at_time.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => handleOrderClick(order.id)} className="view-btn" style={{ marginTop: '10px' }}>
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Buyer Functions */}
        {!profile.is_seller && (
          <section className="account-section">
            <h2 style={{ color: '#007bff' }}><FaTruck /> My Orders</h2>
            <div className="orders-list">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className="order-item" 
                  style={{ cursor: 'pointer' }}
                >
                  <h3 style={{ color: '#007bff' }}>Order #{order.id}</h3>
                  <p style={{ color: '#666' }}>Total: ₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p style={{ color: '#666' }}>Payment Method: {order.payment_method}</p>
                  <p style={{ color: '#666' }}>Status: {order.order_status}</p>
                  <p style={{ color: '#666' }}>Shipping Location: {orderLocations[order.id] || 'Loading location...'}</p>
                  <p style={{ color: '#666' }}>Shipping Address: {order.shipping_address || 'Not set (click Edit Address to update)'}</p>
                  <p style={{ color: '#666' }}>Phone Number: {profile.phone_number || 'Not provided'}</p>
                  <ul style={{ color: '#666' }}>
                    {order.order_items.map((item) => (
                      <li key={item.id}>
                        {item.products.name} - Quantity: {item.quantity} - Price: ₹{item.price_at_time.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleOrderClick(order.id)} className="view-btn" style={{ marginTop: '10px' }}>
                    View Details
                  </button>
                </div>
              ))}
            </div>
            {orders.length === 0 && <p style={{ color: '#666' }}>You have no orders yet.</p>}
          </section>
        )}
      </div>

      {/* Add Product Form (Seller Only) */}
      {showProductForm && profile.is_seller && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ color: '#007bff' }}>Add New Product</h2>
            <form onSubmit={handleSubmit(onSubmitProduct)}>
              <input
                {...register('name', { required: 'Product name is required' })}
                placeholder="Product Name"
                type="text"
                className="input-field"
              />
              {errors.name && <p className="error" style={{ color: '#ff0000' }}>{errors.name.message}</p>}

              <textarea
                {...register('description', { required: 'Description is required' })}
                placeholder="Description"
                className="input-field"
              />
              {errors.description && <p className="error" style={{ color: '#ff0000' }}>{errors.description.message}</p>}

              <input
                {...register('price', { required: 'Price is required', min: 0 })}
                placeholder="Price (₹)"
                type="number"
                step="0.01"
                className="input-field"
              />
              {errors.price && <p className="error" style={{ color: '#ff0000' }}>{errors.price.message}</p>}

              <input
                {...register('stock', { required: 'Stock is required', min: 0 })}
                placeholder="Stock Quantity"
                type="number"
                className="input-field"
              />
              {errors.stock && <p className="error" style={{ color: '#ff0000' }}>{errors.stock.message}</p>}

              <select
                {...register('category_id', { required: 'Category is required' })}
                className="input-field"
              >
                <option value="">Select Category</option>
                <option value="1">Electronics</option>
                <option value="2">Fashion</option>
                <option value="3">Groceries</option>
                {/* Add more categories as needed */}
              </select>
              {errors.category_id && <p className="error" style={{ color: '#ff0000' }}>{errors.category_id.message}</p>}

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageChange(e)}
                className="input-field file-input"
              />
              {errors.image && <p className="error" style={{ color: '#ff0000' }}>{errors.image.message}</p>}

              {previewImages.length > 0 && (
                <div className="image-preview">
                  {previewImages.map((preview, index) => (
                    <img
                      key={index}
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      style={{ width: '100px', margin: '5px' }}
                    />
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? 'Adding...' : 'Add Product'}
                </button>
                <button
                  onClick={() => {
                    setShowProductForm(false);
                    setPreviewImages([]);
                    reset();
                  }}
                  disabled={loading}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Delivery Preferences Form (Seller Only) */}
      {showDeliveryForm && profile.is_seller && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ color: '#007bff' }}>Edit Delivery Preferences</h2>
            <form onSubmit={handleSubmit(onSubmitDelivery)}>
              <label style={{ color: '#666' }}>
                Allow Long-Distance Delivery:
                <select {...register('allows_long_distance', { required: 'Selection is required' })} className="input-field">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              {errors.allows_long_distance && (
                <p className="error" style={{ color: '#ff0000' }}>{errors.allows_long_distance.message}</p>
              )}
              <div className="modal-actions">
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
                <button
                  onClick={() => setShowDeliveryForm(false)}
                  disabled={loading}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Location Form (Seller Only) */}
      {showLocationForm && profile.is_seller && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ color: '#007bff' }}>Edit Store Location</h2>
            <form onSubmit={handleSubmit(onSubmitLocation)}>
              <input
                {...register('lat', {
                  required: 'Latitude is required',
                  pattern: /^-?([1-8]?[0-9]\.?[0-9]*|90\.0*)$/,
                })}
                placeholder={userLocation ? `Detected: ${userLocation.lat}` : 'Latitude (e.g., 12.9753)'}
                type="number"
                step="0.0001"
                defaultValue={userLocation ? userLocation.lat : ''}
                className="input-field"
              />
              {errors.lat && <p className="error" style={{ color: '#ff0000' }}>{errors.lat.message}</p>}

              <input
                {...register('lon', {
                  required: 'Longitude is required',
                  pattern: /^-?([1]?[0-7]?[0-9]\.?[0-9]*|180\.0*)$/,
                })}
                placeholder={userLocation ? `Detected: ${userLocation.lon}` : 'Longitude (e.g., 77.591)'}
                type="number"
                step="0.0001"
                defaultValue={userLocation ? userLocation.lon : ''}
                className="input-field"
              />
              {errors.lon && <p className="error" style={{ color: '#ff0000' }}>{errors.lon.message}</p>}

              <div className="modal-actions">
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? 'Saving...' : 'Save Location'}
                </button>
                <button
                  onClick={() => setShowLocationForm(false)}
                  disabled={loading}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shipping Address Form (Buyer Only) */}
      {showAddressForm && !profile.is_seller && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ color: '#007bff' }}>Edit Shipping Address</h2>
            <form onSubmit={handleSubmit(onSubmitAddress)}>
              <textarea
                {...register('address', { required: 'Shipping address is required' })}
                placeholder={shippingAddress || 'Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)'}
                className="input-field"
                rows="3"
              />
              {errors.address && <p className="error" style={{ color: '#ff0000' }}>{errors.address.message}</p>}
              <div className="modal-actions">
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? 'Saving...' : 'Save Address'}
                </button>
                <button
                  onClick={() => setShowAddressForm(false)}
                  disabled={loading}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Phone Number Form (Buyer Only) */}
      {showPhoneForm && !profile.is_seller && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ color: '#007bff' }}>Edit Phone Number</h2>
            <form onSubmit={handleSubmit(onSubmitPhone)}>
              <input
                {...register('phone_number', {
                  required: 'Phone number is required',
                  pattern: /^[0-9+]{10,13}$/,
                })}
                placeholder="Phone Number (e.g., +919876543210)"
                type="tel"
                className="input-field"
              />
              {errors.phone_number && <p className="error" style={{ color: '#ff0000' }}>{errors.phone_number.message}</p>}
              <div className="modal-actions">
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? 'Saving...' : 'Save Phone Number'}
                </button>
                <button
                  onClick={() => setShowPhoneForm(false)}
                  disabled={loading}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Link */}
      <div className="support-section" style={{ marginTop: '20px', color: '#666' }}>
        <p>Need help? <Link to="/support" style={{ color: '#007bff' }}><FaEnvelope /> Contact Support</Link></p>
      </div>
    </div>
  );
}

export default Account;