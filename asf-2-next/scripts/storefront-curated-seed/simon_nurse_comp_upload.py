#!/usr/bin/env python3
"""Upload Simon nurse-composition lifestyle assets only.

Uploads: md-editorial-a/b per colorway, all posts, all promos.
Does NOT touch sf-hero-34 / sf-side / sf-fallback packshots.
Writes .tmp/simon_nurse_comp_*_urls.json and prints SQL for cache-bust.
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
CACHE_BUST = "v=20261028nursecomp"
MD_SHOTS = ["md-editorial-a.png", "md-editorial-b.png"]


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

    jobs: list[tuple[str, Path, str, str, dict]] = []

    # md-editorial only (shot indices 5 and 6 in original cutover numbering)
    for pkey, prod in catalog["products"].items():
        pnum = int(pkey)
        folder = prod["folder"]
        product_id = prod["id"]
        for cidx, (cname, cinfo) in enumerate(prod["colorways"].items(), start=1):
            for sidx, shot in enumerate(MD_SHOTS, start=5):
                local = GEN / "products" / folder / cname / shot
                storage = (
                    f"{prefix}/products/{product_id}/{cinfo['id']}/"
                    f"{shot.replace('.png', '')}.webp"
                )
                jobs.append(
                    (
                        "editorial",
                        local,
                        "product_medias",
                        storage,
                        {
                            "mediaId": media_uuid(pnum, cidx, sidx),
                            "productId": product_id,
                            "productKey": pkey,
                            "colorway": cname,
                            "shot": shot.replace(".png", ""),
                            "colorId": cinfo["id"],
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
                {"postId": post["id"], "file": post["file"], "productKey": post["productKey"]},
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
                {"promoId": promo["id"], "file": promo["file"], "productKey": promo["productKey"]},
            )
        )

    editorial_urls: list[dict] = []
    post_urls: list[dict] = []
    promo_urls: list[dict] = []
    errors: list[str] = []

    def run_job(kind, local, bucket, storage, meta):
        if not local.exists():
            raise FileNotFoundError(str(local))
        url = upload_bytes(to_webp_bytes(local), bucket, storage, env)
        out = dict(meta)
        out["url"] = url
        return kind, out

    print(f"Uploading {len(jobs)} nurse-comp lifestyle files…", flush=True)
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
                if kind == "editorial":
                    editorial_urls.append(record)
                elif kind == "post":
                    post_urls.append(record)
                else:
                    promo_urls.append(record)
            except Exception as exc:  # noqa: BLE001
                errors.append(str(exc))
            if done % 10 == 0 or done == len(jobs):
                print(f"  {done}/{len(jobs)}", flush=True)

    editorial_urls.sort(key=lambda r: str(r["mediaId"]))
    post_urls.sort(key=lambda r: str(r["postId"]))
    promo_urls.sort(key=lambda r: str(r["promoId"]))

    (TMP / "simon_nurse_comp_editorial_urls.json").write_text(
        json.dumps(editorial_urls, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (TMP / "simon_nurse_comp_post_urls.json").write_text(
        json.dumps(post_urls, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (TMP / "simon_nurse_comp_promo_urls.json").write_text(
        json.dumps(promo_urls, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # SQL for live DB surfaces (posts + promos). Editorials are storage-only
    # (removed from product_medias gallery in two-angle cutover).
    sql_lines = [
        "-- Nurse composition regen cache-bust",
        f"-- token: {CACHE_BUST}",
    ]
    for p in post_urls:
        sql_lines.append(
            "UPDATE public.post_medias SET media_url = "
            f"'{p['url']}' WHERE post_id = '{p['postId']}';"
        )
    for p in promo_urls:
        sql_lines.append(
            "UPDATE public.promotions SET image_url = "
            f"'{p['url']}' WHERE id = '{p['promoId']}';"
        )
    sql_path = TMP / "simon_nurse_comp_apply.sql"
    sql_path.write_text("\n".join(sql_lines) + "\n", encoding="utf-8")

    print(
        f"Done editorial={len(editorial_urls)} posts={len(post_urls)} "
        f"promos={len(promo_urls)} errors={len(errors)}"
    )
    print(f"SQL: {sql_path}")
    if errors:
        for err in errors[:20]:
            print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
