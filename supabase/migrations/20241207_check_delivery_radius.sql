-- Check current delivery radius settings
-- This will show us what delivery radius values we currently have

SELECT 
  'Products' as table_name,
  COUNT(*) as total_count,
  MIN(delivery_radius_km) as min_radius,
  MAX(delivery_radius_km) as max_radius,
  AVG(delivery_radius_km) as avg_radius,
  COUNT(CASE WHEN delivery_radius_km IS NULL THEN 1 END) as null_count
FROM products 
WHERE is_approved = true AND status = 'active'

UNION ALL

SELECT 
  'Categories' as table_name,
  COUNT(*) as total_count,
  MIN(max_delivery_radius_km) as min_radius,
  MAX(max_delivery_radius_km) as max_radius,
  AVG(max_delivery_radius_km) as avg_radius,
  COUNT(CASE WHEN max_delivery_radius_km IS NULL THEN 1 END) as null_count
FROM categories;
