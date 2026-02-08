-- ===========================================
-- Při smazání inzerátu se recenze (hodnocení) nesmažou
-- product_id u recenze se nastaví na NULL; hodnocení prodejce zůstane.
-- Spusť v Supabase SQL Editor (jednou). Až poté bude mazání inzerátu
-- recenze zachovávat.
-- ===========================================

-- 1) Zrušit FK a povolit NULL u product_id
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;

ALTER TABLE public.reviews
  ALTER COLUMN product_id DROP NOT NULL;

-- 2) Zrušit původní UNIQUE (author, profile, product) – s NULL by nefungoval
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_author_profile_product_unique;

-- 3) Částečný unikátní index: jen u neprázdného product_id jedna recenze na (author, profile, product)
CREATE UNIQUE INDEX IF NOT EXISTS reviews_author_profile_product_unique
  ON public.reviews (author_id, profile_id, product_id)
  WHERE product_id IS NOT NULL;

-- 4) Nový FK: při smazání produktu jen nastavíme product_id na NULL
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
