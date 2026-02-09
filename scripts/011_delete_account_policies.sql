-- Politiky pro smazání vlastních záznamů při „Smazat účet“
-- Spusťte v Supabase SQL Editoru.

-- confirmed_sales: uživatel může smazat záznamy, kde je kupující nebo prodejce
-- (select auth.uid()) = vyhodnocení jednou za dotaz, ne za řádek (RLS performance)
DROP POLICY IF EXISTS "confirmed_sales_delete_own" ON public.confirmed_sales;
CREATE POLICY "confirmed_sales_delete_own" ON public.confirmed_sales
  FOR DELETE USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = seller_id);

-- reviews: jedna DELETE politika – autor recenze nebo hodnocený (profile_id) může smazat
-- sloučeno kvůli multiple_permissive_policies; (select auth.uid()) kvůli auth_rls_initplan
DROP POLICY IF EXISTS "reviews_delete_about_self" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_own_or_about_self" ON public.reviews;
CREATE POLICY "reviews_delete_own_or_about_self" ON public.reviews
  FOR DELETE USING ((select auth.uid()) = author_id OR (select auth.uid()) = profile_id);
