-- Fix related products to use current product's delivery radius instead of related product's radius
-- This ensures related products are filtered by the current product's delivery radius

DROP FUNCTION IF EXISTS public.get_related_products_nearby CASCADE;

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
BEGIN
  RETURN QUERY
  WITH current_product AS (
    SELECT category_id, seller_id, delivery_radius_km
    FROM products 
    WHERE id = p_product_id
  ),
  related_products AS (
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
      -- Calculate distance using Haversine formula with product/seller coordinates
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
    CROSS JOIN current_product cp
    WHERE p.category_id = cp.category_id
      AND p.id != p_product_id
      AND p.is_approved = true
      AND p.status = 'active'
      -- Ensure we have coordinates (either from product or seller)
      AND (p.latitude IS NOT NULL OR s.latitude IS NOT NULL)
      AND (p.longitude IS NOT NULL OR s.longitude IS NOT NULL)
      AND c.is_restricted = false
  )
  SELECT 
    rp.id,
    rp.title,
    rp.price,
    rp.original_price,
    rp.discount_amount,
    rp.images,
    rp.seller_id,
    rp.category_id,
    rp.category_name,
    rp.delivery_radius_km,
    rp.max_delivery_radius_km,
    rp.seller_latitude,
    rp.seller_longitude,
    rp.distance_km
  FROM related_products rp
  CROSS JOIN current_product cp
  WHERE rp.distance_km <= COALESCE(cp.delivery_radius_km, rp.max_delivery_radius_km, 40)
  ORDER BY rp.distance_km ASC
  LIMIT p_limit;
END;
$$;







