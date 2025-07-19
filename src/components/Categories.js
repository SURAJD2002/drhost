// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState(null);

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     const { data, error } = await supabase
//       .from('categories')
//       .select('*')
//       .order('name');

//     if (error) console.error('Error fetching categories:', error);
//     else setCategories(data || []);
//   };

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleCategoryClick = (category) => {
//     setSelectedCategory(category);
//     // Navigate to products page for this category (e.g., /products?category=category.id)
//     // You can implement this with react-router or a new component
//     console.log(`Navigating to products for category: ${category.name}`);
//   };

//   return (
//     <div className="categories-page">
//       <h1>Shop by Category</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search categories..."
//           value={searchTerm}
//           onChange={handleSearch}
//         />
//       </div>
//       <div className="category-grid">
//         {filteredCategories.length === 0 ? (
//           <p>No categories found.</p>
//         ) : (
//           filteredCategories.map((category) => (
//             <div
//               key={category.id}
//               className={`category-card ${selectedCategory?.id === category.id ? 'selected' : ''}`}
//               onClick={() => handleCategoryClick(category)}
//             >
//               <h3>{category.name}</h3>
//               {category.parent_id && (
//                 <p>Subcategory of: {categories.find(c => c.id === category.parent_id)?.name}</p>
//               )}
//               <Link to={`/products?category=${category.id}`}>View Products</Link>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default Categories;


// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     const { data, error } = await supabase
//       .from('categories')
//       .select('*')
//       .order('name');

//     if (error) {
//       console.error('Error fetching categories:', error);
//       setError('Error fetching categories');
//     } else {
//       setCategories(data || []);
//       setError(null);
//     }
//   };

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleCategoryClick = (category) => {
//     setSelectedCategory(category);
//     console.log(`Navigating to products for category: ${category.name}`);
//     // You can add additional navigation logic here if desired
//   };

//   return (
//     <div className="categories-page">
//       <h1>Shop by Category</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search categories..."
//           value={searchTerm}
//           onChange={handleSearch}
//         />
//       </div>
//       {error && <p className="error-message">{error}</p>}
//       <div className="category-grid">
//         {filteredCategories.length === 0 ? (
//           <p>No categories found.</p>
//         ) : (
//           filteredCategories.map((category) => (
//             <div
//               key={category.id}
//               className={`category-card ${selectedCategory?.id === category.id ? 'selected' : ''}`}
//               onClick={() => handleCategoryClick(category)}
//             >
//               <h3>{category.name.trim()}</h3>
//               {category.parent_id && (
//                 <p>
//                   Subcategory of:{' '}
//                   {categories.find(c => c.id === category.parent_id)?.name || 'N/A'}
//                 </p>
//               )}
//               <Link to={`/products?category=${category.id}`}>View Products</Link>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default Categories;



// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     const { data, error } = await supabase
//       .from('categories')
//       .select('*')
//       .order('name');

//     if (error) {
//       console.error('Error fetching categories:', error);
//       setError('Error fetching categories');
//     } else {
//       setCategories(data || []);
//       setError(null);
//     }
//   };

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleCategoryClick = (category) => {
//     setSelectedCategory(category);
//     console.log(`Navigating to products for category: ${category.name}`);
//   };

//   return (
//     <div className="categories-page">
//       <h1>Shop by Category</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search categories..."
//           value={searchTerm}
//           onChange={handleSearch}
//         />
//       </div>
//       {error && <p className="error-message">{error}</p>}
//       <div className="category-grid">
//         {filteredCategories.length === 0 ? (
//           <p>No categories found.</p>
//         ) : (
//           filteredCategories.map((category) => (
//             <div
//               key={category.id}
//               className={`category-card ${selectedCategory?.id === category.id ? 'selected' : ''}`}
//               onClick={() => handleCategoryClick(category)}
//             >
//               <img
//                 src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'} // Default image agar URL na ho
//                 alt={category.name}
//                 className="category-image"
//               />
//               <h3>{category.name.trim()}</h3>
//               {category.parent_id && (
//                 <p>
//                   Subcategory of:{' '}
//                   {categories.find(c => c.id === category.parent_id)?.name || 'N/A'}
//                 </p>
//               )}
//               <Link to={`/products?category=${category.id}`} className="view-products-link">
//                 View Products
//               </Link>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default Categories;



// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     const { data, error } = await supabase
//       .from('categories')
//       .select('*')
//       .order('name');

//     if (error) {
//       console.error('Error fetching categories:', error);
//       setError('Error fetching categories');
//     } else {
//       setCategories(data || []);
//       setError(null);
//     }
//   };

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleCategoryClick = (category) => {
//     setSelectedCategory(category);
//     console.log(`Navigating to products for category: ${category.name}`);
//   };

//   return (
//     <div className="categories-page">
//       <header className="categories-header">
//         <h1>Shop by Category</h1>
//       </header>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search categories..."
//           value={searchTerm}
//           onChange={handleSearch}
//           className="search-input"
//         />
//       </div>
//       {error && <p className="error-message">{error}</p>}
//       <div className="category-grid">
//         {filteredCategories.length === 0 ? (
//           <p className="no-categories">No categories found.</p>
//         ) : (
//           filteredCategories.map((category) => (
//             <div
//               key={category.id}
//               className={`category-card ${selectedCategory?.id === category.id ? 'selected' : ''}`}
//               onClick={() => handleCategoryClick(category)}
//             >
//               <div className="category-image-wrapper">
//                 <img
//                   src={category.image_url || 'https://dummyimage.com/150x150/ccc/fff&text=No+Image'}
//                   alt={category.name}
//                   className="category-image"
//                 />
//               </div>
//               <h3 className="category-name">{category.name.trim()}</h3>
//               {category.parent_id && (
//                 <p className="category-parent">
//                   Subcategory of:{' '}
//                   {categories.find(c => c.id === category.parent_id)?.name || 'N/A'}
//                 </p>
//               )}
//               <Link to={`/products?category=${category.id}`} className="view-products-link">
//                 View Products
//               </Link>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default Categories;


// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';
// import Footer from './Footer';

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     const { data, error } = await supabase
//       .from('categories')
//       .select('*')
//       .order('name');

//     if (error) {
//       console.error('Error fetching categories:', error);
//       setError('Error fetching categories');
//     } else {
//       setCategories(data || []);
//       setError(null);
//     }
//   };

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleCategoryClick = (category) => {
//     setSelectedCategory(category);
//     console.log(`Navigating to products for category: ${category.name}`);
//   };

//   return (
//     <div className="categories-page">
//       <header className="categories-header">
//         <h1>Shop by Category</h1>
//       </header>
//       <div className="search-bar">
//         <input
//           type="text"
//           placeholder="Search categories..."
//           value={searchTerm}
//           onChange={handleSearch}
//           className="search-input"
//         />
//       </div>
//       {error && <p className="error-message">{error}</p>}
//       <div className="category-grid">
//         {filteredCategories.length === 0 ? (
//           <p className="no-categories">No categories found.</p>
//         ) : (
//           filteredCategories.map((category) => (
//             <div
//               key={category.id}
//               className={`category-card ${selectedCategory?.id === category.id ? 'selected' : ''}`}
//               onClick={() => handleCategoryClick(category)}
//               role="button"
//               tabIndex={0}
//               onKeyPress={(e) => e.key === 'Enter' && handleCategoryClick(category)}
//               aria-label={`Select ${category.name} category`}
//             >
//               <div className="category-image-wrapper">
//                 <img
//                   src={category.image_url || 'https://via.placeholder.com/150x150?text=Category'}
//                   alt={category.name}
//                   className="category-image"
//                 />
//               </div>
//               <h3 className="category-name">{category.name.trim()}</h3>
//               {category.parent_id && (
//                 <p className="category-parent">
//                   Subcategory of:{' '}
//                   {categories.find(c => c.id === category.parent_id)?.name || 'N/A'}
//                 </p>
//               )}
//               <Link to={`/products?category=${category.id}`} className="view-products-link">
//                 View Products
//               </Link>
//             </div>
//           ))
//         )}
//       </div>
//       <Footer />
//     </div>
//   );
// }

// export default Categories;



// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';
// import Footer from './Footer';

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     const { data, error } = await supabase
//       .from('categories')
//       .select('*')
//       .order('name');

//     if (error) {
//       console.error('Error fetching categories:', error);
//       setError('Error fetching categories');
//     } else {
//       setCategories(data || []);
//       setError(null);
//     }
//   };

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleCategoryClick = (category) => {
//     setSelectedCategory(category);
//     console.log(`Navigating to products for category: ${category.name}`);
//   };

//   return (
//     <div className="cat-page">
//       <header className="cat-header">
//         <h1>Shop by Category</h1>
//       </header>
//       <div className="cat-search-bar">
//         <input
//           type="text"
//           placeholder="Search categories..."
//           value={searchTerm}
//           onChange={handleSearch}
//           className="cat-search-input"
//         />
//       </div>
//       {error && <p className="cat-error-message">{error}</p>}
//       <div className="cat-grid">
//         {filteredCategories.length === 0 ? (
//           <p className="cat-no-categories">No categories found.</p>
//         ) : (
//           filteredCategories.map((category) => (
//             <div
//               key={category.id}
//               className={`cat-card ${selectedCategory?.id === category.id ? 'cat-selected' : ''}`}
//               onClick={() => handleCategoryClick(category)}
//               role="button"
//               tabIndex={0}
//               onKeyPress={(e) => e.key === 'Enter' && handleCategoryClick(category)}
//               aria-label={`Select ${category.name} category`}
//             >
//               <div className="cat-image-wrapper">
//                 <img
//                   src={category.image_url || 'https://via.placeholder.com/150x150?text=Category'}
//                   alt={category.name}
//                   className="cat-image"
//                 />
//               </div>
//               <h3 className="cat-name">{category.name.trim()}</h3>
//               {category.parent_id && (
//                 <p className="cat-parent">
//                   Subcategory of:{' '}
//                   {categories.find(c => c.id === category.parent_id)?.name || 'N/A'}
//                 </p>
//               )}
//               <Link to={`/products?category=${category.id}`} className="cat-view-products-link">
//                 View Products
//               </Link>
//             </div>
//           ))
//         )}
//       </div>
//       <Footer />
//     </div>
//   );
// }

// export default Categories;


// import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';
// import Footer from './Footer';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name');

//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Error fetching categories. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Debounced search handler
//   const handleSearch = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleCategoryClick = (category) => {
//     setSelectedCategory(category);
//     console.log(`Navigating to products for category: ${category.name}`);
//   };

//   return (
//     <div className="cat-page">
//       <header className="cat-header">
//         <h1 className="cat-title">Shop by Category</h1>
//       </header>
//       <div className="cat-search-bar">
//         <input
//           type="text"
//           placeholder="Search categories..."
//           onChange={(e) => handleSearch(e.target.value)}
//           className="cat-search-input"
//           aria-label="Search categories"
//         />
//       </div>
//       {error && <p className="cat-error-message">{error}</p>}
//       <div className="cat-grid">
//         {loading ? (
//           [...Array(6)].map((_, i) => (
//             <div key={`skeleton-${i}`} className="cat-card-skeleton">
//               <div className="skeleton-image" />
//               <div className="skeleton-text" />
//               <div className="skeleton-text short" />
//               <div className="skeleton-link" />
//             </div>
//           ))
//         ) : filteredCategories.length === 0 ? (
//           <p className="cat-no-categories">No categories found.</p>
//         ) : (
//           filteredCategories.map((category) => (
//             <div
//               key={category.id}
//               className={`cat-card ${selectedCategory?.id === category.id ? 'cat-selected' : ''}`}
//               onClick={() => handleCategoryClick(category)}
//               role="button"
//               tabIndex={0}
//               onKeyPress={(e) => e.key === 'Enter' && handleCategoryClick(category)}
//               aria-label={`Select ${category.name} category`}
//             >
//               <div className="cat-image-wrapper">
//                 <img
//                   src={category.image_url || 'https://via.placeholder.com/150x150?text=Category'}
//                   alt={category.name}
//                   className="cat-image"
//                   onError={(e) => (e.target.src = 'https://via.placeholder.com/150x150?text=Category')}
//                 />
//               </div>
//               <h3 className="cat-name">{category.name.trim()}</h3>
//               {category.parent_id && (
//                 <p className="cat-parent">
//                   Subcategory of:{' '}
//                   {categories.find(c => c.id === category.parent_id)?.name || 'N/A'}
//                 </p>
//               )}
//               <Link
//                 to={`/products?category=${category.id}`}
//                 className="cat-view-products-link"
//                 aria-label={`View products in ${category.name} category`}
//               >
//                 View Products
//               </Link>
//             </div>
//           ))
//         )}
//       </div>
//       <Footer />
//     </div>
//   );
// }

// export default Categories;



// import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async'; // Added

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name');

//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Error fetching categories. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Debounced search handler
//   const handleSearch = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleCategoryClick = (category) => {
//     setSelectedCategory(category);
//     console.log(`Navigating to products for category: ${category.name}`);
//   };

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/categories';
//   const categoryList = categories.map(category => ({
//     "@type": "ListItem",
//     position: categories.indexOf(category) + 1,
//     name: category.name,
//     item: `https://www.markeet.com/products?category=${category.id}`,
//   }));

//   return (
//     <div className="cat-page">
//       <Helmet>
//         <title>Shop by Category - Markeet</title>
//         <meta
//           name="description"
//           content="Explore electronics, appliances, fashion, jewellery, gifts, and home decoration categories on Markeet. Shop local with fast delivery."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, categories, Markeet"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shop by Category - Markeet" />
//         <meta
//           property="og:description"
//           content="Explore electronics, appliances, fashion, jewellery, gifts, and home decoration categories on Markeet."
//         />
//         <meta property="og:image" content="https://via.placeholder.com/150x150?text=Category" />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shop by Category - Markeet" />
//         <meta
//           name="twitter:description"
//           content="Explore electronics, appliances, fashion, jewellery, gifts, and home decoration categories on Markeet."
//         />
//         <meta name="twitter:image" content="https://via.placeholder.com/150x150?text=Category" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "ItemList",
//             itemListElement: categoryList,
//           })}
//         </script>
//       </Helmet>

//       <header className="cat-header">
//         <h1 className="cat-title">Shop by Category</h1>
//       </header>
//       <div className="cat-search-bar">
//         <input
//           type="text"
//           placeholder="Search categories..."
//           onChange={(e) => handleSearch(e.target.value)}
//           className="cat-search-input"
//           aria-label="Search categories"
//         />
//       </div>
//       {error && <p className="cat-error-message">{error}</p>}
//       <div className="cat-grid">
//         {loading ? (
//           [...Array(6)].map((_, i) => (
//             <div key={`skeleton-${i}`} className="cat-card-skeleton">
//               <div className="skeleton-image" />
//               <div className="skeleton-text" />
//               <div className="skeleton-text short" />
//               <div className="skeleton-link" />
//             </div>
//           ))
//         ) : filteredCategories.length === 0 ? (
//           <p className="cat-no-categories">No categories found.</p>
//         ) : (
//           filteredCategories.map((category) => (
//             <div
//               key={category.id}
//               className={`cat-card ${selectedCategory?.id === category.id ? 'cat-selected' : ''}`}
//               onClick={() => handleCategoryClick(category)}
//               role="button"
//               tabIndex={0}
//               onKeyPress={(e) => e.key === 'Enter' && handleCategoryClick(category)}
//               aria-label={`Select ${category.name} category`}
//             >
//               <div className="cat-image-wrapper">
//                 <img
//                   src={category.image_url || 'https://via.placeholder.com/150x150?text=Category'}
//                   alt={`${category.name} category image`}
//                   className="cat-image"
//                   onError={(e) => (e.target.src = 'https://via.placeholder.com/150x150?text=Category')}
//                 />
//               </div>
//               <h3 className="cat-name">{category.name.trim()}</h3>
//               {category.parent_id && (
//                 <p className="cat-parent">
//                   Subcategory of:{' '}
//                   {categories.find(c => c.id === category.parent_id)?.name || 'N/A'}
//                 </p>
//               )}
//               <Link
//                 to={`/products?category=${category.id}`}
//                 className="cat-view-products-link"
//                 aria-label={`View products in ${category.name} category`}
//               >
//                 View Products
//               </Link>
//             </div>
//           ))
//         )}
//       </div>
//       <Footer />
//     </div>
//   );
// }

// export default Categories;



// import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('*')
//         .order('name');

//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Error fetching categories. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Debounced search handler
//   const handleSearch = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/categories';
//   const categoryList = categories.map(category => ({
//     "@type": "ListItem",
//     position: categories.indexOf(category) + 1,
//     name: category.name,
//     item: `https://www.markeet.com/products?category=${category.id}`,
//   }));

//   return (
//     <div className="cat-page">
//       <Helmet>
//         <title>Shop by Category - Markeet</title>
//         <meta
//           name="description"
//           content="Explore electronics, appliances, fashion, jewellery, gifts, and home decoration categories on Markeet. Shop local with fast delivery."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, categories, Markeet"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shop by Category - Markeet" />
//         <meta
//           property="og:description"
//           content="Explore electronics, appliances, fashion, jewellery, gifts, and home decoration categories on Markeet."
//         />
//         <meta property="og:image" content="https://via.placeholder.com/150x150?text=Category" />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shop by Category - Markeet" />
//         <meta
//           name="twitter:description"
//           content="Explore electronics, appliances, fashion, jewellery, gifts, and home decoration categories on Markeet."
//         />
//         <meta name="twitter:image" content="https://via.placeholder.com/150x150?text=Category" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "ItemList",
//             itemListElement: categoryList,
//           })}
//         </script>
//       </Helmet>

//       <header className="cat-header">
//         <h1 className="cat-title">Shop by Category</h1>
//       </header>
//       <div className="cat-search-bar">
//         <input
//           type="text"
//           placeholder="Search categories..."
//           onChange={(e) => handleSearch(e.target.value)}
//           className="cat-search-input"
//           aria-label="Search categories"
//         />
//       </div>
//       {error && <p className="cat-error-message">{error}</p>}
//       <div className="cat-grid">
//         {loading ? (
//           [...Array(6)].map((_, i) => (
//             <div key={`skeleton-${i}`} className="cat-card-skeleton">
//               <div className="skeleton-image" />
//               <div className="skeleton-text" />
//               <div className="skeleton-text short" />
//             </div>
//           ))
//         ) : filteredCategories.length === 0 ? (
//           <p className="cat-no-categories">No categories found.</p>
//         ) : (
//           filteredCategories.map((category) => (
//             <Link
//               to={`/products?category=${category.id}`}
//               key={category.id}
//               className="cat-card"
//               role="button"
//               tabIndex={0}
//               aria-label={`View products in ${category.name} category`}
//             >
//               <div className="cat-image-wrapper">
//                 <img
//                   src={category.image_url || 'https://via.placeholder.com/150x150?text=Category'}
//                   alt={`${category.name} category image`}
//                   className="cat-image"
//                   onError={(e) => (e.target.src = 'https://via.placeholder.com/150x150?text=Category')}
//                   loading="lazy"
//                 />
//               </div>
//               <h3 className="cat-name">{category.name.trim()}</h3>
//               {category.parent_id && (
//                 <p className="cat-parent">
//                   Subcategory of:{' '}
//                   {categories.find(c => c.id === category.parent_id)?.name || 'N/A'}
//                 </p>
//               )}
//             </Link>
//           ))
//         )}
//       </div>
//       <Footer />
//     </div>
//   );
// }

// export default Categories;


// import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Check network connectivity
//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
//         duration: 3000,
//         position: 'top-center',
//       });
//       return false;
//     }
//     return true;
//   };

//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, image_url, parent_id, is_restricted')
//         .order('name');
//       if (error) throw error;
//       console.log('Fetched categories:', data); // Debug log
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Error fetching categories. Please try again.');
//       toast.error('Failed to load categories.', { duration: 3000, position: 'top-center' });
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Debounced search handler
//   const handleSearch = useCallback(
//     debounce((value) => {
//       setSearchTerm(value);
//     }, 300),
//     []
//   );

//   const filteredCategories = categories.filter(category =>
//     category.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/categories';
//   const categoryList = categories.map(category => ({
//     '@type': 'ListItem',
//     position: categories.indexOf(category) + 1,
//     name: category.name,
//     item: `https://www.markeet.com/products?category=${category.id}`,
//   }));

//   // Use first category image for SEO if available
//   const seoImage = categories[0]?.image_url || 'https://via.placeholder.com/150x150?text=Category';

//   return (
//     <div className="cat-page">
//       <Helmet>
//         <title>Shop by Category - Markeet</title>
//         <meta
//           name="description"
//           content="Explore electronics, appliances, fashion, jewellery, groceries, gifts, and home decoration categories on Markeet. Shop local with fast delivery."
//         />
//         <meta
//           name="keywords"
//           content="ecommerce, electronics, appliances, fashion, jewellery, groceries, gift, home decoration, categories, Markeet"
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shop by Category - Markeet" />
//         <meta
//           property="og:description"
//           content="Explore electronics, appliances, fashion, jewellery, groceries, gifts, and home decoration categories on Markeet."
//         />
//         <meta property="og:image" content={seoImage} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shop by Category - Markeet" />
//         <meta
//           name="twitter:description"
//           content="Explore electronics, appliances, fashion, jewellery, groceries, gifts, and home decoration categories on Markeet."
//         />
//         <meta name="twitter:image" content={seoImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'ItemList',
//             itemListElement: categoryList,
//           })}
//         </script>
//       </Helmet>

//       <header className="cat-header">
//         <h1 className="cat-title">Shop by Category</h1>
//       </header>
//       <div className="cat-search-bar">
//         <input
//           type="text"
//           placeholder="Search categories..."
//           onChange={(e) => handleSearch(e.target.value)}
//           className="cat-search-input"
//           aria-label="Search categories"
//         />
//       </div>
//       {error && <p className="cat-error-message">{error}</p>}
//       <div className="cat-grid">
//         {loading ? (
//           [...Array(6)].map((_, i) => (
//             <div key={`skeleton-${i}`} className="cat-card-skeleton">
//               <div className="skeleton-image" />
//               <div className="skeleton-text" />
//               <div className="skeleton-text short" />
//             </div>
//           ))
//         ) : filteredCategories.length === 0 ? (
//           <p className="cat-no-categories">No categories found.</p>
//         ) : (
//           filteredCategories.map((category) => (
//             <Link
//               to={`/products?category=${category.id}`}
//               key={category.id}
//               state={{ fromCategories: true }}
//               className="cat-card"
//               role="button"
//               tabIndex={0}
//               aria-label={`View products in ${category.name}`}
//             >
//               <div className="cat-image-wrapper">
//                 <img
//                   src={category.image_url || 'https://via.placeholder.com/150x150?text=Category'}
//                   alt={category.name}
//                   className="cat-image"
//                   onError={(e) => (e.target.src = 'https://via.placeholder.com/150x150?text=Category')}
//                   loading="lazy"
//                 />
//               </div>
//               <h3 className="cat-name">{category.name.trim()}</h3>
//               {category.parent_id && (
//                 <p className="cat-parent">
//                   Subcategory of:{' '}
//                   {categories.find(c => c.id === category.parent_id)?.name || 'N/A'}
//                 </p>
//               )}
//             </Link>
//           ))
//         )}
//       </div>
//       <Footer />
//     </div>
//   );
// }

// export default Categories;


// // src/pages/Categories.js
// import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// /* ---------- helpers ---------- */
// const debounce = (fn, ms = 300) => {
//   let id;
//   return (...args) => {
//     clearTimeout(id);
//     id = setTimeout(() => fn(...args), ms);
//   };
// };

// /* ---------- component ---------- */
// export default function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [search,      setSearch]    = useState('');
//   const [loading,     setLoading]   = useState(true);
//   const [error,       setError]     = useState(null);

//   /* ---------- network guard ---------- */
//   const online = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection.', { duration: 3000, position: 'top-center' });
//       return false;
//     }
//     return true;
//   };

//   /* ---------- fetch ---------- */
//   const fetchCategories = useCallback(async () => {
//     if (!online()) { setLoading(false); return; }

//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         //  ⬇️  parent_id removed
//         .from('categories')
//         .select('id, name, image_url, is_restricted')
//         .order('name');

//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error(err);
//       setError('Could not load categories.');
//       toast.error('Failed to load categories.', { duration: 3000, position: 'top-center' });
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { fetchCategories(); }, [fetchCategories]);

//   /* ---------- search ---------- */
//   const debouncedSearch = useCallback(debounce(value => setSearch(value), 300), []);
//   const visible = categories.filter(c =>
//     c.name.toLowerCase().includes(search.toLowerCase())
//   );

//   /* ---------- SEO data ---------- */
//   const pageUrl  = 'https://www.markeet.com/categories';
//   const heroImg  = categories[0]?.image_url || 'https://via.placeholder.com/150x150?text=Category';
//   const listJson = categories.map((c,i) => ({
//     '@type':'ListItem', position:i+1, name:c.name,
//     item:`https://www.markeet.com/products?category=${c.id}`,
//   }));

//   /* ---------- render ---------- */
//   return (
//     <div className="cat-page">
//       <Helmet>
//         <title>Shop by Category - Markeet</title>
//         <meta name="description"
//               content="Explore electronics, appliances, fashion, jewellery, groceries, gifts, and home decoration categories on Markeet." />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:image" content={heroImg} />
//         <script type="application/ld+json">
//           {JSON.stringify({ '@context':'https://schema.org', '@type':'ItemList', itemListElement:listJson })}
//         </script>
//       </Helmet>

//       <header className="cat-header"><h1 className="cat-title">Shop by Category</h1></header>

//       <div className="cat-search-bar">
//         <input
//           className="cat-search-input"
//           placeholder="Search categories…"
//           aria-label="Search categories"
//           onChange={e => debouncedSearch(e.target.value)}
//         />
//       </div>

//       {error && <p className="cat-error-message">{error}</p>}

//       <div className="cat-grid">
//         {loading
//           ? [...Array(6)].map((_,i)=>(
//               <div key={i} className="cat-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//               </div>
//             ))
//           : visible.length === 0
//             ? <p className="cat-no-categories">No categories found.</p>
//             : visible.map(c => (
//                 <Link
//                   key={c.id}
//                   to={`/products?category=${c.id}`}
//                   state={{ fromCategories:true }}
//                   className="cat-card"
//                   aria-label={`View products in ${c.name}`}
//                 >
//                   <div className="cat-image-wrapper">
//                     <img
//                       src={c.image_url || 'https://via.placeholder.com/150x150?text=Category'}
//                       alt={c.name}
//                       className="cat-image"
//                       onError={e=>e.target.src='https://via.placeholder.com/150x150?text=Category'}
//                       loading="lazy"
//                     />
//                   </div>
//                   <h3 className="cat-name">{c.name.trim()}</h3>
//                 </Link>
//               ))}
//       </div>

//       <Footer />
//     </div>
//   );
// }




// // src/pages/Categories.js
// import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Categories.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// /* ---------- helpers ---------- */
// const debounce = (fn, ms = 300) => {
//   let id;
//   return (...args) => {
//     clearTimeout(id);
//     id = setTimeout(() => fn(...args), ms);
//   };
// };

// /* ---------- component ---------- */
// export default function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [search,      setSearch]    = useState('');
//   const [loading,     setLoading]   = useState(true);
//   const [error,       setError]     = useState(null);

//   /* ---------- network guard ---------- */
//   const online = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection.', { duration: 3000, position: 'top-center' });
//       return false;
//     }
//     return true;
//   };

//   /* ---------- fetch ---------- */
//   const fetchCategories = useCallback(async () => {
//     if (!online()) { setLoading(false); return; }

//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         //  ⬇️  parent_id removed
//         .from('categories')
//         .select('id, name, image_url, is_restricted')
//         .order('name');

//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error(err);
//       setError('Could not load categories.');
//       toast.error('Failed to load categories.', { duration: 3000, position: 'top-center' });
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { fetchCategories(); }, [fetchCategories]);

//   /* ---------- search ---------- */
//   const debouncedSearch = useCallback(debounce(value => setSearch(value), 300), []);
//   const visible = categories.filter(c =>
//     c.name.toLowerCase().includes(search.toLowerCase())
//   );

//   /* ---------- SEO data ---------- */
//   const pageUrl  = 'https://www.markeet.com/categories';
//   const heroImg  = categories[0]?.image_url || 'https://via.placeholder.com/150x150?text=Category';
//   const listJson = categories.map((c,i) => ({
//     '@type':'ListItem', position:i+1, name:c.name,
//     item:`https://www.markeet.com/products?category=${c.id}`,
//   }));

//   /* ---------- render ---------- */
//   return (
//     <div className="cat-page">
//       <Helmet>
//         <title>Shop by Category - Markeet</title>
//         <meta name="description"
//               content="Explore electronics, appliances, fashion, jewellery, groceries, gifts, and home decoration categories on Markeet." />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:image" content={heroImg} />
//         <script type="application/ld+json">
//           {JSON.stringify({ '@context':'https://schema.org', '@type':'ItemList', itemListElement:listJson })}
//         </script>
//       </Helmet>

//       <header className="cat-header"><h1 className="cat-title">Shop by Category</h1></header>

//       <div className="cat-search-bar">
//         <input
//           className="cat-search-input"
//           placeholder="Search categories…"
//           aria-label="Search categories"
//           onChange={e => debouncedSearch(e.target.value)}
//         />
//       </div>

//       {error && <p className="cat-error-message">{error}</p>}

//       <div className="cat-grid">
//         {loading
//           ? [...Array(6)].map((_,i)=>(
//               <div key={i} className="cat-card-skeleton">
//                 <div className="skeleton-image" />
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//               </div>
//             ))
//           : visible.length === 0
//             ? <p className="cat-no-categories">No categories found.</p>
//             : visible.map(c => (
//                 <Link
//                   key={c.id}
//                   to={`/products?category=${c.id}`}
//                   state={{ fromCategories:true }}
//                   className="cat-card"
//                   aria-label={`View products in ${c.name}`}
//                 >
//                   <div className="cat-image-wrapper">
//                     <img
//                       src={c.image_url || 'https://via.placeholder.com/150x150?text=Category'}
//                       alt={c.name}
//                       className="cat-image"
//                       onError={e=>e.target.src='https://via.placeholder.com/150x150?text=Category'}
//                       loading="lazy"
//                     />
//                   </div>
//                   <h3 className="cat-name">{c.name.trim()}</h3>
//                 </Link>
//               ))}
//       </div>

//       <Footer />
//     </div>
//   );
// }



// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import { FaSearch } from 'react-icons/fa';
// import '../style/Categories.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network.', {
//       duration: 4000,
//       position: 'top-center',
//       style: { background: '#ff4d4f', color: '#fff', fontWeight: 'bold', borderRadius: '8px', padding: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' },
//     });
//     return false;
//   }
//   return true;
// };

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const navigate = useNavigate();
//   const searchRef = useRef(null);

//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     try {
//       const { data, error } = await supabase.from('categories').select('id, name, image_url, is_restricted').order('name');
//       if (error) throw error;
//       console.log('Fetched categories:', data);
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories.');
//       setCategories([]);
//       toast.error('Failed to load categories.', {
//         duration: 4000,
//         position: 'top-center',
//         style: { background: '#ff4d4f', color: '#fff', fontWeight: 'bold', borderRadius: '8px', padding: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' },
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchCategories();
//   }, [fetchCategories]);

//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }
//     const filteredSuggestions = categories
//       .filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase()))
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, isSearchFocused, categories]);

//   const handleSearchChange = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const handleSuggestionClick = (category) => {
//     setSearchTerm('');
//     setIsSearchFocused(false);
//     setSuggestions([]);
//     navigate(`/products?category=${category.id}`, { state: { fromCategories: true } });
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   if (loading) return <div className="cat-loading-container">Loading...</div>;

//   if (error) return <div className="cat-error">{error} <button onClick={fetchCategories}>Retry</button></div>;

//   const filteredCategories = searchTerm
//     ? categories.filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase()))
//     : categories;

//   return (
//     <div className="cat-page">
//       <Helmet>
//         <title>Categories - Markeet</title>
//         <meta name="description" content="Explore categories like electronics, fashion, groceries, and more on Markeet." />
//         <meta name="keywords" content="categories, electronics, fashion, groceries, Markeet" />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/categories" />
//       </Helmet>
//       <Toaster position="top-center" />
//       <div className="cat-search-bar" ref={searchRef}>
//         <FaSearch className="cat-search-icon" />
//         <input
//           type="text"
//           placeholder="Search categories..."
//           value={searchTerm}
//           onChange={handleSearchChange}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search categories"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="cat-search-suggestions">
//             {suggestions.map((category) => (
//               <li
//                 key={category.id}
//                 className="cat-suggestion-item"
//                 onClick={() => handleSuggestionClick(category)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && handleSuggestionClick(category)}
//                 aria-label={`Select ${category.name}`}
//               >
//                 {category.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//       <h1 className="cat-title">All Categories</h1>
//       {filteredCategories.length === 0 ? (
//         <p className="no-categories">No categories found.</p>
//       ) : (
//         <div className="cat-grid">
//           {filteredCategories.map((category) => (
//             <Link
//               to={`/products?category=${category.id}`}
//               key={category.id}
//               state={{ fromCategories: true }}
//               className="cat-card"
//               aria-label={`View ${category.name} products`}
//             >
//               <img
//                 src={category.image_url || 'https://dummyimage.com/150x150/image.jpg'}
//                 alt={category.name}
//                 className="cat-image"
//                 onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/image.jpg')}
//                 loading="lazy"
//               />
//               <h3 className="cat-name">{category.name}</h3>
//             </Link>
//           ))}
//         </div>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Categories);


// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import { FaSearch } from 'react-icons/fa';
// import { Helmet } from 'react-helmet-async';
// import icon from '../assets/icon.png';
// import '../style/Categories.css';
// import Footer from './Footer';

// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network.', {
//       duration: 4000,
//       position: 'top-center',
//       style: { background: '#ff4d4f', color: '#fff', fontWeight: 'bold', borderRadius: '8px', padding: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' },
//     });
//     return false;
//   }
//   return true;
// };

// function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSearchFocused, setIsSearchFocused] = useState(false);
//   const [suggestions, setSuggestions] = useState([]);
//   const navigate = useNavigate();
//   const searchRef = useRef(null);

//   const fetchCategories = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     try {
//       const { data, error } = await supabase.from('categories').select('id, name, image_url, is_restricted').order('name');
//       if (error) throw error;
//       setCategories(data || []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load categories.');
//       setCategories([]);
//       toast.error('Failed to load categories.', {
//         duration: 4000,
//         position: 'top-center',
//         style: { background: '#ff4d4f', color: '#fff', fontWeight: 'bold', borderRadius: '8px', padding: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' },
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchCategories();
//   }, [fetchCategories]);

//   useEffect(() => {
//     if (!searchTerm || !isSearchFocused) {
//       setSuggestions([]);
//       return;
//     }
//     const filteredSuggestions = categories
//       .filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase()))
//       .slice(0, 5);
//     setSuggestions(filteredSuggestions);
//   }, [searchTerm, isSearchFocused, categories]);

//   const handleSearchChange = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const handleSuggestionClick = (category) => {
//     setSearchTerm('');
//     setIsSearchFocused(false);
//     setSuggestions([]);
//     navigate(`/products?category=${category.id}`, { state: { fromCategories: true } });
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsSearchFocused(false);
//         setSuggestions([]);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   if (loading) return <div className="cat-loading-container">Loading...</div>;

//   if (error) return (
//     <div className="cat-error">
//       {error} <button onClick={fetchCategories}>Retry</button>
//     </div>
//   );

//   const filteredCategories = searchTerm
//     ? categories.filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase()))
//     : categories;

//   return (
//     <div className="cat-page">
//       <Helmet>
//         <title>Categories - Markeet</title>
//         <meta name="description" content="Explore categories like electronics, fashion, groceries, and more on Markeet." />
//         <meta name="keywords" content="categories, electronics, fashion, groceries, Markeet" />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href="https://www.markeet.com/categories" />
//         <meta property="og:title" content="Categories - Markeet" />
//         <meta property="og:description" content="Explore categories like electronics, fashion, groceries, and more on Markeet." />
//         <meta property="og:image" content={categories[0]?.image_url || 'https://dummyimage.com/150x150/image.jpg'} />
//         <meta property="og:url" content="https://www.markeet.com/categories" />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Categories - Markeet" />
//         <meta name="twitter:description" content="Explore categories like electronics, fashion, groceries, and more on Markeet." />
//         <meta name="twitter:image" content={categories[0]?.image_url || 'https://dummyimage.com/150x150/image.jpg'} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Categories - Markeet',
//             description: 'Explore categories like electronics, fashion, groceries, and more on Markeet.',
//             url: 'https://www.markeet.com/categories',
//             publisher: {
//               '@type': 'Organization',
//               name: 'Markeet',
//             },
//           })}
//         </script>
//       </Helmet>
//       <Toaster position="top-center" />
//       <div className="cat-search-bar" ref={searchRef}>
//         <FaSearch className="cat-search-icon" />
//         <input
//           type="text"
//           placeholder="Search categories..."
//           value={searchTerm}
//           onChange={handleSearchChange}
//           onFocus={() => setIsSearchFocused(true)}
//           aria-label="Search categories"
//         />
//         {suggestions.length > 0 && isSearchFocused && (
//           <ul className="cat-search-suggestions">
//             {suggestions.map((category) => (
//               <li
//                 key={category.id}
//                 className="cat-suggestion-item"
//                 onClick={() => handleSuggestionClick(category)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && handleSuggestionClick(category)}
//                 aria-label={`Select ${category.name}`}
//               >
//                 {category.name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//       <h1 className="cat-title">All Categories</h1>
//       {filteredCategories.length === 0 ? (
//         <p className="no-categories">No categories found.</p>
//       ) : (
//         <div className="cat-grid">
//           {filteredCategories.map((category) => (
//             <Link
//               to={`/products?category=${category.id}`}
//               key={category.id}
//               state={{ fromCategories: true }}
//               className="cat-card"
//               aria-label={`View ${category.name} products`}
//             >
//               <img
//                 src={category.image_url || 'https://dummyimage.com/150x150/image.jpg'}
//                 alt={category.name}
//                 className="cat-image"
//                 onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/image.jpg')}
//                 loading="lazy"
//               />
//               <h3 className="cat-name">{category.name}</h3>
//             </Link>
//           ))}
//         </div>
//       )}
//       <img
//         src={icon}
//         alt="Markeet Logo"
//         className="cat-icon"
//       />
//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Categories);


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Toaster } from 'react-hot-toast'; // Kept for potential future use, but no toast calls
import { FaSearch } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import icon from '../assets/icon.png';
import '../style/Categories.css';
import Footer from './Footer';

const checkNetworkStatus = () => {
  if (!navigator.onLine) {
    return false; // No notification, just return false
  }
  return true;
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const fetchCategories = useCallback(async () => {
    if (!checkNetworkStatus()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('categories').select('id, name, image_url, is_restricted').order('name');
      if (error) throw error;
      setCategories(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load categories.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!searchTerm || !isSearchFocused) {
      setSuggestions([]);
      return;
    }
    const filteredSuggestions = categories
      .filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 5);
    setSuggestions(filteredSuggestions);
  }, [searchTerm, isSearchFocused, categories]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSuggestionClick = (category) => {
    setSearchTerm('');
    setIsSearchFocused(false);
    setSuggestions([]);
    navigate(`/products?category=${category.id}`, { state: { fromCategories: true } });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return <div className="cat-loading-container">Loading...</div>;

  if (error) return (
    <div className="cat-error">
      {error} <button onClick={fetchCategories}>Retry</button>
    </div>
  );

  const filteredCategories = searchTerm
    ? categories.filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : categories;

  return (
    <div className="cat-page">
      <Helmet>
        <title>Categories - Markeet</title>
        <meta name="description" content="Explore categories like electronics, fashion, groceries, and more on Markeet." />
        <meta name="keywords" content="categories, electronics, fashion, groceries, Markeet" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.markeet.com/categories" />
        <meta property="og:title" content="Categories - Markeet" />
        <meta property="og:description" content="Explore categories like electronics, fashion, groceries, and more on Markeet." />
        <meta property="og:image" content={categories[0]?.image_url || 'https://dummyimage.com/150x150/image.jpg'} />
        <meta property="og:url" content="https://www.markeet.com/categories" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Categories - Markeet" />
        <meta name="twitter:description" content="Explore categories like electronics, fashion, groceries, and more on Markeet." />
        <meta name="twitter:image" content={categories[0]?.image_url || 'https://dummyimage.com/150x150/image.jpg'} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Categories - Markeet',
            description: 'Explore categories like electronics, fashion, groceries, and more on Markeet.',
            url: 'https://www.markeet.com/categories',
            publisher: {
              '@type': 'Organization',
              name: 'Markeet',
            },
          })}
        </script>
      </Helmet>
      <Toaster position="top-center" /> {/* Kept but unused */}
      <div className="cat-search-bar" ref={searchRef}>
        <FaSearch className="cat-search-icon" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setIsSearchFocused(true)}
          aria-label="Search categories"
        />
        {suggestions.length > 0 && isSearchFocused && (
          <ul className="cat-search-suggestions">
            {suggestions.map((category) => (
              <li
                key={category.id}
                className="cat-suggestion-item"
                onClick={() => handleSuggestionClick(category)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleSuggestionClick(category)}
                aria-label={`Select ${category.name}`}
              >
                {category.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <h1 className="cat-title">All Categories</h1>
      {filteredCategories.length === 0 ? (
        <p className="no-categories">No categories found.</p>
      ) : (
        <div className="cat-grid">
          {filteredCategories.map((category) => (
            <Link
              to={`/products?category=${category.id}`}
              key={category.id}
              state={{ fromCategories: true }}
              className="cat-card"
              aria-label={`View ${category.name} products`}
            >
              <img
                src={category.image_url || 'https://dummyimage.com/150x150/image.jpg'}
                alt={category.name}
                className="cat-image"
                onError={(e) => (e.target.src = 'https://dummyimage.com/150x150/image.jpg')}
                loading="lazy"
              />
              <h3 className="cat-name">{category.name}</h3>
            </Link>
          ))}
        </div>
      )}
      <img
        src={icon}
        alt="Markeet Logo"
        className="cat-icon"
      />
      <Footer />
    </div>
  );
}

export default React.memo(Categories);