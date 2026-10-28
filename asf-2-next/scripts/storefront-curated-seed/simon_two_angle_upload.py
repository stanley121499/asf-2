#!/usr/bin/env python3
"""Upload Simon two-angle storefront packshots (hero + side + fallback) only.

Does not touch md-editorial / posts / promos / topdown / pair files on disk.
Writes .tmp/simon_two_angle_media_urls.json and prints SQL-ready URL updates.
"""

from __future__ import annotations

import io
import json
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
ENV_PATH = SCRIPT_DIR.parent.parent / ".env.local"
GEN = SCRIPT_DIR / "simon-generated"
CATALOG_PATH = GEN / "CATALOG_IDS.json"
TMP = SCRIPT_DIR / ".tmp"
PUBLIC_BASE = "https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public"
CACHE_BUST = "v=3"
SHOTS = ["sf-hero-34.png", "sf-side.png"]


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


def upload_bytes(data: bytes, bucket: str, storage_path: str, env: dict[str, str]) -> str:
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        raise RuntimeError("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
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
    return f"{PUBLIC_BASE}/{bucket}/{storage_path}?{CACHE_BUST}"


def media_uuid(product_num: int, color_idx: int, shot_idx: int) -> str:
    code = f"{product_num:02d}{color_idx}{shot_idx}"
    return f"c160{code}-24a8-4f00-8000-000000000001"


def main() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    env = load_env(ENV_PATH)
    prefix = catalog["storagePrefix"]
    TMP.mkdir(parents=True, exist_ok=True)

    jobs: list[tuple[Path, str, dict[str, object]]] = []

    for pkey, prod in catalog["products"].items():
        pnum = int(pkey)
        folder = prod["folder"]
        product_id = prod["id"]

        local_fb = GEN / "products" / folder / "sf-fallback.png"
        storage_fb = f"{prefix}/products/{product_id}/fallback.webp"
        jobs.append(
            (
                local_fb,
                storage_fb,
                {
                    "mediaId": prod["fallbackMediaId"],
                    "productId": product_id,
                    "productKey": pkey,
                    "colorway": None,
                    "shot": "sf-fallback",
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
                        local,
                        storage,
                        {
                            "mediaId": mid,
                            "productId": product_id,
                            "productKey": pkey,
                            "colorway": cname,
                            "shot": shot.replace(".png", ""),
                            "arrangement": 9 + sidx,  # 10 hero, 11 side
                            "colorId": cinfo["id"],
                        },
                    )
                )

    results: list[dict[str, object]] = []
    errors: list[str] = []

    def run(local: Path, storage: str, meta: dict[str, object]) -> dict[str, object]:
        if not local.exists():
            raise FileNotFoundError(str(local))
        url = upload_bytes(to_webp_bytes(local), "product_medias", storage, env)
        out = dict(meta)
        out["url"] = url
        out["storagePath"] = storage
        return out

    print(f"Uploading {len(jobs)} two-angle + fallback files…", flush=True)
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(run, local, storage, meta) for local, storage, meta in jobs]
        done = 0
        for fut in as_completed(futures):
            done += 1
            try:
                results.append(fut.result())
            except Exception as exc:  # noqa: BLE001
                errors.append(str(exc))
            if done % 5 == 0 or done == len(jobs):
                print(f"  {done}/{len(jobs)}", flush=True)

    results.sort(key=lambda r: str(r["mediaId"]))
    out_path = TMP / "simon_two_angle_media_urls.json"
    out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out_path} count={len(results)} errors={len(errors)}")
    if errors:
        for err in errors[:20]:
            print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
