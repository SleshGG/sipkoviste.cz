-- ===========================================
-- Indexy na cizí klíče (unindexed_foreign_keys)
-- Zrychlují JOINy, CASCADE a dotazy filtrující podle FK.
-- Spusť v Supabase SQL Editor (jednou).
-- ===========================================

-- confirmed_sales
CREATE INDEX IF NOT EXISTS idx_confirmed_sales_buyer_id
  ON public.confirmed_sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_sales_seller_id
  ON public.confirmed_sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_sales_confirmed_by
  ON public.confirmed_sales(confirmed_by);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_product_id
  ON public.messages(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id
  ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages(sender_id);

-- products
CREATE INDEX IF NOT EXISTS idx_products_seller_id
  ON public.products(seller_id);

-- reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id
  ON public.reviews(product_id);
