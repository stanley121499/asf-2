# Expo Customer App — Malay Locale Agent Prompts (2026)

Run agents **in order** (1 → 9). Each builds on the previous.

**Before every agent**, read:

1. `asf-vault/raw/sources/2026-07-16-expo-customer-ms-locale-plan.md` (full plan)
2. This file — the **AGENT N** section only
3. Skim `asf-vault/raw/sources/2026-04-25-mobile-apps-progress.md` — **no ProductContext RPC**

**Project root for all edits**: `asf-customer-app/`  
**Repo root**: `/Users/stanley/Documents/GIthub/asf-2`

---

## SHARED CONTEXT (read before every agent)

**What exists**: Bilingual Expo customer i18n (`zh-CN` default + `en`) shipped 2026-07-08. ~709 UI keys in JSON. English DB overlays via `ContentTranslationContext`. Your job is adding **`ms` (Bahasa Melayu)**.

**Stack**: Expo SDK ~54, expo-router ~6, React Native 0.81, NativeWind 4 + inline styles, TypeScript strict, Supabase JS, AsyncStorage.

**Locales after this program**: `zh-CN` (default), `en`, `ms`.

**Storage**: AsyncStorage key `asf_locale`. Never `localStorage` / `window`.

**UI rule**: No new hardcoded user-visible strings. Use `t("namespace.key")` from `useTranslation()`.

**DB rule**: Overlay catalog names from `*_translations` when locale is `en` or `ms`. `zh-CN` uses base tables. **Do not** call `fetch_products_with_computed_attributes`.

**Intl mapping**: `zh-CN` → `zh-CN`, `en` → `en`, `ms` → `ms-MY`.

**Non-negotiable**:

- No `any`, no `!` non-null assertion, no `as unknown as T`
- Double quotes for all strings
- Complete files only — no `// ... rest of code`
- No Buy Now — add-to-bag only
- Keep feature-flag gates intact
- Run `cd asf-customer-app && npx tsc --noEmit` at end; fix errors before declaring done
- **Scope**: `asf-customer-app/` + SQL under `docs/sql/` and `supabase/migrations/` only
- **Do not** commit, push, or merge unless the human operator explicitly asks

**Theme**: `constants/theme.ts` — `colors.accent` `#C9A96E`, etc.

**DB project**: `gswszoljvafugtdikimn` — use Supabase MCP when applying migration/seed (Agents 7–8).

**Key files to know**:

| File | Role |
|------|------|
| `i18n/types.ts` | `Locale` union, `SUPPORTED_LOCALES`, `isSupportedLocale` |
| `context/LocaleContext.tsx` | `MESSAGES`, `useTranslation()` |
| `context/ContentTranslationContext.tsx` | DB overlay fetch (currently `en` only) |
| `i18n/resolveContent.ts` | `resolveField(locale, base, translated)` |
| `i18n/format.ts` | `formatDate`, `formatNumber` |
| `app/(tabs)/profile/index.tsx` | Language picker modal |
| `i18n/locales/en.json` | Structural template for `ms.json` |

---

## AGENT 1 — Locale Plumbing + ms.json Scaffold + Language Picker

**Goal**: Wire `ms` through the type system and UI picker. Create `ms.json` as a **structural copy** of `en.json` (English placeholder values OK — Agents 2–5 will translate).

**Edit**:

- `i18n/types.ts` — add `"ms"` to `Locale`, `SUPPORTED_LOCALES`, `isSupportedLocale`
- `context/LocaleContext.tsx` — `import msMessages from "@/i18n/locales/ms.json"`; add to `MESSAGES`
- `i18n/format.ts` — map `ms` → `"ms-MY"` for `Intl.DateTimeFormat` / `Intl.NumberFormat`
- `i18n/resolveContent.ts` — treat `ms` like `en` (prefer translated, fallback to base)
- `i18n/locales/zh-CN.json` — add `"languageMs": "Bahasa Melayu"` under `settings`
- `i18n/locales/en.json` — add `"languageMs": "Bahasa Melayu"` under `settings`
- `app/(tabs)/profile/index.tsx`:
  - Add third `LanguageOption` for `ms`
  - Replace binary `currentLanguageLabel` with map: `{ "zh-CN": t("settings.languageZh"), en: t("settings.languageEn"), ms: t("settings.languageMs") }`

