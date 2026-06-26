#!/usr/bin/env python3
"""Fit MODEL MATCH logo into motion-ready semantic SVG parts (exact raster match)."""

from __future__ import annotations

import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SCRIPT_ROOT = Path(__file__).resolve().parents[6] / "tools" / "pixel2motion" / "scripts"
sys.path.insert(0, str(SCRIPT_ROOT))

from raster_logo_trace import (  # noqa: E402
    fmt,
    make_overlay,
    mask_metrics,
    path_data,
    simplify_closed,
    trace_mask,
)

SOURCE = Path(__file__).resolve().parents[3] / "source.png"
OUT_DIR = Path(__file__).resolve().parent

# Resolution-aware geometry. All part-splitting thresholds were tuned against a
# 500px baseline raster, so we derive a scale factor from the actual source and
# scale linear (positions, simplify tolerances) and area thresholds accordingly.
BASELINE = 500
with Image.open(SOURCE) as _probe:
    WIDTH, HEIGHT = _probe.size
SCALE = WIDTH / BASELINE
AREA_SCALE = SCALE * SCALE

WHITE_FILL = "#ffffff"
PINK_FILL = "#ee73c4"

# Baseline thresholds (in 500px pixels) scaled to the current resolution.
MARK_MIN_AREA = 800 * AREA_SCALE
MARK_TOP_Y = 300 * SCALE
ROW_SPLIT_Y = 345 * SCALE
LETTER_MIN_AREA = 80 * AREA_SCALE
CLUSTER_GAP = 5.0 * SCALE
SIMPLIFY_MARK = 1.4 * SCALE
SIMPLIFY_PINK = 1.2 * SCALE
SIMPLIFY_WORD = 0.85 * SCALE


