import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/Categories.css';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) console.error('Error fetching categories:', error);
    else setCategories(data || []);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    // Navigate to products page for this category (e.g., /products?category=category.id)
    // You can implement this with react-router or a new component
    console.log(`Navigating to products for category: ${category.name}`);
  };

  return (
    <div className="categories-page">
      <h1>Shop by Category</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      <div className="category-grid">
        {filteredCategories.length === 0 ? (
          <p>No categories found.</p>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className={`category-card ${selectedCategory?.id === category.id ? 'selected' : ''}`}
              onClick={() => handleCategoryClick(category)}
            >
              <h3>{category.name}</h3>
              {category.parent_id && (
                <p>Subcategory of: {categories.find(c => c.id === category.parent_id)?.name}</p>
              )}
              <Link to={`/products?category=${category.id}`}>View Products</Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Categories;