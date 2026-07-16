# asf-vault — wiki index

Compounding personal/team knowledge wiki maintained by an LLM per [[CLAUDE.md]]. Raw sources stay under `raw/`; synthesized pages under `wiki/`.

## Overview

- [[wiki/00-overview]] — what this vault is and how to use it

## Concepts

- [[wiki/concepts/llm-wiki-pattern]] — persistent wiki vs one-shot RAG; three layers; operations (ingest, query, lint)
- [[wiki/concepts/rag-vs-compounding-knowledge]] — why retrieval alone does not accumulate structure
- [[wiki/concepts/context-provider-architecture-asf-2]] — ASF-2 ProviderComposer / 35+ contexts
- [[wiki/concepts/asf-2-documentation-index-gaps]] — docs README links vs files present in `raw/sources/docs/`
- [[wiki/concepts/production-readiness-asf-2]] — gap analysis and execution plan for taking ASF-2 to production (updated 2026-04-13)
- [[wiki/concepts/mobile-app-architecture-asf-2]] — Expo+RN decision, RBAC, push notifications, staff+customer app design
- [[wiki/concepts/customer-i18n-asf-2]] — trilingual zh-CN/en/ms customer i18n: Expo shipped; translation tables; Next stashed
- [[wiki/concepts/store-locations-feature-asf-2]] — physical store locator: routes, RLS, API vs direct Supabase patterns, feature flag
- [[wiki/concepts/pixel2motion-splash-asf-2]] — animated cold-start splash: Pixel2Motion → WebView bundle, both Expo apps, regeneration workflow
- [[wiki/concepts/post-purchase-claims-module-asf-2]] — modular post-purchase claims: config-driven policy, feature flag, customer order entry + staff queue

## Entities

- [[wiki/entities/asf-2]] — ASF-2 e-commerce / social platform (stack, active codebases, production status, roadmap pointers)

## Sources — 2026-07-16 Expo Malay locale (3 new)

- [[wiki/sources/2026-07-16-expo-customer-ms-locale-session-accomplishment]] — Session outcome SOT: `ms` shipped on Expo; DB CHECK + Malay seed; Agents 1–9
- [[wiki/sources/2026-07-16-expo-customer-ms-locale-plan]] — Plan: `ms` / `ms-MY`, overlay generalization, seed strategy
- [[wiki/sources/2026-07-16-expo-customer-ms-locale-agent-prompts]] — Agents 1–9 prompts (executed)

## Sources — 2026-07-08 customer i18n (5 new)

- [[wiki/sources/2026-07-08-customer-i18n-session-accomplishment]] — Session outcome SOT: Expo bilingual shipped; DB tables seeded; Next i18n stashed; phone vs WebView discovery
- [[wiki/sources/2026-07-08-expo-customer-i18n-plan]] — Expo plan: AsyncStorage, ContentTranslation, no ProductContext RPC
- [[wiki/sources/2026-07-08-expo-customer-i18n-agent-prompts]] — Expo Agents 1–10 prompts (executed)
- [[wiki/sources/2026-07-08-customer-i18n-plan]] — Original Next.js i18n plan (web parity / SQL+RPC reference)
- [[wiki/sources/2026-07-08-customer-i18n-agent-prompts]] — Next.js Agents 1–11 prompts (stashed implementation)

## Sources — 2026-06-26 post-purchase claims (1 new)

- [[wiki/sources/2026-06-26-post-purchase-claims-module]] — Reusable claims module: feature flag, DB schema, policy config, customer/staff flows, shoe-store defaults, portability pattern

## Sources — 2026-06-26 pixel2motion splash (1 new)

- [[wiki/sources/2026-06-26-pixel2motion-model-match-splash]] — MODEL MATCH animated splash: Pixel2Motion setup, 7 variations, letter cascade shipped on customer + staff Expo apps via WebView

## Sources — 2026-06-26 store locations (1 new)

