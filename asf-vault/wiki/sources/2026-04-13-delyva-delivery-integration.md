---
title: "Delyva Delivery Integration — ASF-2"
type: source
updated: 2026-04-13
tags: [asf-2, delyva, delivery, malaysia, courier, logistics]
---

# Delyva Delivery Integration — ASF-2

**Raw source:** [raw/sources/2026-04-13-delyva-delivery-integration.md](../../raw/sources/2026-04-13-delyva-delivery-integration.md)  
**Service:** Delyva (delyva.com / delyvaNow)  
**Entity:** [[wiki/entities/asf-2]]

## Summary

Reference document for integrating Delyva as the delivery service aggregator for ASF-2. Covers the API, sandbox testing approach, webhook setup, seller physical workflow, and status code mapping. Delyva was chosen as a single API giving access to 20+ Malaysian couriers (J&T, Pos Laju, GDex, DHL, Ninja Van, Lalamove, GrabExpress, etc.).

## Integration model

Store/Marketplace model: one Delyva account owned by ASF-2. All orders flow through it. Billing between ASF-2 and Delyva directly.

## API quick reference

- Base URL: `https://api.delyva.app/v1.0`
- Auth: `X-Delyvax-Access-Token` header
- Rate quote: `POST /service/instantQuote`
- Create order: `POST /order` (with `process: false` for draft)
- Process order: `POST /order/{id}/process`
- Get label PDF: `GET /order/{id}/label`
- Track: `GET /order/{id}`
- Cancel: `POST /order/{id}/cancel`
- Webhooks: `POST /webhook/subscribe`

## Sandbox testing (no real shipments needed)

- Dev portal: `https://trydx.delyva.app/customer` — separate sandbox account
- Webhook Simulator: enter fake `consignmentNo`, select event type, fires real webhook POST to your endpoint
- Events testable: order.created, pickup success, in transit, out for delivery, delivered, failed delivery
- Expose localhost via ngrok or Cloudflare Tunnel to receive webhooks during development

## Seller physical workflow

1. Staff clicks "Ship This Order" → system calls Delyva API → receives `trackingNumber` + `labelUrl`
2. Staff clicks "Print Label" → PDF opens → prints on any standard printer
3. Courier picks up from seller address (serviceCode `NDD`) OR seller drops off at collection point (`NDD-DROP`)
4. Courier scans AWB barcode → tracking begins automatically → customer sees updates via webhook

**Equipment needed:** Any printer. No thermal printer required (though faster for high volume).

## Status code mapping

Key codes for customer-facing timeline: 220 = Picked Up, 300 = In Transit, 320 = Out for Delivery, 400 = Delivered, 410 = Failed Delivery, 90 = Cancelled.

## Webhook signature verification

Uses HMAC-SHA256 with `user.apiSecret`. Verify `X-Delyvax-Hmac-SHA256` header on every webhook POST. Return 200 within 30 seconds or Delyva retries. Stops after 10 failed attempts.

## Related

- [[wiki/entities/asf-2]]
- [[wiki/concepts/production-readiness-asf-2]]
- [[wiki/sources/2026-04-13-immediate-execution-plan]]
- [[wiki/sources/2026-04-13-production-roadmap]]

## Open questions

- Will COD (Cash on Delivery) be offered? Delyva supports it as an add-on.
- Do products need a weight field added to the DB schema for accurate rate quotes?
- Which couriers will be enabled in the Delyva dashboard (affects rates shown to customers)?
