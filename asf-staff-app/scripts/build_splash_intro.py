#!/usr/bin/env python3
"""Bundle letter-cascade splash HTML for the staff app WebView.

Sources live in asf-customer-app (Pixel2Motion output); this script only
writes the self-contained intro bundle into asf-staff-app.
"""

from __future__ import annotations

import re
from pathlib import Path

STAFF_ROOT = Path(__file__).resolve().parents[1]
CUSTOMER_ROOT = STAFF_ROOT.parent / "asf-customer-app"
SRC_HTML = (
    CUSTOMER_ROOT
    / "assets"
    / "splash"
    / "pixel2motion-output"
    / "logo_motion_letters.html"
)
THEME_JS = CUSTOMER_ROOT / "assets" / "splash" / "pixel2motion-output" / "theme-bridge.js"
OUT_HTML = STAFF_ROOT / "assets" / "splash" / "intro" / "splash-intro.html"

MOBILE_CSS = """
/* Mobile embed — logo only, no demo chrome */
body.p2m-mobile-embed {
  padding: 0;
  gap: 0;
}
body.p2m-mobile-embed .atomic-motions,
body.p2m-mobile-embed .principles,
body.p2m-mobile-embed .controls,
body.p2m-mobile-embed .footer,
body.p2m-mobile-embed #p2m-theme-bar {
  display: none !important;
}
body.p2m-mobile-embed #logo-root {
  width: min(88vw, 420px);
  cursor: default;
}
"""

MOBILE_INIT_PATCH = """
    document.body.classList.add("p2m-mobile-embed");
    document.documentElement.classList.add("p2m-chromeless");

    function notifyComplete() {
      const payload = JSON.stringify({ type: "p2m:complete" });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(payload);
      }
    }

    function startMobileIntro() {
      renderHero();
      setPlaybackRate(1.0, true);
      window.__p2mReady = true;
      const holdMs = Math.round(DURATION / Math.max(playbackRate, 0.25)) + 120;
      window.setTimeout(notifyComplete, holdMs);
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      renderHero();
      try {
        for (const animation of heroAnimations()) {
          animation.finish();
        }
      } catch (err) {
        /* ignore */
      }
      window.__p2mReady = true;
      window.setTimeout(notifyComplete, 80);
    } else {
      startMobileIntro();
    }
"""


def main() -> int:
    if not SRC_HTML.exists():
        raise SystemExit(
            f"Missing source HTML: {SRC_HTML}\n"
            "Run Pixel2Motion in asf-customer-app first, or npm run build:splash there."
        )

    html = SRC_HTML.read_text(encoding="utf-8")
    theme_js = THEME_JS.read_text(encoding="utf-8") if THEME_JS.exists() else ""

    html = html.replace(
        '<link rel="stylesheet" href="theme-bridge.css">',
        "",
    )
    html = html.replace(
        '<script src="theme-bridge.js"></script>',
        "",
    )

    html = html.replace("</head>", f"  <style>{MOBILE_CSS}</style>\n</head>", 1)

    if theme_js:
        html = html.replace(
            "</body>",
            f"  <script>\n{theme_js}\n  </script>\n</body>",
            1,
        )

    html = re.sub(
        r"setupAtomImages\(\);\s*setupAtoms\(\);\s*setPlaybackRate\(0\.45, false\);\s*renderHero\(\);\s*applyQaMode\(\);",
        MOBILE_INIT_PATCH.strip(),
        html,
        count=1,
    )

    html = html.replace(
        "mountThemeBar();",
        "/* theme bar omitted in mobile embed */",
    )
    html = html.replace('document.body.classList.add("p2m-has-theme-bar");', "")

    OUT_HTML.parent.mkdir(parents=True, exist_ok=True)
    OUT_HTML.write_text(html, encoding="utf-8")
    print(f"Wrote {OUT_HTML} ({OUT_HTML.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
