-- ===========================================
-- RLS výkon: odstranění varování auth_rls_initplan a multiple_permissive_policies
-- Spusť v Supabase SQL Editor (jednou).
--
-- 1) auth.uid() → (select auth.uid()) aby se vyhodnotilo jednou za dotaz, ne za řádek
-- 2) Sloučení duplicitních politik (české + anglické názvy) na jednu politiku na (tabulka, akce)
-- ===========================================

-- ---------------
-- PRODUCTS
-- ---------------
DROP POLICY IF EXISTS "Produkty může vkládat přihlášený" ON public.products;
DROP POLICY IF EXISTS "Produkty může měnit jen majitel" ON public.products;
DROP POLICY IF EXISTS "Produkty vidí všichni" ON public.products;
DROP POLICY IF EXISTS "products_select_all" ON public.products;
DROP POLICY IF EXISTS "products_select_visible_or_own" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "products_delete_own" ON public.products;

CREATE POLICY "products_select_visible_or_own" ON public.products
  FOR SELECT USING (visible = true OR seller_id = (select auth.uid()));

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK ((select auth.uid()) = seller_id);

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING ((select auth.uid()) = seller_id);

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING ((select auth.uid()) = seller_id);

-- ---------------
-- PROFILES
-- ---------------
DROP POLICY IF EXISTS "Profil si mění majitel" ON public.profiles;
DROP POLICY IF EXISTS "Profily vidí všichni" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING ((select auth.uid()) = id);

-- ---------------
-- MESSAGES
-- ---------------
DROP POLICY IF EXISTS "Uživatel vidí své zprávy" ON public.messages;
DROP POLICY IF EXISTS "Uživatel může poslat zprávu" ON public.messages;
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
DROP POLICY IF EXISTS "messages_update_receiver" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;

CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING ((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id);

CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK ((select auth.uid()) = sender_id);

-- update: příjemce může označit jako přečtené (is_read)
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING ((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id);

CREATE POLICY "messages_delete_own" ON public.messages
  FOR DELETE USING ((select auth.uid()) = sender_id);

-- ---------------
-- REVIEWS
-- ---------------
DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;

CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK ((select auth.uid()) = author_id);

CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING ((select auth.uid()) = author_id);

CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING ((select auth.uid()) = author_id);

-- ---------------
-- FAVORITES
-- ---------------
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;

CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "favorites_insert_own" ON public.favorites
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "favorites_delete_own" ON public.favorites
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ---------------
-- CONFIRMED_SALES
-- ---------------
DROP POLICY IF EXISTS "confirmed_sales_select_own" ON public.confirmed_sales;
DROP POLICY IF EXISTS "confirmed_sales_insert_own" ON public.confirmed_sales;

CREATE POLICY "confirmed_sales_select_own" ON public.confirmed_sales
  FOR SELECT USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = seller_id);

CREATE POLICY "confirmed_sales_insert_own" ON public.confirmed_sales
  FOR INSERT WITH CHECK ((select auth.uid()) = confirmed_by);
