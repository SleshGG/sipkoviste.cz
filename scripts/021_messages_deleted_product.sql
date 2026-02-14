-- ===========================================
-- Zprávy: uložení info o smazaném inzerátu
-- Při smazání inzerátu zůstanou zprávy, v chatu se zobrazí „Inzerát byl smazán“.
-- Spusť v Supabase SQL Editor (jednou).
-- ===========================================

-- 1) Přidat sloupce pro smazaný inzerát
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS deleted_product_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_product_name text;

-- 2) Změnit FK: při smazání produktu nastavit product_id na NULL (zprávy zůstanou)
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_product_id_fkey;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
