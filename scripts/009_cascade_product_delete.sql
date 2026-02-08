-- ===========================================
-- CASCADE při mazání produktu
-- Umožní smazat inzerát i když má zprávy nebo recenze
-- (zprávy a recenze se při smazání produktu smažou také).
-- Spusť v Supabase SQL Editor (jednou).
-- ===========================================

-- messages.product_id: při smazání produktu smazat i konverzace o něm
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_product_id_fkey;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- reviews.product_id: při smazání produktu smazat i recenze k němu
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
