# Cron: wishlist nearby-stock matcher (Agent 5)
#
# Endpoint: GET|POST /api/cron/wishlist-nearby
# Auth: Authorization: Bearer <CRON_SECRET>
# Env: CRON_SECRET (server-only; see `.env.example`)
#
# Wiring:
# - `asf-2-next/vercel.json` schedules `/api/cron/wishlist-nearby` every 15 minutes.
# - Set `CRON_SECRET` on the Vercel project. When present, Vercel Cron sends
#   `Authorization: Bearer $CRON_SECRET` on each invoke (HTTP GET).
# - Vercel Hobby: cron frequency is limited (often once/day). Sub-15-minute
#   schedules typically need Pro, or use an external scheduler / manual curl.
# - Manual invoke:
#     curl -X POST "$NEXT_PUBLIC_APP_URL/api/cron/wishlist-nearby" \
#       -H "Authorization: Bearer $CRON_SECRET"
#
# Matcher rules (plan §10):
# - Snapshots newer than 2 hours
# - Pref `nearby_stock_push` not false (default true when no prefs row)
# - Haversine ≤ 1.5 km to active `store_locations`
# - `store_product_stock.count > 0` for any variant of a wishlist product
# - Cooldown 7 days via `wishlist_nearby_push_log`
# - Max 1 product notification per user per run
#
# Agent 6 (Expo) must POST /api/location/snapshot with Always location updates
# or the cron will find zero fresh snapshots.
