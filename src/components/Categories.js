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


import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/Categories.css';
import Footer from './Footer';

// Utility to debounce a function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Error fetching categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    console.log(`Navigating to products for category: ${category.name}`);
  };

  return (
    <div className="cat-page">
      <header className="cat-header">
        <h1 className="cat-title">Shop by Category</h1>
      </header>
      <div className="cat-search-bar">
        <input
          type="text"
          placeholder="Search categories..."
          onChange={(e) => handleSearch(e.target.value)}
          className="cat-search-input"
          aria-label="Search categories"
        />
      </div>
      {error && <p className="cat-error-message">{error}</p>}
      <div className="cat-grid">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={`skeleton-${i}`} className="cat-card-skeleton">
              <div className="skeleton-image" />
              <div className="skeleton-text" />
              <div className="skeleton-text short" />
              <div className="skeleton-link" />
            </div>
          ))
        ) : filteredCategories.length === 0 ? (
          <p className="cat-no-categories">No categories found.</p>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className={`cat-card ${selectedCategory?.id === category.id ? 'cat-selected' : ''}`}
              onClick={() => handleCategoryClick(category)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleCategoryClick(category)}
              aria-label={`Select ${category.name} category`}
            >
              <div className="cat-image-wrapper">
                <img
                  src={category.image_url || 'https://via.placeholder.com/150x150?text=Category'}
                  alt={category.name}
                  className="cat-image"
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/150x150?text=Category')}
                />
              </div>
              <h3 className="cat-name">{category.name.trim()}</h3>
              {category.parent_id && (
                <p className="cat-parent">
                  Subcategory of:{' '}
                  {categories.find(c => c.id === category.parent_id)?.name || 'N/A'}
                </p>
              )}
              <Link
                to={`/products?category=${category.id}`}
                className="cat-view-products-link"
                aria-label={`View products in ${category.name} category`}
              >
                View Products
              </Link>
            </div>
          ))
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Categories;