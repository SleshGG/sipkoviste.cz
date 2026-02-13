-- ===========================================
-- Funkce pro rychlé počítání inzerátů po kategoriích
-- Místo načítání všech produktů stačí jeden agregovaný dotaz.
-- Spusť v Supabase SQL Editor.
-- ===========================================

CREATE OR REPLACE FUNCTION public.get_category_counts()
RETURNS TABLE(category text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT category::text, COUNT(*)::bigint
  FROM products
  WHERE visible = true AND sold_at IS NULL
  GROUP BY category;
$$;

COMMENT ON FUNCTION public.get_category_counts() IS 'Počet viditelných neprodaných inzerátů po kategoriích. Pro rychlé načtení homepage.';

-- Index pro rychlé načítání tržiště (visible + sold_at + created_at)
CREATE INDEX IF NOT EXISTS idx_products_listing
  ON public.products(created_at DESC)
  WHERE visible = true AND sold_at IS NULL;
