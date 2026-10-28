#!/usr/bin/env python3
"""Upload promo banner image to Supabase medias bucket."""

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

ENV_PATH = Path(__file__).resolve().parents[2] / ".env.local"
BUCKET = "medias"
STORAGE_PREFIX = "storefront-curated/2026-08/promotions"
PUBLIC_BASE = "https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public"
URLS_PATH = Path(__file__).resolve().parent / ".tmp" / "promo_media_urls.json"


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


def upload_bytes(data: bytes, promo_id: str, env: dict[str, str]) -> str:
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        raise RuntimeError("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")

    storage_path = f"{STORAGE_PREFIX}/{promo_id}.webp"
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


def append_record(promo_id: str, promo_zh: str, url: str, qc: str) -> None:
    URLS_PATH.parent.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, str]] = []
    if URLS_PATH.exists():
        records = json.loads(URLS_PATH.read_text(encoding="utf-8"))
    records = [r for r in records if r["promoId"] != promo_id]
    records.append({"promoId": promo_id, "promoZh": promo_zh, "url": url, "qc": qc})
    URLS_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("local_path", type=Path)
    parser.add_argument("promo_id", type=str)
    parser.add_argument("--name", required=True, help="Chinese promo name for manifest")
    parser.add_argument("--qc", default="pass")
    args = parser.parse_args()

    env = load_env(ENV_PATH)
    webp = to_webp_bytes(args.local_path)
    public_url = upload_bytes(webp, args.promo_id, env)
    append_record(args.promo_id, args.name, public_url, args.qc)
    print(public_url)


if __name__ == "__main__":
    main()
