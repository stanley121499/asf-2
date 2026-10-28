#!/usr/bin/env python3
"""Apply storefront curated product migrations via Supabase MCP-compatible batch.

Reads .tmp/apply_XX.json files and prints migration name + query length.
The coordinator should call apply_migration for each file.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

TMP = Path(__file__).resolve().parent / ".tmp"


def main() -> None:
    cats = [int(a) for a in sys.argv[1:]] if len(sys.argv) > 1 else [2, 3, 4, 5, 6, 7, 8, 10, 11, 12]
    for cat in cats:
        path = TMP / f"apply_{cat:02d}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        sys.stdout.write(f"APPLY {cat:02d} {data['name']} {len(data['query'])}\n")


if __name__ == "__main__":
    main()
