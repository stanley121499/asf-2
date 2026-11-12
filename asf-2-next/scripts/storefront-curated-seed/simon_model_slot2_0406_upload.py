#!/usr/bin/env python3
"""Upload Simon sf-model gallery slot-2 for products 04–06 only.

Replaces arrangement=11 (former sf-side) media_url with model lifestyle shots.
Does NOT touch heroes (arr 10), fallback (arr 1), or spin frames.
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
CACHE_BUST = "v=20261102model0406"
PRODUCT_KEYS = ("04", "05", "06")


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
    # shot_idx 2 = former side / gallery slot 2
    code = f"{product_num:02d}{color_idx}{shot_idx}"
    return f"c160{code}-24a8-4f00-8000-000000000001"


def main() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    env = load_env(ENV_PATH)
    prefix = catalog["storagePrefix"]
    TMP.mkdir(parents=True, exist_ok=True)

    jobs: list[tuple[Path, str, dict[str, object]]] = []
    for pkey in PRODUCT_KEYS:
        prod = catalog["products"][pkey]
        pnum = int(pkey)
        folder = prod["folder"]
        product_id = prod["id"]
        for cidx, (cname, cinfo) in enumerate(prod["colorways"].items(), start=1):
            local = GEN / "products" / folder / cname / "sf-model.png"
            mid = media_uuid(pnum, cidx, 2)
            storage = f"{prefix}/products/{product_id}/{cinfo['id']}/sf-model.webp"
            jobs.append(
                (
                    local,
                    storage,
                    {
                        "mediaId": mid,
                        "productId": product_id,
                        "productKey": pkey,
                        "colorway": cname,
                        "shot": "sf-model",
                        "arrangement": 11,
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

    print(f"Uploading {len(jobs)} sf-model slot2 files…", flush=True)
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(run, local, storage, meta) for local, storage, meta in jobs]
        for fut in as_completed(futures):
            try:
                results.append(fut.result())
            except Exception as exc:  # noqa: BLE001
                errors.append(str(exc))

    results.sort(key=lambda r: (str(r["productKey"]), str(r["colorway"])))
    out_path = TMP / "simon_model_slot2_0406_urls.json"
    out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    sql_lines = ["-- model slot2 04-06 cache-bust"]
    for row in results:
        sql_lines.append(
            "UPDATE product_medias SET media_url = "
            f"'{row['url']}' WHERE id = '{row['mediaId']}';"
        )
    sql_path = TMP / "simon_model_slot2_0406_apply.sql"
    sql_path.write_text("\n".join(sql_lines) + "\n", encoding="utf-8")

    print(f"Wrote {out_path} count={len(results)} errors={len(errors)}")
    print(f"Wrote {sql_path}")
    for row in results:
        print(f"  {row['productKey']} {row['colorway']}: {row['url']}")
    if errors:
        for err in errors:
            print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
