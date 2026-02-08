-- ===========================================
-- Potvrzené prodeje (kupující potvrdí nákup; poté může hodnotit prodejce)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.confirmed_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id),
  seller_id uuid NOT NULL REFERENCES public.profiles(id),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  confirmed_by uuid NOT NULL REFERENCES public.profiles(id),
  CONSTRAINT confirmed_sales_pkey PRIMARY KEY (id),
  CONSTRAINT confirmed_sales_product_buyer_seller_unique UNIQUE (product_id, buyer_id, seller_id),
  CONSTRAINT confirmed_sales_buyer_not_seller CHECK (buyer_id != seller_id)
);

CREATE INDEX IF NOT EXISTS idx_confirmed_sales_product_buyer_seller
  ON public.confirmed_sales(product_id, buyer_id, seller_id);

COMMENT ON TABLE public.confirmed_sales IS 'Potvrzení prodeje mezi kupujícím a prodejcem; po potvrzení může kupující ohodnotit prodejce.';

-- ===========================================
-- RLS
-- ===========================================
ALTER TABLE public.confirmed_sales ENABLE ROW LEVEL SECURITY;

-- Číst jen záznamy, kde je uživatel kupující nebo prodejce
CREATE POLICY "confirmed_sales_select_own" ON public.confirmed_sales
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Vložit jen přihlášený; kontrolu (konverzace existuje, uživatel je kupující nebo prodejce) dělá aplikace
CREATE POLICY "confirmed_sales_insert_own" ON public.confirmed_sales
  FOR INSERT WITH CHECK (auth.uid() = confirmed_by);
