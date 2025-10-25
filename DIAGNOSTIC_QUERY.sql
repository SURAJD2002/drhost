-- Diagnostic queries to check database structure
-- Run these in Supabase Dashboard > SQL Editor to diagnose issues

-- 1. Check if products table exists and has required columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if sellers table exists and has required columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sellers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check sample data from products table
SELECT 
    id, title, price, seller_id, latitude, longitude, delivery_radius_km, is_approved, status
FROM products 
LIMIT 3;

-- 4. Check sample data from sellers table
SELECT 
    id, store_name, latitude, longitude
FROM sellers 
LIMIT 3;

-- 5. Check if there are any products with valid coordinates
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as products_with_lat,
    COUNT(CASE WHEN longitude IS NOT NULL THEN 1 END) as products_with_lon,
    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as products_with_coords
FROM products;

-- 6. Check if there are any sellers with valid coordinates
SELECT 
    COUNT(*) as total_sellers,
    COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as sellers_with_lat,
    COUNT(CASE WHEN longitude IS NOT NULL THEN 1 END) as sellers_with_lon,
    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as sellers_with_coords
FROM sellers;

-- 7. Test a simple join to see if the relationship works
SELECT 
    p.id, p.title, s.store_name, p.latitude, p.longitude, s.latitude as seller_lat, s.longitude as seller_lon
FROM products p
JOIN sellers s ON p.seller_id = s.id
WHERE p.is_approved = true AND p.status = 'active'
LIMIT 3;




