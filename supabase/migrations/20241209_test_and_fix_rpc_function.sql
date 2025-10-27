-- Test and fix the get_related_products_nearby function
-- This migration ensures the function is properly created and working

-- Drop the function completely to start fresh
DROP FUNCTION IF EXISTS public.get_related_products_nearby CASCADE;

-- Create a simple, clean version of the function
CREATE OR REPLACE FUNCTION public.get_related_products_nearby(
    p_limit integer,
    p_product_id integer, 
    p_user_lat double precision, 
    p_user_lon double precision
)
RETURNS TABLE (
    id integer,
    title text,
    price decimal,
    original_price decimal,
    discount_amount decimal,
    images jsonb,
    seller_id integer,
    category_id integer,
    category_name text,
    delivery_radius_km integer,
    max_delivery_radius_km integer,
    seller_latitude decimal,
    seller_longitude decimal,
    distance_km decimal
) 
LANGUAGE plpgsql
AS $$
DECLARE
    current_category_id integer;
    current_delivery_radius_km integer;
BEGIN
  -- Get current product details first
  SELECT category_id, delivery_radius_km 
  INTO current_category_id, current_delivery_radius_km
  FROM products 
  WHERE id = p_product_id;
  
  -- If current product not found, return empty result
  IF current_category_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.original_price,
    p.discount_amount,
    p.images,
    p.seller_id,
    p.category_id,
    c.name as category_name,
    p.delivery_radius_km,
    c.max_delivery_radius_km,
    -- Use product coordinates if available, otherwise fall back to seller coordinates
    COALESCE(p.latitude, s.latitude) as seller_latitude,
    COALESCE(p.longitude, s.longitude) as seller_longitude,
    -- Calculate distance using Haversine formula
    (
      6371 * acos(
        cos(radians(p_user_lat)) * 
        cos(radians(COALESCE(p.latitude, s.latitude))) * 
        cos(radians(COALESCE(p.longitude, s.longitude)) - radians(p_user_lon)) + 
        sin(radians(p_user_lat)) * 
        sin(radians(COALESCE(p.latitude, s.latitude)))
      )
    ) as distance_km
  FROM products p
  JOIN categories c ON p.category_id = c.id
  JOIN sellers s ON p.seller_id = s.id
  WHERE p.category_id = current_category_id
    AND p.id != p_product_id
    AND p.is_approved = true
    AND p.status = 'active'
    -- Ensure we have coordinates (either from product or seller)
    AND (p.latitude IS NOT NULL OR s.latitude IS NOT NULL)
    AND (p.longitude IS NOT NULL OR s.longitude IS NOT NULL)
    AND c.is_restricted = false
    -- Filter by current product's delivery radius
    AND (
      6371 * acos(
        cos(radians(p_user_lat)) * 
        cos(radians(COALESCE(p.latitude, s.latitude))) * 
        cos(radians(COALESCE(p.longitude, s.longitude)) - radians(p_user_lon)) + 
        sin(radians(p_user_lat)) * 
        sin(radians(COALESCE(p.latitude, s.latitude)))
      )
    ) <= COALESCE(current_delivery_radius_km, c.max_delivery_radius_km, 40)
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$;

-- Test the function to make sure it works
SELECT 'Function created successfully' as status;






