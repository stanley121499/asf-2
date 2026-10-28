#!/usr/bin/env python3
"""Generate SQL migration to UPDATE promotions.image_url from uploaded URLs."""

from __future__ import annotations

import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
URLS_PATH = SCRIPT_DIR / ".tmp" / "promo_media_urls.json"
OUT_DIR = SCRIPT_DIR.parent.parent / "supabase" / "migrations"


def main() -> None:
    if not URLS_PATH.exists():
        raise SystemExit(f"Missing {URLS_PATH} — run batch_upload_promos.py first")

    records = json.loads(URLS_PATH.read_text(encoding="utf-8"))
    lines = [
        "-- Agent 36: update promotions banner image_url",
        "",
    ]
    for rec in sorted(records, key=lambda r: r["promoId"]):
        url = rec["url"].replace("'", "''")
        promo_id = rec["promoId"]
        lines.append(
            f"UPDATE public.promotions SET image_url = '{url}' "
            f"WHERE id = '{promo_id}';"
        )
        lines.append("")

    out_path = OUT_DIR / "20260825150001_expo_customer_storefront_curated_promo_media.sql"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {out_path} ({len(records)} UPDATEs)")


if __name__ == "__main__":
    main()
