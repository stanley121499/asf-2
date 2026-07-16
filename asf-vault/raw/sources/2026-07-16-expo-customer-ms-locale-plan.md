# Expo Customer App — Malay (Bahasa Melayu) Locale Plan (2026)

**Project**: ASF-2 Expo customer app (`asf-customer-app/`)  
**Date**: July 16, 2026  
**Companion prompts**: `2026-07-16-expo-customer-ms-locale-agent-prompts.md`  
**Builds on**: `2026-07-08-expo-customer-i18n-plan.md` (zh-CN + en already shipped)

---

## What We Are Doing

Add a **third locale — Malay (`ms`)** to the existing Expo customer app i18n system.

The app already supports:

| Layer | Status today |
|-------|----------------|
| **UI chrome** | `zh-CN` (default) + `en` via JSON catalogs + `useTranslation()` / AsyncStorage `asf_locale` |
| **Catalog content** | Supabase `*_translations` tables with English overlay when `locale === "en"` |

Malay work extends both layers without changing the overall architecture.

**Target app**: `asf-customer-app/` only (Expo SDK ~54, expo-router ~6, React Native).

**Out of scope**

- `asf-staff-app`
- `asf-2-next` (web i18n still stashed)
- Persisting locale to `user_details` (device-local AsyncStorage only)
- `fetch_products_with_computed_attributes` RPC inside ProductContext (banned — caused crashes)
- Stripe PaymentSheet language (follows OS)
- Notification title/body re-localization (stored as plaintext at insert time)
- Locales beyond `zh-CN`, `en`, `ms`

---

## Decisions (Locked)

| Decision | Choice |
|----------|--------|
| New locale code | `ms` (app + DB); map to `ms-MY` for `Intl` date/number formatting |
| Default locale | Remain `zh-CN` (no device auto-detect in this program) |
| Storage key | Keep `asf_locale` (same AsyncStorage key) |
| UI i18n | Add `i18n/locales/ms.json` (~709 keys, same tree as `en.json`) |
| DB content | Extend six `*_translations` tables to allow `locale = 'ms'`; seed Malay rows for live minimart catalog |
| Overlay rule | `zh-CN` → base table; `en` / `ms` → translation row with fallback to base Chinese |
| Translation quality | Machine-assisted Bahasa Melayu acceptable for v1; human polish later |
| Malay label in picker | `Bahasa Melayu` (`settings.languageMs`) |

---

## Current State (Verified 2026-07-16)

### UI i18n (shipped)

```
asf-customer-app/
  i18n/
    types.ts                    # Locale = "zh-CN" | "en"
    format.ts                   # Intl: zh-CN vs en only
    resolveContent.ts           # zh-CN → base; en → overlay
    errorMap.ts
    locales/zh-CN.json          # 709 keys
    locales/en.json             # 709 keys
  context/
    LocaleContext.tsx           # MESSAGES for zh-CN + en
    ContentTranslationContext.tsx  # fetches only when locale === "en"
```

**JSON namespaces** (30 top-level):  
`common`, `nav`, `settings`, `alerts`, `errors`, `search`, `onboarding`, `announcement`, `post`, `video`, `home`, `highlights`, `catalog`, `filter`, `product`, `cart`, `checkout`, `points`, `wishlist`, `orders`, `warrantyCredits`, `claims`, `locations`, `orderSuccess`, `notifications`, `rewards`, `support`, `auth`, `faq`, `review`

**Language picker**: Profile hub modal — 简体中文 | English (`app/(tabs)/profile/index.tsx`).

### Binary locale helpers (need Malay path)

These still branch `en` vs everything-else-as-Chinese:

| File | Issue |
|------|-------|
| `lib/relativeTime.ts` | Hardcoded EN/ZH strings |
| `lib/storeLocationDistance.ts` | Hardcoded EN/ZH distance labels |
| `i18n/format.ts` | `intlLocale` only maps zh-CN or en |

### DB (Supabase `gswszoljvafugtdikimn` — verified via MCP)

| Item | Status |
|------|--------|
| Translation tables | Exist with RLS SELECT for anon/authenticated |
| English seed | 20 products, 4 categories, 7 brands, 6 departments, 11 ranges, 6 posts |
| Locale CHECK constraint | `locale IN ('zh-CN', 'en')` on all six tables — **`ms` not yet allowed** |
| Malay rows | **None** |