**Create**:

- `i18n/locales/ms.json` — copy entire tree from `en.json` (placeholder English values fine)

**Do NOT**:

- Translate `ms.json` content (Agents 2–5)
- Change `ContentTranslationContext` yet (Agent 6)
- Touch DB (Agents 7–8)

**Verification**: `npx tsc --noEmit`. App boots. Profile shows three language options. Selecting Malay switches UI to placeholder English strings from `ms.json` (expected until Agents 2–5).

**Handoff**: Agents 2–5 translate `ms.json` in chunks. Do not rename keys.

---

## AGENT 2 — ms.json Chunk A (Chrome + Browse)

**Depends on**: Agent 1 (`ms.json` exists)

**Goal**: Translate **only** these namespaces in `i18n/locales/ms.json` to Bahasa Melayu:

`common`, `nav`, `settings`, `alerts`, `errors`, `search`, `onboarding`, `announcement`, `post`, `video`, `home`, `highlights`, `catalog`, `filter`, `product`

(~160 keys)

**Reference**: Read values from `i18n/locales/en.json` for the same namespaces. Compare structure with `zh-CN.json` if meaning is unclear.

**Translation rules**:

- Malaysian Malay (bukan Bahasa Indonesia)
- Keep `{param}` tokens unchanged
- `settings.languageMs` stays `"Bahasa Melayu"`
- `settings.languageZh` / `settings.languageEn` stay as endonym labels (简体中文 / English)

**Do NOT**: Edit other namespaces, TypeScript files, or DB.

**Verification**: `npx tsc --noEmit`. Spot-check Profile + Home + Browse tabs in Malay locale.

---

## AGENT 3 — ms.json Chunk B (Commerce)

**Depends on**: Agent 2

**Goal**: Translate these namespaces in `ms.json`:

`cart`, `checkout`, `points`, `wishlist`, `orderSuccess`

(~212 keys — largest commerce block)

**Focus files for spot-check** (read only, do not migrate screens — already use `t()`):

- `app/cart.tsx`
- `app/checkout/index.tsx`
- `app/checkout/payment.tsx`
- `app/checkout/success.tsx`

**Do NOT**: Edit TypeScript. Other namespaces remain Agent 2/4/5 responsibility.

**Verification**: `npx tsc --noEmit`. Walk cart → checkout → success in Malay locale; strings should be Malay not English placeholder.

---

## AGENT 4 — ms.json Chunk C (Orders + Claims)

**Depends on**: Agent 3

**Goal**: Translate these namespaces in `ms.json`:

`orders`, `warrantyCredits`, `claims`, `locations`, `notifications`

(~162 keys)

**Spot-check screens** (read only):

- `app/(tabs)/profile/orders/index.tsx`, `[orderId].tsx`
- `app/(tabs)/profile/warranty-credits.tsx`
- `app/(tabs)/profile/claims/index.tsx`, `new.tsx`, `[claimId].tsx`
- `app/(tabs)/locations.tsx`

**Verification**: `npx tsc --noEmit`. Orders + claims flows show Malay strings.

---

## AGENT 5 — ms.json Chunk D (Account + Support)

**Depends on**: Agent 4

**Goal**: Translate remaining namespaces in `ms.json`:

`rewards`, `support`, `auth`, `faq`, `review`

(~159 keys)

After this agent, **all ~709 keys** in `ms.json` should be Bahasa Melayu (not English placeholders).

**Spot-check screens** (read only):

- `app/(auth)/sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx`
- `app/(tabs)/profile/rewards.tsx`
- `app/(tabs)/profile/support/index.tsx`

**Verification**:

