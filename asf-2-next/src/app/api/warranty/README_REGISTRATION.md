# Physical Warranty Registration APIs — Agent handoff

Base path: `/api/warranty`  
Auth: session cookie (web) **or** `Authorization: Bearer <supabase_access_token>` (Expo).
`requireAuthenticatedUser` accepts both so customer/staff Expo apps can call these routes.  
Mutations (activate, claim, redeem, online consume) use the **service-role** Supabase client.

JSON uses **camelCase**. Error body: `{ "error": "<CODE>", "message": "..." }`.

---

## Error codes

| Code | Typical HTTP | When |
|------|--------------|------|
| `CODE_INVALID` | 400 / 404 | Activation code missing / not found |
| `CODE_USED` | 409 | Activation code already burned |
| `ALREADY_CLAIMED` | 409 | Second claim on same registration |
| `INELIGIBLE` | 400 | Future/invalid purchase date, no tier, non-active status |
| `CREDIT_USED` | 409 | Voucher already redeemed |
| `CREDIT_EXPIRED` | 400 | Voucher expired / revoked / revoked |
| `CREDIT_NOT_FOUND` | 404 | Unknown redemption code / credit id |
| `STORE_INVALID` | 400 | Purchase or redeem store missing / inactive |
| `PRODUCT_PRICE_MISSING` | 400 | Code has no product or product price ≤ 0 |
| `NOT_FOUND` | 404 | Registration not found |
| `FORBIDDEN` | 403 | Not owner |
| `INTERNAL` | 500 | Unexpected server/DB failure |

---

## Customer routes

### `POST /registrations/activate` — customer JWT

**Request**
```json
{
  "code": "ASF-TEST-0001",
  "purchaseDate": "2026-07-01",
  "purchaseStoreId": "<uuid>",
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "customerPhone": "+60123456789",
  "staffName": "Optional staff",
  "receiptUrl": "https://optional.example/receipt.jpg"
}
```
`staffName` / `receiptUrl` optional (omit or `null`).

**Response `201`**
```json
{ "registration": { /* RegistrationSummary — see below */ } }
```

---

### `GET /registrations` — customer JWT

**Response `200`**
```json
{ "registrations": [ /* RegistrationSummary[] */ ] }
```

---

### `GET /registrations/[id]` — customer JWT (own only)

**Response `200`**
```json
{ "registration": { /* RegistrationSummary */ } }
```

---

### `POST /registrations/[id]/claim` — customer JWT

No body. Server computes tier % and RM amount from `purchaseDate` + policy tiers.

**Response `200`**
```json
{
  "registration": { /* RegistrationSummary, status claimed */ },
  "credit": { /* WarrantyVoucherPayload */ }
}
```

Second claim → `409` `{ "error": "ALREADY_CLAIMED", "message": "..." }`.

---

### `GET /credits/[id]/voucher` — customer JWT (own only)

**Response `200`**
```json
{
  "voucher": {
    "creditId": "<uuid>",
    "redemptionCode": "K7M2P9QX",
    "amountMyr": 150.0,
    "approvedPercent": 75,
    "expiresAt": "2027-07-17T00:00:00.000Z",
    "status": "active",
    "redemptionChannel": null,
    "registrationId": "<uuid>",
    "usedAt": null
  }
}
```

QR payload suggestion for Agents 3–4: JSON `{ "creditId", "redemptionCode" }` or encode `redemptionCode` alone.

---

## Staff routes

### `POST /redeem/preview` — staff JWT

**Request** (at least one of)
```json
{ "redemptionCode": "K7M2P9QX" }
```
```json
{ "creditId": "<uuid>" }
```

**Response `200`**
```json
{
  "preview": {
    "creditId": "<uuid>",
    "redemptionCode": "K7M2P9QX",
    "amountMyr": 150.0,
    "approvedPercent": 75,
    "status": "active",
    "expiresAt": "...",
    "redeemable": true,
    "reasonCode": null,
    "reasonMessage": null,
    "customerName": "Jane Doe",
    "productName": "Air Max",
    "registrationId": "<uuid>",
    "redemptionChannel": null
  }
}
```
When not redeemable, `redeemable: false` and `reasonCode` is `CREDIT_USED` / `CREDIT_EXPIRED` / `INELIGIBLE` (HTTP still 200 so staff UI can show state without confirming).

---

### `POST /redeem/confirm` — staff JWT

**Request**
```json
{
  "redemptionCode": "K7M2P9QX",
  "redeemedStoreId": "<uuid>"
}
```

**Response `200`**
```json
{ "voucher": { /* WarrantyVoucherPayload with status used, redemptionChannel in_store */ } }
```

---

## Online apply (existing, extended)

### `POST /credits/apply` — customer JWT

Unchanged request: `{ "creditId", "cartSubtotalMyr" }`.  
Works for **registration-issued** credits (ownership / active / expiry / amount only — no claim_item required).

Checkout `consumeWarrantyCredit` now sets `redemption_channel = "online"` when burning.

---

## `RegistrationSummary` shape

```ts
{
  id: string
  status: "active" | "claimed" | "expired" | "void"
  purchaseDate: string // YYYY-MM-DD
  purchaseStoreId: string
  purchaseStoreName: string | null
  productId: string | null
  productName: string | null
  productImageUrl: string | null
  productColorId: string | null
  productSizeId: string | null
  originalPairPriceMyr: number
  customerName: string
  customerEmail: string
  customerPhone: string
  staffName: string | null
  receiptUrl: string | null
  warrantyCreditId: string | null
  claimedAt: string | null
  createdAt: string
  updatedAt: string
  tier: {
    daysSincePurchase: number
    tierPercent: number | null
    tierDaysFrom: number | null
    tierDaysTo: number | null
    tierFound: boolean
    claimable: boolean
    estimatedCreditMyr: number | null
    maxWarrantyDays: number
  }
  policyTiers: Array<{
    monthIndex: number // Month 1–12 (calendar months from purchase; Month 12 through maxWarrantyDays)
    daysFrom: number
    daysTo: number
    discountPercent: number // From discount tier at the start of that month window
    estimatedCreditMyr: number
  }>
}
```

`claimable` is true only when `status === "active"` and a tier matches current days since purchase.

---

## Implementation notes for Agents 3–5

- Prefer calling these Next APIs for activate / list / claim / voucher / redeem — do not write `warranty_activation_codes` or `warranty_credits` from Expo.
- Never send `amountMyr` / `approvedPercent` on claim; display server values only.
- Staff app: preview first, then confirm with the store the staff is redeeming at.
- Blockers: migration `20260717140000_physical_warranty_registration.sql` must be applied + seed codes from `docs/sql/SEED_WARRANTY_ACTIVATION_CODES.sql` before E2E.
