import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/Products.css';

function Products() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const [products, setProducts] = useState([]);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(userLocation);
          fetchProducts(userLocation);
        },
        (error) => {
          console.error('Geolocation error:', error);
          const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
          setLocation(bengaluruLocation);
          fetchProducts(bengaluruLocation);
        }
      );
    } else {
      const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
      setLocation(bengaluruLocation);
      fetchProducts(bengaluruLocation);
    }
  }, [categoryId]);

  const fetchProducts = async (userLocation) => {
    if (!userLocation || !categoryId) return;

    try {
      console.log('Fetching products with location:', userLocation, 'for category:', categoryId);
      // First, try nearby products (20 km)
      let { data, error: rpcError } = await supabase.rpc('nearby_products', {
        user_lon: userLocation.lon,
        user_lat: userLocation.lat,
        max_distance_meters: 20000,
        include_long_distance: false,
      }).eq('category_id', parseInt(categoryId, 10)); // Ensure categoryId is an integer

      if (rpcError) {
        console.error('RPC error (nearby):', rpcError);
        setError(`Error fetching nearby products: ${rpcError.message}`);
      } else if (!data || data.length === 0) {
        console.log('No nearby products, fetching with long-distance...');
        // Fall back to long-distance products
        ({ data, error: rpcError } = await supabase.rpc('nearby_products', {
          user_lon: userLocation.lon,
          user_lat: userLocation.lat,
          max_distance_meters: 20000,
          include_long_distance: true,
        }).eq('category_id', parseInt(categoryId, 10)));
        if (rpcError) throw rpcError;
        console.log('Long-distance products:', data);
      }

      if (data) {
        console.log('Products with category_id and images:', data);
        setProducts(data.map(product => ({
          ...product,
          images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
        })));
      } else {
        // Fallback to all approved products in the category
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('id, category_id, name, price, images, sellers(location, allows_long_distance)')
          .eq('category_id', parseInt(categoryId, 10))
          .eq('is_approved', true);
        if (fallbackError) {
          console.error('Fallback error:', fallbackError);
          setError(`Fallback error: ${fallbackError.message}`);
          setProducts([]);
        } else {
          console.log('Fallback products with category_id and images:', fallbackData);
          setProducts(fallbackData.map(product => ({
            ...product,
            images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
          })));
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError(`Unexpected error: ${error.message}`);
      // Fallback to all approved products in the category
      const { data, error: fallbackError } = await supabase
        .from('products')
        .select('id, category_id, name, price, images, sellers(location, allows_long_distance)')
        .eq('category_id', parseInt(categoryId, 10))
        .eq('is_approved', true);
      if (fallbackError) console.error(fallbackError);
      else setProducts(data.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
      })));
    }
  };

  return (
    <div className="products-page">
      <h1>Products in Category</h1>
      <div className="product-grid">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img 
              src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
              alt={product.name} 
              onError={(e) => { 
                e.target.src = 'https://dummyimage.com/150'; 
                console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
              }}
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
            />
            <h3 style={{ color: '#007bff' }}>{product.name}</h3>
            <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p style={{ color: '#666' }}>
              {product.distance_km 
                ? `${product.distance_km.toFixed(1)} km away${product.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` 
                : 'Distance TBD'}
            </p>
            <p style={{ color: '#666' }}>Category ID: {product.category_id || 'Unknown'}</p>
            <Link to={`/product/${product.id}`} className="view-details-btn">
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;