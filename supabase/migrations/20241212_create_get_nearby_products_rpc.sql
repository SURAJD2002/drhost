-- Create get_nearby_products RPC function
-- This function returns products within delivery radius of user location

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_nearby_products(double precision, double precision) CASCADE;

-- Create the RPC function
CREATE OR REPLACE FUNCTION public.get_nearby_products(
    user_lat double precision,
    user_lon double precision
)
RETURNS TABLE (
    id integer,
    title text,
    price decimal,
    seller_id integer,
    seller_name text,
    latitude decimal,
    longitude decimal,
    delivery_radius_km integer,
    distance_km decimal
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.price,
        p.seller_id,
        s.store_name as seller_name,
        COALESCE(p.latitude, s.latitude) as latitude,
        COALESCE(p.longitude, s.longitude) as longitude,
        p.delivery_radius_km,
        -- Haversine distance calculation
        (
            6371 * acos(
                cos(radians(user_lat)) * cos(radians(COALESCE(p.latitude, s.latitude))) *
                cos(radians(COALESCE(p.longitude, s.longitude)) - radians(user_lon)) +
                sin(radians(user_lat)) * sin(radians(COALESCE(p.latitude, s.latitude)))
            )
        ) as distance_km
    FROM products p
    JOIN sellers s ON p.seller_id = s.id
    WHERE 
        p.is_approved = true 
        AND p.status = 'active'
        AND (p.latitude IS NOT NULL OR s.latitude IS NOT NULL)
        AND (p.longitude IS NOT NULL OR s.longitude IS NOT NULL)
        -- Filter by delivery radius
        AND (
            6371 * acos(
                cos(radians(user_lat)) * cos(radians(COALESCE(p.latitude, s.latitude))) *
                cos(radians(COALESCE(p.longitude, s.longitude)) - radians(user_lon)) +
                sin(radians(user_lat)) * sin(radians(COALESCE(p.latitude, s.latitude)))
            )
        ) <= COALESCE(p.delivery_radius_km, 50) -- Default 50km if no radius set
    ORDER BY distance_km ASC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_nearby_products(double precision, double precision) TO anon, authenticated;

-- Test the function
SELECT 'RPC function created successfully' as status;





