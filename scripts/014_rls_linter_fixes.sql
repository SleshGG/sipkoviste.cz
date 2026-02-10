-- ===========================================
-- Oprava RLS podle Supabase linteru
-- Spusť v Supabase SQL Editor (jednou).
--
-- 1) auth_rls_initplan: auth.uid() → (select auth.uid()) v politikách
--    (vyhodnocení jednou za dotaz, ne za každý řádek)
-- 2) multiple_permissive_policies: u products jedna SELECT politika místo dvou
-- ===========================================

-- ---------------
-- PROFILES
-- ---------------
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING ((select auth.uid()) = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- ---------------
-- PRODUCTS (jedna SELECT politika + auth fix)
-- ---------------
DROP POLICY IF EXISTS "products_select_all" ON public.products;
DROP POLICY IF EXISTS "products_select_visible_or_own" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "products_delete_own" ON public.products;

-- Jediná SELECT politika: viditelné pro všechny, nebo vlastní (skryté) pro prodejce
CREATE POLICY "products_select_visible_or_own" ON public.products
  FOR SELECT USING (visible = true OR seller_id = (select auth.uid()));

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK ((select auth.uid()) = seller_id);

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING ((select auth.uid()) = seller_id);

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING ((select auth.uid()) = seller_id);

-- ---------------
-- MESSAGES
-- ---------------
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;

CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING ((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id);

CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK ((select auth.uid()) = sender_id);

CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING ((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id);

CREATE POLICY "messages_delete_own" ON public.messages
  FOR DELETE USING ((select auth.uid()) = sender_id);
