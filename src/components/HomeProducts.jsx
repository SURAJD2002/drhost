// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FaShoppingCart } from 'react-icons/fa';
// import '../style/HomeProducts.css';

// // Product cards dynamically rendered here
// function HomeProducts({ products = [], addToCart, buyNow }) {
//   const navigate = useNavigate();

//   // Fallback for no products
//   if (!Array.isArray(products) || products.length === 0) {
//     return <div className="hp-no-products">No products available yet!</div>;
//   }

//   return (
//     <div className="hp-products-container">
//       {products.map((product) => {
//         const discount = product.original_price && product.offer_price
//           ? product.original_price - product.offer_price
//           : 0;

//         return (
//           <div
//             key={product.id}
//             className="hp-product-card"
//             onClick={() => navigate(`/product/${product.id}`)}
//             role="button"
//             tabIndex={0}
//             onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//             aria-label={`View ${product.name || 'product'}`}
//           >
//             <div className="hp-image-container">
//               {discount > 0 && (
//                 <div className="hp-offer-badge">
//                   <span>Offer!</span>
//                   <span>Save ₹{discount.toFixed(2)}</span>
//                 </div>
//               )}
//               <img
//                 src={product.images?.[0] || 'https://dummyimage.com/150'}
//                 alt={product.name || 'Product Image'}
//                 className="hp-product-image"
//                 loading="lazy"
//                 onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//               />
//             </div>
//             <div className="hp-product-info">
//               <h3 className="hp-product-name">{product.name || 'Unnamed Product'}</h3>
//               <p className="hp-product-seller">by {product.sellerName || 'Unknown Seller'}</p>
//               <div className="hp-price-container">
//                 <p className="hp-offer-price">
//                   ₹{product.offer_price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
//                 </p>
//                 {product.original_price && product.original_price > product.offer_price && (
//                   <p className="hp-original-price">
//                     ₹{product.original_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                 )}
//               </div>
//               <div className="hp-button-container">
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     addToCart(product);
//                   }}
//                   className={`hp-cart-button ${product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0)) ? 'hp-button-disabled' : ''}`}
//                   disabled={product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                   aria-label={`Add ${product.name || 'product'} to cart`}
//                 >
//                   <FaShoppingCart className="hp-button-icon" /> Add to Cart
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     buyNow(product);
//                   }}
//                   className={`hp-buy-button ${product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0)) ? 'hp-button-disabled' : ''}`}
//                   disabled={product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                   aria-label={`Buy ${product.name || 'product'} now`}
//                 >
//                   Buy Now
//                 </button>
//               </div>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// export default React.memo(HomeProducts);


// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FaShoppingCart } from 'react-icons/fa';
// import '../style/HomeProducts.css';

// // Product cards dynamically rendered here
// function HomeProducts({ products = [], addToCart, buyNow }) {
//   const navigate = useNavigate();

//   // Fallback for no products
//   if (!Array.isArray(products) || products.length === 0) {
//     return <div className="hp-no-products">No products available yet!</div>;
//   }

//   return (
//     <div className="hp-products-container">
//       {products.map((product) => {
//         const discount = product.original_price && product.offer_price
//           ? product.original_price - product.offer_price
//           : 0;

//         return (
//           <div
//             key={product.id}
//             className="hp-product-card"
//             onClick={() => navigate(`/product/${product.id}`)}
//             role="button"
//             tabIndex={0}
//             onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//             aria-label={`View ${product.name || 'product'}`}
//           >
//             <div className="hp-image-container">
//               {discount > 0 && (
//                 <div className="hp-offer-badge">
//                   <span>Offer!</span>
//                   <span>Save ₹{discount.toFixed(2)}</span>
//                 </div>
//               )}
//               <img
//                 src={product.images?.[0] || 'https://dummyimage.com/150'}
//                 alt={product.name || 'Product Image'}
//                 className="hp-product-image"
//                 loading="lazy"
//                 onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//               />
//             </div>
//             <div className="hp-product-info">
//               <h3 className="hp-product-name">{product.name || 'Unnamed Product'}</h3>
//               <div className="hp-price-container">
//                 <p className="hp-offer-price">
//                   ₹{product.offer_price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
//                 </p>
//                 {product.original_price && product.original_price > product.offer_price && (
//                   <p className="hp-original-price">
//                     ₹{product.original_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                 )}
//               </div>
//               <div className="hp-button-container">
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     addToCart(product);
//                   }}
//                   className={`hp-cart-button ${product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0)) ? 'hp-button-disabled' : ''}`}
//                   disabled={product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                   aria-label={`Add ${product.name || 'product'} to cart`}
//                 >
//                   <FaShoppingCart className="hp-button-icon" /> Add to Cart
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     buyNow(product);
//                   }}
//                   className={`hp-buy-button ${product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0)) ? 'hp-button-disabled' : ''}`}
//                   disabled={product.stock <= 0 || (product.variants?.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                   aria-label={`Buy ${product.name || 'product'} now`}
//                 >
//                   Buy Now
//                 </button>
//               </div>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// export default React.memo(HomeProducts);


import React from 'react';
import ProductCard from './ProductCard';
import '../style/Products.css'; // Import Products.css instead of HomeProducts.css

function HomeProducts({ products = [], addToCart, buyNow }) {
  // Fallback for no products
  if (!Array.isArray(products) || products.length === 0) {
    return <div className="hp-no-products">No products available yet!</div>;
  }

  return (
    <div className="prod-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          addToCart={addToCart}
          handleBuyNow={buyNow}
          categoryId={product.categoryId}
          categoryName={null} // Optional: Fetch category name if needed
        />
      ))}
    </div>
  );
}

export default React.memo(HomeProducts);