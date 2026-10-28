#!/usr/bin/env python3
"""Build product media upload spec for a category from seed SQL + manifest."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

PATTERN = re.compile(
    r"\('(a360[^']+)', '(dddd[^']+)', '[^']*', (\d+), ('a350[^']+'|NULL)"
)

CATEGORY_META: dict[str, dict[str, str]] = {
    "01": {
        "zh": "跑鞋",
        "silhouette": "running shoe with mesh upper and cushioned sole",
        "must_be": "a running shoe with mesh upper and cushioned sole",
        "must_not": "dress shoe, boot, sandal, or court sneaker",
    },
    "02": {
        "zh": "板鞋球场",
        "silhouette": "low-top court or skate sneaker with flat rubber sole",
        "must_be": "a low-top court/skate sneaker with flat sole",
        "must_not": "running shoe, boot, dress shoe, or sandal",
    },
    "03": {
        "zh": "正装皮鞋",
        "silhouette": "leather dress shoe (oxford, derby, or loafer)",
        "must_be": "a leather dress shoe (oxford, derby, or loafer)",
        "must_not": "sneaker, boot, sandal, or athletic shoe",
    },
    "04": {
        "zh": "男靴",
        "silhouette": "men's ankle or mid-calf boot",
        "must_be": "a men's ankle or mid boot",
        "must_not": "sneaker, sandal, dress shoe, or women's boot",
    },
    "05": {
        "zh": "一脚蹬",
        "silhouette": "women's slip-on flat with no laces",
        "must_be": "a women's slip-on flat with no laces",
        "must_not": "sneaker, boot, heeled pump, or sandal",
    },
    "06": {
        "zh": "休闲运动鞋",
        "silhouette": "women's casual lifestyle sneaker",
        "must_be": "a women's casual sneaker",
        "must_not": "running shoe, boot, dress shoe, or sandal",
    },
    "07": {
        "zh": "短靴",
        "silhouette": "women's ankle boot",
        "must_be": "a women's ankle boot",
        "must_not": "sneaker, sandal, men's boot, or knee-high boot",
    },
    "08": {
        "zh": "时尚高帮",
        "silhouette": "fashion high-top sneaker or boot-style high-top shoe",
        "must_be": "a high-top shoe with extended upper collar",
        "must_not": "low-top court sneaker, sandal, or dress shoe",
    },
    "09": {
        "zh": "包袋",
        "silhouette": "handbag, tote, crossbody bag, or backpack",
        "must_be": "a bag product (handbag, tote, crossbody, or backpack)",
        "must_not": "footwear, belt, cap, or sock",
    },
    "10": {
        "zh": "帽袜",
        "silhouette": "baseball cap, beanie, or sock multi-pack",
        "must_be": "a cap, beanie, or sock pack product",
        "must_not": "footwear, bag, or belt",
    },
    "11": {
        "zh": "护理套装",
        "silhouette": "shoe care kit with bottles, brush, and packaging",
        "must_be": "a shoe care or cleaning kit product set",
        "must_not": "footwear, bag, or apparel",
    },
    "12": {
        "zh": "腰带与小物",
        "silhouette": "leather belt or small fashion accessory",
        "must_be": "a belt or small leather accessory",
        "must_not": "handbag, footwear, or wallet",
    },
}

HEX_LABELS: dict[str, str] = {
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
    "#6B7280": "gray",
    "#8B4513": "brown",
    "#D4AF37": "gold",
    "#F472B6": "pink",
    "#059669": "emerald",
}


def hex_label(hex_code: str) -> str:
    return HEX_LABELS.get(hex_code.upper(), hex_code)


def prompt_for(meta: dict[str, str], product_zh: str, hex_code: str | None, is_fallback: bool) -> str:
    color_part = (
        "Neutral multi-tone presentation showing typical color accents."
        if is_fallback
        else f"Primary color: {hex_code} ({hex_label(hex_code or '')})."
    )
    return (
        f"Premium e-commerce studio packshot, {meta['silhouette']} for category {meta['zh']}. "
        f"Product: {product_zh}. {color_part} "
        f"Pure white background #F7F7F5, single item, 3/4 front angle, soft shadow, "
        f"no model, no text, no watermark, photorealistic, Malaysian premium footwear retail. "
        f"MUST be {meta['must_be']}. MUST NOT be {meta['must_not']}."
    )


def resolve_sql_path(cat: str) -> Path:
    migrations = ROOT.parent.parent / "supabase/migrations"
    candidates = [
        ROOT / f".tmp/chunks_{cat}/part_02.sql",
        ROOT / f".tmp/cat{cat}.sql",
        ROOT / f"apply-payloads/cat{cat}.sql",
        migrations / f"20260825_expo_customer_storefront_curated_products_cat{cat}.sql",
    ]
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError(f"No seed SQL found for cat{cat}; tried {[str(p) for p in candidates]}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("category", help="Two-digit category, e.g. 01 or 02")
    args = parser.parse_args()
    cat = args.category.zfill(2)
    prefix = f"dddd{cat}"
    meta = CATEGORY_META[cat]
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    sql = resolve_sql_path(cat).read_text(encoding="utf-8")

    rows: list[dict[str, object]] = []
    for media_id, product_id, arrangement, color_ref in PATTERN.findall(sql):
        if not product_id.startswith(prefix):
            continue
        spec = manifest["products"][product_id]
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
                "prompt": prompt_for(meta, spec["zh"], hex_code, is_fallback),
            }
        )

    rows.sort(key=lambda r: (r["productId"], r["arrangement"]))
    out = ROOT / f"cat{cat}_media_spec.json"
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} entries to {out}")


if __name__ == "__main__":
    main()
