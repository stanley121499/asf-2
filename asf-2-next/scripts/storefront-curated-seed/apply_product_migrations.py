#!/usr/bin/env python3
"""Print migration apply instructions for Supabase MCP (Agents 03-14).

Run each stripped SQL file via Supabase MCP apply_migration or execute_sql.
Usage: python3 apply_product_migrations.py [--cat 01]
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
MIGRATIONS = REPO_ROOT / "supabase" / "migrations"


def strip_sql(path: Path) -> str:
    return re.sub(r"--[^\n]*", "", path.read_text(encoding="utf-8")).strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cat", type=int, help="Category number 1-12")
    args = parser.parse_args()

    cats = [args.cat] if args.cat else list(range(1, 13))
    for cat in cats:
        path = MIGRATIONS / f"20260825_expo_customer_storefront_curated_products_cat{cat:02d}.sql"
        if not path.exists():
            raise SystemExit(f"Missing {path}")
        sql = strip_sql(path)
        print(f"=== cat{cat:02d} ({len(sql)} bytes) ===")
        print(f"name: expo_customer_storefront_curated_products_cat{cat:02d}")
        print(sql[:200] + "...")


if __name__ == "__main__":
    main()
