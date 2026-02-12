-- Funkce pro počet oblíbených u produktů (SECURITY DEFINER = bypass RLS)
CREATE OR REPLACE FUNCTION public.get_product_favorite_counts(product_ids uuid[])
RETURNS TABLE (product_id uuid, favorite_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.product_id, count(*)::bigint
  FROM favorites f
  WHERE f.product_id = ANY(product_ids)
  GROUP BY f.product_id;
$$;
