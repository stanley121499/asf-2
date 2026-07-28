import type { ReactElement } from "react";

/**
 * Noir cart chrome overlay for {@link CartChromeHost}.
 *
 * Noir uses **headers-everywhere** bags (`CartButton` inside Home / Highlights /
 * Profile hub chrome, Classic Shop fallback headers, and `SubPageHeader` via
 * `showCart`) — not a floating FAB. The host overlay is therefore a no-op.
 * Auth and checkout never mount `CartChromeHost`, so they stay bag-free.
 *
 * Agent 6 will keep this pattern when shipping Noir Shop + ProductDetail.
 */
export function NoirCartChrome(): ReactElement | null {
  return null;
}
