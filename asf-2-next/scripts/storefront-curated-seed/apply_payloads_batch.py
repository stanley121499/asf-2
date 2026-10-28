#!/usr/bin/env python3
"""Apply category payloads from mcp-payloads/*.json via Supabase MCP execute_sql.

Reads JSON payloads and prints instructions. Actual apply is done by coordinator
calling Supabase MCP apply_migration with printed name + query.

Usage:
  python3 apply_payloads_batch.py 6 7 8
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

PAYLOAD_DIR = Path(__file__).resolve().parent / "mcp-payloads"


def load(cat: int) -> dict[str, str]:
    return json.loads((PAYLOAD_DIR / f"cat{cat:02d}.json").read_text(encoding="utf-8"))


def main() -> None:
    cats = [int(a) for a in sys.argv[1:]]
    for cat in cats:
        data = load(cat)
        out = Path(__file__).resolve().parent / ".tmp" / f"_apply_ready_cat{cat:02d}.json"
        out.write_text(json.dumps({"name": data["name"], "query": data["query"]}, ensure_ascii=False))
        print(f"cat{cat:02d}: {data['name']} -> {out} ({len(data['query'])} bytes)")


if __name__ == "__main__":
    main()
