#!/usr/bin/env python3
"""Generate SQL migration to UPDATE post_medias URLs from uploaded URLs."""

from __future__ import annotations

import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
URLS_PATH = SCRIPT_DIR / ".tmp" / "post_media_urls.json"
OUT_DIR = SCRIPT_DIR.parent.parent / "supabase" / "migrations"


def main() -> None:
    if not URLS_PATH.exists():
        raise SystemExit(f"Missing {URLS_PATH} — run batch_upload_posts.py first")

    records = json.loads(URLS_PATH.read_text(encoding="utf-8"))
    lines = [
        "-- Agent 32-35: update post_medias editorial URLs",
        "",
    ]
    for rec in sorted(records, key=lambda r: r["postId"]):
        url = rec["url"].replace("'", "''")
        post_id = rec["postId"]
        lines.append(
            f"UPDATE public.post_medias SET media_url = '{url}' "
            f"WHERE post_id = '{post_id}' AND arrangement = 1;"
        )
        lines.append("")

    out_path = OUT_DIR / "20260825150000_expo_customer_storefront_curated_post_media.sql"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {out_path} ({len(records)} UPDATEs)")


if __name__ == "__main__":
    main()
