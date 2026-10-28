#!/usr/bin/env python3
"""Build cat01 product media upload spec from manifest + seed SQL."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
SQL = (ROOT / ".tmp/chunks_01/part_02.sql").read_text(encoding="utf-8")

PATTERN = re.compile(
    r"\('(a360[^']+)', '(dddd[^']+)', '[^']*', (\d+), ('a350[^']+'|NULL)"
)

SILHOUETTE = "running shoe with mesh upper and cushioned sole"
CATEGORY = "跑鞋"


def hex_label(hex_code: str) -> str:
    labels = {
        "#F5F5F5": "off-white",
        "#111111": "black",
        "#4A6670": "slate blue-gray",
        "#DC2626": "red",
        "#FFFFFF": "white",
        "#CAFF00": "neon yellow",
        "#F5F0E8": "warm cream",
        "#9CA3AF": "cool gray",
        "#1E3A5F": "navy blue",
        "#365314": "olive green",
        "#EA580C": "orange",
        "#99F6E4": "mint teal",
        "#7C3AED": "purple",
        "#C0C0C0": "silver gray",
        "#0284C7": "bright blue",
    }
    return labels.get(hex_code.upper(), hex_code)


def prompt_for(product_zh: str, hex_code: str | None, is_fallback: bool) -> str:
    color_part = (
        f"Neutral multi-tone presentation showing typical color accents."
        if is_fallback
        else f"Primary color: {hex_code} ({hex_label(hex_code or '')})."
    )
    return (
        f"Premium e-commerce studio packshot, {SILHOUETTE} for category {CATEGORY}. "
        f"Product: {product_zh}. {color_part} "
        f"Pure white background #F7F7F5, single item, 3/4 front angle, soft shadow, "
        f"no model, no text, no watermark, photorealistic, Malaysian premium footwear retail. "
        f"MUST be a running shoe with mesh upper and cushioned sole. "
        f"MUST NOT be dress shoe, boot, sandal, or court sneaker."
    )


def main() -> None:
    rows: list[dict[str, object]] = []
    for media_id, product_id, arrangement, color_ref in PATTERN.findall(SQL):
        if not product_id.startswith("dddd01"):
            continue
        spec = MANIFEST["products"][product_id]
        is_fallback = color_ref == "NULL"
        color_id = None if is_fallback else color_ref.strip("'")
        hex_code: str | None = None
        if not is_fallback:
            for cw in spec["colorways"]:
                if cw["colorId"] == color_id:
                    hex_code = cw["hex"]
                    break
        slot = product_id.split("-")[0][-4:]
        filename = f"prod_{slot}_{media_id.split('-')[-1]}.png"
        rows.append(
            {
                "mediaId": media_id,
                "productId": product_id,
                "productZh": spec["zh"],
                "colorId": color_id,
                "hex": hex_code,
                "arrangement": int(arrangement),
                "isFallback": is_fallback,
                "filename": filename,
                "prompt": prompt_for(spec["zh"], hex_code, is_fallback),
            }
        )

    rows.sort(key=lambda r: (r["productId"], r["arrangement"]))
    out = ROOT / "cat01_media_spec.json"
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} entries to {out}")


if __name__ == "__main__":
    main()
