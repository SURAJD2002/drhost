-- Fix Supabase RPC parameter conflict in get_related_products_nearby()
-- This migration resolves the function signature ambiguity by dropping the duplicate function

-- Drop the conflicting function signature that has different parameter order/types
DROP FUNCTION IF EXISTS public.get_related_products_nearby(
    p_product_id integer, 
    p_user_lat numeric, 
    p_user_lon numeric, 
    p_limit integer
);

-- Ensure the correct function signature exists
-- This should match the signature we're calling from JavaScript:
-- get_related_products_nearby(p_limit integer, p_product_id integer, p_user_lat double precision, p_user_lon double precision)

-- If the function doesn't exist, create it with the correct signature
CREATE OR REPLACE FUNCTION public.get_related_products_nearby(
    p_limit integer,
    p_product_id integer, 
    p_user_lat double precision, 
    p_user_lon double precision
)
RETURNS TABLE (
    id integer,
    title text,
    name text,
    price numeric,
    original_price numeric,
    discount_amount numeric,
    images text[],
    seller_id integer,
    category_id integer,
    distance_km numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.name,
        p.price,
        p.original_price,
        p.discount_amount,
        p.images,
        p.seller_id,
        p.category_id,
        ROUND(
            6371 * acos(
                cos(radians(p_user_lat)) * 
                cos(radians(s.latitude)) * 
                cos(radians(s.longitude) - radians(p_user_lon)) + 
                sin(radians(p_user_lat)) * 
                sin(radians(s.latitude))
            )::numeric, 2
        ) AS distance_km
    FROM products p
    JOIN sellers s ON p.seller_id = s.id
    WHERE p.id != p_product_id
        AND p.is_approved = true
        AND p.status = 'active'
        AND (
            6371 * acos(
                cos(radians(p_user_lat)) * 
                cos(radians(s.latitude)) * 
                cos(radians(s.longitude) - radians(p_user_lon)) + 
                sin(radians(p_user_lat)) * 
                sin(radians(s.latitude))
            )
        ) <= 40  -- Within 40km radius
    ORDER BY distance_km ASC
    LIMIT p_limit;
END;
$$;
