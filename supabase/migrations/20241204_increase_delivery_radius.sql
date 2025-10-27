-- Increase delivery radius for better product availability
-- This migration updates products and categories to have more reasonable delivery radius

-- Update products with very small delivery radius (less than 10km) to 20km
UPDATE products 
SET delivery_radius_km = 20 
WHERE delivery_radius_km IS NOT NULL 
  AND delivery_radius_km < 10 
  AND delivery_radius_km > 0;

-- Update products with null delivery radius to 20km
UPDATE products 
SET delivery_radius_km = 20 
WHERE delivery_radius_km IS NULL;

-- Update categories with small max_delivery_radius_km to 40km
UPDATE categories 
SET max_delivery_radius_km = 40 
WHERE max_delivery_radius_km IS NOT NULL 
  AND max_delivery_radius_km < 20;

-- Update categories with null max_delivery_radius_km to 40km
UPDATE categories 
SET max_delivery_radius_km = 40 
WHERE max_delivery_radius_km IS NULL;

-- Show summary of changes
SELECT 
  'Products Updated' as table_name,
  COUNT(*) as count,
  MIN(delivery_radius_km) as min_radius,
  MAX(delivery_radius_km) as max_radius,
  AVG(delivery_radius_km) as avg_radius
FROM products 
WHERE delivery_radius_km IS NOT NULL

UNION ALL

SELECT 
  'Categories Updated' as table_name,
  COUNT(*) as count,
  MIN(max_delivery_radius_km) as min_radius,
  MAX(max_delivery_radius_km) as max_radius,
  AVG(max_delivery_radius_km) as avg_radius
FROM categories 
WHERE max_delivery_radius_km IS NOT NULL;






