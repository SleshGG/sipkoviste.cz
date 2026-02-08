-- ===========================================
-- Skrývání inzerátů + oblíbené (srdíčka)
-- ===========================================

-- 1) Sloupec visible u produktů (výchozí true = zobrazeno na tržišti)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true;

-- RLS: na tržišti a v detailu vidí ostatní jen viditelné; prodejce vidí i své skryté
DROP POLICY IF EXISTS "products_select_all" ON public.products;
CREATE POLICY "products_select_visible_or_own" ON public.products
  FOR SELECT USING (visible = true OR seller_id = auth.uid());

-- 2) Tabulka oblíbených (srdíčka) – přihlášený uživatel si ukládá product_id
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_product_unique UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites(product_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);
