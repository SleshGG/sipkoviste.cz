-- ===========================================
-- Označení inzerátu jako prodaného (po potvrzení prodeje v chatu)
-- ===========================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sold_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.products.sold_at IS 'Kdy byl inzerát prodán (prodejce potvrdil prodej v chatu). NULL = není prodán.';

CREATE INDEX IF NOT EXISTS idx_products_sold_at ON public.products(sold_at) WHERE sold_at IS NULL;
