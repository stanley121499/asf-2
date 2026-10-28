#!/usr/bin/env python3
"""Generate taxonomy media_url UPDATE SQL from uploaded URLs JSON."""

from __future__ import annotations

import json
import sys
from pathlib import Path

TABLE_MAP = {
    "departments": "departments",
    "ranges": "ranges",
    "categories": "categories",
    "brand": "brand",
}


def main() -> None:
    urls_path = Path(__file__).resolve().parent / ".tmp" / "taxonomy_urls.json"
    if not urls_path.exists():
        print(f"Missing {urls_path}", file=sys.stderr)
        sys.exit(1)

    entries = json.loads(urls_path.read_text(encoding="utf-8"))
    lines: list[str] = []
    for entry in entries:
        table = TABLE_MAP[entry["type"]]
        node_id = entry["id"]
        url = entry["url"].replace("'", "''")
        lines.append(
            f"UPDATE public.{table} SET media_url = '{url}' "
            f"WHERE id = '{node_id}';"
        )

    out = Path(__file__).resolve().parents[2] / "supabase" / "migrations" / "20260825120000_expo_customer_storefront_curated_taxonomy_media.sql"
    sql = "-- Agent 15: taxonomy tile media_url updates\n\n" + "\n".join(lines) + "\n"
    out.write_text(sql, encoding="utf-8")
    print(f"Wrote {len(lines)} UPDATEs to {out}")


if __name__ == "__main__":
    main()
