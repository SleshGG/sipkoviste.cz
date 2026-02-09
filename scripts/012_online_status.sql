-- Online status: předvolba a čas poslední aktivity
-- Spusťte v Supabase SQL Editoru.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_online_status boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

COMMENT ON COLUMN public.profiles.show_online_status IS 'Zobrazovat ostatním, že je uživatel online';
COMMENT ON COLUMN public.profiles.last_seen_at IS 'Čas poslední aktivity na webu (aktualizuje se při prohlížení stránek)';