```bash
cd asf-customer-app && npx tsc --noEmit
node -e "
const en=require('./i18n/locales/en.json');
const ms=require('./i18n/locales/ms.json');
function keys(o,p=''){let a=[];for(const k of Object.keys(o)){const path=p?p+'.'+k:k;if(typeof o[k]==='string')a.push(path);else a.push(...keys(o[k],path));}return a;}
const ek=keys(en).sort(), mk=keys(ms).sort();
if(JSON.stringify(ek)!==JSON.stringify(mk)) { console.error('KEY MISMATCH'); process.exit(1); }
console.log('Key parity OK:', ek.length);
"
```

---

## AGENT 6 — Locale Helpers + ContentTranslation Overlay

**Depends on**: Agent 5 (all `ms.json` keys present)

**Goal**: Remove binary `en` vs `zh-CN` branches for formatting helpers; generalize DB overlay fetch for `ms`.

**Edit**:

1. **`i18n/locales/*.json`** — add relative-time + distance keys (all three locales):

```
notifications.relative.justNow
notifications.relative.minutesAgo   # "{count}"
notifications.relative.hoursAgo
notifications.relative.daysAgo
locations.distance.within100m
locations.distance.meters         # "{count}"
locations.distance.kilometers       # "{count}"
```

2. **`lib/relativeTime.ts`** — accept `t` callback or move callers to pass translated strings; **no** hardcoded Malay/Chinese/English literals

3. **`lib/storeLocationDistance.ts`** — same pattern via `t()` keys

4. **Callers** — update `components/NotificationRow.tsx` (and any other `formatRelativeTime` call sites) to pass `t` + locale

5. **`context/ContentTranslationContext.tsx`**:
   - Replace `if (locale !== "en")` with `if (locale === "zh-CN")` early return
   - Fetch with `.eq("locale", locale)` for `en` and `ms`
   - Update file header comment

**Do NOT**: Apply DB migration or seed (Agents 7–8). Malay product names will not appear until seed is applied.

**Verification**: `npx tsc --noEmit`. In Malay locale, relative times and distances use Malay JSON strings. `ContentTranslationContext` issues Supabase queries with `locale=ms` (visible in dev logs) even if zero rows return until Agent 8.

---

## AGENT 7 — DB Migration (Allow `ms` Locale)

**Depends on**: Agent 1 (types know `ms`). May run parallel to Agents 2–6 but must finish before Agent 8.

**Goal**: Widen CHECK constraints so `locale = 'ms'` is valid on all six translation tables.

**Create**:

- `supabase/migrations/20260716120000_customer_i18n_ms_locale.sql`
- Mirror at `docs/sql/CUSTOMER_I18N_MS_MIGRATION.sql` (comment header + same SQL)

**SQL pattern** (repeat per table):

```sql
ALTER TABLE product_translations
  DROP CONSTRAINT IF EXISTS product_translations_locale_check;
ALTER TABLE product_translations
  ADD CONSTRAINT product_translations_locale_check
  CHECK (locale IN ('zh-CN', 'en', 'ms'));
```

Tables: `product_translations`, `category_translations`, `brand_translations`, `department_translations`, `range_translations`, `post_translations`.

**Apply** via Supabase MCP `apply_migration` (preferred) or `execute_sql`.

**Verify** with MCP:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.product_translations'::regclass AND contype = 'c';
```

Expect `ms` in the CHECK array.

**Do NOT**: Insert seed rows (Agent 8). Do not modify Expo app code unless `tsc` broke from migration types (unlikely).

---

## AGENT 8 — DB Malay Seed + Apply

**Depends on**: Agent 7 (CHECK allows `ms`)

**Goal**: Seed Bahasa Melayu catalog translations for the live minimart demo.

**Create**: `docs/sql/CUSTOMER_I18N_SEED_MS.sql`

- Copy structure from `docs/sql/CUSTOMER_I18N_SEED_EN.sql`
- Same UUIDs for all entities
- `locale = 'ms'`
- Translate all `name`, `description`, `caption`, `cta_text` values to Bahasa Melayu
- `ON CONFLICT (...) DO UPDATE` for idempotency

**Row counts to match English seed**:

| Table | Rows |
|-------|------|
| `category_translations` | 4 |
| `brand_translations` | 7 |
| `department_translations` | 6 |
| `range_translations` | 11 |
| `post_translations` | 6 |
| `product_translations` | 20 |

**Apply** via Supabase MCP `execute_sql` (seed data) or paste into SQL editor.

**Verify**:

```sql
SELECT locale, COUNT(*)::int FROM product_translations GROUP BY locale ORDER BY locale;
-- Expect en: 20, ms: 20

