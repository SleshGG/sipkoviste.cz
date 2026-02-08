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

## Doporučení do budoucna
- Při přidání nových chráněných cest je doplnit do pole `protectedPaths` v `lib/supabase/proxy.ts`.
- Rate limiting na přihlášení/registraci (např. na úrovni Supabase nebo edge).
