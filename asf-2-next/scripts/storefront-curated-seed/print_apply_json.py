#!/usr/bin/env python3
"""Print apply_migration JSON for a category (for coordinator MCP apply)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

TMP = Path(__file__).resolve().parent / ".tmp"


def main() -> None:
    cat = int(sys.argv[1])
    data = json.loads((TMP / f"apply_{cat:02d}.json").read_text(encoding="utf-8"))
    print(json.dumps({"name": data["name"], "query": data["query"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
