/**
 * Light/dark theme bridge for MODEL MATCH splash HTML previews.
 * Swaps SVG background + mark fills; keeps pink accent unchanged.
 */
(function p2mThemeBridge() {
  "use strict";

  const STORAGE_KEY = "p2m-splash-theme";
  const MARK_IDS = [
    "letter-m",
    "word-model",
    "word-match",
    "model-m",
    "model-o",
    "model-d",
    "model-e",
    "model-l",
    "match-m",
    "match-a",
    "match-t",
    "match-c",
    "match-h",
  ];
  const ACCENT = "#ee73c4";

  /**
   * @returns {"light" | "dark"}
   */
  function readThemeFromUrl() {
    const value = new URLSearchParams(window.location.search).get("theme");
    if (value === "light" || value === "dark") {
      return value;
    }
    return null;
  }

  /**
   * @returns {"light" | "dark"}
   */
  function getTheme() {
    const fromUrl = readThemeFromUrl();
    if (fromUrl) {
      return fromUrl;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return "dark";
  }

  /**
   * @param {"light" | "dark"} theme
   */
  function setTheme(theme) {
    document.documentElement.dataset.p2mTheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
    applyThemeToDocument(theme);
    syncToggleButtons(theme);
    syncVariationLinks(theme);
  }

  /**
   * @param {"light" | "dark"} theme
   */
  function colorsForTheme(theme) {
    return {
      bg: theme === "light" ? "#ffffff" : "#000000",
      mark: theme === "light" ? "#000000" : "#ffffff",
      accent: ACCENT,
    };
  }

  /**
   * @param {SVGSVGElement} svg
   * @param {"light" | "dark"} theme
   */
  function applyThemeToSvg(svg, theme) {
    const colors = colorsForTheme(theme);
    const rect = svg.querySelector("rect");
    if (rect) {
      rect.setAttribute("fill", colors.bg);
    }

    for (const id of MARK_IDS) {
      const group = svg.getElementById(id);
      if (!group) {
        continue;
      }
      const paths = group.querySelectorAll("path");
      for (const path of paths) {
        path.setAttribute("fill", colors.mark);
      }
    }

    const accent = svg.getElementById("number-2");
    if (accent) {
      const paths = accent.querySelectorAll("path");
      for (const path of paths) {
        path.setAttribute("fill", colors.accent);
      }
    }
  }

  /**
   * Patch a data-URI SVG used by atomic motion thumbnails.
   * @param {string} src
   * @param {"light" | "dark"} theme
   * @returns {string}
   */
  function patchDataUri(src, theme) {
    if (!src.startsWith("data:image/svg+xml")) {
      return src;
    }
    const colors = colorsForTheme(theme);
    const comma = src.indexOf(",");
    if (comma < 0) {
      return src;
    }
    const encoded = src.slice(comma + 1);
    let markup = "";
    try {
      markup = decodeURIComponent(encoded);
    } catch (error) {
      return src;
    }

    markup = markup.replace(
      /<rect width="100%" height="100%" fill="[^"]*"\/>/,
      `<rect width="100%" height="100%" fill="${colors.bg}"/>`
    );
    markup = markup.replace(/fill="#ffffff"/gi, `fill="${colors.mark}"`);
    markup = markup.replace(/fill="#ee73c4"/gi, `fill="${colors.accent}"`);

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  }

  /**
   * @param {"light" | "dark"} theme
   */
  function applyThemeToDocument(theme) {
    const docColors = colorsForTheme(theme);
    document.documentElement.style.setProperty("--bg", docColors.bg);
    document.documentElement.style.setProperty("--text-primary", docColors.mark);

    const root = document.getElementById("logo-root");
    if (root) {
      const svg = root.querySelector("svg");
      if (svg) {
        applyThemeToSvg(svg, theme);
      }
    }

    const atomImages = document.querySelectorAll(".atom-stage img");
    for (const img of atomImages) {
      if (typeof img.src === "string" && img.src.startsWith("data:image/svg+xml")) {
        img.src = patchDataUri(img.src, theme);
      }
    }
  }

  /**
   * @param {"light" | "dark"} theme
   */
  function syncToggleButtons(theme) {
    const buttons = document.querySelectorAll("[data-p2m-theme-btn]");
    for (const button of buttons) {
      const value = button.getAttribute("data-p2m-theme-btn");
      button.setAttribute("aria-pressed", value === theme ? "true" : "false");
    }
  }

  /**
   * Keep variation cards pointing at the active theme.
   * @param {"light" | "dark"} theme
   */
  function syncVariationLinks(theme) {
    const links = document.querySelectorAll("a.card[href]");
    for (const link of links) {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http")) {
        continue;
      }
      const url = new URL(href, window.location.href);
      url.searchParams.set("theme", theme);
      link.setAttribute("href", `${url.pathname}${url.search}`);
    }
  }

  function mountThemeBar() {
    if (document.getElementById("p2m-theme-bar")) {
      return;
    }

    const bar = document.createElement("div");
    bar.id = "p2m-theme-bar";
    bar.className = "p2m-theme-bar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Preview theme");

    const darkBtn = document.createElement("button");
    darkBtn.type = "button";
    darkBtn.textContent = "Dark";
    darkBtn.setAttribute("data-p2m-theme-btn", "dark");

    const lightBtn = document.createElement("button");
    lightBtn.type = "button";
    lightBtn.textContent = "Light";
    lightBtn.setAttribute("data-p2m-theme-btn", "light");

    darkBtn.addEventListener("click", () => setTheme("dark"));
    lightBtn.addEventListener("click", () => setTheme("light"));

    bar.appendChild(darkBtn);
    bar.appendChild(lightBtn);
    document.body.appendChild(bar);
    document.body.classList.add("p2m-has-theme-bar");
  }

  function watchHeroRerender() {
    const root = document.getElementById("logo-root");
    if (!root) {
      return;
    }
    const observer = new MutationObserver(() => {
      applyThemeToDocument(getTheme());
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  function init() {
    mountThemeBar();
    setTheme(getTheme());
    watchHeroRerender();

    window.P2MTheme = {
      getTheme,
      setTheme,
      applyThemeToDocument,
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
