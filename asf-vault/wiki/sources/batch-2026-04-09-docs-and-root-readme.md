---
title: "Batch ingest: docs/ + repo root README"
type: source
updated: 2026-04-09
sources: 66
tags: [ingest, asf-2, corpus]
raw: "raw/sources/docs/, raw/sources/root/README.md"
---

# Batch ingest: `docs/` markdown + repo root `README.md`

## Provenance

On **2026-04-09**, all `**/*.md` files under the repository `docs/` tree were **copied** into `raw/sources/docs/` (preserving paths), and `README.md` from the **repository root** was copied to `raw/sources/root/README.md`. Originals remain in the repo; the vault holds a **frozen snapshot** for wiki work.

- **Count:** 65 markdown files under `raw/sources/docs/` plus 1 under `raw/sources/root/` (**66** files in this batch; separate from `raw/sources/llm-wiki-idea.md`).

## Per-source wiki pages ([[CLAUDE.md]] compliance)

Each raw markdown file above has a matching **`wiki/sources/doc-<kebab-from-filename>.md`** page (plus [[wiki/sources/doc-repo-root-readme]] for the root README). They include summary, top-level outline, wikilinks to [[wiki/entities/asf-2]], and an open-questions placeholder. **[[index.md]]** lists all 66 with wikilinks. This batch note remains the **thematic** map; drill into individual `doc-*` pages for per-file navigation.

## One-line summary

ASF-2 project **architecture, schema, features, bugs, performance programs, redesign plans, agent prompt packs, Herbs data notes, and Next.js migration** material—plus a **Create React App** stub README at `raw/sources/root/README.md` that does **not** describe the real app (the real overview is [docs/README.md](../../raw/sources/docs/README.md)).

## Key themes

1. **Platform:** React + TypeScript + Vite + Supabase; admin + customer surfaces; large Context surface ([[wiki/concepts/context-provider-architecture-asf-2]]).
2. **Data:** PostgreSQL via Supabase; ~42 tables documented in [DATABASE.md](../../raw/sources/docs/DATABASE.md).
3. **Production blockers:** Customer `ProductDetails` variants/cart/stock/gallery called out in [CRITICAL_BUGS.md](../../raw/sources/docs/CRITICAL_BUGS.md) and [FEATURES.md](../../raw/sources/docs/FEATURES.md).
4. **Performance:** Rolling audits and multi-round **PERFORMANCE_FIX_PLAN** / **PERFORMANCE_FIX_AGENT_PROMPTS** documents (2026 rounds 2–8).
5. **UX / redesign:** Customer redesign and UX fix **plans** and **agent prompts** (multiple rounds).
6. **Migrations / content:** Herbs product/blog/image/migration docs; Next.js migration plan + prompts.
7. **Operations:** Setup, deployment, testing, soft delete strategy, unused code inventory.

## Annotated core docs (start here)

| Raw path | Role |
|----------|------|
| [docs/README.md](../../raw/sources/docs/README.md) | Doc hub and project overview (see [[wiki/concepts/asf-2-documentation-index-gaps]] for index drift) |
| [docs/ARCHITECTURE.md](../../raw/sources/docs/ARCHITECTURE.md) | Stack, folder layout, ProviderComposer |
| [docs/DATABASE.md](../../raw/sources/docs/DATABASE.md) | Schema modules, relationships |
| [docs/FEATURES.md](../../raw/sources/docs/FEATURES.md) | Feature matrix and known gaps |
| [docs/CRITICAL_BUGS.md](../../raw/sources/docs/CRITICAL_BUGS.md) | Pre-production priorities |
| [docs/SETUP.md](../../raw/sources/docs/SETUP.md) | Environment and dev setup |
| [docs/DEPLOYMENT.md](../../raw/sources/docs/DEPLOYMENT.md) | Production deployment |
| [docs/DEVELOPMENT_GUIDE.md](../../raw/sources/docs/DEVELOPMENT_GUIDE.md) | Standards and workflows |
| [docs/CONTEXTS.md](../../raw/sources/docs/CONTEXTS.md) | Context provider inventory |
| [docs/CUSTOMER_FACING.md](../../raw/sources/docs/CUSTOMER_FACING.md) | Customer routes/components |
| [docs/ADMIN_PANEL.md](../../raw/sources/docs/ADMIN_PANEL.md) | Admin features |
| [docs/PERFORMANCE_ISSUES.md](../../raw/sources/docs/PERFORMANCE_ISSUES.md) | Performance analysis |
| [docs/TESTING_GUIDE.md](../../raw/sources/docs/TESTING_GUIDE.md) | Testing approach |
| [docs/SOFT_DELETE_STRATEGY.md](../../raw/sources/docs/SOFT_DELETE_STRATEGY.md) | Deletion / FK strategy |
| [docs/AI_AGENT_PROMPTS.md](../../raw/sources/docs/AI_AGENT_PROMPTS.md) | Meta prompts for fixes |
| [root/README.md](../../raw/sources/root/README.md) | CRA template only—not ASF-2 app docs |

