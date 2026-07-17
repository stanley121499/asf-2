# Physical Warranty Registration — Session Accomplishment (ASF-2)

**Date**: 2026-07-17  
**Status**: Implemented (local / DB); production deploy of Next APIs still required for remote Expo  
**Stakeholder**: Simon (via Stanley)  
**Related design**: `2026-07-17-physical-warranty-registration-design.md`  
**Related prompts**: executed then removed (`2026-07-17-physical-warranty-registration-agent-prompts.md`)  
**Builds on / supersedes (customer-facing hero)**:
- Online claims + photo approval (`2026-06-26-post-purchase-claims-module.md`)
- Human-verified warranty credits (`2026-07-09-warranty-discount-credits-design.md`) — **tiers + fixed RM math reused**; physical registration is the new primary customer path

This file is the **session source of truth** for what was decided and what shipped on 2026-07-17. Prefer this over chat memory when continuing warranty work.

---

## 1. Problem Simon wanted solved

Simon sells mostly through **consignment / partner shops**, not direct online. Customers need:

1. A premium **ownership hub** in the Expo customer app (“My Collection” / Apple “My Devices” vibe)
2. Warranty time tracking with a **calendar** (daily ring → tick after 24h)
3. Clear **period → offer %** visibility (editable later by merchant)
4. **Claim once**, no proof the shoe is broken, no staff approval to issue
5. Redeem **online or at any physical partner store** (staff burns voucher; till discount manual for now)
6. Activation via a **card inside the shoebox** (unique code), not unique QR artwork on every outer box

---

## 2. Locked product decisions

| Topic | Decision |
|-------|----------|
| Activation | **Card inside the box** with unique one-time code (+ QR deep link preferred later). Outer-box SKU QR optional / deferred |
| Why not unique QR per box | Too much ops; unique **code** on a premium insert is enough anti-fraud for v1 |
| Auth | Must **log in** before activate |
| Receipt photo | **Optional** |
| Staff name on form | **Optional** |
| Purchase store | Required (`store_locations`) |
| Claim count | **Once per registration forever** |
| Tier timing | % from days since `purchase_date` **on claim day** |
| Early vs late | Claim in month 1 @ 75% → done; wait until month 3 @ 50% → lower credit, still one claim |
| Credit math | **Fixed RM** = `original_pair_price_myr × tier_percent / 100` (not “% off whatever they buy next”) |
| Staff approval | **None** for issuance |
| Staff role | Only **redeem / burn** voucher in-store |
| In-store till | Discount applied **manually** (no POS) |
| Where redeemable | **Any partner store** |
| Online redeem | Same voucher; mutually exclusive with in-store (single-use) |
| Primary surface | **`asf-customer-app` (Expo)** first |
| Feature flag | **`warranty_registration`** (dedicated; not `claims`) |
| Printing cards (ops) | Not customer-app. Later: admin **Generate N codes → download PDF/CSV** for print shop. v1: SQL seed |

Default tier table (merchant-editable via existing `/settings/warranty`):

| Days since purchase | % of original pair → fixed RM |
|---------------------|-------------------------------|
| 0–30 | 75% |
| 31–60 | 50% |
| 61–90 | 25% |
| 91–365 | 10% |
| 366+ | ineligible |

---

## 3. End-to-end model (shipped)

```
Activate card → Track (My Collection + calendar + month tabs)
    → Claim once (auto-issue fixed RM voucher)
    → Redeem online OR staff in-store burn
```

### Objects

| Object | Role |
|--------|------|
| `warranty_activation_codes` | One-time codes printed on cards |
| `warranty_registrations` | “This customer owns this pair” from purchase date |
| `warranty_credits` (extended) | Issued voucher: amount, `redemption_code`, channel `online` \| `in_store` |
| `warranty_policies` + `warranty_discount_tiers` | Reused; % windows still merchant-editable |
| `store_locations` | Purchase store + redeem store |

