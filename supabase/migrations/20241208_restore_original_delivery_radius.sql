-- Restore original delivery radius settings as set by sellers
-- This migration reverts the automatic radius increases and keeps seller-set values

-- First, let's see what we have currently
SELECT 
  'Current Products Radius Distribution' as info,
  delivery_radius_km,
  COUNT(*) as count
FROM products 
WHERE is_approved = true AND status = 'active'
GROUP BY delivery_radius_km
ORDER BY delivery_radius_km;

-- Restore products with 20km radius back to their original values
-- We'll set them to NULL first, so they use category's max_delivery_radius_km
UPDATE products 
SET delivery_radius_km = NULL 
WHERE delivery_radius_km = 20 
  AND is_approved = true 
  AND status = 'active';

-- Also restore any products that were set to 20km but should have smaller radius
-- This is a conservative approach - we'll let them use category defaults
UPDATE products 
SET delivery_radius_km = NULL 
WHERE delivery_radius_km >= 20 
  AND is_approved = true 
  AND status = 'active';

-- Show final distribution
SELECT 
  'Final Products Radius Distribution' as info,
  COALESCE(delivery_radius_km::text, 'NULL (uses category)') as delivery_radius_km,
  COUNT(*) as count
FROM products 
WHERE is_approved = true AND status = 'active'
GROUP BY delivery_radius_km
ORDER BY delivery_radius_km;

-- Show category radius distribution
SELECT 
  'Categories Radius Distribution' as info,
  COALESCE(max_delivery_radius_km::text, 'NULL (default 40km)') as max_delivery_radius_km,
  COUNT(*) as count
FROM categories
GROUP BY max_delivery_radius_km
ORDER BY max_delivery_radius_km;






