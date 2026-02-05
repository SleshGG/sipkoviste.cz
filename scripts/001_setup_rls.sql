-- ===========================================
-- RLS Politiky pro sipkoviste.cz
-- ===========================================

-- PROFILES TABLE
-- ---------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kdokoliv muze cist profily (verejne)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- Uzivatel muze upravovat jen svuj profil
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Uzivatel muze smazat jen svuj profil
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Uzivatel muze vlozit jen svuj profil
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- PRODUCTS TABLE
-- ---------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Kdokoliv muze cist produkty (verejne)
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT USING (true);

-- Prihlaseny uzivatel muze vytvorit produkt
CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Uzivatel muze upravovat jen sve produkty
CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (auth.uid() = seller_id);

-- Uzivatel muze mazat jen sve produkty
CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (auth.uid() = seller_id);

-- MESSAGES TABLE
-- ---------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Uzivatel muze cist zpravy kde je odesilatel nebo prijemce
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Prihlaseny uzivatel muze odesilat zpravy
CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Uzivatel muze upravovat jen sve odeslane zpravy
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Uzivatel muze mazat jen sve zpravy
CREATE POLICY "messages_delete_own" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);

-- ===========================================
-- Trigger pro automaticke vytvoreni profilu
-- ===========================================

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
    5.0,
    0,
    NOW(),
    'Do hodiny'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Smazat stary trigger pokud existuje
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Vytvorit trigger pro nove uzivatele
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- Realtime subscriptions
-- ===========================================

-- Povolit realtime pro messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