## Thematic file groups (complete paths)

### Performance (audits, issues, plans, agent prompts)

- [PERFORMANCE_AUDIT_2026.md](../../raw/sources/docs/PERFORMANCE_AUDIT_2026.md)
- [PERFORMANCE_ISSUES.md](../../raw/sources/docs/PERFORMANCE_ISSUES.md)
- [PERFORMANCE_FIX_PLAN_2026.md](../../raw/sources/docs/PERFORMANCE_FIX_PLAN_2026.md) through [PERFORMANCE_FIX_PLAN_2026_ROUND8.md](../../raw/sources/docs/PERFORMANCE_FIX_PLAN_2026_ROUND8.md)
- [PERFORMANCE_FIX_AGENT_PROMPTS.md](../../raw/sources/docs/PERFORMANCE_FIX_AGENT_PROMPTS.md) through [PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND8.md](../../raw/sources/docs/PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND8.md)
- [HIGHLIGHTS_SCROLL_PERFORMANCE_ISSUE.md](../../raw/sources/docs/HIGHLIGHTS_SCROLL_PERFORMANCE_ISSUE.md), [HIGHLIGHTS_SCROLL_PERFORMANCE_AGENT_PROMPTS.md](../../raw/sources/docs/HIGHLIGHTS_SCROLL_PERFORMANCE_AGENT_PROMPTS.md)
- [IMAGE_PERFORMANCE_AUDIT.md](../../raw/sources/docs/IMAGE_PERFORMANCE_AUDIT.md), [IMAGE_FIX_AGENT_PROMPTS.md](../../raw/sources/docs/IMAGE_FIX_AGENT_PROMPTS.md), [IMAGE_LAZY_REVERT_PROMPTS.md](../../raw/sources/docs/IMAGE_LAZY_REVERT_PROMPTS.md)

### Customer redesign & UX

- [CUSTOMER_REDESIGN_PLAN_2026.md](../../raw/sources/docs/CUSTOMER_REDESIGN_PLAN_2026.md)
- [CUSTOMER_REDESIGN_AGENT_PROMPTS_2026.md](../../raw/sources/docs/CUSTOMER_REDESIGN_AGENT_PROMPTS_2026.md)
- [CUSTOMER_REDESIGN_BUGFIX_PROMPTS_2026.md](../../raw/sources/docs/CUSTOMER_REDESIGN_BUGFIX_PROMPTS_2026.md) … **ROUND2** … **ROUND6** (same prefix family)
- [CUSTOMER_UX_FIXES_PLAN_2026.md](../../raw/sources/docs/CUSTOMER_UX_FIXES_PLAN_2026.md), [CUSTOMER_UX_FIXES_AGENT_PROMPTS_2026.md](../../raw/sources/docs/CUSTOMER_UX_FIXES_AGENT_PROMPTS_2026.md)
- [CUSTOMER_UX_IMPROVEMENTS_PLAN_2026.md](../../raw/sources/docs/CUSTOMER_UX_IMPROVEMENTS_PLAN_2026.md), [CUSTOMER_UX_IMPROVEMENTS_AGENT_PROMPTS_2026.md](../../raw/sources/docs/CUSTOMER_UX_IMPROVEMENTS_AGENT_PROMPTS_2026.md)

