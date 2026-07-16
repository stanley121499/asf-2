# asf-vault — activity log

Append-only. Newest entries at the bottom (or top—stay consistent). This vault uses **bottom append** with newest last.

---

## [2026-04-09] bootstrap | LLM Wiki structure in asf-vault

- Added [[CLAUDE.md]] as agent schema; created `raw/sources/`, `raw/assets/`, `wiki/` tree; initialized [[index.md]] and this log.
- Human entry points: [[Welcome.md]], [[wiki/00-overview]].

## [2026-04-09] ingest | LLM Wiki idea document

- Source: `raw/sources/llm-wiki-idea.md`
- Wiki touched: [[wiki/sources/llm-wiki-idea]], [[wiki/concepts/llm-wiki-pattern]], [[wiki/concepts/rag-vs-compounding-knowledge]], [[wiki/00-overview]], [[index.md]]
- Notes: First ingest demonstrates multi-page integration from a single source; Memex link noted on concept page.

## [2026-04-09] ingest | Repo docs/ (all .md) + root README → raw

- Sources: `raw/sources/docs/**/*.md` (65 files), `raw/sources/root/README.md` (copy of repo root README)
- Action: Copied from `asf-2/docs/` and `asf-2/README.md` into vault raw (originals unchanged in repo)
- Wiki touched: [[wiki/sources/batch-2026-04-09-docs-and-root-readme]], [[wiki/entities/asf-2]], [[wiki/concepts/context-provider-architecture-asf-2]], [[wiki/concepts/asf-2-documentation-index-gaps]], [[wiki/00-overview]], [[index.md]]
- Notes: Batch catalog page + entity/concepts; flagged docs README module links missing on disk and CRA root README vs Vite/docs mismatch.

## [2026-04-09] ingest | Remediation — per-source wiki pages for docs corpus

- Issue: Prior pass used one batch page instead of **one `wiki/sources/*` page per raw file** ([[CLAUDE.md]] §5).
- Action: Added **66** pages `wiki/sources/doc-*.md` (+ [[wiki/sources/doc-repo-root-readme]]), each linking to its raw path with summary, outline, wikilinks, open questions.
- Wiki touched: all new `doc-*` files; [[index.md]] (full catalog list); [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] (clarified relationship to per-file pages).
- Notes: Summaries are heuristic; some default to "see raw" when the source has no paragraph under the H1.

## [2026-04-13] ingest | Production planning session — 5 new raw sources

- Sources:
  - `raw/sources/2026-04-13-production-roadmap.md`
  - `raw/sources/2026-04-13-user-flow-audit.md`
  - `raw/sources/2026-04-13-immediate-execution-plan.md`
  - `raw/sources/2026-04-13-mobile-app-strategy.md`
  - `raw/sources/2026-04-13-delyva-delivery-integration.md`
- Wiki touched:
  - [[wiki/sources/2026-04-13-production-roadmap]] (new)
  - [[wiki/sources/2026-04-13-user-flow-audit]] (new)
  - [[wiki/sources/2026-04-13-immediate-execution-plan]] (new)
  - [[wiki/sources/2026-04-13-mobile-app-strategy]] (new)
  - [[wiki/sources/2026-04-13-delyva-delivery-integration]] (new)
  - [[wiki/concepts/production-readiness-asf-2]] (new)
  - [[wiki/concepts/mobile-app-architecture-asf-2]] (new)
  - [[wiki/entities/asf-2]] (updated: Next.js active codebase, mobile plans, production status, sources 66→71)
  - [[wiki/00-overview]] (updated: sources count 67→72, added 2026-04-13 focus section)
  - [[index.md]] (updated: 7 new entries — 5 sources + 2 concepts; raw layout table expanded)
- Notes: Content captured from a multi-turn planning conversation covering the full production build-out scope. Key new knowledge: Next.js API routes serve as the sole backend (no separate server needed); Expo+RN chosen over Flutter for both mobile apps; Delyva chosen as Malaysian delivery aggregator; 12-step immediate execution plan with checkout + analytics as critical-path blockers.

