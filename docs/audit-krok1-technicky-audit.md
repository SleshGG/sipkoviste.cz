# Krok 1: Technický audit a čištění – shrnutí

## Provedené úpravy

### Type Safety (TypeScript)
- **`lib/supabase/types.ts`** – Přidán typ `MessageWithRelations` pro zprávy s vnořenými profily a produktem (výstup z Supabase select s joinem).
- **`lib/supabase/database.ts`** – Odstraněno `any` u zpráv: `data` se typuje jako `MessageWithRelations[]`, Map má explicitní typ hodnoty, oprava `created_at` → `timestamp` v podmínce.
- **`app/messages/page.tsx`** – Odstraněno `(msg: any)`: použit typ `MessageWithRelations` z `@/lib/supabase/types`.

### Dead code a zjednodušení
- **`app/sell/page.tsx`** – Odebrán nepoužívaný `import React from "react"` (JSX funguje bez něj).
- **`app/layout.tsx`** – Odstraněn nepoužívaný import `React` a nepoužívané proměnné `_geist` / `_geistMono`. Font **Geist** se nyní aplikuje na `<body>` přes `geistSans.className`, aby Next.js mohl optimalizovat načítání fontu. Odstraněn nepoužívaný **Geist_Mono**.

### Best practices
- Font z Next.js (`next/font/google`) je skutečně použit v layoutu, konzistentní s `@theme inline` v `app/globals.css` (Geist jako `--font-sans`).

---

## Poznámky (beze změn)

- **`styles/globals.css`** – Není nikde importován (pouze `app/globals.css` v layoutu). Může sloužit jako záloha nebo alternativní téma; ponecháno.
- **`components/image-lightbox.tsx`** – Pouze na detailu produktu (inline lightbox v `product-page-client.tsx`). Komponenta zůstává pro případné budoucí použití.
- **`lib/supabase/database.ts` – `getConversations()`** – Funkce není v projektu volaná (zprávy načítá přímo `app/messages/page.tsx` přes Supabase client). Ponecháno jako součást API knihovny pro případné použití.

---

## Doporučení do budoucna

1. **Sdílená utilita pro formátování data** – `formatMemberSince` (product-page-client) a obdobná logika v dashboardu – zvážit přesun do `lib/utils.ts` nebo `lib/format.ts`.
2. **Konverzační klíč** – V messages se používá `::` (`otherUserId::product_id`), v database `-`. Pokud by se někdy používalo `getConversations()` vedle klienta, sjednotit formát klíče.
3. **Duplicitní rozhraní Message** – V `app/messages/page.tsx` je lokální `interface Message`; lze používat pouze typ z `@/lib/supabase/types` a v případě potřeby rozšířit tam.
