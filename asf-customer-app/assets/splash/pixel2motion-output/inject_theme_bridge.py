#!/usr/bin/env python3
"""Inject theme-bridge assets into splash preview HTML files."""

from __future__ import annotations

from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent
CSS_TAG = '<link rel="stylesheet" href="theme-bridge.css">'
JS_TAG = '<script src="theme-bridge.js"></script>'

HTML_FILES = [
    "variations.html",
    "logo_motion.html",
    "logo_motion_letters.html",
    "logo_motion_scale_pop.html",
    "logo_motion_minimal_fade.html",
    "logo_motion_mask_wipe.html",
    "logo_motion_luxury_fade.html",
    "logo_motion_ink_reveal.html",
]


def inject(path: Path) -> None:
    """Add theme bridge tags once if missing."""
    text = path.read_text(encoding="utf-8")
    if "theme-bridge.css" not in text:
        text = text.replace("</head>", f"  {CSS_TAG}\n</head>", 1)
    if "theme-bridge.js" not in text:
        text = text.replace("</body>", f"  {JS_TAG}\n</body>", 1)
    path.write_text(text, encoding="utf-8")


def main() -> int:
    for name in HTML_FILES:
        target = OUTPUT_DIR / name
        if not target.exists():
            raise SystemExit(f"Missing file: {target}")
        inject(target)
        print(f"patched {target.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
