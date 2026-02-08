# Audit – Krok 3: Bezpečnost a formuláře

## Provedené změny

### Middleware (ochrana rout)
- **`middleware.ts`** v kořeni projektu: Next.js nyní volá `updateSession()` z `@/lib/supabase/proxy`, obnovuje Supabase session a chrání cesty vyžadující přihlášení.
- **Chráněné cesty:** `/dashboard`, `/sell`, `/messages`, **`/listings`** – nepřihlášený uživatel je přesměrován na `/` s `?auth=required`.
- **`lib/supabase/proxy.ts`:** Do seznamu chráněných cest přidána `/listings`.

### Validace na serveru (`lib/supabase/actions.ts`)
- **Auth:** `validateAuthInput()` – e-mail (regex), heslo ≥ 8 znaků; u registrace jméno ≥ 2 znaky.
- **createProductAction:** název ≥ 2 znaky, cena číslo 0–99 999 999.
- **updateProductAction:** validace ID (UUID), název 2–200 znaků, cena v rozsahu; z updates se vyřadí `seller_id` (nelze přeřadit inzerát na jiného prodejce).
- **sendMessageAction:** text 1–5000 znaků, `receiver_id` a `product_id` jako UUID.
- **UUID_REGEX** přesunut na začátek souboru a použit u `updateProductAction` i `sendMessageAction`.

### Klientská validace
- **`components/auth-dialog.tsx`:** Přihlášení/registrace – kontrola formátu e-mailu, délky jména a hesla, shoda hesel; odstraněny `console.log`.

### Tajemství
- Žádné API klíče v kódu; pouze `NEXT_PUBLIC_*` a placeholdery v `lib/supabase`.

## RLS výkon (databáze)
- **`scripts/007_rls_performance.sql`:** Odstraní varování Supabase linteru (auth_rls_initplan, multiple_permissive_policies). V RLS politikách se používá `(select auth.uid())` místo `auth.uid()`, aby se uid vyhodnotilo jednou za dotaz; duplicitní politiky (české + anglické názvy) jsou sloučeny na jednu per (tabulka, akce). Spusť jednou v Supabase SQL Editor – zrychlí to dotazy a načítání stránek.

## Indexy na cizí klíče
- **`scripts/008_indexes_foreign_keys.sql`:** Přidá indexy na sloupce s cizími klíči (confirmed_sales: buyer_id, seller_id, confirmed_by; messages: product_id, receiver_id, sender_id; products: seller_id; reviews: product_id). Odstraní info „Unindexed foreign keys“ a zlepší výkon JOINů a dotazů. Spusť jednou v SQL Editor.
- *Unused index (idx_favorites_product_id, idx_reviews_author_id, idx_products_sold_at):* Linter je označuje jako nepoužívané; pro malý provoz je lze nechat – mohou se hodit později (filtry, reporty). Odstranit až při skutečné optimalizaci zátěže.

## Leaked Password Protection (Supabase Auth)
- Varování **„Leaked Password Protection Disabled“**: Supabase může kontrolovat hesla proti databázi HaveIBeenPwned (uniklá hesla). Zapnutí je v **Dashboardu**, ne v kódu.
- **Jak zapnout:** Supabase Dashboard → **Authentication** → **Providers** → **Email** (nebo **Settings** v sekci Auth) → najdi **„Leaked password protection“** / **„Password strength“** → zapni **„Enable leaked password protection“** (nebo ekvivalent). Ulož.
- Dokumentace: [Password security – Leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Doporučení do budoucna
- Při přidání nových chráněných cest je doplnit do pole `protectedPaths` v `lib/supabase/proxy.ts`.
- Rate limiting na přihlášení/registraci (např. na úrovni Supabase nebo edge).
