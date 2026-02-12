-- Produkty s nejvíce srdíčky (pro doporučené inzeráty na homepage)
-- SECURITY DEFINER = bypass RLS pro agregační dotaz přes favorites
CREATE OR REPLACE FUNCTION public.get_top_products_by_favorites(limit_count int DEFAULT 4)
RETURNS TABLE (product_id uuid, favorite_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.product_id, count(*)::bigint
  FROM favorites f
  JOIN products p ON p.id = f.product_id
  WHERE p.visible = true AND p.sold_at IS NULL
  GROUP BY f.product_id
  ORDER BY count(*) DESC
  LIMIT limit_count;
$$;
