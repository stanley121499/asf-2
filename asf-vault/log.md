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

## [2026-07-16] ingest | Expo customer home revamp plan + agent prompts

- Sources: `raw/sources/2026-07-16-expo-customer-home-revamp-plan.md`, `raw/sources/2026-07-16-expo-customer-home-revamp-agent-prompts.md`
- Wiki touched:
  - [[wiki/sources/2026-07-16-expo-customer-home-revamp-plan]] (new)
  - [[wiki/sources/2026-07-16-expo-customer-home-revamp-agent-prompts]] (new)
  - [[index.md]] (2 new source entries)
- Notes: Simon feedback → locked decisions (MODEL MATCH tenant brand, all active promos, once-per-session ceremony, worst-case urge). Four sequential agents for `asf-customer-app` home only; not yet executed.

## [2026-07-17] ingest | MODEL MATCH catalog content revamp plan + agent prompts

- Sources: `raw/sources/2026-07-17-model-match-catalog-revamp-plan.md`, `raw/sources/2026-07-17-model-match-catalog-revamp-agent-prompts.md`
- Wiki touched:
  - [[wiki/sources/2026-07-17-model-match-catalog-revamp-plan]] (new)
  - [[wiki/sources/2026-07-17-model-match-catalog-revamp-agent-prompts]] (new)
  - [[index.md]] (2 new source entries; home revamp prompts marked executed)
- Notes: A1 footwear retheme; promotions retheme; images+names/captions; browser HTTP+appropriateness checks required. Six agents (promos → rename → images×2 → posts → i18n). Pending execution.

## [2026-07-17] query | Expo Home + MODEL MATCH catalog session accomplishment

- Outcome filed: [[wiki/syntheses/2026-07-17-expo-customer-home-catalog-revamp-session-accomplishment]]
- Scope captured: Home UX and ceremony, MODEL MATCH catalog/live promotions, zh-CN/en/ms overlays, hero/offers fixes, and origin-aware product navigation.
- Verification recorded: typecheck clean, 724 locale keys × 3, complete product/category/post translations, unique product/post media, and physical-phone smoke testing.
- Index updated with the synthesis as the delivered-program source of truth.

## [2026-07-17] ingest | Warranty discount credits — design spec (built on claims module)

- Source: `raw/sources/2026-07-09-warranty-discount-credits-design.md`
- Wiki touched:
  - [[wiki/sources/2026-07-09-warranty-discount-credits-design]] (new)
  - [[wiki/concepts/warranty-discount-credits-asf-2]] (new)
  - [[wiki/concepts/post-purchase-claims-module-asf-2]] (updated: added "Evolution — warranty discount credits" section resolving v1 gaps: DB tiers, `order_status_logs` delivery date, multi-item `claim_items`)
  - [[wiki/entities/asf-2]] (updated: warranty credits feature block; updated 2026-07-08→2026-07-17; sources 81→82)
  - [[wiki/00-overview]] (updated: current-focus bullet; sources 81→82)
  - [[index.md]] (new concept + source entries; new 2026-07-09 sources section)
- Notes: Human-verified warranty credit system on the `claims` feature flag — estimate-only time tiers, staff approval issues fixed-RM per-line-item `warranty_credits`, one-click cart redemption, single-use, 1-year expiry. New tables `warranty_policies`/`warranty_discount_tiers`/`claim_items`/`warranty_credits`. Working tree confirms all 7 implementation agents shipped in `asf-2-next` (migration `20260709120000_...`, `src/modules/warranty/*`, `api/warranty/*`, `WarrantyPolicy`/`WarrantyCredit` contexts). Open tension: an `asf-customer-app` port also appears in progress despite v1 being scoped web-only.

## [2026-07-17] cleanup | Remove executed agent-prompt raw sources + tmp files (human override of raw immutability)

