# Šipkoviště.cz

Inzertní platforma pro šipkařské vybavení – Next.js 16, Supabase, Vercel.

## Lokální vývoj

1. **Klonování a závislosti**
   ```bash
   git clone https://github.com/tvuj-username/sipkovistecz.git
   cd sipkovistecz
   pnpm install
   ```

2. **Proměnné prostředí**
   - Zkopíruj `.env.example` do `.env.local`
   - Vyplň hodnoty z [Supabase Dashboard](https://supabase.com/dashboard): Project Settings → API (URL, anon key, service_role key)

3. **Spuštění**
   ```bash
   pnpm dev
   ```
   Aplikace běží na [http://localhost:3000](http://localhost:3000).

## Nasazení na Vercel

1. **Repozitář na GitHubu**
   - Nahraj projekt na GitHub (např. `sipkovistecz`).
   - Do `.git` nepatří: `node_modules`, `.next`, `.env.local` ani jiné `.env*` (kromě `.env.example`).

2. **Projekt ve Vercel**
   - [vercel.com](https://vercel.com) → **Add New** → **Project** → import z GitHubu.
   - **Framework Preset:** Next.js (detekce automatická).
   - **Root Directory:** ponech prázdné.
   - **Build Command:** `pnpm build` (nebo `npm run build`).
   - **Output Directory:** výchozí (`.next`).

3. **Environment Variables ve Vercel**
   V **Settings → Environment Variables** nastav (pro Production, Preview i Development podle potřeby):

   | Proměnná | Povinné | Popis |
   |----------|---------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | ano | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ano | Supabase anon (public) key |
   | `SUPABASE_SERVICE_ROLE_KEY` | ano* | Service role key (mazání účtu apod.) |
   | `NEXT_PUBLIC_SITE_URL` | doporučeno | Kanonická URL (např. `https://sipkoviste.cz`) pro sitemap a metadata |

   \* Bez service role key nebudou fungovat akce vyžadující admin práva (např. kompletní mazání účtu).

   **NEXT_PUBLIC_SITE_URL:** Na Vercel můžeš pro preview nechat prázdné (použije se `VERCEL_URL`). Pro produkční doménu nastav `https://tvoje-domena.cz`.

4. **Deploy**
   - Po uložení proměnných spusť **Redeploy**.
   - Vercel při každém push do hlavní větve nasadí novou verzi.

## Databáze (Supabase)

SQL skripty v `scripts/` spouštěj v pořadí v Supabase SQL Editoru (např. 001 → 014). Nejdřív vytvoř tabulky a RLS podle dokumentace Supabase, pak postupně migrace.

## Skripty

- `pnpm dev` – vývoj s hot reload
- `pnpm build` – produkční build
- `pnpm start` – spuštění produkčního buildu
- `pnpm lint` – ESLint

## Licence

Privátní projekt.
