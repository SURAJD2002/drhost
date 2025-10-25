-- Fixed RPC Function for Nearby Products
-- This fixes the "structure of query does not match function result type" error

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_nearby_products(double precision, double precision) CASCADE;

-- Create the corrected RPC function with proper return structure
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
        p.id::integer,
        p.title::text,
        p.price::decimal,
        p.seller_id::integer,
        s.store_name::text as seller_name,
        COALESCE(p.latitude, s.latitude)::decimal as latitude,
        COALESCE(p.longitude, s.longitude)::decimal as longitude,
        p.delivery_radius_km::integer,
        -- Haversine distance calculation
        (
            6371 * acos(
                cos(radians(user_lat)) * cos(radians(COALESCE(p.latitude, s.latitude))) *
                cos(radians(COALESCE(p.longitude, s.longitude)) - radians(user_lon)) +
                sin(radians(user_lat)) * sin(radians(COALESCE(p.latitude, s.latitude)))
            )
        )::decimal as distance_km
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
SELECT 'Fixed RPC function created successfully' as status;

-- Test with sample coordinates
SELECT * FROM public.get_nearby_products(23.7407, 86.4146) LIMIT 3;




