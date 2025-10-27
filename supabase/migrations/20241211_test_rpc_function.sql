-- Test the RPC function to ensure it works
-- This migration tests the function with sample data

-- Test if the function exists and can be called
DO $$
BEGIN
  -- Try to call the function with test parameters
  -- This will fail if the function doesn't exist or has syntax errors
  PERFORM public.get_related_products_nearby(1, 1, 0.0, 0.0);
  RAISE NOTICE 'RPC function test: SUCCESS - Function exists and can be called';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'RPC function test: FAILED - %', SQLERRM;
END $$;

-- Show function signature
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_related_products_nearby'
  AND routine_schema = 'public';






