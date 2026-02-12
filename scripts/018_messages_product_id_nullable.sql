-- ===========================================
-- Obecné zprávy bez vazby na inzerát
-- Umožní uživatelům psát si i bez konkrétního inzerátu.
-- Spusť v Supabase SQL Editor (jednou).
-- ===========================================

-- 1) Povolit NULL u product_id (zprávy bez inzerátu = obecná konverzace)
ALTER TABLE public.messages
  ALTER COLUMN product_id DROP NOT NULL;

-- FK messages_product_id_fkey zůstává – platí jen pro řádky kde product_id IS NOT NULL.
-- Při smazání produktu se smažou jen zprávy s tím product_id (CASCADE).