Reference SQL:

- `docs/sql/CUSTOMER_I18N_TRANSLATION_TABLES.sql` — table DDL
- `docs/sql/CUSTOMER_I18N_SEED_EN.sql` — English seed (use as template for Malay seed)

### Provider tree (unchanged)

```
StripeProvider → AuthProvider → FeatureFlagsProvider → AlertProvider
  → LocaleProvider → ContentTranslationProvider → RouteContextBundle
```

(`components/Providers.tsx`)

---

## Architecture Changes (Malay)

### 1. UI locale plumbing

```diff
- export type Locale = "zh-CN" | "en";
+ export type Locale = "zh-CN" | "en" | "ms";
```

- Register `ms.json` in `LocaleContext` `MESSAGES`
- Add `settings.languageMs` to **all three** locale JSON files
- Profile language picker: third option **Bahasa Melayu**
- Replace binary `currentLanguageLabel` ternary with a small locale → key map

### 2. Content overlay generalization

Today `ContentTranslationContext` only loads when `locale === "en"`.

Change to:

```
if (locale === "zh-CN") → empty maps (use base table)
else → batch-fetch *_translations WHERE locale = <active locale>
```

Applies to both `en` and `ms`. Keep **direct ProductContext selects** — no RPC.

`resolveContent.ts`:

```
zh-CN → base
en | ms → translated ?? base ?? ""
```

### 3. Locale-aware formatting

`format.ts`:

| App locale | Intl locale |
|------------|-------------|
| `zh-CN` | `zh-CN` |
| `en` | `en` |
| `ms` | `ms-MY` |

Move `relativeTime` and `storeLocationDistance` strings into JSON keys (preferred) or add explicit `ms` branches.

Suggested new keys:

```
notifications.relative.justNow
notifications.relative.minutesAgo    # "{count} min ago" / "{count} minit lalu"
notifications.relative.hoursAgo
notifications.relative.daysAgo
locations.distance.within100m
locations.distance.meters            # "{count} m"
locations.distance.kilometers        # "{count} km"
```

Add matching keys to `zh-CN.json`, `en.json`, and `ms.json`; update callers to use `t()`.

### 4. Database migration

New migration widens CHECK on all six tables:

```sql
-- Example for product_translations; repeat for category_, brand_, department_, range_, post_
ALTER TABLE product_translations
  DROP CONSTRAINT IF EXISTS product_translations_locale_check;
ALTER TABLE product_translations
  ADD CONSTRAINT product_translations_locale_check
  CHECK (locale IN ('zh-CN', 'en', 'ms'));
```

Place migration at:

- `supabase/migrations/<timestamp>_customer_i18n_ms_locale.sql`  
  and/or `docs/sql/CUSTOMER_I18N_MS_MIGRATION.sql` (mirror of EN docs pattern)

### 5. Malay seed data

New file `docs/sql/CUSTOMER_I18N_SEED_MS.sql`:

- Same UUIDs as `CUSTOMER_I18N_SEED_EN.sql`
- `locale = 'ms'`
- Bahasa Melayu names/descriptions for all 54 entity rows
- `ON CONFLICT (entity_id, locale) DO UPDATE` for idempotency

Apply to project `gswszoljvafugtdikimn` via Supabase MCP `apply_migration` + `execute_sql` (Agent 8).

---

## Implementation Phases (Agent Map)

Designed for **~200k context** models: each agent reads the plan + one agent section + on-disk locale files (not pasted wholesale).

| Agent | Scope | ~Keys / files | Est. complexity |
|-------|-------|---------------|-----------------|
| **1** | Locale plumbing + `ms.json` scaffold + profile picker | ~10 files | Medium |
| **2** | Translate `ms.json` chunk A (chrome + browse) | ~160 keys | Medium |
| **3** | Translate `ms.json` chunk B (commerce) | ~212 keys | Medium–Large |
| **4** | Translate `ms.json` chunk C (orders + claims) | ~162 keys | Medium |
| **5** | Translate `ms.json` chunk D (account + support) | ~159 keys | Medium |
| **6** | Locale helpers + `ContentTranslationContext` generalization | ~5 files | Medium |
| **7** | DB migration SQL (allow `ms` locale) | 1 migration | Small |
| **8** | DB Malay seed SQL + apply via Supabase MCP | 1 seed file | Medium |
| **9** | Parity script + final grep + `tsc` verification | tooling | Small–Medium |

