# Workflow: Rezervační systém (ACTIVE → RESERVED → SOLD)

## Přehled stavů

| Status   | Popis                          |
|----------|--------------------------------|
| `active` | Produkt je k dispozici         |
| `reserved` | Rezervováno kupujícím (24 h) |
| `sold`   | Prodáno                        |

---

## 1. ACTIVE

**Kdy:** `status === 'active'`

**Kupující (user ≠ owner):**
- Tlačítko **Koupit** → otevře dialog → potvrzení → volá `reserve_product` RPC
- Tlačítko **Nabídnout cenu** (pokud negotiable)
- Tlačítko **Poslat dotaz**

**Prodejce (owner):**
- Žádné akční tlačítko (jen Bezpečnostní tipy)

**Nepřihlášený:**
- Žádná akce

---

## 2. RESERVED

**Kdy:** `status === 'reserved'`

**Kupující (reserved_by === user):**
- Text: „Čeká se na potvrzení prodávajícím“
- Text: „Prodávající má 24 hodin na potvrzení prodeje.“
- Countdown: „Rezervace vyprší za: X h Y min“
- Tlačítko **Zobrazit chat** → `/messages?to=sellerId&product=id`

**Prodejce (owner):**
- Text: „Zájem o váš produkt“
- Text: „Uživatel si chce tento produkt koupit. Potvrzením dokončíte prodej.“
- Tlačítko **Potvrdit prodej** → `confirm_sale` RPC
- Tlačítko **Zrušit rezervaci** → `cancel_reservation` RPC
- Tlačítko **Zobrazit chat** → `/messages?to=reserved_by&product=id`

**Ostatní:**
- Text: „Produkt je momentálně rezervován“ / „Tento produkt je rezervován.“

---

## 3. SOLD

**Kdy:** `status === 'sold'`

**Kupující nebo prodejce:**
- Text: „Produkt byl prodán.“
- Tlačítko **Ohodnotit** → `/profile/me` (sekce Zakoupené/Prodané)

**Ostatní:**
- Text: „Produkt byl prodán.“

---

## Sekvence

```
[ACTIVE]  →  Klik „Koupit“  →  reserve_product()  →  [RESERVED]
[RESERVED] →  Prodejce „Potvrdit“  →  confirm_sale()  →  [SOLD]
[RESERVED] →  Prodejce „Zrušit“  →  cancel_reservation()  →  [ACTIVE]
[RESERVED] →  Vypršení 24 h  →  cleanup_expired_reservations()  →  [ACTIVE]
```

---

## Automatická expirace

- Cron job každých 15 min: `cleanup_expired_reservations()`
- Při načtení stránky (reserved + expired): `expireReservationsAction()` → `router.refresh()`
- Realtime: změny `products` se posílají klientovi

---

## Upozornění (notifications)

Každý krok workflow vytvoří upozornění v záložce **Upozornění** na stránce Zprávy:

| Událost | Příjemce | Typ |
|---------|----------|-----|
| Rezervace | Prodejce | `reservation` |
| Prodej potvrzen | Kupující | `sale_confirmed` |
| Rezervace zrušena | Kupující | `reservation_cancelled` |
| Rezervace vypršela | Prodejce + Kupující | `reservation_expired` |

SQL: `scripts/reservation_notifications.sql` – vytvoří tabulku notifications a aktualizuje RPC funkce tak, aby volaly `insert_notification()`.