### Anti-abuse (v1)

- Unique unused activation code
- One claim per registration
- Server-side claim amount (client cannot set RM / %)
- Single-use credit; redeem confirm transactional
- No future purchase dates

---

## 4. What shipped (code + DB)

### 4.1 Database (applied on ASF Supabase)

- Migration: `asf-2-next/supabase/migrations/20260717140000_physical_warranty_registration.sql`  
  (applied remotely via MCP in chunks as `physical_warranty_registration` + follow-ons)
- Mirror: `asf-2-next/docs/sql/step_13_physical_warranty_registration.sql`
- Seed codes: `asf-2-next/docs/sql/SEED_WARRANTY_ACTIVATION_CODES.sql` (`ASF-TEST-0001`…`0040`)
- Feature flag row: `warranty_registration` = **enabled**
- `warranty_credits` extended: `registration_id`, `redemption_code`, `redemption_channel`, `redeemed_store_id`, `redeemed_by_staff_id`; `claim_id` / `claim_item_id` nullable with source CHECK

### 4.2 Next.js APIs (`asf-2-next`)

Contract: `asf-2-next/src/app/api/warranty/README_REGISTRATION.md`

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/warranty/registrations/activate` | Customer Bearer/JWT |
| GET | `/api/warranty/registrations` | Customer |
| GET | `/api/warranty/registrations/[id]` | Customer (own) |
| POST | `/api/warranty/registrations/[id]/claim` | Customer (own), auto-issue |
| GET | `/api/warranty/credits/[id]/voucher` | Customer (own) |
| POST | `/api/warranty/redeem/preview` | Staff |
| POST | `/api/warranty/redeem/confirm` | Staff |

Also: online apply/consume supports registration-issued credits (`redemption_channel: online`).  
`requireAuthenticatedUser` accepts **Bearer** tokens for Expo.

Responses include `productImageUrl` from `product_medias` where available.

### 4.3 Expo customer (`asf-customer-app`)

| Surface | Path / notes |
|---------|----------------|
| Profile → My Collection | `/(tabs)/profile/collection` |
| Activate | `/(tabs)/profile/collection/activate` |
| Detail (premium redesign) | `/(tabs)/profile/collection/[registrationId]` |
| API client | `lib/apiFetch.ts` + `lib/warranty/warrantyRegistrationApi.ts` |
| Context | `WarrantyRegistrationContext` |
| Month tabs helper | `lib/warranty/buildWarrantyMonthTabs.ts` |
| i18n | `collection.*` in en / zh-CN / ms |
| QR | `react-native-qrcode-svg` (+ `react-native-svg`) for voucher |

**Detail UX decisions after playtest (same day):**

- Premium ownership hub: large product hero, quieter calendar, RM credit first (not “75%” as hero)
- Month tabs = **Month 1 … Month 12** covering **365 days** from purchase
- Month bucketing = **real calendar months** from `purchase_date` (UTC); Month 12 extends through day 365; fallback 30-day buckets if date unparseable
- Calendar shows **only days in the selected month** (~28–36), not the full year strip
- Offer copy: “If you claim now / in Month N” → **RM X store credit** → “Y% of your RM Z purchase” → claim-once helper
- Letter placeholder (e.g. “经”) was first character of Chinese product name when no image — replaced by product media when URL present
- Product images today are often **opaque** Unsplash JPEGs; true cutout cards need transparent PNGs in `product_medias`

### 4.4 Staff app (`asf-staff-app`)

- Redeem screen: `/(app)/warranty/redeem`
- Entry: dashboard / settings tools (“核销保修”)
- Flow: paste redemption code or QR JSON `{"creditId","redemptionCode"}` → preview → pick store → confirm burn
- Flag: `warranty_registration`

### 4.5 Shared helpers

Mirrored in Next + Expo:

- `normalizeActivationCode`
- `generateRedemptionCode`
- `daysSincePurchase` (future → negative; reject in API)
- Existing `resolveWarrantyTier` / `calculateCreditAmount`

---

## 5. Implementation agents (completed)

Ran serially from the (now-deleted) agent prompts file:

1. Schema + types + helpers  
2. Next registration / claim / redeem APIs  
3. Expo Activate + My Collection list  
4. Expo detail calendar + claim + voucher  
5. Staff redeem  

Follow-up same-day UI agents: product image + month tabs + offer clarity + premium redesign; then Month 1–12 / calendar scoped to selected month.

---

## 6. Local testing notes (2026-07-17)

- Expo was pointing at `EXPO_PUBLIC_API_URL=https://asf-2.vercel.app` → new routes not deployed → HTML 404 → “Invalid response from activate”
- Temporary fix for device testing: point Expo at local Next (`http://<LAN-IP>:3001`) with Next listening on `0.0.0.0`
- Seeded active registration for `stanley121499@gmail.com` (Classic Court Sneaker, purchase 2026-07-12, Pavilion KL) so calendar/claim could be tested without printing cards
- Test codes remaining for activate: `ASF-TEST-0002`… (0001 burned by seed registration)

