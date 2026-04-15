# LLM Wiki — Agent schema (source of truth)

This file defines how the LLM operates inside **asf-vault**. It takes precedence over generic assistant defaults. On **every** conversation turn, apply these rules before acting: treat this document as the contract for ingest, query, lint, logging, and file layout.

---

## 1. Purpose

You maintain a **compounding knowledge wiki**: structured, interlinked markdown owned by the LLM, built from **immutable raw sources** curated by the human. The goal is persistent synthesis and cross-references—not one-off RAG answers with no accumulation.

---

## 2. Directory layout (vault root = `asf-vault/`)

| Path | Role | LLM may write? |
|------|------|----------------|
| `raw/sources/` | Text sources (articles, notes, transcripts, clipped pages) | **No** — read only |
| `raw/assets/` | Images and binary attachments referenced from sources | **No** — read only |
| `wiki/` | All wiki pages (entities, concepts, source summaries, syntheses) | **Yes** |
| `index.md` | Content-oriented catalog of wiki pages | **Yes** |
| `log.md` | Append-only chronological activity log | **Yes** (append only; never delete or rewrite history) |
| `CLAUDE.md` | This schema | **Yes** — only when the human asks to evolve conventions |

**Folder conventions**

- New **sources** go under `raw/sources/`. Use descriptive filenames: `YYYY-MM-DD-slug.md` when a date matters; otherwise `slug.md`.
- **Attachments** for clipped web content live under `raw/assets/` (Obsidian can be configured to download here).
- **Wiki pages** live under `wiki/` with subfolders by kind (see below). Prefer lowercase, hyphenated filenames: `wiki/concepts/llm-wiki-pattern.md`.

**Wiki subfolders (use as appropriate)**

- `wiki/concepts/` — ideas, patterns, frameworks
- `wiki/entities/` — people, orgs, products, named projects
- `wiki/sources/` — one page per ingested source: summary, key claims, links to concepts/entities
- `wiki/syntheses/` — comparisons, theses, analyses produced from multiple pages or queries
- `wiki/meta/` — vault operations (optional; use sparingly)

Add new subfolders only if the human agrees or if an existing ingest clearly needs them; document new top-level areas in a log entry.

---

## 3. Immutability and truth

- **Raw layer** (`raw/**`) is the human’s source of truth. You **never** edit, move, or delete files under `raw/`. If something is wrong, you note it on a wiki page or ask the human to fix the file.
- **Wiki layer** is your responsibility: keep it consistent, linked, and updated when new sources arrive or when answers should be filed.

---

## 4. Links, titles, and frontmatter

- Use **Obsidian wikilinks** for wiki-to-wiki navigation: `[[wiki/concepts/example]]` (no `.md` in link is fine in Obsidian).
- When linking to a source file for human reference, use standard markdown links to the path: `[label](raw/sources/file.md)`.
- Optional **YAML frontmatter** on wiki pages (recommended for Dataview later):

```yaml
---
title: "Page title"
type: concept | entity | source | synthesis | overview
updated: YYYY-MM-DD
sources: 0
tags: [tag-one, tag-two]
---
```

- **`updated`**: set to the calendar date of the last substantive edit (ingest or lint fix).
- **`sources`**: for non-source pages, approximate count of distinct raw sources that materially support the page (optional).

---

## 5. Workflow: Ingest

**Trigger:** Human adds a file under `raw/` (or asks to process an existing path) and requests ingest.

**Steps (complete all that apply in one coherent pass unless the human asks to split work):**

1. **Read** the new source (and linked assets if images are critical to meaning).
2. **Discuss** briefly with the human if needed: ambiguities, sensitivity, what to emphasize.
3. **Create or update wiki pages:**
   - Add `wiki/sources/<slug>.md` summarizing the source, key claims, open questions, and wikilinks to related `wiki/concepts/` and `wiki/entities/` pages (create stubs if missing).
   - Update or create **concept/entity** pages affected by the new information; note **contradictions** with prior wiki text explicitly (section “Contradictions / open tension” when needed).
4. **Update** `wiki/00-overview.md` if the vault’s scope or high-level picture changed.
5. **Update** `index.md`: add or refresh entries (link, one-line summary, optional metadata).
6. **Append** `log.md` with a new section (see log format below).

**Scope:** A single source often touches multiple wiki files; updating several pages in one ingest is expected.

---

## 6. Workflow: Query

**Trigger:** Human asks a question.

**Steps:**

1. Read **`index.md`** first to locate relevant wiki pages.
2. Open the **most relevant** wiki pages (and only then raw sources if the wiki is insufficient or the human wants primary text).
3. **Answer** with citations: wikilinks and/or paths to `raw/sources/...` where claims come from.
4. If the answer is **durable** (comparison, analysis, reusable synthesis), ask whether to **file** it under `wiki/syntheses/`; if the human agrees, create the page and update `index.md` and `log.md`.

---

## 7. Workflow: Lint

**Trigger:** Human requests a wiki health pass (or periodic maintenance).

**Checklist (report findings, then fix wiki with human approval for large restructures):**

- Contradictions between pages; mark resolutions or “open tension” sections.
- Stale claims vs newer `wiki/sources/` or raw material.
- **Orphan** wiki pages with no inbound wikilinks (add links from index, overview, or related pages).
- Important terms **without** concept pages (create stubs or full pages).
- **Missing cross-references** between related notes.
- **Gaps** answerable by web search or new sources (suggest next ingests).

Append a summary to **`log.md`**.

---

## 8. `index.md` format

Maintain a **human- and LLM-readable catalog**. Suggested structure (adapt as the vault grows):

- Short intro line: what this vault covers.
- Sections by type: Overview, Concepts, Entities, Sources, Syntheses.
- Each entry: `- [[wiki/path/to/page]] — one-line summary`  
  Optional: ` (updated: YYYY-MM-DD)` or source count.

Update `index.md` on **every ingest** and whenever new synthesis pages are added.

---

## 9. `log.md` format (append-only)

Each entry is a **level-2 heading** with a consistent prefix for grepping:

```markdown
## [YYYY-MM-DD] ingest | Short title
- Source: `raw/sources/file.md`
- Wiki touched: [[wiki/sources/...]], [[wiki/concepts/...]], ...
- Notes: one line

## [YYYY-MM-DD] query | Short label
- Question summary (no secrets)
- Outcome: answer filed / not filed; pages read

## [YYYY-MM-DD] lint | Pass
- Findings: ...
- Actions: ...
```

**Rules:** Never remove or rewrite past log sections. Only **append**.

---

## 10. Optional tooling (future)

If the wiki grows large, the human may add local search (e.g. qmd) or scripts. Document new tools here when introduced.

---

## 11. Session behavior (every interaction)

1. Obey **immutability** for `raw/**`.
2. For **ingest / query / lint**, follow the workflows above.
3. Keep **index.md** and **log.md** accurate for operations you perform.
4. Prefer **small, focused** wiki pages and explicit **contradiction** handling over silent overwriting.
5. If instructions conflict, **this file wins** unless the human explicitly overrides for that turn.

---

## 12. Human-facing entry

The human opens **`Welcome.md`** or **`wiki/00-overview.md`** for orientation. You keep **`wiki/00-overview.md`** aligned with the current state of the vault.
