-- ============================================
-- EXPORT RPC DEFINITION (PASTE INTO SUPABASE SQL EDITOR)
-- ============================================
-- Purpose:
-- - Extract the current SQL definition of the RPC so we can update it safely.
-- - Supabase requires a full CREATE OR REPLACE FUNCTION ... body to modify a function.

-- Step 1: List the function signature(s) (in case it has parameters)
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'fetch_products_with_computed_attributes';

-- Step 2: Export the current function definition (no-arg version)
-- If your function has parameters, replace the empty () with the identity args from Step 1.
SELECT pg_get_functiondef('public.fetch_products_with_computed_attributes()'::regprocedure) AS ddl;