---

## 7. Explicitly not done / next ops

| Item | Status |
|------|--------|
| Admin “Generate codes + PDF print sheet” | **Not built** — SQL seed only |
| Deploy Next warranty registration routes to Vercel | **Required** for production Expo |
| POS / till integration | Out of scope |
| Transparent product cutouts | Needs PNG uploads to `product_medias` |
| Web customer My Collection parity | Deferred |
| Reverse / void in-store redeem | Deferred |
| Unique outer-box QR per SKU artwork | Optional later |
| Old online photo-claims path | Left in place for direct web sales; not the Simon physical hero |

---

## 8. Contradiction / open tension with prior wiki

[[wiki/concepts/warranty-discount-credits-asf-2]] describes **staff-approved**, photo-backed claims issuing credits. This session **does not delete** that system, but the **Simon physical retail path** intentionally:

- Skips photos and staff approval for issuance
- Starts from activation card + purchase date, not online delivery
- Puts Expo My Collection first

Treat physical registration as the **current customer-facing warranty SOT** for retail/consignment; keep online claims as a parallel path until product explicitly merges or retires them.

---

## 9. Key file index

```
asf-2-next/
  supabase/migrations/20260717140000_physical_warranty_registration.sql
  docs/sql/step_13_physical_warranty_registration.sql
  docs/sql/SEED_WARRANTY_ACTIVATION_CODES.sql
  src/app/api/warranty/README_REGISTRATION.md
  src/app/api/_lib/warrantyRegistrations.ts
  src/app/api/warranty/registrations/**
  src/app/api/warranty/redeem/**
  src/modules/warranty/*

asf-customer-app/
  app/(tabs)/profile/collection/**
  context/WarrantyRegistrationContext.tsx
  lib/apiFetch.ts
  lib/warranty/*

asf-staff-app/
  app/(app)/warranty/redeem.tsx
  lib/warranty/warrantyRedeemApi.ts

asf-vault/raw/sources/
  2026-07-17-physical-warranty-registration-design.md
  2026-07-17-physical-warranty-registration-session-accomplishment.md  ← this file
```

---

## 10. Success criteria (session)

- [x] Logged-in activate via one-time code (API + Expo UI)
- [x] My Collection list + detail with calendar rings → ticks
- [x] Month tabs Month 1–12 / 365 days; calendar scoped to selected month
- [x] Claim once → fixed RM voucher + QR / backup code
- [x] Staff in-store redeem burn
- [x] Online apply path extended for registration credits
- [x] Feature flag `warranty_registration`
- [x] DB migration + seed codes + flag enabled on Supabase
- [ ] Production Next deploy so Expo can leave local API URL
- [ ] Admin print pack for Simon’s real cards

---

*End of session accomplishment.*
