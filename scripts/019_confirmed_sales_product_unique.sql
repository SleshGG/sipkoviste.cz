-- ===========================================
-- Jeden produkt = jeden potvrzený prodej
-- Zabrání potvrzení téhož inzerátu více kupujícím.
-- Spusť v Supabase SQL Editor (jednou).
-- ===========================================

-- Před spuštěním: zkontroluj, zda neexistují duplicitní product_id
-- SELECT product_id, count(*) FROM confirmed_sales GROUP BY product_id HAVING count(*) > 1;

-- 1) Odstranit původní constraint (product_id, buyer_id, seller_id)
ALTER TABLE public.confirmed_sales
  DROP CONSTRAINT IF EXISTS confirmed_sales_product_buyer_seller_unique;

-- 2) Přidat constraint: jeden produkt může mít nejvýše jeden potvrzený prodej
ALTER TABLE public.confirmed_sales
  ADD CONSTRAINT confirmed_sales_product_unique UNIQUE (product_id);
