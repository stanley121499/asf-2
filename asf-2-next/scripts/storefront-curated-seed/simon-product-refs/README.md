# Simon product reference library

Physical product photos from Simon. Use these as **reference_image_paths** when generating storefront, model, post, or promo media so outputs stay aligned with the real shoes.

## Layout

```
simon-product-refs/
  manifest.json                          # machine-readable catalog + prompt locks
  01-knit-maryjane-buckle/{black,beige}/
  02-knit-ballet-xstrap/{black,beige}/
  03-knit-ankle-strap/{blush,beige}/
  04-satin-ankle-strap/{cream,black-almond}/
  05-satin-maryjane/{cream,black-pink}/
  06-satin-ballet-xstrap/{cream,black-pink}/
  _fidelity-tests/                       # approved / draft AI fidelity checks
```

`black-almond` under product 04 is **AI-generated** (no physical sample). Prefer pairing those files with the physical `cream` refs when generating more media.

## Naming

`{angle}[-detail]-{nn}.jpg`

| Token | Meaning |
|---|---|
| `side` | Lateral profile |
| `front` | Front / slightly elevated |
| `rear` | Heel / back |
| `topdown` | Bird’s-eye into the shoe |
| `sole` | Outsole underside |
| `*-insole-*` | Angle where insole branding is readable |
| `*-hand-*` | Hand holding the shoe |

## How to generate (checklist)

1. Open `manifest.json` → pick `productId` + `colorway`.
2. Attach **all** files listed under that colorway’s `refs` (especially `insole`, `side`, `sole`).
3. Copy the `promptLock` fields into the image prompt (silhouette, strap type, branding text).
4. Prefer a top-down / open-shoe angle when insole print must be visible.
5. Save new fidelity outputs under `_fidelity-tests/{product-slug}/`.

## Products (summary)

| ID | Slug | Colors | Distinguishing feature |
|---|---|---|---|
| 01 | `knit-maryjane-buckle` | black, beige | Single instep strap + buckle |
| 02 | `knit-ballet-xstrap` | black, beige | Two wide elastic **X** straps (no buckle) |
| 03 | `knit-ankle-strap` | blush, beige | Wide **ankle** strap + large tonal buckle; **knit** upper |
| 04 | `satin-ankle-strap` | cream, **black-almond** | Wide **ankle** strap + buckle; **satin** upper; black exterior / almond interior (generated) |
| 05 | `satin-maryjane` | cream, **black-pink** | Single **instep** Mary Jane strap + small buckle (not ankle strap); **satin** upper; black-pink is AI-generated |
| 06 | `satin-ballet-xstrap` | cream, **black-pink** | Two wide elastic **X** straps (no buckle); **smooth satin/matte white** upper — not knit; square toe; black-pink is AI-generated |

`black-pink` under products 05 and 06 is **AI-generated** (no physical sample). Prefer pairing those files with the physical `cream` refs when generating more media.

**06 vs 02:** Product **02** is **ribbed knit** X-strap ballet. Product **06** is the same strap layout but **smooth satin/matte white** fabric (no knit ribs).

Source: WhatsApp photos 2026-10-13 (Simon).
