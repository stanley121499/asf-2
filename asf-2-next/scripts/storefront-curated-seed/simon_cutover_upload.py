#!/usr/bin/env python3
"""Upload Simon-generated product/post/promo images to Supabase Storage.

Writes URL maps under .tmp/simon_*.json for SQL wiring.
Path prefix: storefront-curated/2026-10/simon/...
"""

from __future__ import annotations

import io
import json
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("pip install pillow", file=sys.stderr)
    raise

SCRIPT_DIR = Path(__file__).resolve().parent
ENV_PATH = SCRIPT_DIR.parent.parent / ".env.local"
GEN = SCRIPT_DIR / "simon-generated"
CATALOG_PATH = GEN / "CATALOG_IDS.json"
TMP = SCRIPT_DIR / ".tmp"
PUBLIC_BASE = "https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public"
SHOTS = [
    "sf-hero-34.png",
    "sf-side.png",
    "sf-topdown-insole.png",
    "sf-pair-or-sole.png",
    "md-editorial-a.png",
    "md-editorial-b.png",
]


def load_env(path: Path) -> dict[str, str]:
    """Load key=value pairs from a dotenv file."""
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
    """Convert any raster image to WEBP bytes."""
    with Image.open(local_path) as img:
        rgb = img.convert("RGB")
        buf = io.BytesIO()
        rgb.save(buf, format="WEBP", quality=88, method=6)
        return buf.getvalue()


def upload_bytes(
    data: bytes,
    bucket: str,
    storage_path: str,
    env: dict[str, str],
) -> str:
    """POST/upsert bytes to Supabase Storage; return public URL."""
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        raise RuntimeError(
            "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
        )

    url = f"{supabase_url}/storage/v1/object/{bucket}/{storage_path}"
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
        with urllib.request.urlopen(req, timeout=180) as resp:
            if resp.status not in (200, 201):
                raise RuntimeError(f"Upload failed {resp.status}")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Upload failed {exc.code}: {body}") from exc

    return f"{PUBLIC_BASE}/{bucket}/{storage_path}"


def media_uuid(product_num: int, color_idx: int, shot_idx: int) -> str:
    """Stable media UUID: c160{PP}{C}{S}-24a8-4f00-8000-000000000001."""
    code = f"{product_num:02d}{color_idx}{shot_idx}"
    return f"c160{code}-24a8-4f00-8000-000000000001"


def upload_one(
    local: Path,
    bucket: str,
    storage_path: str,
    env: dict[str, str],
) -> str:
    """Convert local file to webp and upload."""
    if not local.exists():
        raise FileNotFoundError(str(local))
    return upload_bytes(to_webp_bytes(local), bucket, storage_path, env)


def main() -> None:
    """Upload all Simon assets and write URL JSON maps."""
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    env = load_env(ENV_PATH)
    prefix = catalog["storagePrefix"]
    TMP.mkdir(parents=True, exist_ok=True)

    jobs: list[tuple[str, Path, str, str, dict[str, object]]] = []

    for pkey, prod in catalog["products"].items():
        pnum = int(pkey)
        folder = prod["folder"]
        product_id = prod["id"]

        # Fallback
        local_fb = GEN / "products" / folder / "sf-fallback.png"
        storage_fb = f"{prefix}/products/{product_id}/fallback.webp"
        jobs.append(
            (
                "product",
                local_fb,
                "product_medias",
                storage_fb,
                {
                    "mediaId": prod["fallbackMediaId"],
                    "productId": product_id,
                    "productKey": pkey,
                    "colorway": None,
                    "shot": "sf-fallback",
                    "isFallback": True,
                    "arrangement": 1,
                    "colorId": None,
                },
            )
        )

        for cidx, (cname, cinfo) in enumerate(prod["colorways"].items(), start=1):
            for sidx, shot in enumerate(SHOTS, start=1):
                local = GEN / "products" / folder / cname / shot
                mid = media_uuid(pnum, cidx, sidx)
                storage = (
                    f"{prefix}/products/{product_id}/{cinfo['id']}/{shot.replace('.png', '')}.webp"
                )
                jobs.append(
                    (
                        "product",
                        local,
                        "product_medias",
                        storage,
                        {
                            "mediaId": mid,
                            "productId": product_id,
                            "productKey": pkey,
                            "colorway": cname,
                            "shot": shot.replace(".png", ""),
                            "isFallback": False,
                            "arrangement": 9 + sidx,
                            "colorId": cinfo["id"],
                            "hex": cinfo["hex"],
                        },
                    )
                )

    for post in catalog["posts"]:
        local = GEN / "posts" / post["file"]
        storage = f"{prefix}/posts/{post['id']}.webp"
        jobs.append(
            (
                "post",
                local,
                "post_medias",
                storage,
                {
                    "postId": post["id"],
                    "file": post["file"],
                    "productKey": post["productKey"],
                },
            )
        )

    for promo in catalog["promos"]:
        local = GEN / "promos" / promo["file"]
        storage = f"{prefix}/promos/{promo['id']}.webp"
        jobs.append(
            (
                "promo",
                local,
                "medias",
                storage,
                {
                    "promoId": promo["id"],
                    "file": promo["file"],
                    "productKey": promo["productKey"],
                },
            )
        )

    product_urls: list[dict[str, object]] = []
    post_urls: list[dict[str, object]] = []
    promo_urls: list[dict[str, object]] = []
    errors: list[str] = []

    def run_job(
        kind: str,
        local: Path,
        bucket: str,
        storage: str,
        meta: dict[str, object],
    ) -> tuple[str, dict[str, object]]:
        url = upload_one(local, bucket, storage, env)
        out = dict(meta)
        out["url"] = url
        return kind, out

    print(f"Uploading {len(jobs)} files…", flush=True)
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [
            pool.submit(run_job, kind, local, bucket, storage, meta)
            for kind, local, bucket, storage, meta in jobs
        ]
        done = 0
        for fut in as_completed(futures):
            done += 1
            try:
                kind, record = fut.result()
                if kind == "product":
                    product_urls.append(record)
                elif kind == "post":
                    post_urls.append(record)
                else:
                    promo_urls.append(record)
            except Exception as exc:  # noqa: BLE001 — collect all upload failures
                errors.append(str(exc))
            if done % 10 == 0 or done == len(jobs):
                print(f"  {done}/{len(jobs)}", flush=True)

    product_urls.sort(key=lambda r: str(r["mediaId"]))
    post_urls.sort(key=lambda r: str(r["postId"]))
    promo_urls.sort(key=lambda r: str(r["promoId"]))

    (TMP / "simon_product_media_urls.json").write_text(
        json.dumps(product_urls, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (TMP / "simon_post_media_urls.json").write_text(
        json.dumps(post_urls, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (TMP / "simon_promo_media_urls.json").write_text(
        json.dumps(promo_urls, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(
        f"Done products={len(product_urls)} posts={len(post_urls)} "
        f"promos={len(promo_urls)} errors={len(errors)}"
    )
    if errors:
        for err in errors[:20]:
            print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
