/**
 * Tenant brand config for UI wordmarks (home navbar, ceremony, overlays).
 * V1: plain module constant. Swap to remote config later without changing call sites.
 */
export type TenantBrand = {
  displayName: string;
  tagline: string | null;
};

export const tenantBrand: TenantBrand = {
  displayName: "MODEL MATCH",
  tagline: null,
};
