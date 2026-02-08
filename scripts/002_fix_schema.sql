-- ===========================================
-- Opravy schématu a triggeru (spusť v Supabase SQL Editor)
-- ===========================================

-- 1) Sloupec profiles.member_since je TEXT (rok např. '2025').
--    Trigger musí vkládat text, ne timestamp:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, rating, review_count, member_since, response_time)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NULL,
    0,
    0,
    to_char(NOW(), 'YYYY'),
    '< 2 hodiny'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2) (Volitelné) Pokud máš sloupec products.images bez typu, nastav ho na text[],
--    aby Supabase/PostgREST správně vracel pole URL:
-- ALTER TABLE public.products
--   ALTER COLUMN images TYPE text[] USING (
--     CASE WHEN images IS NULL THEN NULL
--          WHEN array_ndims(images) = 1 THEN images::text[]
--          ELSE ARRAY[]::text[] END
--   );

-- 3) (Volitelné) Opravit existující záznamy v profiles, kde member_since je timestamp:
-- UPDATE public.profiles
-- SET member_since = to_char(created_at, 'YYYY')
-- WHERE member_since !~ '^\d{4}$';
