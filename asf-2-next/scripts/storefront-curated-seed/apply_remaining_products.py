#!/usr/bin/env python3
"""Apply remaining product category payloads via Supabase execute_sql HTTP bridge.

Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in environment
(from asf-2-next/.env.local). Uses PostgREST is unavailable for raw SQL — this
script prints instructions for coordinator MCP apply_migration instead.

Usage:
  python3 apply_remaining_products.py           # list pending
  python3 apply_remaining_products.py --cat 4   # print SQL path for cat
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
TMP = SCRIPT_DIR / ".tmp"
PENDING = [3, 4, 5, 6, 7, 8]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cat", type=int, default=0)
    args = parser.parse_args()

    cats = [args.cat] if args.cat else PENDING
    for cat in cats:
        payload = json.loads((TMP / f"apply_{cat:02d}.json").read_text(encoding="utf-8"))
        sql_path = TMP / f"cat{cat:02d}_exact.sql"
        sql_path.write_text(payload["query"], encoding="utf-8")
        print(f"cat{cat:02d}|{payload['name']}|{sql_path}|{len(payload['query'])}")


if __name__ == "__main__":
    main()