def load_masks() -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Build foreground masks for white mark, pink accent, and full logo."""
    rgba = np.asarray(Image.open(SOURCE).convert("RGBA"))
    rgb = rgba[:, :, :3].astype(float)
    alpha = rgba[:, :, 3]
    lum = rgb.sum(axis=2)
    white = (lum > 650) & (alpha > 200)
    pink = (
        (rgba[:, :, 0] > 150)
        & (rgba[:, :, 1] < 140)
        & (rgba[:, :, 2] > 100)
        & (alpha > 200)
    )
    fg = white | pink
    return white, pink, fg


def label_components(mask: np.ndarray) -> list[dict[str, object]]:
    """Return connected components with pixel masks."""
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    components: list[dict[str, object]] = []
    ys, xs = np.nonzero(mask)
    for start_y, start_x in zip(ys.tolist(), xs.tolist()):
        if seen[start_y, start_x]:
            continue
        queue: deque[tuple[int, int]] = deque([(start_y, start_x)])
        seen[start_y, start_x] = True
        pixels: list[tuple[int, int]] = []
        while queue:
            y, x = queue.popleft()
            pixels.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    queue.append((ny, nx))
        comp_mask = np.zeros_like(mask, dtype=bool)
        for y, x in pixels:
            comp_mask[y, x] = True
        xs_vals = [p[1] for p in pixels]
        ys_vals = [p[0] for p in pixels]
        components.append(
            {
                "mask": comp_mask,
                "area": len(pixels),
                "bbox": (min(xs_vals), min(ys_vals), max(xs_vals), max(ys_vals)),
                "centroid_y": sum(ys_vals) / len(ys_vals),
            }
        )
    components.sort(key=lambda item: int(item["area"]), reverse=True)
    return components


def trace_part(mask: np.ndarray, simplify: float) -> str:
    """Trace a boolean mask into SVG path data."""
    loops = [simplify_closed(loop, simplify) for loop in trace_mask(mask)]
    loops = [loop for loop in loops if len(loop) >= 3]
    return path_data(loops)


def cluster_letters(components: list[dict[str, object]], gap: float = CLUSTER_GAP) -> list[dict[str, object]]:
    """Merge fragmented serif components that belong to one letter."""
    if not components:
        return []
    ordered = sorted(components, key=lambda item: float(item["bbox"][0]))
    clusters: list[dict[str, object]] = []
    for component in ordered:
        bbox = component["bbox"]
        centroid_x = float(component["centroid_x"])
        if not clusters:
            clusters.append(
                {
                    "mask": component["mask"].copy(),
                    "centroid_x": centroid_x,
                    "bbox": bbox,
                }
            )
            continue
        last = clusters[-1]
        last_bbox = last["bbox"]
        horizontal_gap = float(bbox[0]) - float(last_bbox[2])
        if horizontal_gap <= gap:
            last["mask"] = last["mask"] | component["mask"]
            last["centroid_x"] = float(np.nonzero(last["mask"])[1].mean())
            last["bbox"] = (
                min(int(last_bbox[0]), int(bbox[0])),
                min(int(last_bbox[1]), int(bbox[1])),
                max(int(last_bbox[2]), int(bbox[2])),
                max(int(last_bbox[3]), int(bbox[3])),
            )
        else:
            clusters.append(
                {
                    "mask": component["mask"].copy(),
                    "centroid_x": centroid_x,
                    "bbox": bbox,
                }
            )
    return clusters


def merge_last_fragment(letters: list[dict[str, object]]) -> list[dict[str, object]]:
    """Merge a split final letter when rasterization fragments one glyph."""
    if len(letters) <= 5:
        return letters
    ordered = sorted(letters, key=lambda item: float(item["bbox"][0]))
    last = ordered[-1]
    prev = ordered[-2]
    prev["mask"] = prev["mask"] | last["mask"]
    xs = np.nonzero(prev["mask"])[1]
    prev["centroid_x"] = float(xs.mean())
    prev["bbox"] = (
        min(int(prev["bbox"][0]), int(last["bbox"][0])),
        min(int(prev["bbox"][1]), int(last["bbox"][1])),
        max(int(prev["bbox"][2]), int(last["bbox"][2])),
        max(int(prev["bbox"][3]), int(last["bbox"][3])),
    )
    return ordered[:-1]


def build_letter_parts(white: np.ndarray, pink: np.ndarray) -> list[dict[str, str]]:
    """Build per-letter wordmark parts for cascade choreography."""
    model_names = ["model-m", "model-o", "model-d", "model-e", "model-l"]
    match_names = ["match-m", "match-a", "match-t", "match-c", "match-h"]
    parts: list[dict[str, str]] = []
    white_components = label_components(white)

    mark_mask = np.zeros_like(white, dtype=bool)
    model_letters: list[dict[str, object]] = []
    match_letters: list[dict[str, object]] = []

    for component in white_components:
        area = int(component["area"])
        centroid_y = float(component["centroid_y"])
        if area > MARK_MIN_AREA or centroid_y < MARK_TOP_Y:
            mark_mask |= component["mask"]
        elif area < LETTER_MIN_AREA:
            continue
        elif centroid_y < ROW_SPLIT_Y:
            model_letters.append(
                {
                    "mask": component["mask"],
                    "centroid_x": float(component["bbox"][0] + component["bbox"][2]) / 2.0,
                    "bbox": component["bbox"],
                }
            )
        else:
            match_letters.append(
                {
                    "mask": component["mask"],
                    "centroid_x": float(component["bbox"][0] + component["bbox"][2]) / 2.0,
                    "bbox": component["bbox"],
                }
            )

    parts.append({"id": "letter-m", "fill": WHITE_FILL, "d": trace_part(mark_mask, SIMPLIFY_MARK)})
    parts.append({"id": "number-2", "fill": PINK_FILL, "d": trace_part(pink, SIMPLIFY_PINK)})

    model_clusters = sorted(model_letters, key=lambda item: float(item["bbox"][0]))
    match_clusters = merge_last_fragment(
        sorted(match_letters, key=lambda item: float(item["bbox"][0]))
    )

    for index, letter_id in enumerate(model_names):
        if index >= len(model_clusters):
            break
        parts.append(
            {
                "id": letter_id,
                "fill": WHITE_FILL,
                "d": trace_part(model_clusters[index]["mask"], SIMPLIFY_WORD),
            }
        )

    for index, letter_id in enumerate(match_names):
        if index >= len(match_clusters):
            break
        parts.append(
            {
                "id": letter_id,
                "fill": WHITE_FILL,
                "d": trace_part(match_clusters[index]["mask"], SIMPLIFY_WORD),
            }
        )

    return [part for part in parts if part["d"]]


def build_semantic_parts(white: np.ndarray, pink: np.ndarray) -> list[dict[str, str]]:
    """Assign traced paths to semantic ids for choreography."""
    parts: list[dict[str, str]] = []

    white_components = label_components(white)
    mark_mask = np.zeros_like(white, dtype=bool)
    model_mask = np.zeros_like(white, dtype=bool)
    match_mask = np.zeros_like(white, dtype=bool)

    for component in white_components:
        area = int(component["area"])
        centroid_y = float(component["centroid_y"])
        comp_mask = component["mask"]
        if area > MARK_MIN_AREA or centroid_y < MARK_TOP_Y:
            mark_mask |= comp_mask
        elif centroid_y < ROW_SPLIT_Y:
            model_mask |= comp_mask
        else:
            match_mask |= comp_mask

    parts.append(
        {
            "id": "letter-m",
            "fill": WHITE_FILL,
            "d": trace_part(mark_mask, SIMPLIFY_MARK),
        }
    )
    parts.append(
        {
            "id": "number-2",
            "fill": PINK_FILL,
            "d": trace_part(pink, SIMPLIFY_PINK),
        }
    )
    parts.append(
        {
            "id": "word-model",
            "fill": WHITE_FILL,
            "d": trace_part(model_mask, SIMPLIFY_WORD),
        }
    )
    parts.append(
        {
            "id": "word-match",
            "fill": WHITE_FILL,
            "d": trace_part(match_mask, SIMPLIFY_WORD),
        }
    )
    return [part for part in parts if part["d"]]


def svg_document(parts: list[dict[str, str]]) -> str:
    """Emit motion-ready SVG with stable semantic ids."""
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
        "  <title>MODEL MATCH logo</title>",
        '  <rect width="100%" height="100%" fill="#000000"/>',
        '  <g id="logo" fill-rule="evenodd" shape-rendering="geometricPrecision">',
    ]
    for part in parts:
        lines.append(
            f'    <g id="{part["id"]}"><path d="{part["d"]}" fill="{part["fill"]}"/></g>'
        )
    lines.extend(["  </g>", "</svg>", ""])
    return "\n".join(lines)


def render_paths(white: np.ndarray, pink: np.ndarray) -> Image.Image:
    """Rasterize semantic masks for overlay QA."""
    from raster_logo_trace import draw_evenodd_mask

    result = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 255))
    white_components = label_components(white)
    mark_mask = np.zeros_like(white, dtype=bool)
    model_mask = np.zeros_like(white, dtype=bool)
    match_mask = np.zeros_like(white, dtype=bool)
    for component in white_components:
        area = int(component["area"])
        centroid_y = float(component["centroid_y"])
        if area > MARK_MIN_AREA or centroid_y < MARK_TOP_Y:
            mark_mask |= component["mask"]
        elif centroid_y < ROW_SPLIT_Y:
            model_mask |= component["mask"]
        else:
            match_mask |= component["mask"]

    layers = [
        (WHITE_FILL, mark_mask),
        (PINK_FILL, pink),
        (WHITE_FILL, model_mask),
        (WHITE_FILL, match_mask),
    ]
    for fill, mask in layers:
        loops = trace_mask(mask)
        if not loops:
            continue
        layer_mask = draw_evenodd_mask((WIDTH, HEIGHT), loops)
        rgb = tuple(int(fill.strip("#")[i : i + 2], 16) for i in (0, 2, 4))
        layer = Image.new("RGBA", (WIDTH, HEIGHT), (*rgb, 255))
        empty = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        result.alpha_composite(Image.composite(layer, empty, layer_mask))
    return result


def main() -> int:
    white, pink, fg = load_masks()
    parts = build_semantic_parts(white, pink)
    letter_parts = build_letter_parts(white, pink)

    svg_text = svg_document(parts)
    svg_path = OUT_DIR / "logo_semantic_v1.svg"
    svg_path.write_text(svg_text, encoding="utf-8")

    letter_svg = svg_document(letter_parts)
    letter_svg_path = OUT_DIR / "logo_letters.svg"
    letter_svg_path.write_text(letter_svg, encoding="utf-8")

    source = Image.open(SOURCE).convert("RGBA")
    vector = render_paths(white, pink)
    vector_path = OUT_DIR / "semantic_v1_render.png"
    overlay_path = OUT_DIR / "semantic_v1_overlay.png"
    vector.save(vector_path)
    make_overlay(source, vector, 112).save(overlay_path)
    metrics = mask_metrics(fg, vector)
    report = {
        "parts": [part["id"] for part in parts],
        "letter_parts": [part["id"] for part in letter_parts],
        "metrics": metrics,
        "svg": str(svg_path),
        "letter_svg": str(letter_svg_path),
    }
    (OUT_DIR / "semantic_v1_metrics.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
