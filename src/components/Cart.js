import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom'; // Added import for Link
import '../style/Cart.css';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch cart items from localStorage
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart);
    fetchCartProducts(storedCart);
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
        .select('id, name, price, images')
        .in('id', productIds)
        .eq('is_approved', true);

      if (error) throw error;

      if (data) {
        console.log('Cart products with images:', data);
        setProducts(data.map(product => ({
          ...product,
          images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
        })));
      }
    } catch (error) {
      console.error('Error fetching cart products:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = (productId) => {
    const updatedCart = cartItems.filter(item => item.id !== productId);
    setCartItems(updatedCart);
    setProducts(products.filter(product => product.id !== productId)); // Update products state
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const total = products.reduce((sum, product) => sum + (product.price || 0), 0);

  if (loading) return <div className="cart-loading">Loading...</div>;
  if (error) return <div className="cart-error">{error}</div>;

  return (
    <div className="cart">
      <h1 style={{ color: '#007bff' }}>Your Cart</h1>
      {cartItems.length === 0 ? (
        <p style={{ color: '#666' }}>Your cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {products.map((product) => (
              <div key={product.id} className="cart-item">
                <img 
                  src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
                  alt={product.name} 
                  onError={(e) => { 
                    e.target.src = 'https://dummyimage.com/150'; 
                    console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
                  }}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <h3 style={{ color: '#007bff' }}>{product.name}</h3>
                  <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <button 
                    onClick={() => removeFromCart(product.id)} 
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-total">
            <h2 style={{ color: '#007bff' }}>Total: ₹{total.toFixed(2).toLocaleString('en-IN')}</h2>
            <Link to="/checkout" className="checkout-btn">
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;