- Human explicitly authorized deleting completed agent-prompt raw sources for this turn (overrides [[CLAUDE.md]] §3 raw immutability).
- Raw deleted (6): `2026-07-09-warranty-discount-credits-agent-prompts.md` (ingested first), `2026-07-08-expo-customer-i18n-agent-prompts.md`, `2026-07-08-customer-i18n-agent-prompts.md`, `2026-07-16-expo-customer-ms-locale-agent-prompts.md`, `2026-07-16-expo-customer-home-revamp-agent-prompts.md`, `2026-07-17-model-match-catalog-revamp-agent-prompts.md`.
- Wiki pages deleted (5): the corresponding `wiki/sources/*-agent-prompts.md` pages.
- Inbound links fixed to avoid orphans: [[index.md]] (5 entries removed + section counts adjusted), [[wiki/syntheses/2026-07-17-expo-customer-home-catalog-revamp-session-accomplishment]], [[wiki/concepts/customer-i18n-asf-2]], and the ms-locale / customer-i18n / home-revamp / catalog-revamp plan + session pages.
- Repo tmp removed: `.tmp-mm-verify/` (53 untracked MODEL MATCH verification images) and tracked `temp/` folder (`translation_migration.md` + 6 Supabase CSV exports).
- Note: prose "Companion prompts" references inside remaining raw plan/design files now point at deleted files; raw left unedited per immutability. Kept all `wiki/sources/doc-*_AGENT_PROMPTS*` doc-mirror pages (not in scope).

## [2026-07-17] raw | Physical warranty registration design + agent prompts

- Sources added (human-requested write to raw):
  - `raw/sources/2026-07-17-physical-warranty-registration-design.md`
  - `raw/sources/2026-07-17-physical-warranty-registration-agent-prompts.md`
- Wiki ingest: not run yet (raw-only for now); [[index.md]] points at raw paths
- Notes: Locks card-in-box activation, My Collection UX, claim-once tier math (fixed RM of original pair), auto-issue vouchers, staff redeem-only (manual till), any partner store. Five serial agents sized for ~200k context.

## [2026-07-17] ingest | Physical warranty registration session accomplishment

- Source: `raw/sources/2026-07-17-physical-warranty-registration-session-accomplishment.md`
- Wiki touched: [[wiki/sources/2026-07-17-physical-warranty-registration-session-accomplishment]], [[wiki/concepts/physical-warranty-registration-asf-2]] (new), [[wiki/concepts/warranty-discount-credits-asf-2]] (open tension updated), [[index.md]]
- Notes: Captures Simon decisions + shipped physical registration (card-in-box, My Collection, claim-once auto voucher, staff redeem). Marks prior staff-approve credits path as parallel, not retail SOT.

## [2026-07-17] cleanup | Remove physical warranty agent prompts

- Raw deleted: `2026-07-17-physical-warranty-registration-agent-prompts.md` (executed; human requested removal before commit)
- Updated: [[index.md]], session accomplishment raw (prompt path notes)
- Kept: design + session accomplishment sources and wiki concept/source pages

## [2026-07-17] ingest | Expo customer ceremony / 仪式感 motion session

- Source: `raw/sources/2026-07-17-expo-customer-ceremony-motion-session-accomplishment.md`
- Also kept (plans, not prompts): `2026-07-17-expo-customer-ceremony-motion-plan.md`, `2026-07-17-expo-customer-daily-bold-ceremony-plan.md`
- Deleted before ingest (agent prompts, human-requested): `2026-07-17-expo-customer-ceremony-motion-agent-prompts.md`, `2026-07-17-expo-customer-daily-bold-ceremony-agent-prompts.md`
- Wiki touched: [[wiki/sources/2026-07-17-expo-customer-ceremony-motion-session-accomplishment]], [[wiki/concepts/expo-customer-ceremony-motion-asf-2]], [[wiki/entities/asf-2]], [[wiki/00-overview]], [[index.md]]
- Notes: Ambient + day-to-day bold 仪式感 shipped on asf-customer-app; rare wins deferred; PressableScale / usePreventRemove bugfixes recorded.

## [2026-07-18] cleanup + ingest | Expo customer beginner guide / App Guide

- Human authorized deleting executed agent prompts before wiki ingest (overrides [[CLAUDE.md]] §3 for this file).
- Raw deleted: `2026-07-17-expo-customer-beginner-guide-agent-prompts.md`
- Raw added: `2026-07-17-expo-customer-beginner-guide-session-accomplishment.md` (session SOT)
- Kept plan: `2026-07-17-expo-customer-beginner-guide-plan.md` (companion-prompts filename in prose is historical only)
- Wiki touched: [[wiki/sources/2026-07-17-expo-customer-beginner-guide-session-accomplishment]], [[wiki/concepts/expo-customer-beginner-guide-asf-2]] (new), [[wiki/concepts/mobile-app-architecture-asf-2]], [[wiki/entities/asf-2]], [[wiki/00-overview]], [[index.md]]
- Notes: Hub + first-launch coach marks shipped on asf-customer-app; language on welcome; device polish (spotlight focus remeasure, Skip in card, PressableScale `centerContent`).

