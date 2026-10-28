#!/usr/bin/env python3
"""Print apply_migration JSON for a category payload (stdout). Usage: apply_via_mcp_helper.py 6"""

from __future__ import annotations

import json
import sys
from pathlib import Path

PAYLOAD_DIR = Path(__file__).resolve().parent / "mcp-payloads"


def main() -> None:
    cat = int(sys.argv[1])
    data = json.loads((PAYLOAD_DIR / f"cat{cat:02d}.json").read_text(encoding="utf-8"))
    print(json.dumps({"name": data["name"], "query": data["query"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
