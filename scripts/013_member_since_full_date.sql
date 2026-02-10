-- Ukládání celého data registrace (YYYY-MM-DD) místo jen roku.
-- Noví uživatelé dostanou správné datum; stávající záznamy s rokem (YYYY) se zobrazí jako „od roku YYYY“.

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
    to_char(NOW() AT TIME ZONE 'Europe/Prague', 'YYYY-MM-DD'),
    '< 2 hodiny'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