### Dependency graph

```
1 ──► 2, 3, 4, 5 (ms.json translation — serial 2→3→4→5 recommended)
1 ──► 6 (helpers + overlay code)
7 ──► 8 (migration before seed)
6 + 5 + 8 ──► 9 (final verification)
```

**Recommended serial path**: `1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9`

Agents 2–5 may run in parallel after Agent 1 if multiple operators are available, but **serial is safer** to avoid `ms.json` merge conflicts.

---

## ms.json Translation Chunks

| Agent | Namespaces | Key count |
|-------|------------|-----------|
| 2 | `common`, `nav`, `settings`, `alerts`, `errors`, `search`, `onboarding`, `announcement`, `post`, `video`, `home`, `highlights`, `catalog`, `filter`, `product` | ~160 |
| 3 | `cart`, `checkout`, `points`, `wishlist`, `orderSuccess` | ~212 |
| 4 | `orders`, `warrantyCredits`, `claims`, `locations`, `notifications` | ~162 |
| 5 | `rewards`, `support`, `auth`, `faq`, `review` | ~159 |

**Rules for translators**

- Keep **identical key tree** to `en.json` — only translate string values
- Preserve `{param}` placeholders exactly (`{count}`, `{date}`, `{query}`, etc.)
- Use formal-but-friendly Malaysian Malay (bukan Indonesia)
- Product/brand proper nouns may stay Latin script (e.g. "Coca-Cola")
- Do not rename keys or namespaces

---

## Hard Constraints (unchanged from Expo i18n program)

| Constraint | Details |
|------------|---------|
| **Expo SDK 54** | Keep compatible dependencies |
| **No ProductContext RPC** | Direct `supabase.from("products").select(...)` only |
| **No Buy Now** | Add-to-bag flow only |
| **TypeScript** | No `any`, no `!`, no `as unknown as T`. Double quotes. Complete files. |
| **Theme** | `constants/theme.ts` |
| **Feature flags** | Do not break gated modules (`claims`, `store_locations`, `promotions`, etc.) |
| **Scope** | `asf-customer-app/` + SQL docs/migrations only |
| **No commit/push** | Unless the human operator explicitly asks |

---

## Verification Checklist (Agent 9)

- [ ] `cd asf-customer-app && npx tsc --noEmit` clean
- [ ] Key parity: `zh-CN`, `en`, `ms` have identical key trees (parity script)
- [ ] Profile → Language shows 简体中文 | English | Bahasa Melayu
- [ ] Selecting Malay persists across app restart (`asf_locale` = `ms`)
- [ ] Malay UI chrome renders (tabs, cart, checkout, claims, etc.)
- [ ] Malay mode: product names from `product_translations` where `locale = 'ms'`
- [ ] Missing Malay DB row falls back to Chinese base (no blank titles)
- [ ] `formatDate` / `formatNumber` use `ms-MY` when locale is `ms`
- [ ] Relative time + distance strings show Malay (not Chinese fallback)
- [ ] `ContentTranslationContext` fetches for both `en` and `ms`
- [ ] DB CHECK allows `ms` on all six translation tables

---

## Known Gaps (document, do not fix in this program)

- Stripe PaymentSheet follows device OS language
- Push/in-app notification bodies remain whatever language was stored at insert
- Web (`asf-2-next`) Malay parity not in scope
- Staff app Malay not in scope
- Optional future: auto-detect device locale on first launch

---

## Related Sources

- `asf-vault/raw/sources/2026-07-08-expo-customer-i18n-plan.md` — original bilingual Expo plan
- `asf-vault/raw/sources/2026-07-08-expo-customer-i18n-agent-prompts.md` — executed Agents 1–10
- `asf-vault/wiki/concepts/customer-i18n-asf-2.md` — wiki concept (update after ingest)
- `docs/sql/CUSTOMER_I18N_TRANSLATION_TABLES.sql`
- `docs/sql/CUSTOMER_I18N_SEED_EN.sql`
- `asf-vault/raw/sources/2026-04-25-mobile-apps-progress.md` — Expo no-RPC rule
