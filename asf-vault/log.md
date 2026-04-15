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
