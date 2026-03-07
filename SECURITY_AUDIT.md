# Bezpečnostní audit – Šipkoviště.cz

Datum: 2026-02-07

## 1. XSS ochrana ✅

### Stav
- **dangerouslySetInnerHTML**: Nepoužívá se v projektu
- **innerHTML / eval / document.write**: Nepoužívá se
- **React JSX**: Všechna uživatelská data (jména, popisy, zprávy, recenze) se renderují přes `{variable}` – React automaticky escapuje
- **URL validace**: Přidána `lib/security.ts` – `isSafeImageUrl()` a `getSafeImageUrl()` pro avatary a obrázky (blokuje `javascript:`, `data:`, neznámé hosty)
- **AvatarWithOnline**: Používá `getSafeImageUrl()` před zobrazením
- **updateProfileAction**: Validuje `avatar_url` před uložením

### Doporučení
- Při budoucím použití `dangerouslySetInnerHTML` vždy sanitizovat (např. DOMPurify)

---

## 2. CSRF ochrana ✅

### Stav
- **Next.js Server Actions**: Mají vestavěnou CSRF ochranu (unikátní `Next-Action` header, origin check)
- **Supabase cookies**: Přidány `SameSite=lax` a `Secure` (v produkci) v `lib/supabase/proxy.ts` a `lib/supabase/server.ts`
- **httpOnly**: Supabase auth cookies musí zůstat `httpOnly: false` – browser client potřebuje číst token pro API volání (omezení Supabase SSR)

### Doporučení
- CSRF token není nutný – Server Actions jsou chráněny nativně

---

## 3. Autentizace ✅

### Stav
- **localStorage pro auth**: Nepoužívá se – Supabase SSR ukládá session do cookies
- **localStorage**: Pouze pro cookie consent (`sipkoviste-cookie-consent`) – nesenzitivní
- **Cookies**: SameSite=lax, Secure v produkci
- **Expirace / refresh**: Supabase automaticky obnovuje tokeny; middleware (`lib/supabase/proxy.ts`) zajišťuje refresh session
- **Chráněné cesty**: Middleware přesměruje nepřihlášené z `/dashboard`, `/sell`, `/messages`, `/listings`, `/profile/me`, `/marketplace/oblibene`

### Doporučení
- httpOnly cookies pro Supabase auth nejsou možné bez změny architektury (client potřebuje token pro Supabase API)

---

## 4. API bezpečnost ✅

### Stav
- **Rate limiting**: Distribuovaný (Redis/Upstash) v `lib/security.ts`
  - Klíč: `rate:{type}:{identifier}`, TTL 60 s, max 30 req/okno
  - Auth, zprávy, produkty, recenze
  - Brute-force: 5 neúspěšných přihlášení = blokace IP na 15 min
- **Validace vstupů**: Všechny Server Actions validují vstupy (UUID regex, délky, kategorie, ceny, komentář recenze max 2000 znaků)
- **Autorizace**: Každá akce volá `supabase.auth.getUser()` a ověřuje oprávnění (seller_id, receiver_id, atd.)
- **Zod**: V projektu dostupný; validace je implementována ručně (regex, whitelist)

### Doporučení
- Nastav KV_REST_API_URL a KV_REST_API_TOKEN (Vercel KV / Upstash Redis) pro distribuovaný rate limiting

---

## 5. Security headers ✅

### Stav (next.config.mjs)
| Header | Hodnota |
|--------|---------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| Content-Security-Policy | default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none'; ... |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload (pouze produkce) |
| upgrade-insecure-requests | V CSP (pouze produkce) |

### Poznámky
- `unsafe-inline` a `unsafe-eval` v script-src jsou často nutné pro Next.js
- HSTS pouze v produkci (localhost by byl problém)

---

## 6. .env audit ✅

### Stav
| Proměnná | Klient? | Bezpečnost |
|----------|---------|------------|
| NEXT_PUBLIC_SUPABASE_URL | Ano | Veřejná URL – OK |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Ano | Anon key je určen pro klienta – OK |
| NEXT_PUBLIC_SITE_URL | Ano | Veřejná URL – OK |
| NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL | Ano | Volitelné – OK |
| NEXT_PUBLIC_FB_APP_ID | Ano | Veřejné ID – OK |
| SUPABASE_SERVICE_ROLE_KEY | Ne | Pouze server – ✅ |
| RESEND_API_KEY | Ne | Pouze server – ✅ |

### Doporučení
- Nikdy nepřidávat `NEXT_PUBLIC_` k service role key ani API klíčům

---

## Shrnutí oprav

| Oblast | Problém | Oprava |
|--------|---------|--------|
| XSS | Možná nebezpečná URL v avatarech | `isSafeImageUrl`, `getSafeImageUrl` v lib/security.ts |
| Cookies | Chybějící SameSite/Secure | Přidáno v proxy.ts a server.ts |
| Rate limiting | Žádný | checkRateLimit() pro auth, zprávy, produkty, recenze, deleteAccount |
| Headers | Chybějící HSTS | Strict-Transport-Security v produkci |
| Headers | Chybějící object-src | `object-src 'none'` v CSP |
| Validace | Recenze bez limitu délky | Max 2000 znaků pro komentář recenze |
| .env | Dokumentace | Bezpečnostní poznámky v .env.example |
