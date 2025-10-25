-- Simplified RPC Function for Nearby Products
-- This version is more compatible with different database structures

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_nearby_products(double precision, double precision) CASCADE;

-- Create a simplified version that handles potential data type issues
CREATE OR REPLACE FUNCTION public.get_nearby_products(
    user_lat double precision,
    user_lon double precision
)
RETURNS TABLE (
    id integer,
    title text,
    price numeric,
    seller_id integer,
    seller_name text,
    latitude numeric,
    longitude numeric,
    delivery_radius_km integer,
    distance_km numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.id, 0)::integer as id,
        COALESCE(p.title, 'Unknown Product')::text as title,
        COALESCE(p.price, 0)::numeric as price,
        COALESCE(p.seller_id, 0)::integer as seller_id,
        COALESCE(s.store_name, 'Unknown Seller')::text as seller_name,
        COALESCE(p.latitude, s.latitude, 0)::numeric as latitude,
        COALESCE(p.longitude, s.longitude, 0)::numeric as longitude,
        COALESCE(p.delivery_radius_km, 50)::integer as delivery_radius_km,
        -- Haversine distance calculation with error handling
        CASE 
            WHEN COALESCE(p.latitude, s.latitude) IS NOT NULL 
                 AND COALESCE(p.longitude, s.longitude) IS NOT NULL
                 AND COALESCE(p.latitude, s.latitude) != 0 
                 AND COALESCE(p.longitude, s.longitude) != 0
            THEN (
                6371 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(user_lat)) * cos(radians(COALESCE(p.latitude, s.latitude))) *
                        cos(radians(COALESCE(p.longitude, s.longitude)) - radians(user_lon)) +
                        sin(radians(user_lat)) * sin(radians(COALESCE(p.latitude, s.latitude)))
                    ))
                )
            )::numeric
            ELSE 999999::numeric -- Very far distance for invalid coordinates
        END as distance_km
    FROM products p
    LEFT JOIN sellers s ON p.seller_id = s.id
    WHERE 
        p.is_approved = true 
        AND p.status = 'active'
        AND (p.latitude IS NOT NULL OR s.latitude IS NOT NULL)
        AND (p.longitude IS NOT NULL OR s.longitude IS NOT NULL)
        AND (p.latitude != 0 OR s.latitude != 0)
        AND (p.longitude != 0 OR s.longitude != 0)
        -- Filter by delivery radius
        AND CASE 
            WHEN COALESCE(p.latitude, s.latitude) IS NOT NULL 
                 AND COALESCE(p.longitude, s.longitude) IS NOT NULL
                 AND COALESCE(p.latitude, s.latitude) != 0 
                 AND COALESCE(p.longitude, s.longitude) != 0
            THEN (
                6371 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(user_lat)) * cos(radians(COALESCE(p.latitude, s.latitude))) *
                        cos(radians(COALESCE(p.longitude, s.longitude)) - radians(user_lon)) +
                        sin(radians(user_lat)) * sin(radians(COALESCE(p.latitude, s.latitude)))
                    ))
                )
            )
            ELSE 999999
        END <= COALESCE(p.delivery_radius_km, 50)
    ORDER BY distance_km ASC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_nearby_products(double precision, double precision) TO anon, authenticated;

-- Test the function
SELECT 'Simplified RPC function created successfully' as status;

-- Test with sample coordinates
SELECT * FROM public.get_nearby_products(23.7407, 86.4146) LIMIT 3;