---

[2026-04-13] audit | Phase 0 verification — bugs fixed + gap docs updated

- Phase 0 agent run verified correct: migration SQL idempotent, DB types regenerated, soft-delete utility, OrderContext/RewardsClient rewrites all valid.
- Bugs fixed in code (not requiring DB migration):
  - `OrderContext.tsx`: removed redundant `.select().single()` from `product_stock_logs` insert
  - `OrderContext.tsx`: `updateOrderStatus` now inserts into `order_status_logs` (table existed in DB; agent left incorrect TODO)
  - `orders/[orderId]/page.tsx` (admin): status history now fetched from real `order_status_logs` table; `handleStatusUpdate` inserts real log row
- Gap resolved (needs DB migration — new SQL file created):
  - `shipping_address_structured JSONB` column on `orders` — file: `docs/sql/PHASE_0B_SHIPPING_ADDRESS_STRUCTURED.sql`. Must run before Phase 2 (Delyva create-shipment needs structured fields). TEXT `shipping_address` kept for display.
- Gap deferred (documented, not actioned):
  - `push_tokens` table — deferred to Phase 5 (mobile apps). SQL added to Phase 5 section of production-roadmap raw source.
- Security notes documented in wiki (intentional design, not bugs):
  - `staff_roles` SELECT-own only — bootstrap owner via Supabase SQL editor
  - `notifications` no client INSERT — all inserts use service role key from server

## [2026-04-25] ingest | Mobile apps progress — both Expo apps built (Apr 13–25)

- Source: `raw/sources/2026-04-25-mobile-apps-progress.md`
- Wiki touched:
  - [[wiki/sources/2026-04-25-mobile-apps-progress]] (new)
  - [[wiki/entities/asf-2]] (updated: codebases table, production readiness section, sources 71→73)
  - [[wiki/00-overview]] (updated: current focus section, sources 72→73)
  - [[index.md]] (added 1 new source entry + raw layout table entry)
- Notes: Documents all work between 2026-04-13 and 2026-04-25 — customer app APK shipped, staff app feature-complete via Expo Go. Critical schema corrections captured (products.status not active; product_stock.count not quantity; announcements and promotion_products tables newly documented). Expo Router lesson: every `(tabs)/` subdirectory must have `_layout.tsx`. Next priority: demo data (Malaysia minimart) + fix staff bottom nav dashboard tab.

## [2026-04-25] ingest | Demo data plan — Malaysia minimart (KK Mart / 99 Speed Mart)

- Source: `raw/sources/2026-04-25-demo-data-plan.md`
- Wiki touched: [[index.md]] (added entry)
- Notes: Planning document for seeding Supabase with ~50 Malaysian minimart products across 7 categories, 10 brands, historical orders, promotions, and announcements. Includes verified schema column names from `database.types.ts`. Will be used as context for demo data agent.

## [2026-06-26] ingest | Store locations feature — cross-platform implementation

- Source: `raw/sources/2026-06-26-store-locations-feature.md`
- Wiki touched:
  - [[wiki/sources/2026-06-26-store-locations-feature]] (new)
  - [[wiki/concepts/store-locations-feature-asf-2]] (new)
  - [[wiki/entities/asf-2]] (updated: store locations module, sources 73→74)
  - [[wiki/00-overview]] (updated: current focus, sources 73→74)
  - [[index.md]] (added concept + source entries)
- Notes: Documents full store locator build — `store_locations` + `feature_flags` migrations on ASF Supabase, customer `/stores` vs admin `/store-locations` route split, mobile wishlist→门店 tab, staff apiFetch CRUD, integration tests, production deploy still pending.

## [2026-06-26] ingest | Pixel2Motion MODEL MATCH animated splash

