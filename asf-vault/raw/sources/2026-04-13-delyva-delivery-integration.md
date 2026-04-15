# Delyva Delivery Integration — ASF-2

**Date:** 2026-04-13  
**Service:** Delyva (delyva.com / delyvaNow)  
**Purpose:** Malaysian multi-courier delivery integration for ASF-2 e-commerce platform

---

## Why Delyva

Delyva is a Malaysian logistics aggregator. One API integration gives access to 20+ couriers:
- J&T Express, Pos Laju, GDex, DHL eCommerce, Ninja Van, Line Clear, Flash Express
- Same-day/instant: Lalamove, GrabExpress, Borzo, pandago
- And more (full list on delyva.com)

**Alternative approaches considered and rejected:**
- Direct J&T API: covers only J&T, requires separate agreements per courier
- Direct Pos Laju API: complex integration, government postal service bureaucracy
- Delyva aggregator: single account, single API, choose couriers in dashboard, competitive rates

---

## Integration Model

Use the **Store / Marketplace model**: one Delyva account owned by ASF-2, all orders go through it. Billing between ASF-2 and Delyva directly.

The alternative (SaaS model where each merchant has their own account) is not needed since ASF-2 operates as a single seller.

---

## API Reference

**Base URL:** `https://api.delyva.app/v1.0`

**Auth header (all requests):**
```
X-Delyvax-Access-Token: <YOUR_API_KEY>
```

Get API key: Customer Portal → Settings → API Integrations.

### Key endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/service/instantQuote` | Get shipping rates for an origin+destination+weight |
| POST | `/order` | Create order (draft, `process: false`) |
| POST | `/order/{id}/process` | Confirm/process the draft order |
| GET | `/order/{id}` | Get order details including tracking number |
| GET | `/order/{id}/label` | Get PDF shipping label URL |
| POST | `/order/{id}/cancel` | Cancel order (before pickup) |
| POST | `/webhook/subscribe` | Subscribe to webhook events |

### Shipping rate request example
```json
POST /service/instantQuote
{
  "customerId": 123,
  "origin": {
    "address1": "28 Jalan 5",
    "city": "Kajang",
    "state": "Selangor",
    "postcode": "43000",
    "country": "MY"
  },
  "destination": {
    "address1": "F-11-19 Pacific Place",
    "city": "Petaling Jaya",
    "state": "Selangor",
    "postcode": "47301",
    "country": "MY"
  },
  "weight": { "unit": "kg", "value": 0.9 },
  "itemType": "PARCEL"
}
```

Response includes array of services with `serviceCode`, courier name, price in MYR, ETA.

### Common service codes
- `NDD` — Next Day Delivery (pickup from seller)
- `NDD-DROP` — Next Day Delivery (seller drops off at collection point)
- `SD` — Same Day (~3–4 hours)
- `INSTANT` — ~1–2 hours
- `COD-NDD` — NDD with Cash on Delivery

---

## Sandbox vs Production

| | Sandbox | Production |
|---|---|---|
| Portal | `https://trydx.delyva.app/customer` | `https://my.delyva.app/customer` |
| API base | `https://api.delyva.app/v1.0` | same URL |
| Real couriers | No | Yes |
| Real charges | No | Yes |

Register a **separate sandbox account** at `trydx.delyva.app`. Get a sandbox API key. No real shipments are created, no money is charged.

---

## Testing Without Real Shipments

Delyva provides a **Webhook Simulator** in the sandbox portal:

1. Create a test order via API (gets a fake `consignmentNo`)
2. Go to sandbox portal → webhook simulator
3. Enter the `consignmentNo`, select an event type:
   - `order.created` (statusCode 100)
   - Pickup Success (statusCode 200)
   - In Transit (statusCode 300)
   - Out for Delivery (statusCode 320)
   - Delivered (statusCode 400)
   - Failed Delivery (statusCode 410)
4. Click Send → fires a real webhook POST to your subscribed endpoint

This allows **full end-to-end testing of the tracking flow** without a single real parcel.

