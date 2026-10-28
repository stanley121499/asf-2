#!/usr/bin/env python3
"""Emit apply_migration payloads as JSON lines for coordinator batch apply."""

from __future__ import annotations

import json
import sys
from pathlib import Path

PAYLOAD_DIR = Path(__file__).resolve().parent / "mcp-payloads"
CATEGORIES = [2, 3, 4, 5, 6, 7, 8, 10, 11, 12]


def main() -> None:
    cats = [int(a) for a in sys.argv[1:]] if len(sys.argv) > 1 else CATEGORIES
    for cat in cats:
        path = PAYLOAD_DIR / f"cat{cat:02d}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        print(json.dumps({"cat": cat, "name": data["name"], "query": data["query"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
