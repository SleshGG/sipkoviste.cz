-- ===========================================
-- Šipkoviště.cz – kompletní inicializace Supabase
-- Spusť v Supabase SQL Editor na prázdné databázi (jednou).
--
-- Po spuštění: vytvoř Storage bucket "product-images" (public)
-- v Supabase Dashboard → Storage.
-- ===========================================

-- ============ 0. ZÁKLADNÍ TABULKY ============

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  avatar_url text,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  member_since timestamptz NOT NULL DEFAULT now(),
  response_time text NOT NULL DEFAULT '–',
  show_online_status boolean DEFAULT true,
  last_seen_at timestamptz,
  email_notifications boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text NOT NULL,
  price numeric(12,2) NOT NULL,
  weight text,
  material text,
  condition text NOT NULL CHECK (condition IN ('Nové', 'Jako nové', 'Dobré', 'Uspokojivé')),
  category text NOT NULL CHECK (category IN ('steel-darts', 'soft-darts', 'dartboards', 'accessories')),
  image text,
  images text[],
  description text,
  negotiable boolean NOT NULL DEFAULT true,
  visible boolean DEFAULT true,
  sold_at timestamptz,
  view_count integer DEFAULT 0,
  specs jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'sold')),
  reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reservation_expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_visible ON public.products(visible);
CREATE INDEX IF NOT EXISTS idx_products_reserved_by ON public.products(reserved_by);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  text text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  message_type text,
  offer_amount numeric(12,2),
  offer_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_product_id uuid,
  deleted_product_name text
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_product ON public.messages(product_id);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(author_id, profile_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_profile ON public.reviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author ON public.reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);

CREATE TABLE IF NOT EXISTS public.favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.confirmed_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  confirmed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_price numeric(12,2),
  UNIQUE(product_id)
);

CREATE INDEX IF NOT EXISTS idx_confirmed_sales_buyer ON public.confirmed_sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_sales_seller ON public.confirmed_sales(seller_id);

-- Trigger: vytvoření profilu při registraci
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funkce: aktualizace ratingu profilu po recenzi
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE profiles SET
    review_count = (SELECT COUNT(*) FROM reviews WHERE profile_id = NEW.profile_id),
    rating = (SELECT COALESCE(AVG(rating)::numeric(3,2), 0) FROM reviews WHERE profile_id = NEW.profile_id)
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_rating();

