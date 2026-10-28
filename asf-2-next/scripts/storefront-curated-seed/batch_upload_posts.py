#!/usr/bin/env python3
"""Upload generated post editorial images from post_media_spec.json."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ASSETS_DIR = Path("/Users/stanley/.cursor/projects/Users-stanley-Documents-GIthub-asf-2/assets")
UPLOAD = SCRIPT_DIR / "upload_post_media.py"
SPEC = SCRIPT_DIR / "post_media_spec.json"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--from", dest="from_idx", type=int, default=1, help="Start post index (1-based)")
    parser.add_argument("--to", dest="to_idx", type=int, default=10, help="End post index (1-based)")
    args = parser.parse_args()

    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    uploaded = 0
    skipped = 0
    for entry in spec:
        idx = int(entry["postId"].split("-")[-1])
        if idx < args.from_idx or idx > args.to_idx:
            continue
        local = ASSETS_DIR / entry["filename"]
        if not local.exists():
            skipped += 1
            print(f"SKIP missing {entry['filename']}", file=sys.stderr)
            continue
        cmd = [
            sys.executable,
            str(UPLOAD),
            str(local),
            entry["postId"],
            "--name",
            entry["postZh"],
        ]
        subprocess.run(cmd, check=True)
        uploaded += 1
    print(f"Uploaded {uploaded}, skipped {skipped} (missing PNG)")


if __name__ == "__main__":
    main()
