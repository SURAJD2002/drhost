import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaShoppingCart } from 'react-icons/fa';
import Slider from 'react-slick'; // Import react-slick
import 'slick-carousel/slick/slick.css'; // Import slick-carousel CSS
import 'slick-carousel/slick/slick-theme.css'; // Import slick-carousel theme CSS
import '../style/Home.css';

function Home() {
  const [products, setProducts] = useState([]);
  const [bannerImages, setBannerImages] = useState([]); // State for banner images
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // State for search

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(userLocation);
          fetchNearbyProducts(userLocation);
          fetchBannerImages(); // Fetch banner images from bucket
        },
        (error) => {
          console.error('Geolocation error:', error);
          const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
          setLocation(bengaluruLocation);
          fetchNearbyProducts(bengaluruLocation);
          fetchBannerImages(); // Fetch banner images from bucket
        }
      );
    } else {
      const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
      setLocation(bengaluruLocation);
      fetchNearbyProducts(bengaluruLocation);
      fetchBannerImages(); // Fetch banner images from bucket
    }
  }, []);

  const fetchNearbyProducts = async (userLocation) => {
    setLoading(true);
    try {
      console.log('Fetching nearby products with location:', userLocation);
      let { data, error: rpcError } = await supabase.rpc('nearby_products', {
        user_lon: userLocation.lon,
        user_lat: userLocation.lat,
        max_distance_meters: 20000,
        include_long_distance: false,
      });

      if (rpcError) {
        console.error('RPC error (nearby):', rpcError);
        setError(`Error fetching nearby products: ${rpcError.message}`);
      } else if (!data || data.length === 0) {
        console.log('No nearby products, fetching with long-distance...');
        ({ data, error: rpcError } = await supabase.rpc('nearby_products', {
          user_lon: userLocation.lon,
          user_lat: userLocation.lat,
          max_distance_meters: 20000,
          include_long_distance: true,
        }));
        if (rpcError) throw rpcError;
        console.log('Long-distance products:', data);
      }

      if (data) {
        console.log('Products with images:', data);
        setProducts(data.map(product => ({
          ...product,
          images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
        })));
      } else {
        // Fallback to all approved products
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('id, category_id, name, price, images, sellers(location, allows_long_distance)')
          .eq('is_approved', true);
        if (fallbackError) {
          console.error('Fallback error:', fallbackError);
          setError(`Fallback error: ${fallbackError.message}`);
          setProducts([]);
        } else {
          console.log('Fallback products with images:', fallbackData);
          setProducts(fallbackData.map(product => ({
            ...product,
            images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
          })));
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError(`Unexpected error: ${error.message}`);
      // Fallback to all approved products
      const { data, error: fallbackError } = await supabase
        .from('products')
        .select('id, category_id, name, price, images, sellers(location, allows_long_distance)')
        .eq('is_approved', true);
      if (fallbackError) console.error(fallbackError);
      else setProducts(data.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
      })));
    } finally {
      setLoading(false);
    }
  };

  const fetchBannerImages = async () => {
    try {
      // List all files in the 'banner-images' bucket
      const { data, error } = await supabase.storage
        .from('banner-images')
        .list('', {
          limit: 3, // Limit to 3 banners (adjust as needed)
          sortBy: { column: 'name', order: 'asc' }, // Sort by name for consistency
        });

      if (error) throw error;

      if (data) {
        // Fetch public URLs for each banner image
        const bannerPromises = data.map(async (file) => {
          const { data: { publicUrl }, error: urlError } = supabase.storage
            .from('banner-images')
            .getPublicUrl(file.name);

          if (urlError) {
            console.error(`Error fetching banner image ${file.name}:`, urlError);
            return { url: 'https://dummyimage.com/1200x300?text=Banner+Image', name: file.name }; // Fallback
          }
          return { url: publicUrl, name: file.name };
        });

        const bannerImages = await Promise.all(bannerPromises);
        console.log('Banner images:', bannerImages);
        setBannerImages(bannerImages);
      }
    } catch (error) {
      console.error('Error fetching banner images:', error);
      setError(`Error fetching banner images: ${error.message}`);
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Slider settings for react-slick
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div className="home">
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Slide Banner (Carousel) with Product Links */}
      <div className="banner-slider">
        <Slider {...sliderSettings}>
          {bannerImages.map((banner, index) => (
            <Link key={index} to={`/product/${index + 1}`} className="banner-link"> {/* Example: Link to product 1, 2, 3 */}
              <div>
                <img 
                  src={banner.url} 
                  alt={`Banner ${banner.name}`} 
                  onError={(e) => { 
                    e.target.src = 'https://dummyimage.com/1200x300?text=Banner+Image'; 
                    console.error('Banner image load failed for:', banner.name, 'URL:', banner.url); 
                  }}
                  className="banner-image"
                />
                <p style={{ color: '#007bff', textAlign: 'center', padding: '10px' }}>Featured Product {index + 1}</p> {/* Adjust text as needed */}
              </div>
            </Link>
          ))}
        </Slider>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
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
              <Link to={`/product/${product.id}`} className="view-details-btn">
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
      <div className="cart-icon">
        <Link to="/cart"><FaShoppingCart size={30} color="#007bff" /></Link>
      </div>
    </div>
  );
}

export default Home;