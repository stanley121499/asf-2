#!/usr/bin/env python3
"""Generate category product_medias UPDATE SQL and refresh manifest."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MIGRATIONS = ROOT.parent.parent / "supabase/migrations"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("category", help="Two-digit category, e.g. 01")
    args = parser.parse_args()
    cat = args.category.zfill(2)
    prefix = f"dddd{cat}"
    urls_path = ROOT / ".tmp" / f"product_media_urls_cat{cat}.json"
    manifest_path = ROOT / "manifest.json"
    cat_num = int(cat)
    ts = f"2026082513{cat_num:04d}00"
    migration = MIGRATIONS / f"{ts}_expo_customer_storefront_curated_media_cat{cat}.sql"

    if not urls_path.exists():
        print(f"Missing {urls_path}", file=sys.stderr)
        sys.exit(1)

    records = json.loads(urls_path.read_text(encoding="utf-8"))
    lines = [
        f"UPDATE public.product_medias SET media_url = '{r['url'].replace(chr(39), chr(39) * 2)}' "
        f"WHERE id = '{r['mediaId']}';"
        for r in records
    ]
    sql = f"-- Agent cat{cat} product_medias URLs\n\n" + "\n".join(lines) + "\n"
    migration.write_text(sql, encoding="utf-8")
    print(f"Wrote {len(lines)} UPDATEs to {migration}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for rec in records:
        pid = rec["productId"]
        if not pid.startswith(prefix):
            continue
        spec = manifest["products"][pid]
        if rec.get("isFallback"):
            spec["fallbackUrl"] = rec["url"]
            continue
        color_id = rec.get("colorId")
        if color_id:
            for cw in spec["colorways"]:
                if cw["colorId"] == color_id:
                    cw["url"] = rec["url"]
                    cw["qc"] = rec["qc"]

    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated manifest for cat{cat} ({len(records)} media rows)")


if __name__ == "__main__":
    main()
