import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ExampleHomePage from './ExampleHomePage';
import ExampleCategoryPage from './ExampleCategoryPage';
import ExampleProductPage from './ExampleProductPage';
import '../style/ExampleComponents.css';

/**
 * Perfect Navigation Demo Router
 * Demonstrates the complete navigation system with scroll restoration
 */
function PerfectNavigationDemo() {
  return (
    <HelmetProvider>
      <div className="example-app">
        <BrowserRouter>
          <Routes>
            {/* Home Route */}
            <Route path="/" element={<ExampleHomePage />} />
            
            {/* Category Routes */}
            <Route path="/category/:categorySlug" element={<ExampleCategoryPage />} />
            
            {/* Product Routes */}
            <Route path="/product/:productId" element={<ExampleProductPage />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </HelmetProvider>
  );
}

export default PerfectNavigationDemo;




