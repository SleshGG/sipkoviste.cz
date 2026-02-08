-- ===========================================
-- Hodnocení uživatelů (recenze)
-- Pravidla: docs/hodnoceni-pravidla.md
-- ===========================================

-- Tabulka recenzí: kdo (author_id) ohodnotil koho (profile_id) v kontextu produktu (product_id)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_author_profile_product_unique UNIQUE (author_id, profile_id, product_id),
  CONSTRAINT reviews_not_self CHECK (author_id != profile_id)
);

-- Index pro rychlé načtení recenzí profilu
CREATE INDEX IF NOT EXISTS idx_reviews_profile_id ON public.reviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON public.reviews(author_id);

COMMENT ON TABLE public.reviews IS 'Hodnocení prodejců od kupujících; pouze po konverzaci o daném inzerátu.';

-- ===========================================
-- RLS
-- ===========================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Číst recenze může kdokoliv (veřejné profily)
CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

-- Vložit recenzi jen přihlášený uživatel jako author_id; kontrolu „může hodnotit“ dělá aplikace nebo funkce
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Mazat/upravovat jen vlastní recenzi
CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (auth.uid() = author_id);

-- ===========================================
-- Přepočet rating a review_count na profilu
-- Volat po INSERT/UPDATE/DELETE v reviews (nebo z aplikace)
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.profile_id;
  ELSE
    target_id := NEW.profile_id;
  END IF;

  UPDATE public.profiles
  SET
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE profile_id = target_id),
    rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) FROM public.reviews WHERE profile_id = target_id)
  WHERE id = target_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_update_profile_rating ON public.reviews;
CREATE TRIGGER reviews_update_profile_rating
  AFTER INSERT OR UPDATE OF rating OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_rating();
