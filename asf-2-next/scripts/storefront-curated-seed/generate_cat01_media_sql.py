#!/usr/bin/env python3
"""Generate cat01 product_medias UPDATE SQL and refresh manifest."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
URLS_PATH = ROOT / ".tmp" / "product_media_urls_cat01.json"
MANIFEST_PATH = ROOT / "manifest.json"
MIGRATION = ROOT.parent.parent / "supabase/migrations/20260825130000_expo_customer_storefront_curated_media_cat01.sql"


def main() -> None:
    if not URLS_PATH.exists():
        print(f"Missing {URLS_PATH}", file=sys.stderr)
        sys.exit(1)

    records = json.loads(URLS_PATH.read_text(encoding="utf-8"))
    lines = [
        f"UPDATE public.product_medias SET media_url = '{r['url'].replace(chr(39), chr(39)*2)}' "
        f"WHERE id = '{r['mediaId']}';"
        for r in records
    ]
    sql = "-- Agent 16: cat01 跑鞋 product_medias URLs\n\n" + "\n".join(lines) + "\n"
    MIGRATION.write_text(sql, encoding="utf-8")
    print(f"Wrote {len(lines)} UPDATEs to {MIGRATION}")

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    by_media = {r["mediaId"]: r for r in records}
    for product_id, spec in manifest["products"].items():
        if not product_id.startswith("dddd01"):
            continue
        fallback_url = ""
        for cw in spec["colorways"]:
            for rec in records:
                if rec.get("colorId") == cw["colorId"]:
                    cw["url"] = rec["url"]
                    cw["qc"] = rec["qc"]
        for rec in records:
            if rec["productId"] == product_id and rec.get("isFallback"):
                spec["fallbackUrl"] = rec["url"]
        # map colorways by colorId from records
        for rec in records:
            if rec["productId"] != product_id or rec.get("isFallback"):
                continue
            hex_val = rec.get("hex") or ""
            for cw in spec["colorways"]:
                if cw["hex"].upper() == str(hex_val).upper():
                    cw["url"] = rec["url"]
                    cw["qc"] = rec["qc"]
            if rec.get("isFallback"):
                spec["fallbackUrl"] = rec["url"]

    # second pass using explicit colorId in records if present
    for rec in records:
        pid = rec["productId"]
        if not pid.startswith("dddd01"):
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

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated manifest for cat01 ({len(records)} media rows)")


if __name__ == "__main__":
    main()
