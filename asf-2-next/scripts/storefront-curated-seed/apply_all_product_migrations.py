#!/usr/bin/env python3
"""Apply all product category SQL payloads via Supabase MCP execute_sql pattern.

Reads stripped SQL from apply-payloads/ and prints one file path per line for batch apply.
Run manually or pipe to coordinator MCP apply_migration calls.
"""

from __future__ import annotations

from pathlib import Path

PAYLOAD_DIR = Path(__file__).resolve().parent / "apply-payloads"
CATEGORIES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12]


def main() -> None:
    for cat in CATEGORIES:
        path = PAYLOAD_DIR / f"cat{cat:02d}.sql"
        if not path.exists():
            raise SystemExit(f"Missing payload: {path}")
        print(f"cat{cat:02d}|{path}|{path.stat().st_size}")


if __name__ == "__main__":
    main()
