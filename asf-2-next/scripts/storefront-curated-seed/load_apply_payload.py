#!/usr/bin/env python3
"""Load migration payload from .tmp/apply_XX.json and print SQL to stdout."""

from __future__ import annotations

import json
import sys
from pathlib import Path

TMP = Path(__file__).resolve().parent / ".tmp"


def main() -> None:
    cat = int(sys.argv[1])
    data = json.loads((TMP / f"apply_{cat:02d}.json").read_text(encoding="utf-8"))
    if len(sys.argv) > 2 and sys.argv[2] == "meta":
        print(data["name"])
        return
    sys.stdout.write(data["query"])


if __name__ == "__main__":
    main()