## [2026-07-28] raw | Expo customer Noir SSENSE bold pass plan + prompts

- Sources added:
  - `raw/sources/2026-07-28-expo-customer-noir-ssense-plan.md`
  - `raw/sources/2026-07-28-expo-customer-noir-ssense-agent-prompts.md`
- Also indexed prior Atelier editorial raws on [[index.md]] (paths only; full wiki ingest deferred until session accomplishment)
- Notes: Noir-only SSENSE night commerce; 4 agents sized for ~200k; Home grid vs Shop list locked; same surface breadth as Atelier (Stores + Orders/Account).

## [2026-07-28] raw | Expo customer Noir intentional redesign Round 2

- Sources added:
  - `raw/sources/2026-07-28-expo-customer-noir-intentional-plan.md`
  - `raw/sources/2026-07-28-expo-customer-noir-intentional-agent-prompts.md` (**later deleted** after execution)
- Indexed on [[index.md]]
- Notes: Stanley QA after R1 — Home≈Shop jobs, Stores/Shop/PDP craft, Rewards dark contrast. 5 agents (0 contrast ∥ 1 Home ∥ 4 Stores → 2 Shop → 3 PDP). Home ≤8 curated; supersedes R1 24-grid.

## [2026-07-28] cleanup + ingest | Theme skins session accomplishment (Atelier + Noir)

- Human requested: delete agent prompts before wiki SOT so prompts do not enter wiki.
- Raw **deleted** (executed prompts):
  - `2026-07-27-expo-customer-theme-skins-agent-prompts.md`
  - `2026-07-27-expo-customer-theme-skins-polish-agent-prompts.md`
  - `2026-07-28-expo-customer-atelier-editorial-agent-prompts.md`
  - `2026-07-28-expo-customer-noir-ssense-agent-prompts.md`
  - `2026-07-28-expo-customer-noir-intentional-agent-prompts.md`
- Raw **added**: `2026-07-28-expo-customer-theme-skins-session-accomplishment.md` (session SOT)
- Kept plans: theme-skins, polish, atelier-editorial, noir-ssense, noir-intentional
- Wiki touched: [[wiki/sources/2026-07-28-expo-customer-theme-skins-session-accomplishment]], [[wiki/concepts/expo-customer-theme-skins-asf-2]] (new), [[index.md]]
- Notes: Decisions + what landed for Classic/Atelier/Noir R1+R2; pitfalls (PressableScale row, Maps inner fill).

## [2026-07-28] query | Customer notification system planning

- Question: Which notifications for Expo customer app first, and how to implement?
- Pages read: [[wiki/00-overview]], [[wiki/concepts/mobile-app-architecture-asf-2]], [[wiki/concepts/production-readiness-asf-2]], [[wiki/sources/2026-04-13-mobile-app-strategy]], [[wiki/sources/2026-04-25-mobile-apps-progress]], [[wiki/concepts/post-purchase-claims-module-asf-2]], [[wiki/concepts/customer-i18n-asf-2]], [[wiki/concepts/physical-warranty-registration-asf-2]]; plus live DB check (`notifications` exists, `push_tokens` missing) and code (`NotificationContext`, Stripe webhook, claims helpers)
- Outcome: answer not filed; recommendation given in chat (in-app already partial; push + order-status producers are the gaps)


## [2026-07-28] query | Customer notifications plan lock (design decisions)

- Question: Lock full customer notification plan from design answers; no implementation yet
- Decisions captured: editable DB templates (B); promo to all tokens (A) + prefs; Next admin compose (B); multilang with default fallback; deep links; customer-only (no staff-app push)
- Outcome: plan presented in chat; not filed pending human approval


## [2026-07-28] ingest | Expo customer notifications plan + agent prompts

- Source: `raw/sources/2026-07-28-expo-customer-notifications-plan.md`, `raw/sources/2026-07-28-expo-customer-notifications-agent-prompts.md`
- Wiki touched: [[wiki/sources/2026-07-28-expo-customer-notifications-plan]], [[wiki/00-overview]], [[index.md]]
- Notes: Locked decisions (templates B, promo A + prefs A, Next admin, multilang default fallback, customer-only). Five agents sized for ~200k context. Toggle set A (Orders / Claims & support / Promotions).


## [2026-07-28] lint/update | Notifications agent pack 5 → 8

- Human feedback: 5 agents under-split a large program (producers + dual admin UI + Expo).
- Updated: `raw/sources/2026-07-28-expo-customer-notifications-agent-prompts.md`, plan §12, wiki source + index.
- Notes: Agent 3 Stripe-only; 4 claims/warranty/physical; 5 order-status+support; 6 templates; 7 campaigns; 8 Expo.

