# Krok 2: Optimalizace výkonu – shrnutí

## Provedené úpravy

### Obrázky (Images)
- **next.config.mjs**
  - Odstraněno `unoptimized: true` – zapnuta **Next.js Image Optimization** (resize, moderní formáty).
  - Přidáno `formats: ['image/avif', 'image/webp']` – obrázky z Supabase se servírují v AVIF/WebP tam, kde to prohlížeč podporuje (menší velikost, lepší LCP).
- **ProductCard** – nový prop `priority`; na úvodní stránce má první doporučený inzerát `priority={true}` pro rychlejší **LCP** (Largest Contentful Paint).
- **Detail produktu** – u hlavního obrázku doplněn atribut `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"` pro správné rozměry při responzivu.
- **Moje inzeráty** – u náhledů obrázků doplněno `sizes="(max-width: 640px) 80px, 96px"` (malé thumbnaily).

### Bundle size a code-splitting
- **Úvod (app/page.tsx)** – `HomeClient` se načítá přes **dynamic import** (`next/dynamic`) s `ssr: true` a loading fallbackem. Mřížka produktů a framer-motion se stáhnou až s tímto chunkem.
- **Tržiště (app/marketplace/page.tsx)** – `MarketplaceClient` také přes **dynamic import** s `ssr: true`. Menší hlavní bundle, tržiště se načte až při návštěvě route.
- Typ `initialProducts` na tržišti změněn z `as any` na `ProductWithSeller[]`.

### Caching
- **Úvodní stránka** – přidáno `export const revalidate = 60`. Výstup stránky se cache na 60 sekund, při opakované návštěvě lepší TTFB bez zbytečného zatížení Supabase.
- Tržiště zůstává `force-dynamic` (vždy čerstvá data dle požadavku).

---

## Doporučení do budoucna

1. **Lighthouse / Core Web Vitals**
   - Po nasazení spusťte Lighthouse (Performance) a kontrolu Core Web Vitals (LCP, FID/INP, CLS).
   - U obrázků z externích URL (Supabase) ověřte, že Image Optimization běží (např. že requesty jdou na `/_next/image?url=...`).

2. **framer-motion**
   - Knihovna je poměrně velká. Pokud budete chtít dál zmenšit bundle, lze u jednoduchých animací (fade-in, slide) použít čisté CSS (např. `tw-animate-css`) a framer-motion načítat jen na stránkách, kde je potřeba (např. product detail, sell wizard).

3. **Další dynamické stránky**
   - Stejný vzor (dynamic import client komponenty s loading stavem) lze použít pro `/sell`, `/messages`, `/listings`, `/dashboard` – každá route pak načte jen svůj chunk.

4. **unstable_cache**
   - Pro seznam produktů (getProducts) lze v budoucnu zvážit `unstable_cache` z `next/cache` s tagy a revalidate. Pozor: Supabase server client může používat cookies; uvnitř `unstable_cache` nelze volat dynamické API (cookies, headers). Řešením je předat potřebná data jako argumenty.