SELECT name FROM product_translations WHERE locale = 'ms' LIMIT 3;
```

**Do NOT**: Change app TypeScript unless fixing a seed-related type comment.

---

## AGENT 9 — Final Verification + Parity Script

**Depends on**: Agents 1–8

**Goal**: Confirm Malay locale is complete end-to-end.

**Create** (optional but recommended):

- `asf-customer-app/scripts/check-locale-parity.mjs` — fails if `zh-CN`, `en`, `ms` key trees differ

**Tasks**:

1. Run parity script (or inline node one-liner from Agent 5)
2. Grep `asf-customer-app` for stale binary locale checks:

   ```
   locale === "en"
   locale !== "en"
   ```

   Fix any missed by Agents 1/6 (should be none or trivial)

3. Grep for hardcoded relative-time / distance strings outside JSON
4. `cd asf-customer-app && npx tsc --noEmit`
5. Manual checklist (reply with status):

| Check | Status |
|-------|--------|
| Default `zh-CN` unchanged | |
| English still works | |
| Malay picker + persistence | |
| Malay UI chrome (~709 keys) | |
| Malay product names from DB | |
| Fallback to Chinese when MS row missing | |
| `tsc` clean | |

**Document remaining gaps** (do not fix):

- Stripe PaymentSheet OS language
- Notification plaintext at insert time

**Do NOT**: Expand into staff app or Next.js web.

---

## Parallelization Guide

| Stage | Parallel? | Notes |
|-------|-----------|-------|
| Agent 1 | No | Foundation |
| Agents 2–5 | Possible | **Serial recommended** — single `ms.json` file |
| Agent 6 | After 5 | Needs complete JSON for new keys |
| Agent 7 | Can start after 1 | Independent of JSON translation |
| Agent 8 | After 7 | Needs CHECK constraint |
| Agent 9 | After 6 + 8 | Full E2E |

**Recommended serial path**: `1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9`

---

## Copy-Paste Prompt Template

```
You are adding Malay (ms) locale support to the ASF-2 Expo customer app.

Read:
1. asf-vault/raw/sources/2026-07-16-expo-customer-ms-locale-plan.md
2. asf-vault/raw/sources/2026-07-16-expo-customer-ms-locale-agent-prompts.md — AGENT N only

Workspace: asf-customer-app/ under repo asf-2.

Execute AGENT N only. Follow SHARED CONTEXT.
Do NOT use fetch_products_with_computed_attributes.
Persist locale with AsyncStorage key asf_locale.
Run: cd asf-customer-app && npx tsc --noEmit
Do not commit or push unless I explicitly ask.
```

Replace `N` with 1–9.

---

## Agent sizing rationale (~200k context)

| Agent | Why this size |
|-------|----------------|
| 1 | ~10 small TS/TSX edits + JSON scaffold — fits easily |
| 2–5 | ~160–212 translation keys each — agent reads `en.json` namespaces from disk, not pasted; leaves room for edits + tsc |
| 6 | ~5 files + 7 new keys × 3 locales — moderate code change |
| 7 | One migration, six ALTERs — small |
| 8 | ~110 lines SQL + MCP apply — seed content is repetitive |
| 9 | Grep + script + checklist — small |

Avoid combining Agents 3+4 (374 keys) or 2+3 (372 keys) in one run — translation volume risks context exhaustion when the model also holds plan + source files + screen context.