## [2026-08-12] ingest | Expo customer Home tidy revamp (Classic + Noir)

- Source: `raw/sources/2026-08-12-expo-customer-home-tidy-revamp-plan.md`, `raw/sources/2026-08-12-expo-customer-home-tidy-revamp-agent-prompts.md`
- Wiki touched: [[wiki/sources/2026-08-12-expo-customer-home-tidy-revamp-plan]], [[index.md]]
- Notes: Simon feedback locked — Frame1 newest product, strict viewport frames, demote categories, Classic+Noir only; 3 agents (shared layout → Classic → Noir) sized for ~200k context.

## [2026-08-12] ingest | Expo customer Home tidy revamp Round 2

- Source: `raw/sources/2026-08-12-expo-customer-home-tidy-r2-plan.md`, `raw/sources/2026-08-12-expo-customer-home-tidy-r2-agent-prompts.md`
- Wiki touched: [[wiki/sources/2026-08-12-expo-customer-home-tidy-r2-plan]], [[index.md]], [[wiki/00-overview]]
- Notes: Device audit — Round 1 not tidy enough. R2 locks: remove Home wordmark; no peek (half card = cutoff); snap 2-up + Swipe/dots; push-down Frame 1 / kill scrims; fixed promo banners; keep categories as chip slider; product+promo+posts. 3 agents. Round 1 superseded for tidy grammar.

## [2026-08-12] ingest | Expo customer Home editorial density Round 3

- Source: `raw/sources/2026-08-12-expo-customer-home-tidy-r3-plan.md`, `raw/sources/2026-08-12-expo-customer-home-tidy-r3-agent-prompts.md`
- Wiki touched: [[wiki/sources/2026-08-12-expo-customer-home-tidy-r3-plan]], [[index.md]], [[wiki/00-overview]]
- Notes: Home felt empty; DB OK (20 products, 6 posts, 4 active promos). R3: editorial storefront; Frame 1 ~48% usable; onload = Frame1 + promo + 2 product cards; denser scroll/higher caps; keep R2 tidy. 3 agents.

## [2026-08-12] ingest | Expo customer Home cover + editorial body Round 4

- Source: `raw/sources/2026-08-12-expo-customer-home-tidy-r4-plan.md`, `raw/sources/2026-08-12-expo-customer-home-tidy-r4-agent-prompts.md`
- Wiki touched: [[wiki/sources/2026-08-12-expo-customer-home-tidy-r4-plan]], [[index.md]], [[wiki/00-overview]]
- Notes: R3 failed — short vertical scroll (snap sideways) + squashed hero lost focal point. R4: tall cover ≈ full first viewport; below-fold stacked promos + 2-col product grid + journal lead/grid; kill product/post snap. 3 agents.

## [2026-08-12] ingest | Expo customer Home Noir differentiation Round 5

- Source: `raw/sources/2026-08-12-expo-customer-home-noir-diff-r5-plan.md`, `raw/sources/2026-08-12-expo-customer-home-noir-diff-r5-agent-prompts.md`
- Wiki touched: [[wiki/sources/2026-08-12-expo-customer-home-noir-diff-r5-plan]], [[index.md]], [[wiki/00-overview]]
- Notes: Classic frozen. Noir: chips, 1-col large stream (cap ~7), journal ≤2 full-bleed, no categories. 1 agent.

## [2026-08-24] ingest | Expo customer Storefront theme (Classic clone)

- Source: `raw/sources/2026-08-24-expo-customer-storefront-theme-plan.md`, `raw/sources/2026-08-24-expo-customer-storefront-theme-agent-prompts.md`
- Wiki touched: [[wiki/sources/2026-08-24-expo-customer-storefront-theme-plan]], [[index.md]], [[wiki/00-overview]]
- Notes: New theme id `storefront`. Home: newest hero + 2nd–7th grid with swatches; post/promo blocks + load more; Shop: flat taxonomy sidebar + next-level tiles + lazy products; bell on Home/Shop/Highlights. Schema gaps: color medias, post_products, taxonomy parent FKs, promo images. Initially 6 agents — expanded to **9** after review (split seed + platform wiring; fuller IA/acceptance).

## [2026-08-24] update | Storefront plan/prompts expanded 6 → 9 agents

