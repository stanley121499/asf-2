#!/usr/bin/env python3
"""Upload product packshot to Supabase product_medias bucket and record URL."""

from __future__ import annotations

import argparse
import io
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("pip install pillow", file=sys.stderr)
    raise

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env.local"
BUCKET = "product_medias"
PUBLIC_BASE = "https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public"
URLS_PATH = Path(__file__).resolve().parent / ".tmp" / "product_media_urls_cat01.json"


def urls_path_for(category: str) -> Path:
    return Path(__file__).resolve().parent / ".tmp" / f"product_media_urls_cat{category.zfill(2)}.json"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def to_webp_bytes(local_path: Path) -> bytes:
    with Image.open(local_path) as img:
        rgb = img.convert("RGB")
        buf = io.BytesIO()
        rgb.save(buf, format="WEBP", quality=88, method=6)
        return buf.getvalue()


def upload_bytes(data: bytes, product_id: str, media_id: str, env: dict[str, str]) -> str:
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        raise RuntimeError("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")

    storage_path = f"storefront-curated/2026-08/products/{product_id}/{media_id}.webp"
    url = f"{supabase_url}/storage/v1/object/{BUCKET}/{storage_path}"
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "image/webp",
            "x-upsert": "true",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            if resp.status not in (200, 201):
                raise RuntimeError(f"Upload failed {resp.status}")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Upload failed {exc.code}: {body}") from exc

    return f"{PUBLIC_BASE}/{BUCKET}/{storage_path}"


def append_record(record: dict[str, object], urls_path: Path) -> None:
    urls_path.parent.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, object]] = []
    if urls_path.exists():
        records = json.loads(urls_path.read_text(encoding="utf-8"))
    records = [r for r in records if r.get("mediaId") != record["mediaId"]]
    records.append(record)
    urls_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("local_path", type=Path)
    parser.add_argument("product_id", type=str)
    parser.add_argument("media_id", type=str)
    parser.add_argument("--qc", default="pass")
    parser.add_argument("--hex", default="")
    parser.add_argument("--color-id", default="")
    parser.add_argument("--category", default="01")
    parser.add_argument("--fallback", action="store_true")
    args = parser.parse_args()

    env = load_env(ENV_PATH)
    webp = to_webp_bytes(args.local_path)
    public_url = upload_bytes(webp, args.product_id, args.media_id, env)
    append_record(
        {
            "mediaId": args.media_id,
            "productId": args.product_id,
            "url": public_url,
            "qc": args.qc,
            "isFallback": args.fallback,
            "hex": args.hex,
            "colorId": args.color_id or None,
        },
        urls_path_for(args.category),
    )
    print(public_url)


if __name__ == "__main__":
    main()