### Expose localhost for webhook testing
Use ngrok or Cloudflare Tunnel:
```bash
ngrok http 3000
# or
cloudflared tunnel --url http://localhost:3000
```
Register the tunnel URL as your webhook endpoint in the Delyva portal.

---

## Webhook Events

Subscribe with:
```json
POST /v1.0/webhook/subscribe
{
  "event": "order_tracking.update",
  "url": "https://yourapp.com/api/delivery/webhook",
  "secret": "<shared-secret>"
}
```

| Event | When |
|---|---|
| `order.created` | Order successfully created (statusCode 100) |
| `order.failed` | Order failed to create |
| `order.updated` | Order details updated |
| `order_tracking.update` | New tracking activity (fires for every update) |
| `order_tracking.change` | Only when statusCode changes (recommended for status updates) |

### Verify webhook signature (Node.js)
```javascript
const crypto = require('crypto');
const expected = crypto.createHmac('sha256', process.env.DELYVA_API_SECRET)
  .update(JSON.stringify(req.body)).digest('base64');
if (req.headers['x-delyvax-hmac-sha256'] !== expected) {
  return res.status(401).send('Invalid signature');
}
```

---

## Seller Physical Workflow

What the seller (warehouse/staff) needs to do for each shipment:

### Step 1: System books the shipment
Staff clicks "Ship This Order" in the admin panel → app calls `/api/delivery/create-shipment` → Delyva API creates and processes the order → system receives `trackingNumber` and `labelUrl`.

### Step 2: Print the AWB (Air Waybill / shipping label)
Staff clicks "Print Label" button in admin → opens `labelUrl` PDF in browser → prints on any printer.
- Standard printer is sufficient
- Thermal label printer (Zebra, Xprinter) is faster for high volume — optional
- The AWB has a barcode/QR that the courier scans at every stage

### Step 3: Attach label and arrange collection

**Option A — Courier Pickup:**
- serviceCode `NDD` or `SD` etc.
- Courier comes to the seller's address
- No minimum parcel count required
- Cut-off time: typically 3–5pm depending on courier (miss it = next day pickup)
- Schedule pickup through Delyva portal or app

**Option B — Drop-off at collection point:**
- serviceCode `NDD-DROP` (cheaper, no wait for courier)
- Seller brings parcel to a drop-off point
- J&T: J&T service centres
- Pos Laju: post offices
- Ninja Van: designated collection points
- Delyva portal lists nearby drop-off locations

### Packing list (optional)
Add `?packingList=true` to label URL for a packing list alongside the label. Useful when shipping multiple items per parcel.

---

## Order Status Codes (Delyva)

| statusCode | Meaning |
|---|---|
| 100 | Order created (draft) |
| 200 | Order processed / confirmed |
| 210 | Pickup assigned |
| 220 | Pickup success |
| 300 | In transit |
| 310 | Out for delivery hub |
| 320 | Out for delivery |
| 400 | Delivered |
| 410 | Failed delivery |
| 420 | Return in progress |
| 430 | Returned to sender |
| 90 | Cancelled |

Map these to customer-facing status labels (e.g., 220 → "Picked Up", 320 → "Out for Delivery", 400 → "Delivered").

---

## Live Tracking Map (optional)

Delyva provides an embeddable live map with ETA for instant/same-day delivery orders:
```html
<iframe
  src="https://my.delyva.app/track/rmap?trackingNo=MYJNT123456789"
  style="width:100%;height:520px;border:0;"
  allowfullscreen loading="lazy">
</iframe>
```
Only shows when driver is assigned (statusCode 210+) and delivery type is instant/same-day.

---

## Add-ons Available

- **COD (Cash on Delivery)**: `"cod": { "currency": "MYR", "amount": 500 }` — courier collects cash on delivery and remits to seller
- **Insurance**: `"insurance": { "currency": "MYR", "amount": 400 }` — parcel value insurance
- Both are addons at quote and order creation time

---

## Cancellation Rules

- **Before `process` call**: cancel any time, no charge
- **NDD/courier**: cancel before pickup completes (statusCode < 220) or contact Delyva support
- **Instant/same-day**: cancel before driver accepts (statusCode < 200)