- Human feedback: first pack felt too thin vs scope.
- Updated same raw plan + prompts: deeper IA, seed bars, lib/component map, PDP/nav, linked route, Shop state rules; agents split schema | taxonomy seed | color/link seed | scaffold | contexts/tile/PDP | Home newest | Home feed | Shop | bells+smoke.
- Wiki touched: [[wiki/sources/2026-08-24-expo-customer-storefront-theme-plan]], [[index.md]], [[wiki/00-overview]]

## [2026-08-25] ingest | Storefront session accomplishment SOT

- Source: `raw/sources/2026-08-24-expo-customer-storefront-theme-session-accomplishment.md`
- Deleted: `raw/sources/2026-08-24-expo-customer-storefront-theme-agent-prompts.md` (post-run cleanup)
- Wiki touched: [[wiki/sources/2026-08-24-expo-customer-storefront-theme-session-accomplishment]], [[index.md]], [[wiki/00-overview]], plan + plan wiki (status → shipped)
- Notes: Documents shipped Storefront pack, locked decisions, migrations, seed caveats, post-ship fixes (splash, bell returnTo, push, warranty). Mock data flagged for full curated redo + image gen in next program.

## [2026-08-24] update | Storefront coverage matrix + QC Agent 10

- Human: double-check all requests covered; add QC.
- Plan: §1.1 R1–R17 traceability; feed swatches required; seed proves all 4 taxonomy link styles + multi-post product; contexts explicitly use dept/range/brand; §11 full QC (SQL/UI/locale/regression).
- Prompts: 9 → **10** agents (Agent 10 = formal QC, defect-first).
- Wiki touched: [[wiki/sources/2026-08-24-expo-customer-storefront-theme-plan]], [[index.md]], [[wiki/00-overview]]

## [2026-08-25] ingest | Storefront curated seed plan + agent prompts

- Source: `raw/sources/2026-08-25-expo-customer-storefront-curated-seed-plan.md`, `raw/sources/2026-08-25-expo-customer-storefront-curated-seed-agent-prompts.md`
- Wiki touched: [[index.md]]
- Notes: Full mock-data redo for Storefront demo. 80 products (8 footwear + 4 accessory per category), 3 depts (no kids), zh canonical brands, new UUID scheme, soft-delete herbal + old demo. 10 posts (≥6 links), 4–6 promos. ~450 AI images with per-category gen+QC. **38 agents** in 6 phases for ~200k context windows. Image phasing TBD by Stanley. No implementation yet.


## [2026-09-03] ingest | Storefront occupation taxonomy + Home filter plan + prompts

- Source: `raw/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-plan.md`, `raw/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-agent-prompts.md`
- Wiki touched: [[wiki/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-plan]], [[wiki/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-agent-prompts]], [[index.md]], [[wiki/00-overview]]
- Notes: Stanley+Simon: range=occupation, category kind_key types; Shop occupations-only left rail; Home category filter rail refilters hero/arrivals/feed; hero=latest post; See all on every 2×3; Coming soon empty combos. **8 agents** for ~200k. Partially supersedes 2026-08-24 Storefront Home hero + Shop sidebar IA. No implementation yet.

## [2026-09-03] qc | Storefront occupation taxonomy Agent 08
- Source: `raw/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-qc-notes.md`
- Wiki touched: [[wiki/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-qc-notes]]
- Notes: Static QC 15 PASS / 0 FAIL / 1 SKIP (R1 device). Implementation-complete pending device QC.

## [2026-09-08] ingest | Customer engagement discovery points + nearby stock plan + prompts

- Source: `raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan.md`, `raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-agent-prompts.md`
- Wiki touched: [[wiki/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan]], [[wiki/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-agent-prompts]], [[index.md]], [[wiki/00-overview]]
- Notes: Locked dual feature for Expo: first-view points (admin-editable amount, strong ceremony) + nearby wishlist stock (1.5km / 7d / Always location / normal push+inbox). Per-store color×size stock new. Demo notification seeds. **7 agents** for ~200k. No implementation yet.

## [2026-09-08] qc | Customer engagement Agent 07

- Source: `raw/sources/2026-09-08-expo-customer-engagement-qc-notes.md`
- Wiki touched: [[wiki/sources/2026-09-08-expo-customer-engagement-qc-notes]], [[index.md]], [[wiki/00-overview]]
- Notes: §13 matrix 11 PASS / 1 FAIL (Highlights linked-products) / 5 SKIP (device/native). Ceremony not on nearby; stock_place unused. Demo inbox 6 rows. P0 none.
