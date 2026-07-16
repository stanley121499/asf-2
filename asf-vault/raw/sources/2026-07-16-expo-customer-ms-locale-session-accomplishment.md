# Expo Customer App — Malay Locale Session Accomplishment (2026-07-16)

**Date**: 2026-07-16  
**Project**: ASF-2  
**Primary delivery**: `asf-customer-app` (Expo) — third locale **Bahasa Melayu (`ms`)** on top of existing zh-CN + en  
**Supabase project**: `gswszoljvafugtdikimn`

---

## 1. What we set out to do

Add **Malay** to the Expo customer app without redesigning i18n:

- Extend UI chrome catalogs with `i18n/locales/ms.json`
- Add Bahasa Melayu to the Profile language picker
- Generalize content overlays so `ms` works like `en`
- Widen DB translation-table locale CHECKs and seed Malay catalog rows
- Keep default locale **`zh-CN`**; preference still AsyncStorage-only (`asf_locale`)

**Out of scope** (unchanged): staff app, Next.js web i18n stash, Stripe PaymentSheet OS language, notification plaintext at insert, `user_details.preferred_locale`.

---

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| Locale code | `ms` in app + DB; `ms-MY` for `Intl` date/number formatting |
| Default locale | Remains `zh-CN` (no first-launch device auto-detect) |
| Storage | Same key `asf_locale` |
| Overlay rule | `zh-CN` → base tables; `en` / `ms` → `*_translations` with fallback to base Chinese |
| Translation quality | Machine-assisted Malaysian Malay for v1; human polish later |
| Picker label | `Bahasa Melayu` via `settings.languageMs` |
| Agent sizing | 9 agents, ~160–212 UI keys per translation agent (200k-context-friendly) |

---

## 3. Plans & agent prompts written

| Raw source | Purpose |
|------------|---------|
| `raw/sources/2026-07-16-expo-customer-ms-locale-plan.md` | Implementation plan + architecture deltas |
| `raw/sources/2026-07-16-expo-customer-ms-locale-agent-prompts.md` | Agents 1–9 copy-paste prompts |
| This file | Session outcome / source of truth for what landed |

Builds on: `2026-07-08-expo-customer-i18n-plan.md` (zh-CN + en already shipped).

---

## 4. Agent execution (1 → 9) — COMPLETE

| Agent | Scope | Result |
|-------|-------|--------|
| 1 | Plumbing + `ms.json` scaffold + profile picker | `Locale` includes `ms`; three-option picker |
| 2 | `ms.json` Chunk A (chrome + browse) | ~177 keys Malay |
| 3 | `ms.json` Chunk B (commerce) | 212 keys Malay |
| 4 | `ms.json` Chunk C (orders + claims) | 162 keys Malay |
| 5 | `ms.json` Chunk D (auth + support) | remaining keys Malay |
| 6 | Helpers + `ContentTranslationContext` | `t()` for relative time/distance; fetch overlays for `en` and `ms` |
| 7 | DB migration allow `ms` | Applied on live project |
| 8 | Malay seed SQL | 54 rows applied |
| 9 | Parity script + verification | `tsc` clean; 717 keys × 3 locales |

---

## 5. Expo delivery (`asf-customer-app`)

### Infrastructure

- `i18n/types.ts` — `Locale = "zh-CN" | "en" | "ms"`
- `i18n/locales/ms.json` — full catalog (~717 leaf keys, parity with en/zh-CN)
- `i18n/format.ts` — `ms` → `ms-MY`
- `i18n/resolveContent.ts` — `ms` treated like `en`
- `context/LocaleContext.tsx` — `MESSAGES.ms` registered
- `context/ContentTranslationContext.tsx` — early return only for `zh-CN`; `.eq("locale", locale)` for `en`/`ms`
- `lib/relativeTime.ts` / `lib/storeLocationDistance.ts` — no hardcoded EN/ZH; use `t()` keys
- `scripts/check-locale-parity.mjs` — fails if zh-CN / en / ms key trees diverge

### UX

- Profile language modal: **简体中文 | English | Bahasa Melayu**
- Preference persists across restart via AsyncStorage
- Relative time + store distance labels flip with locale

### Hard rules (still in force)

- No `fetch_products_with_computed_attributes` in Expo ProductContext
- Customer UI chrome via `t("key")` only
- Device-local locale only

---

## 6. Database (applied on `gswszoljvafugtdikimn`)

1. **Migration** — CHECK on all six `*_translations` tables now allows `('zh-CN', 'en', 'ms')`
   - Repo: `supabase/migrations/20260716120000_customer_i18n_ms_locale.sql`
   - Mirror: `docs/sql/CUSTOMER_I18N_MS_MIGRATION.sql`
2. **Malay seed** — same UUIDs as English minimart seed
   - Repo: `docs/sql/CUSTOMER_I18N_SEED_MS.sql`
   - Counts: 20 products, 4 categories, 7 brands, 6 departments, 11 ranges, 6 posts (`locale = 'ms'`)

Sample product names: Coca-Cola Klasik, Biji Kopi Panggang Premium, Teh Hitam Organik Tanah Tinggi.

---

## 7. Verification (Agent 9)

- [x] Key parity: 717 keys each for zh-CN / en / ms
- [x] `npx tsc --noEmit` clean
- [x] Malay picker + AsyncStorage persistence (code path)
- [x] Content overlay queries `locale=ms`
- [x] DB seed counts match English
- [ ] Optional human: device smoke-test in Expo Go

---

## 8. Known gaps (document, do not fix here)

- Stripe PaymentSheet follows **OS** language
- Notification title/body stored as plaintext at insert (not re-localized)
- Web (`asf-2-next`) Malay / i18n parity still stashed / out of scope
- Staff app Malay not started
- Optional future: auto-detect device locale on first launch

---

## 9. How to run for phone testing

```bash
cd asf-customer-app
npx expo start
# or: npx expo start --tunnel
```

Open Expo Go → scan QR → Profile → Language → Bahasa Melayu.

---

## Related

- Wiki concept: [[wiki/concepts/customer-i18n-asf-2]] (update to trilingual after ingest)
- Prior session: `raw/sources/2026-07-08-customer-i18n-session-accomplishment.md`
