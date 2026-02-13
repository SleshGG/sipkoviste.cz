-- ===========================================
-- Skutečná prodejní cena u potvrzených prodejů
-- Spusť v Supabase SQL Editor.
-- ===========================================

ALTER TABLE public.confirmed_sales
  ADD COLUMN IF NOT EXISTS sale_price integer;

COMMENT ON COLUMN public.confirmed_sales.sale_price IS 'Skutečná cena za kterou byl produkt prodán (Kč). NULL = prodáno za cenu z inzerátu.';