-- RPC: zvýšení počtu zobrazení
CREATE OR REPLACE FUNCTION public.increment_product_view_count(pid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE products SET view_count = COALESCE(view_count, 0) + 1 WHERE id = pid;
END;
$$;

-- RPC: počty po kategoriích
CREATE OR REPLACE FUNCTION public.get_category_counts()
RETURNS TABLE(category text, count bigint) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT p.category::text, COUNT(*)::bigint
  FROM products p
  WHERE p.visible = true AND (p.status = 'active' OR p.status IS NULL) AND p.sold_at IS NULL
  GROUP BY p.category;
$$;

-- RPC: počty oblíbených u produktů
CREATE OR REPLACE FUNCTION public.get_product_favorite_counts(product_ids uuid[])
RETURNS TABLE(product_id uuid, favorite_count bigint) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT f.product_id, COUNT(*)::bigint
  FROM favorites f
  WHERE f.product_id = ANY(product_ids)
  GROUP BY f.product_id;
$$;

-- RPC: top produkty podle oblíbených
CREATE OR REPLACE FUNCTION public.get_top_products_by_favorites(limit_count integer DEFAULT 4)
RETURNS TABLE(product_id uuid, favorite_count bigint) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT f.product_id, COUNT(*)::bigint
  FROM favorites f
  JOIN products p ON p.id = f.product_id
  WHERE p.visible = true AND (p.status = 'active' OR p.status IS NULL) AND p.sold_at IS NULL
  GROUP BY f.product_id
  ORDER BY COUNT(*) DESC
  LIMIT limit_count;
$$;

-- ============ 1. NOTIFICATIONS + REZERVAČNÍ WORKFLOW ============

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  related_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_product_id ON public.notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_user_id ON public.notifications(related_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Uživatel vidí jen svá upozornění" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Uživatel může označit jako přečtená" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Žádný přímý INSERT" ON public.notifications;
DROP POLICY IF EXISTS "notifications_no_insert" ON public.notifications;
CREATE POLICY "notifications_no_insert" ON public.notifications FOR INSERT WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.insert_notification(p_user_id uuid, p_type text, p_title text, p_body text DEFAULT NULL, p_product_id uuid DEFAULT NULL, p_related_user_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, product_id, related_user_id) VALUES (p_user_id, p_type, p_title, p_body, p_product_id, p_related_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_product(p_product_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid; v_product record; v_buyer_name text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Musíte být přihlášeni.'); END IF;
  SELECT id, seller_id, status, name INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;
  IF v_product IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Inzerát nenalezen.'); END IF;
  IF v_product.seller_id = v_user_id THEN RETURN jsonb_build_object('ok', false, 'error', 'Nemůžete rezervovat vlastní produkt.'); END IF;
  IF v_product.status != 'active' THEN RETURN jsonb_build_object('ok', false, 'error', 'Produkt není k dispozici.'); END IF;
  UPDATE products SET status = 'reserved', reserved_by = v_user_id, reservation_expires_at = now() + interval '24 hours' WHERE id = p_product_id AND status = 'active';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Produkt není k dispozici.'); END IF;
  SELECT name INTO v_buyer_name FROM profiles WHERE id = v_user_id;
  PERFORM insert_notification(v_product.seller_id, 'reservation', 'Nová rezervace', COALESCE(v_buyer_name, 'Uživatel') || ' si chce koupit „' || COALESCE(v_product.name, 'produkt') || '". Máte 24 hodin na potvrzení.', p_product_id, v_user_id);
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_sale(p_product_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid; v_product record; v_name text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Musíte být přihlášeni.'); END IF;
  SELECT id, seller_id, status, reserved_by, reservation_expires_at, price, name INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;
  IF v_product IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Inzerát nenalezen.'); END IF;
  IF v_product.seller_id != v_user_id THEN RETURN jsonb_build_object('ok', false, 'error', 'Prodej může potvrdit pouze prodejce.'); END IF;
  IF v_product.status != 'reserved' THEN RETURN jsonb_build_object('ok', false, 'error', 'Produkt není rezervován.'); END IF;
  IF v_product.reservation_expires_at IS NULL OR v_product.reservation_expires_at <= now() THEN
    UPDATE products SET status = 'active', reserved_by = null, reservation_expires_at = null WHERE id = p_product_id;
    RETURN jsonb_build_object('ok', false, 'error', 'Rezervace vypršela.');
  END IF;
  IF v_product.reserved_by IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Rezervace je neplatná.'); END IF;
  v_name := v_product.name;
  UPDATE products SET status = 'sold', sold_at = now(), reserved_by = null, reservation_expires_at = null WHERE id = p_product_id AND status = 'reserved';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Nepodařilo se potvrdit prodej.'); END IF;
  INSERT INTO confirmed_sales (product_id, buyer_id, seller_id, confirmed_by, sale_price) VALUES (p_product_id, v_product.reserved_by, v_product.seller_id, v_user_id, v_product.price);
  PERFORM insert_notification(v_product.reserved_by, 'sale_confirmed', 'Prodej potvrzen', 'Prodejce potvrdil prodej „' || COALESCE(v_name, 'produkt') || '". Ohodnoťte prodejce.', p_product_id, v_user_id);
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_reservation(p_product_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid; v_product record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Musíte být přihlášeni.'); END IF;
  SELECT id, seller_id, status, reserved_by, name INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;
  IF v_product IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Inzerát nenalezen.'); END IF;
  IF v_product.seller_id != v_user_id THEN RETURN jsonb_build_object('ok', false, 'error', 'Rezervaci může zrušit pouze prodejce.'); END IF;
  IF v_product.status != 'reserved' THEN RETURN jsonb_build_object('ok', false, 'error', 'Produkt není rezervován.'); END IF;
  IF v_product.reserved_by IS NOT NULL THEN
    PERFORM insert_notification(v_product.reserved_by, 'reservation_cancelled', 'Rezervace zrušena', 'Prodejce ' || COALESCE((SELECT name FROM profiles WHERE id = v_user_id), 'Uživatel') || ' zrušil rezervaci.', p_product_id, v_user_id);
  END IF;
  UPDATE products SET status = 'active', reserved_by = null, reservation_expires_at = null WHERE id = p_product_id AND status = 'reserved';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Nepodařilo se zrušit rezervaci.'); END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer; v_row record;
BEGIN
  FOR v_row IN SELECT id, seller_id, reserved_by, name FROM products WHERE status = 'reserved' AND reservation_expires_at IS NOT NULL AND reservation_expires_at < now() LOOP
    PERFORM insert_notification(v_row.seller_id, 'reservation_expired', 'Rezervace vypršela', 'Rezervace vypršela. Produkt je znovu k dispozici.', v_row.id, v_row.reserved_by);
    IF v_row.reserved_by IS NOT NULL THEN
      PERFORM insert_notification(v_row.reserved_by, 'reservation_expired', 'Rezervace vypršela', 'Vaše rezervace vypršela.', v_row.id, v_row.seller_id);
    END IF;
  END LOOP;
  UPDATE products SET status = 'active', reserved_by = null, reservation_expires_at = null WHERE status = 'reserved' AND reservation_expires_at IS NOT NULL AND reservation_expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_reservations()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT cleanup_expired_reservations();
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ============ 2. AUDIT LOGS ============

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert own audit logs" ON public.audit_logs;
CREATE POLICY "Insert own audit logs" ON public.audit_logs FOR INSERT WITH CHECK (user_id IS NULL OR user_id = (select auth.uid()));

-- ============ 3. RLS POLICIES ============

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles veřejné čtení" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Profiles vlastník může vložit" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = (select auth.uid()));
DROP POLICY IF EXISTS "Profiles vlastník může upravit" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));
DROP POLICY IF EXISTS "Profiles vlastník může smazat" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (id = (select auth.uid()));

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products čtení veřejné a vlastní" ON public.products;
DROP POLICY IF EXISTS "products_select_visible_or_own" ON public.products;
CREATE POLICY "products_select_visible_or_own" ON public.products FOR SELECT USING (
  (visible = true AND (status = 'active' OR status IS NULL) AND sold_at IS NULL)
  OR seller_id = (select auth.uid())
  OR reserved_by = (select auth.uid())
  OR id IN (SELECT product_id FROM confirmed_sales WHERE buyer_id = (select auth.uid()))
);
DROP POLICY IF EXISTS "Products prodejce může vložit" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
CREATE POLICY "products_insert_own" ON public.products FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL AND seller_id = (select auth.uid()));
DROP POLICY IF EXISTS "Products prodejce může upravit" ON public.products;
DROP POLICY IF EXISTS "products_update_own" ON public.products;
CREATE POLICY "products_update_own" ON public.products FOR UPDATE USING (seller_id = (select auth.uid())) WITH CHECK (seller_id = (select auth.uid()));
DROP POLICY IF EXISTS "Products prodejce může smazat" ON public.products;
DROP POLICY IF EXISTS "products_delete_own" ON public.products;
CREATE POLICY "products_delete_own" ON public.products FOR DELETE USING (seller_id = (select auth.uid()));

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Messages čtení jen účastník" ON public.messages;
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT USING (sender_id = (select auth.uid()) OR receiver_id = (select auth.uid()));
DROP POLICY IF EXISTS "Messages odesílatel může vložit" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL AND sender_id = (select auth.uid()));
DROP POLICY IF EXISTS "Messages příjemce může označit přečtené" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE USING (receiver_id = (select auth.uid())) WITH CHECK (receiver_id = (select auth.uid()));

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews veřejné čtení" ON public.reviews;
DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Reviews autor může vložit" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL AND author_id = (select auth.uid()));

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Favorites vlastník čtení" ON public.favorites;
DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT USING (user_id = (select auth.uid()));
DROP POLICY IF EXISTS "Favorites vlastník může vložit" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()));
DROP POLICY IF EXISTS "Favorites vlastník může smazat" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE USING (user_id = (select auth.uid()));

ALTER TABLE public.confirmed_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Confirmed_sales čtení jen účastník" ON public.confirmed_sales;
DROP POLICY IF EXISTS "confirmed_sales_select_own" ON public.confirmed_sales;
CREATE POLICY "confirmed_sales_select_own" ON public.confirmed_sales FOR SELECT USING (buyer_id = (select auth.uid()) OR seller_id = (select auth.uid()));
DROP POLICY IF EXISTS "Confirmed_sales účastník může smazat při mazání účtu" ON public.confirmed_sales;
DROP POLICY IF EXISTS "confirmed_sales_delete_own" ON public.confirmed_sales;
CREATE POLICY "confirmed_sales_delete_own" ON public.confirmed_sales FOR DELETE USING (buyer_id = (select auth.uid()) OR seller_id = (select auth.uid()));