- [[wiki/sources/2026-06-26-store-locations-feature]] — Store locator across web + both mobile apps; DB migration, route conflict fix (`/stores` vs `/store-locations`), testing, deploy gaps

## Sources — 2026-04-25 mobile apps progress (1 new)

- [[wiki/sources/2026-04-25-mobile-apps-progress]] — Both Expo mobile apps built + functional; schema corrections (products.status, product_stock.count); expo-router tab lessons; next priority: demo data
- [[wiki/sources/2026-04-25-demo-data-plan]] — KK Mart/99 Speed Mart style Malaysia minimart demo data plan; 50 products, 7 categories, 10 brands, SQL schema facts

## Sources — 2026-04-13 planning session (5 new)

- [[wiki/sources/2026-04-13-production-roadmap]] — Full production roadmap: architecture, 8 phases, environment vars, timeline
- [[wiki/sources/2026-04-13-user-flow-audit]] — Code-level audit of all routes in `asf-2-next`; working/broken/missing flows for customer + admin
- [[wiki/sources/2026-04-13-immediate-execution-plan]] — 12-step plan (~15 days) to get everything working with real data
- [[wiki/sources/2026-04-13-mobile-app-strategy]] — Expo vs Flutter decision, staff+customer app design, push notifications
- [[wiki/sources/2026-04-13-delyva-delivery-integration]] — Delyva API, sandbox testing, seller workflow, status codes

## Sources — meta & corpus overview

- [[wiki/sources/llm-wiki-idea]] — `raw/sources/llm-wiki-idea.md` (LLM Wiki pattern document)
- [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] — thematic overview + contradictions for the whole docs/root README mirror (use alongside per-file pages below)

## Sources — ASF-2 docs (one wiki page per raw file, 66)

Each entry satisfies [[CLAUDE.md]] ingest step: `wiki/sources/<slug>.md` per raw file, with summary, outline, wikilinks, and open-questions placeholder.

