import type { ThemeId, ThemePack, ThemeTokens } from "@/themes/types";
import { DEFAULT_THEME_ID, isThemeId } from "@/themes/types";

/**
 * Cache of already-required theme packs so switching themes does not re-init
 * Metro modules unnecessarily.
 */
const packCache = new Map<ThemeId, ThemePack>();

/**
 * Cache of token-only loads for staff Appearance swatches — avoids requiring
 * every inactive pack's full screen tree just to preview colors.
 */
const tokensCache = new Map<ThemeId, ThemeTokens>();

/**
 * Lazily requires a single theme pack. Metro still ships inactive packs in the
 * bundle graph, but module bodies (heavy screen trees) only run when that
 * theme is first resolved — a meaningful cold-start win vs static imports of
 * all four packs in `registry.ts`.
 *
 * @param themeId - Pack to load.
 * @returns The theme pack for `themeId`.
 */
function loadThemePack(themeId: ThemeId): ThemePack {
  const cached = packCache.get(themeId);
  if (cached !== undefined) {
    return cached;
  }

  let pack: ThemePack;
  switch (themeId) {
    case "classic": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy Metro require
      const mod = require("@/themes/classic") as { classicPack: ThemePack };
      pack = mod.classicPack;
      break;
    }
    case "atelier": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy Metro require
      const mod = require("@/themes/atelier") as { atelierPack: ThemePack };
      pack = mod.atelierPack;
      break;
    }
    case "noir": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy Metro require
      const mod = require("@/themes/noir") as { noirPack: ThemePack };
      pack = mod.noirPack;
      break;
    }
    case "storefront": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy Metro require
      const mod = require("@/themes/storefront") as { storefrontPack: ThemePack };
      pack = mod.storefrontPack;
      break;
    }
    default: {
      const _exhaustive: never = themeId;
      void _exhaustive;
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy Metro require
      const mod = require("@/themes/classic") as { classicPack: ThemePack };
      pack = mod.classicPack;
      break;
    }
  }

  packCache.set(themeId, pack);
  tokensCache.set(themeId, pack.tokens);
  return pack;
}

/**
 * Loads only the token module for a theme (no screen / CartChrome graph).
 * Prefer this for Appearance swatches so opening Theme does not evaluate
 * every inactive pack's ProfileHub/Shop trees.
 *
 * @param themeId - Pack whose tokens to read.
 * @returns Token palette for `themeId`.
 */
function loadThemeTokens(themeId: ThemeId): ThemeTokens {
  const cached = tokensCache.get(themeId);
  if (cached !== undefined) {
    return cached;
  }

  const packCached = packCache.get(themeId);
  if (packCached !== undefined) {
    tokensCache.set(themeId, packCached.tokens);
    return packCached.tokens;
  }

  let tokens: ThemeTokens;
  switch (themeId) {
    case "classic": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- tokens-only lazy require
      const mod = require("@/themes/classic/tokens") as {
        classicTokens: ThemeTokens;
      };
      tokens = mod.classicTokens;
      break;
    }
    case "atelier": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- tokens-only lazy require
      const mod = require("@/themes/atelier/tokens") as {
        atelierTokens: ThemeTokens;
      };
      tokens = mod.atelierTokens;
      break;
    }
    case "noir": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- tokens-only lazy require
      const mod = require("@/themes/noir/tokens") as {
        noirTokens: ThemeTokens;
      };
      tokens = mod.noirTokens;
      break;
    }
    case "storefront": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- tokens-only lazy require
      const mod = require("@/themes/storefront/tokens") as {
        storefrontTokens: ThemeTokens;
      };
      tokens = mod.storefrontTokens;
      break;
    }
    default: {
      const _exhaustive: never = themeId;
      void _exhaustive;
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- tokens-only lazy require
      const mod = require("@/themes/classic/tokens") as {
        classicTokens: ThemeTokens;
      };
      tokens = mod.classicTokens;
      break;
    }
  }

  tokensCache.set(themeId, tokens);
  return tokens;
}

/**
 * Resolves a theme pack from the registry, falling back to Classic.
 * Inactive packs are not required until first use.
 *
 * @param themeId - Requested theme id (may be invalid at runtime).
 */
export function getThemePack(themeId: ThemeId): ThemePack {
  if (!isThemeId(themeId)) {
    return loadThemePack(DEFAULT_THEME_ID);
  }
  return loadThemePack(themeId);
}

/**
 * Resolves theme tokens without loading the pack's screen modules.
 * Falls back to Classic tokens for invalid ids.
 *
 * @param themeId - Requested theme id (may be invalid at runtime).
 */
export function getThemeTokens(themeId: ThemeId): ThemeTokens {
  if (!isThemeId(themeId)) {
    return loadThemeTokens(DEFAULT_THEME_ID);
  }
  return loadThemeTokens(themeId);
}

/**
 * Eager map for callers that need `Record` semantics. Prefer {@link getThemePack}
 * so inactive packs stay unloaded until accessed.
 */
export const themeRegistry: Record<ThemeId, ThemePack> = {
  get classic(): ThemePack {
    return loadThemePack("classic");
  },
  get atelier(): ThemePack {
    return loadThemePack("atelier");
  },
  get noir(): ThemePack {
    return loadThemePack("noir");
  },
  get storefront(): ThemePack {
    return loadThemePack("storefront");
  },
};
