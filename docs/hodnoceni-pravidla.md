# Pravidla hodnocení uživatelů

## Kdo může koho hodnotit

- **Hodnotit může jen ten, kdo s prodejcem vedl konverzaci o konkrétním inzerátu.**
- Hodnotí se **prodejce** (vlastník inzerátu). Kupující (druhá strana v chatu) dává hodnocení prodejci.
- Tj. uživatel A může ohodnotit uživatele B **pouze pokud**:
  - B je prodejce nějakého inzerátu (produktu),
  - A s B **vedl konverzaci** o tom inzerátu (existují zprávy mezi A a B s daným `product_id`).

## Kdy lze hodnotit

- **Až po proběhlé konverzaci** – v systému musí existovat alespoň jedna zpráva mezi hodnotícím a prodejcem o daném produktu.
- Doporučení: povolit hodnocení **až po odeslání alespoň jedné zprávy od obou stran** (aby šlo o skutečnou výměnu), nebo hned po první zprávě od hodnotícího (jednodušší).  
  Výchozí návrh: **stačí, že hodnotící je účastník konverzace** (odeslal nebo přijal alespoň jednu zprávu v konverzaci o daném produktu).

## Kolikrát

- **Jedno hodnocení na jednu konverzaci/inzerát.**  
  Jeden uživatel může ohodnotit druhého **nejvýše jednou za jeden produkt** (jednu konverzaci).  
  Pokud spolu komunikovali o více inzerátech, může dát samostatné hodnocení za každý inzerát (volitelně je v UI omezit na „jedno hodnocení na uživatele“ – viz níže).

- V DB: unikátní kombinace `(kdo hodnotí, koho hodnotí, o jakém produktu)` → **jeden záznam na trojici (author_id, profile_id, product_id)**.

## Co se ukládá

- **rating** (1–5),
- volitelný **text** (komentář),
- **author_id** – kdo hodnotí,
- **profile_id** – koho hodnotí (prodejce),
- **product_id** – inzerát, u kterého proběhla konverzace (kontext).

## Kontrola v aplikaci

Před uložením recenze ověřit:

1. Uživatel je přihlášen (`author_id` = aktuální uživatel).
2. **Prodejce** daného produktu je `profile_id` (správný „hodnocený“).
3. Mezi `author_id` a `profile_id` existuje konverzace o `product_id` (alespoň jedna zpráva v tabulce `messages` s tímto `product_id` a dvojicí sender/receiver).
4. Pro tuto trojici `(author_id, profile_id, product_id)` ještě neexistuje záznam v `reviews` (nebo DB unikátní constraint to zajistí).

## Zobrazení a průměr

- Na profilu prodejce zobrazit:
  - počet recenzí (`review_count`),
  - průměrné hodnocení (`rating`).
- Hodnoty v tabulce `profiles` (sloupce `rating`, `review_count`) se přepočítají při každém přidání (nebo změně/smazání) recenze – např. triggerem nebo v serverové akci po insertu do `reviews`.

## Shrnutí situací

| Situace | Může hodnotit? |
|--------|-----------------|
| Kupující psal prodejci o inzerátu (konverzace existuje) | Ano – kupující může ohodnotit prodejce za tento inzerát. |
| Někdo jen prohlíží inzerát, nepsal | Ne. |
| Prodejce chce ohodnotit kupujícího | V tomto návrhu ne (hodnotí se jen prodejce). Lze později rozšířit o „obousměrné“ hodnocení. |
| Stejný kupující a prodejce, druhý inzerát | Ano – může dát druhé hodnocení (za druhý inzerát). Lze změnit na „max 1 hodnocení na uživatele“. |

Pokud chcete **jen jedno hodnocení na dvojici uživatelů** (bez ohledu na produkt), v DB bude unikátní constraint na `(author_id, profile_id)` a kontrola „existuje konverzace“ bude: existuje alespoň jedna konverzace mezi A a B o libovolném produktu.

---

## Implementace v aplikaci

- **SQL:** Skript `scripts/003_reviews_schema.sql` vytvoří tabulku `reviews`, RLS a trigger pro přepočet `profiles.rating` a `profiles.review_count`.
- **Kontrola „může hodnotit“:** Funkce `canUserRateProfile(productId, authorId, profileId)` v `lib/supabase/database.ts` ověří, že prodejce produktu je `profileId` a že mezi `authorId` a `profileId` existuje konverzace o daném produktu.
- **Odeslání recenze:** Server action `submitReviewAction({ product_id, profile_id, rating, comment })` v `lib/supabase/actions.ts` zkontroluje oprávnění, zda recenze pro tuto trojici ještě neexistuje, a vloží záznam.

**Kde v UI nabídnout hodnocení:** Např. na stránce zpráv u konverzace (tlačítko „Ohodnotit prodejce“), nebo na detailu inzerátu po přihlášení, pokud už uživatel s prodejcem o tento inzerát psal (a ještě nehodnotil).