- [[wiki/sources/doc-admin-customer-split-agent-prompts-2026]] — Admin / Customer Split — Agent Prompts 2026 — raw: `ADMIN_CUSTOMER_SPLIT_AGENT_PROMPTS_2026.md`
- [[wiki/sources/doc-admin-customer-split-plan-2026]] — Admin / Customer Code Split Plan — 2026 — raw: `ADMIN_CUSTOMER_SPLIT_PLAN_2026.md`
- [[wiki/sources/doc-admin-panel]] — Admin Panel Documentation — raw: `ADMIN_PANEL.md`
- [[wiki/sources/doc-ai-agent-prompts]] — AI Agent Prompts for ASF-2 Project Fixes — raw: `AI_AGENT_PROMPTS.md`
- [[wiki/sources/doc-architecture]] — System Architecture — raw: `ARCHITECTURE.md`
- [[wiki/sources/doc-complete-herbs-product-data]] — Complete Medicinal Herbs Product Data Sheet — raw: `COMPLETE_HERBS_PRODUCT_DATA.md`
- [[wiki/sources/doc-contexts]] — React Context Providers Documentation — raw: `CONTEXTS.md`
- [[wiki/sources/doc-critical-bugs]] — Critical Bugs & Issues — raw: `CRITICAL_BUGS.md`
- [[wiki/sources/doc-customer-facing]] — Customer-Facing Pages Documentation — raw: `CUSTOMER_FACING.md`
- [[wiki/sources/doc-customer-redesign-agent-prompts-2026]] — Customer App — Full Redesign Agent Prompts (2026) — raw: `CUSTOMER_REDESIGN_AGENT_PROMPTS_2026.md`
- [[wiki/sources/doc-customer-redesign-bugfix-prompts-2026]] — Customer App — Bug Fix Agent Prompts (Round 2, March 2026) — raw: `CUSTOMER_REDESIGN_BUGFIX_PROMPTS_2026.md`
- [[wiki/sources/doc-customer-redesign-bugfix-prompts-2026-round2]] — Customer App — Bug Fix Agent Prompts Round 2 (March 2026) — raw: `CUSTOMER_REDESIGN_BUGFIX_PROMPTS_2026_ROUND2.md`
- [[wiki/sources/doc-customer-redesign-bugfix-prompts-2026-round3]] — Customer App — Fix Prompts Round 3 (March 2026) — raw: `CUSTOMER_REDESIGN_BUGFIX_PROMPTS_2026_ROUND3.md`
- [[wiki/sources/doc-customer-redesign-bugfix-prompts-2026-round4]] — Customer App — Fix Prompts Round 4 (March 2026) — raw: `CUSTOMER_REDESIGN_BUGFIX_PROMPTS_2026_ROUND4.md`
- [[wiki/sources/doc-customer-redesign-bugfix-prompts-2026-round5]] — Customer App — Fix Prompts Round 5 (March 2026) — raw: `CUSTOMER_REDESIGN_BUGFIX_PROMPTS_2026_ROUND5.md`
- [[wiki/sources/doc-customer-redesign-bugfix-prompts-2026-round6]] — Customer App — Fix Prompts Round 6 (March 2026) — raw: `CUSTOMER_REDESIGN_BUGFIX_PROMPTS_2026_ROUND6.md`
- [[wiki/sources/doc-customer-redesign-plan-2026]] — Customer App — Full UI/UX Redesign Plan (2026) — raw: `CUSTOMER_REDESIGN_PLAN_2026.md`
- [[wiki/sources/doc-customer-ux-fixes-agent-prompts-2026]] — Customer UX Fixes — Agent Prompts (March 2026) — raw: `CUSTOMER_UX_FIXES_AGENT_PROMPTS_2026.md`
- [[wiki/sources/doc-customer-ux-fixes-plan-2026]] — Customer UX Fixes — Plan (March 2026) — raw: `CUSTOMER_UX_FIXES_PLAN_2026.md`
- [[wiki/sources/doc-customer-ux-improvements-agent-prompts-2026]] — Customer UX Improvements — Agent Prompts (March 2026) — raw: `CUSTOMER_UX_IMPROVEMENTS_AGENT_PROMPTS_2026.md`
- [[wiki/sources/doc-customer-ux-improvements-plan-2026]] — Customer UX Improvements — Plan (March 2026) — raw: `CUSTOMER_UX_IMPROVEMENTS_PLAN_2026.md`
- [[wiki/sources/doc-database]] — Database Schema Documentation — raw: `DATABASE.md`
- [[wiki/sources/doc-deployment]] — Deployment Guide — raw: `DEPLOYMENT.md`
- [[wiki/sources/doc-development-guide]] — Development Guide — raw: `DEVELOPMENT_GUIDE.md`
- [[wiki/sources/doc-feature-implementation-agent-prompts-2026]] — Feature Implementation — Agent Prompts 2026 — raw: `FEATURE_IMPLEMENTATION_AGENT_PROMPTS_2026.md`
- [[wiki/sources/doc-feature-implementation-plan-2026]] — Feature Implementation Plan — 2026 — raw: `FEATURE_IMPLEMENTATION_PLAN_2026.md`
- [[wiki/sources/doc-features]] — Feature Inventory & Implementation Status — raw: `FEATURES.md`
- [[wiki/sources/doc-herbs-blog-posts-data]] — Medicinal Herbs Blog Post Data — raw: `HERBS_BLOG_POSTS_DATA.md`
- [[wiki/sources/doc-herbs-images-sources]] — Medicinal Herbs Product Images - Free Stock Photos — raw: `HERBS_IMAGES_SOURCES.md`
- [[wiki/sources/doc-herbs-migration-quickstart]] — Quick Start: Medicinal Herbs Data Migration — raw: `HERBS_MIGRATION_QUICKSTART.md`
- [[wiki/sources/doc-highlights-scroll-performance-agent-prompts]] — Highlights Page — Scroll & Image Performance Agent Prompts — raw: `HIGHLIGHTS_SCROLL_PERFORMANCE_AGENT_PROMPTS.md`
- [[wiki/sources/doc-highlights-scroll-performance-issue]] — Highlights Page — Scroll & Image Load Performance Issue — raw: `HIGHLIGHTS_SCROLL_PERFORMANCE_ISSUE.md`
- [[wiki/sources/doc-image-fix-agent-prompts]] — Image Performance Fix — Agent Prompts — raw: `IMAGE_FIX_AGENT_PROMPTS.md`
- [[wiki/sources/doc-image-lazy-revert-prompts]] — Image Fix — Revert to Native Lazy Loading — raw: `IMAGE_LAZY_REVERT_PROMPTS.md`
- [[wiki/sources/doc-image-performance-audit]] — Image Loading Performance Audit — raw: `IMAGE_PERFORMANCE_AUDIT.md`
- [[wiki/sources/doc-nextjs-migration-agent-prompts-2026]] — Next.js Migration — Agent Prompts 2026 — raw: `NEXTJS_MIGRATION_AGENT_PROMPTS_2026.md`
- [[wiki/sources/doc-nextjs-migration-plan-2026]] — Next.js Migration Plan — 2026 — raw: `NEXTJS_MIGRATION_PLAN_2026.md`
- [[wiki/sources/doc-performance-audit-2026]] — Performance Audit — ASF-2 React App — raw: `PERFORMANCE_AUDIT_2026.md`
- [[wiki/sources/doc-performance-fix-agent-prompts]] — Performance Fix — Agent Prompts — raw: `PERFORMANCE_FIX_AGENT_PROMPTS.md`
- [[wiki/sources/doc-performance-fix-agent-prompts-2026]] — Performance Fix Agent Prompts — ASF-2 (March 2026) — raw: `PERFORMANCE_FIX_AGENT_PROMPTS_2026.md`
- [[wiki/sources/doc-performance-fix-agent-prompts-2026-round2]] — Performance Fix Agent Prompts – Round 2 (2026) — raw: `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND2.md`
- [[wiki/sources/doc-performance-fix-agent-prompts-2026-round3]] — Performance Fix Agent Prompts — Round 3 (2026) — raw: `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND3.md`
- [[wiki/sources/doc-performance-fix-agent-prompts-2026-round4]] — Performance Fix Agent Prompts — Round 4 (2026) — raw: `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND4.md`
- [[wiki/sources/doc-performance-fix-agent-prompts-2026-round5]] — Performance Fix Agent Prompts — Round 5 (2026) — raw: `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND5.md`
- [[wiki/sources/doc-performance-fix-agent-prompts-2026-round6]] — Performance Fix Agent Prompts — Round 6 (2026) — raw: `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND6.md`
- [[wiki/sources/doc-performance-fix-agent-prompts-2026-round7]] — Performance Fix Agent Prompts — Round 7 (2026): Phone Heating — raw: `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND7.md`
- [[wiki/sources/doc-performance-fix-agent-prompts-2026-round8]] — Performance Fix Agent Prompts — Round 8 (2026): White Scroll Blank Sections — raw: `PERFORMANCE_FIX_AGENT_PROMPTS_2026_ROUND8.md`
- [[wiki/sources/doc-performance-fix-plan-2026]] — Performance Fix Plan — ASF-2 (March 2026) — raw: `PERFORMANCE_FIX_PLAN_2026.md`
- [[wiki/sources/doc-performance-fix-plan-2026-round2]] — Performance Fix Plan – Round 2 (2026) — raw: `PERFORMANCE_FIX_PLAN_2026_ROUND2.md`
- [[wiki/sources/doc-performance-fix-plan-2026-round3]] — Performance Fix Plan — Round 3 (2026) — raw: `PERFORMANCE_FIX_PLAN_2026_ROUND3.md`
- [[wiki/sources/doc-performance-fix-plan-2026-round4]] — Performance Fix Plan — Round 4 (2026) — raw: `PERFORMANCE_FIX_PLAN_2026_ROUND4.md`
- [[wiki/sources/doc-performance-fix-plan-2026-round5]] — Performance Fix Plan — Round 5 (2026) — raw: `PERFORMANCE_FIX_PLAN_2026_ROUND5.md`
- [[wiki/sources/doc-performance-fix-plan-2026-round6]] — Performance Fix Plan — Round 6 (2026) — raw: `PERFORMANCE_FIX_PLAN_2026_ROUND6.md`
- [[wiki/sources/doc-performance-fix-plan-2026-round7]] — Performance Fix Plan — Round 7 (2026): Phone Heating — raw: `PERFORMANCE_FIX_PLAN_2026_ROUND7.md`
- [[wiki/sources/doc-performance-fix-plan-2026-round8]] — Performance Fix Plan — Round 8 (2026): White/Blank Sections on Fast Scroll — raw: `PERFORMANCE_FIX_PLAN_2026_ROUND8.md`
- [[wiki/sources/doc-performance-issues]] — Performance Issues & Solutions — raw: `PERFORMANCE_ISSUES.md`
- [[wiki/sources/doc-product-section-agent-prompts]] — Product Section Enhancement — Agent Prompts — raw: `PRODUCT_SECTION_AGENT_PROMPTS.md`
- [[wiki/sources/doc-product-section-enhancements]] — Product Section Enhancements — raw: `PRODUCT_SECTION_ENHANCEMENTS.md`
- [[wiki/sources/doc-readme]] — ASF-2 Project Documentation — raw: `docs/README.md`
- [[wiki/sources/doc-repo-root-readme]] — Getting Started with Create React App — raw: `repo root README.md` (mirror at `raw/sources/root/README.md`)
- [[wiki/sources/doc-settings-redesign-agent-prompts-2026]] — Settings Page Redesign — Agent Prompts 2026 — raw: `SETTINGS_REDESIGN_AGENT_PROMPTS_2026.md`
- [[wiki/sources/doc-settings-redesign-plan-2026]] — Settings Page Redesign Plan — 2026 — raw: `SETTINGS_REDESIGN_PLAN_2026.md`
- [[wiki/sources/doc-setup]] — Development Environment Setup Guide — raw: `SETUP.md`
- [[wiki/sources/doc-soft-delete-strategy]] — Soft Delete Implementation Strategy — raw: `SOFT_DELETE_STRATEGY.md`
- [[wiki/sources/doc-testing-guide]] — Testing Guide — raw: `TESTING_GUIDE.md`
- [[wiki/sources/doc-unused-code]] — Unused Code & Dependencies — raw: `UNUSED_CODE.md`