### Admin / customer split & settings & product section

- [ADMIN_CUSTOMER_SPLIT_PLAN_2026.md](../../raw/sources/docs/ADMIN_CUSTOMER_SPLIT_PLAN_2026.md), [ADMIN_CUSTOMER_SPLIT_AGENT_PROMPTS_2026.md](../../raw/sources/docs/ADMIN_CUSTOMER_SPLIT_AGENT_PROMPTS_2026.md)
- [SETTINGS_REDESIGN_PLAN_2026.md](../../raw/sources/docs/SETTINGS_REDESIGN_PLAN_2026.md), [SETTINGS_REDESIGN_AGENT_PROMPTS_2026.md](../../raw/sources/docs/SETTINGS_REDESIGN_AGENT_PROMPTS_2026.md)
- [PRODUCT_SECTION_ENHANCEMENTS.md](../../raw/sources/docs/PRODUCT_SECTION_ENHANCEMENTS.md), [PRODUCT_SECTION_AGENT_PROMPTS.md](../../raw/sources/docs/PRODUCT_SECTION_AGENT_PROMPTS.md)

### Feature implementation & Next.js & Herbs

- [FEATURE_IMPLEMENTATION_PLAN_2026.md](../../raw/sources/docs/FEATURE_IMPLEMENTATION_PLAN_2026.md), [FEATURE_IMPLEMENTATION_AGENT_PROMPTS_2026.md](../../raw/sources/docs/FEATURE_IMPLEMENTATION_AGENT_PROMPTS_2026.md)
- [NEXTJS_MIGRATION_PLAN_2026.md](../../raw/sources/docs/NEXTJS_MIGRATION_PLAN_2026.md), [NEXTJS_MIGRATION_AGENT_PROMPTS_2026.md](../../raw/sources/docs/NEXTJS_MIGRATION_AGENT_PROMPTS_2026.md)
- [HERBS_MIGRATION_QUICKSTART.md](../../raw/sources/docs/HERBS_MIGRATION_QUICKSTART.md), [HERBS_IMAGES_SOURCES.md](../../raw/sources/docs/HERBS_IMAGES_SOURCES.md), [HERBS_BLOG_POSTS_DATA.md](../../raw/sources/docs/HERBS_BLOG_POSTS_DATA.md), [COMPLETE_HERBS_PRODUCT_DATA.md](../../raw/sources/docs/COMPLETE_HERBS_PRODUCT_DATA.md)

### Misc

- [UNUSED_CODE.md](../../raw/sources/docs/UNUSED_CODE.md)

## Integrated wiki pages

- [[wiki/entities/asf-2]]
- [[wiki/concepts/context-provider-architecture-asf-2]]
- [[wiki/concepts/asf-2-documentation-index-gaps]]

## Contradictions / open tension

- **Root README vs docs README:** [root/README.md](../../raw/sources/root/README.md) is **Create React App** boilerplate; [docs/README.md](../../raw/sources/docs/README.md) describes **Vite** and the real stack—treat docs as authoritative for ASF-2.
- **Docs index links:** [docs/README.md](../../raw/sources/docs/README.md) references module markdown files that are **missing** from the tree; see [[wiki/concepts/asf-2-documentation-index-gaps]].

## Follow-ups

- Ingest **non-markdown** `docs/` artifacts (SQL seeds, etc.) only if you copy them into `raw/` and extend schema; this batch was **markdown only**.
- Enrich any shallow **Summary** lines on `doc-*` pages (some docs jump straight from `#` to `##` with no paragraph) after a deep read or targeted ingest pass.
