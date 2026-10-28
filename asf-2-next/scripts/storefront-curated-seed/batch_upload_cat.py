#!/usr/bin/env python3
"""Upload generated packshots for a category from spec + assets dir."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ASSETS_DIR = Path("/Users/stanley/.cursor/projects/Users-stanley-Documents-GIthub-asf-2/assets")
UPLOAD = SCRIPT_DIR / "upload_product_media.py"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("category", help="Two-digit category, e.g. 01")
    args = parser.parse_args()
    cat = args.category.zfill(2)
    spec_path = SCRIPT_DIR / f"cat{cat}_media_spec.json"
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    uploaded = 0
    skipped = 0
    for entry in spec:
        local = ASSETS_DIR / entry["filename"]
        if not local.exists():
            skipped += 1
            continue
        cmd = [
            sys.executable,
            str(UPLOAD),
            str(local),
            entry["productId"],
            entry["mediaId"],
            "--category",
            cat,
        ]
        if entry.get("isFallback"):
            cmd.append("--fallback")
        else:
            if entry.get("hex"):
                cmd.extend(["--hex", entry["hex"]])
            if entry.get("colorId"):
                cmd.extend(["--color-id", entry["colorId"]])
        subprocess.run(cmd, check=True)
        uploaded += 1
    print(f"Uploaded {uploaded}, skipped {skipped} (missing PNG)")


if __name__ == "__main__":
    main()
