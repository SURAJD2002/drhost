-- Create function to get related products with location filtering
CREATE OR REPLACE FUNCTION get_related_products_nearby(
  p_product_id INTEGER,
  p_user_lat DECIMAL,
  p_user_lon DECIMAL,
  p_limit INTEGER DEFAULT 4
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  price DECIMAL,
  original_price DECIMAL,
  discount_amount DECIMAL,
  images JSONB,
  seller_id INTEGER,
  category_id INTEGER,
  category_name TEXT,
  delivery_radius_km INTEGER,
  max_delivery_radius_km INTEGER,
  seller_latitude DECIMAL,
  seller_longitude DECIMAL,
  distance_km DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH current_product AS (
    SELECT category_id, seller_id
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
      s.latitude as seller_latitude,
      s.longitude as seller_longitude,
      -- Calculate distance using Haversine formula
      (
        6371 * acos(
          cos(radians(p_user_lat)) * 
          cos(radians(s.latitude)) * 
          cos(radians(s.longitude) - radians(p_user_lon)) + 
          sin(radians(p_user_lat)) * 
          sin(radians(s.latitude))
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
      AND s.latitude IS NOT NULL
      AND s.longitude IS NOT NULL
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
  WHERE rp.distance_km <= COALESCE(rp.delivery_radius_km, rp.max_delivery_radius_km, 40)
  ORDER BY rp.distance_km ASC
  LIMIT p_limit;
END;
$$;