- Source: `raw/sources/2026-06-26-pixel2motion-model-match-splash.md`
- Wiki touched:
  - [[wiki/sources/2026-06-26-pixel2motion-model-match-splash]] (new)
  - [[wiki/concepts/pixel2motion-splash-asf-2]] (new)
  - [[wiki/entities/asf-2]] (updated: animated splash, mobile app status, sources 74→75)
  - [[wiki/concepts/mobile-app-architecture-asf-2]] (updated: splash section, sources 2→3)
  - [[wiki/00-overview]] (updated: current focus, sources 74→75)
  - [[index.md]] (added concept + source entries)
- Notes: Documents full Pixel2Motion pipeline for Simon footwear pilot — semantic SVG trace (IoU 0.9972), 7 client variations, Variation 7 letter cascade chosen, WebView embed on both Expo apps, build:splash regeneration from customer motion SOT.

## [2026-06-26] ingest | Post-purchase claims module — modular warranty/returns

- Source: `raw/sources/2026-06-26-post-purchase-claims-module.md`
- Wiki touched:
  - [[wiki/sources/2026-06-26-post-purchase-claims-module]] (new)
  - [[wiki/concepts/post-purchase-claims-module-asf-2]] (new)
  - [[wiki/entities/asf-2]] (updated: claims module, sources 75→76)
  - [[wiki/00-overview]] (updated: current focus, sources 75→76)
  - [[index.md]] (added concept + source entries)
- Notes: Source-of-truth for `claims` module implementation — config portability via `claimPolicyConfig.ts`, SQL `step_11_claims.sql`, customer order-item entry, staff queue mirroring Support; migration must be run before production use.

## [2026-07-08] ingest | Customer i18n session — Expo ship + DB translations

- Source: `raw/sources/2026-07-08-customer-i18n-session-accomplishment.md` (plus plans/prompts: `2026-07-08-customer-i18n-*.md`, `2026-07-08-expo-customer-i18n-*.md`)
- Wiki touched:
  - [[wiki/sources/2026-07-08-customer-i18n-session-accomplishment]] (new)
  - [[wiki/sources/2026-07-08-expo-customer-i18n-plan]] (new)
  - [[wiki/sources/2026-07-08-expo-customer-i18n-agent-prompts]] (new)
  - [[wiki/sources/2026-07-08-customer-i18n-plan]] (new)
  - [[wiki/sources/2026-07-08-customer-i18n-agent-prompts]] (new)
  - [[wiki/concepts/customer-i18n-asf-2]] (new)
  - [[wiki/entities/asf-2]] (updated: Expo i18n shipped; sources 76→81)
  - [[wiki/concepts/mobile-app-architecture-asf-2]] (updated: i18n section; sources 3→4)
  - [[wiki/00-overview]] (updated: current focus; sources 76→81)
  - [[index.md]] (concept + 5 source entries)
- Notes: Phone SOT is Expo not Next WebView; translation tables applied on gswszoljvafugtdikimn; Next UI i18n remains git-stashed.

## [2026-07-16] ingest | Expo customer Malay (`ms`) locale — Agents 1–9 complete

- Sources: `raw/sources/2026-07-16-expo-customer-ms-locale-session-accomplishment.md`, `2026-07-16-expo-customer-ms-locale-plan.md`, `2026-07-16-expo-customer-ms-locale-agent-prompts.md`
- Wiki touched:
  - [[wiki/sources/2026-07-16-expo-customer-ms-locale-session-accomplishment]] (new)
  - [[wiki/sources/2026-07-16-expo-customer-ms-locale-plan]] (new)
  - [[wiki/sources/2026-07-16-expo-customer-ms-locale-agent-prompts]] (new)
  - [[wiki/concepts/customer-i18n-asf-2]] (updated: trilingual zh-CN/en/ms)
  - [[index.md]] (3 new source entries + concept blurb)
- Notes: `ms` / `ms-MY` locked; DB CHECK widened + Malay seed applied on gswszoljvafugtdikimn; 717 UI keys × 3 locales; ContentTranslation fetches for en and ms; default remains zh-CN.
