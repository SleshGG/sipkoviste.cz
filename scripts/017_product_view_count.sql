-- ===========================================
-- Počet zobrazení inzerátů
-- ===========================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.products.view_count IS 'Počet zobrazení detailu inzerátu (inkrementováno při zobrazení stránky)';

-- Funkce pro atomické zvýšení počtu zobrazení
CREATE OR REPLACE FUNCTION public.increment_product_view_count(pid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.products
  SET view_count = view_count + 1
  WHERE id = pid;
$$;