## Syntheses

- _(none yet — file durable answers under `wiki/syntheses/` per [[CLAUDE.md]])_

## Raw layout quick reference

| Path | Contents |
|------|----------|
| `raw/sources/docs/` | Mirror of repo `/docs` markdown (65 files) |
| `raw/sources/root/README.md` | Mirror of repo root `README.md` |
| `raw/sources/llm-wiki-idea.md` | LLM Wiki pattern source |
| `raw/sources/2026-04-13-production-roadmap.md` | Full production roadmap (8 phases) |
| `raw/sources/2026-04-13-user-flow-audit.md` | User flow gap audit of `asf-2-next` |
| `raw/sources/2026-04-13-immediate-execution-plan.md` | 12-step execution plan |
| `raw/sources/2026-04-13-mobile-app-strategy.md` | Expo mobile app strategy |
| `raw/sources/2026-04-13-delyva-delivery-integration.md` | Delyva delivery API reference |
| `raw/sources/2026-04-25-mobile-apps-progress.md` | Mobile apps progress Apr 13–25; schema corrections; expo-router lessons |
| `raw/sources/2026-06-26-store-locations-feature.md` | Cross-platform store locator implementation |
| `raw/sources/2026-06-26-pixel2motion-model-match-splash.md` | Pixel2Motion MODEL MATCH animated splash pipeline |
| `raw/sources/2026-06-26-post-purchase-claims-module.md` | Post-purchase claims module (modular warranty/returns) |
