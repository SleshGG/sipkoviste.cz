# Audit – Krok 4: SEO a metadata

## Provedené změny

### Root layout (`app/layout.tsx`)
- **metadataBase:** URL z `NEXT_PUBLIC_SITE_URL` nebo `https://${VERCEL_URL}` (produkce), jinak `http://localhost:3000`.
- **title:** template `%s | Šipkoviště.cz` pro podstránky.
- **openGraph:** `type`, `locale`, `siteName`, `title`, `description`.
- **twitter:** `card: summary_large_image`, `title`, `description`.

### Metadata na stránkách
- **Úvodní stránka:** dědí z layoutu (title + description).
- **Tržiště** (`/marketplace`): vlastní title „Tržiště“, description a OG.
- **Detail produktu** (`/product/[id]`): **generateMetadata** – title z názvu + značka, description z popisu (max 160 znaků), OG/Twitter obrázek z produktu.
- **Přidat inzerát** (`/sell`), **Nastavení** (`/dashboard`), **Zprávy** (`/messages`), **Moje inzeráty** (`/listings`): vlastní layout s `metadata` (title + description).

### Sitemap
- **`app/sitemap.ts`:** Dynamická sitemap.
  - Statické: `/`, `/marketplace`, `/sell`.
  - Dynamické: `/product/[id]` pro všechna viditelná, neprodaná ID z DB (`getProductIdsForSitemap()` v `lib/supabase/database.ts`).
  - Priorita a `changeFrequency` nastaveny (úvod 1, tržiště 0.9, produkty 0.8, sell 0.6).

### Robots
- **`app/robots.ts`:** Pravidla pro všechny boty.
  - **allow:** `/`
  - **disallow:** `/dashboard`, `/messages`, `/listings`, `/sell/` (soukromé / chráněné).
  - **sitemap:** `${base}/sitemap.xml`.

## Proměnné prostředí
- **NEXT_PUBLIC_SITE_URL** – doporučeno nastavit v produkci (např. `https://sipkovistecz.cz`) pro správné absolutní URL v sitemap a OG.
- Na Vercelu se použije `VERCEL_URL`, pokud `NEXT_PUBLIC_SITE_URL` není nastaveno.
