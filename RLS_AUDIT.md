# Audit Row-Level Security (Supabase)

## 1. Přehled tabulek a RLS stavu

| Tabulka | RLS enabled | SELECT | INSERT | UPDATE | DELETE | Poznámka |
|---------|-------------|--------|--------|--------|--------|----------|
| **profiles** | ❓ | ❓ | ❓ | ❓ | ❓ | Schéma mimo repo |
| **products** | ❓ | ❓ | ❓ | ❓ | ❓ | Schéma mimo repo |
| **messages** | ❓ | ❓ | ❓ | ❓ | ❓ | Schéma mimo repo |
| **reviews** | ❓ | ❓ | ❓ | ❓ | ❓ | Schéma mimo repo |
| **favorites** | ❓ | ❓ | ❓ | ❓ | ❓ | Schéma mimo repo |
| **confirmed_sales** | ❓ | ❓ | ❓ | ❓ | ❓ | Schéma mimo repo |
| **notifications** | ✅ | ✅ user_id | ❌ (pouze RPC) | ✅ user_id | ❌ | Správně |
| **audit_logs** | ✅ | ❌ | ✅ user_id | ❌ | ❌ | Správně |

> Tabulky profiles, products, messages, reviews, favorites, confirmed_sales jsou referencovány v kódu, ale jejich CREATE TABLE a RLS definice nejsou v repozitáři (pravděpodobně v Supabase Dashboard nebo skriptech 001–014).

---

## 2. Požadavky na RLS

### 2.1 User může číst jen své zprávy
- **messages**: SELECT pouze pokud `sender_id = auth.uid() OR receiver_id = auth.uid()`
- Bez této podmínky by anonym/útočník mohl číst cizí konverzace.

### 2.2 User může editovat jen své produkty
- **products**: UPDATE/DELETE pouze pokud `seller_id = auth.uid()`
- INSERT pouze s `seller_id = auth.uid()`.

### 2.3 Seller může upravovat jen své položky
- Stejné jako 2.2 – `seller_id = auth.uid()` pro UPDATE, DELETE, INSERT.

### 2.4 Recenze nelze editovat po odeslání
- **reviews**: Žádná UPDATE ani DELETE policy pro běžné uživatele.
- INSERT pouze s `author_id = auth.uid()`.

### 2.5 Žádná tabulka nemá veřejný SELECT bez podmínky
- **profiles**: Veřejné čtení je OK (zobrazení profilů), ale mělo by být explicitní.
- **products**: Veřejné čtení jen pro viditelné/aktivní inzeráty; vlastní produkty prodejce vždy.
- **messages**: Jen vlastní konverzace (sender/receiver).
- **reviews**: Veřejné čtení OK (zobrazení na profilu).
- **favorites**: Jen vlastní oblíbené.
- **confirmed_sales**: Jen vlastní prodeje (buyer/seller).
- **notifications**: Jen vlastní.
- **audit_logs**: Bez SELECT pro anon/authenticated (jen service role).

---

## 3. Doporučené RLS policy

Níže navržené policy jsou v souboru `scripts/init_all.sql`.

### profiles
- **SELECT**: Veřejné (všichni mohou číst profily pro zobrazení na tržišti/profilu).
- **INSERT**: `id = auth.uid()` (pouze vlastní profil, typicky trigger z auth.users).
- **UPDATE**: `id = auth.uid()`.
- **DELETE**: `id = auth.uid()` (pro mazání účtu).

### products
- **SELECT**: `(visible = true AND (status = 'active' OR status IS NULL) AND sold_at IS NULL) OR seller_id = auth.uid()` – veřejné inzeráty + vlastní produkty prodejce.
- **INSERT**: `auth.uid() IS NOT NULL AND seller_id = auth.uid()`.
- **UPDATE**: `seller_id = auth.uid()`.
- **DELETE**: `seller_id = auth.uid()`.

### messages
- **SELECT**: `sender_id = auth.uid() OR receiver_id = auth.uid()`.
- **INSERT**: `sender_id = auth.uid()`.
- **UPDATE**: `receiver_id = auth.uid()` (označení jako přečtené).
- **DELETE**: Žádná policy (zprávy se nemazají uživateli).

### reviews
- **SELECT**: Veřejné (zobrazení recenzí na profilu).
- **INSERT**: `author_id = auth.uid()`.
- **UPDATE**: Žádná policy (recenze jsou neměnné).
- **DELETE**: Žádná policy (recenze se nemazají).

### favorites
- **SELECT**: `user_id = auth.uid()`.
- **INSERT**: `user_id = auth.uid()`.
- **DELETE**: `user_id = auth.uid()`.

### confirmed_sales
- **SELECT**: `buyer_id = auth.uid() OR seller_id = auth.uid()`.
- **INSERT**: Pouze přes SECURITY DEFINER funkce (confirm_sale, sendBuyIntent). Žádná přímá INSERT policy pro uživatele.
- **UPDATE**: Žádná.
- **DELETE**: Žádná.

---

## 4. Kontrolní seznam

- [ ] Spustit `scripts/init_all.sql` v Supabase SQL Editoru.
- [ ] Ověřit, že RLS je na všech tabulkách: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- [ ] Otestovat s různými uživateli (anon, authenticated, různé role).
- [ ] Použít Supabase Policy Simulator pro ověření.
