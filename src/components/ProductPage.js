import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/ProductPage.css';

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // Detect user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(userLocation);
          fetchProduct(userLocation);
        },
        (error) => {
          console.error('Geolocation error:', error);
          const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
          setLocation(bengaluruLocation);
          fetchProduct(bengaluruLocation);
        }
      );
    } else {
      const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
      setLocation(bengaluruLocation);
      fetchProduct(bengaluruLocation);
    }

    // Fetch reviews
    fetchReviews();
  }, [id]);

  const fetchProduct = async (userLocation) => {
    setLoading(true);
    try {
      if (!userLocation || !id) return;

      // Fetch product with seller details and distance
      let { data, error: productError } = await supabase.rpc('nearby_products', {
        user_lon: userLocation.lon,
        user_lat: userLocation.lat,
        max_distance_meters: 20000,
        include_long_distance: true, // Allow long-distance products
      }).eq('id', parseInt(id, 10));

      if (productError) throw productError;

      if (data && data.length > 0) {
        setProduct(data[0]);
      } else {
        // Fallback to direct product query with seller details
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('*, sellers(location, allows_long_distance, store_name)')
          .eq('id', parseInt(id, 10))
          .eq('is_approved', true)
          .single();
        if (fallbackError) throw fallbackError;
        setProduct(fallbackData);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', parseInt(id, 10));
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError(`Error fetching reviews: ${error.message}`);
    }
  };

  const addToCart = () => {
    if (!product) return;
    const updatedCart = [...cart, product];
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    alert(`${product.name} added to cart!`);
  };

  const addToWishlist = () => {
    if (!product) return;
    if (!wishlist.some(item => item.id === product.id)) {
      const updatedWishlist = [...wishlist, product];
      setWishlist(updatedWishlist);
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      alert(`${product.name} added to wishlist!`);
    } else {
      alert(`${product.name} is already in your wishlist!`);
    }
  };

  if (loading) return <div className="product-loading">Loading...</div>;
  if (error) return <div className="product-error">{error}</div>;
  if (!product) return <p>Product not found</p>;

  return (
    <div className="product-page">
      <img 
        src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
        alt={product.name} 
        onError={(e) => { 
          e.target.src = 'https://dummyimage.com/150'; 
          console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
        }}
        style={{ width: '100%', maxWidth: '300px', height: 'auto', objectFit: 'cover', borderRadius: '8px', marginBottom: '20px' }}
      />
      <h1 style={{ color: '#007bff' }}>{product.name}</h1>
      <p style={{ color: '#666' }}>${product.price}</p>
      <p style={{ color: '#666' }}>{product.distance_km ? `${product.distance_km.toFixed(1)} km away${product.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` : 'Distance TBD'}</p>
      <p style={{ color: '#666' }}>{product.description || 'No description available'}</p>
      <div className="product-actions">
        <button onClick={addToCart} className="action-btn">Add to Cart</button>
        <button onClick={addToWishlist} className="action-btn">Add to Wishlist</button>
      </div>
      <div className="seller-details">
        <h2 style={{ color: '#007bff' }}>Seller Information</h2>
        <p style={{ color: '#666' }}>Store Name: {product.sellers?.store_name || 'Not available'}</p>
        <p style={{ color: '#666' }}>Location: {product.sellers?.location ? 'Lat/Lon Set' : 'Not Set'}</p>
        <p style={{ color: '#666' }}>Long-Distance Delivery: {product.sellers?.allows_long_distance ? 'Yes' : 'No'}</p>
        <Link to={`/seller/${product.seller_id}`} className="view-seller-btn">View Seller Profile</Link>
      </div>
      <div className="reviews-section">
        <h2 style={{ color: '#007bff' }}>Reviews</h2>
        {reviews.length === 0 ? (
          <p style={{ color: '#666' }}>No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review">
              <p style={{ color: '#666' }}><strong>{review.user_name || 'Anonymous'}</strong>: {review.rating}/5 - {review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProductPage;