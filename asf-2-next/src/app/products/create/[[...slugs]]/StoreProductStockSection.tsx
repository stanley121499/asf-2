"use client";

import { Button, Label, TextInput } from "flowbite-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useAlertContext } from "@/context/AlertContext";
import {
  useProductColorContext,
  type ProductColor,
} from "@/context/product/ProductColorContext";
import {
  useProductSizeContext,
  type ProductSize,
} from "@/context/product/ProductSizeContext";
import { isSoftDeletedRow } from "@/utils/softDeleteRuntime";

/** Active store location row used for the stock matrix. */
type ActiveStore = {
  id: string;
  name: string;
  mall_name: string;
  active: boolean;
};

/** One editable cell in the store × variant matrix. */
type StockCellKey = string;

/** Draft count keyed by `${storeId}|${colorId ?? "null"}|${sizeId ?? "null"}`. */
type DraftCounts = Record<StockCellKey, number>;

type VariantCombo = {
  colorId: string | null;
  sizeId: string | null;
  colorLabel: string;
  sizeLabel: string;
};

type StoreProductStockListItem = {
  id: string;
  storeLocationId: string;
  storeName: string;
  mallName: string;
  productId: string;
  colorId: string | null;
  sizeId: string | null;
  count: number;
  updatedAt: string;
};

type StoreProductStockSectionProps = {
  /** Product id when editing; null/undefined on create (section shows save-first hint). */
  productId: string | null | undefined;
};

/**
 * Builds a stable draft key for a store × color × size cell.
 */
function cellKey(
  storeLocationId: string,
  colorId: string | null,
  sizeId: string | null
): StockCellKey {
  const colorPart = colorId === null ? "null" : colorId;
  const sizePart = sizeId === null ? "null" : sizeId;
  return [storeLocationId, colorPart, sizePart].join("|");
}

/**
 * Builds variant combinations from active colors/sizes.
 * Color-only catalogs use null size_id (matches current seed data).
 */
function buildVariantCombos(
  colors: ProductColor[],
  sizes: ProductSize[]
): VariantCombo[] {
  if (colors.length === 0 && sizes.length === 0) {
    return [];
  }
  if (colors.length > 0 && sizes.length > 0) {
    const combos: VariantCombo[] = [];
    for (const color of colors) {
      for (const size of sizes) {
        combos.push({
          colorId: color.id,
          sizeId: size.id,
          colorLabel: color.color,
          sizeLabel: size.size,
        });
      }
    }
    return combos;
  }
  if (colors.length > 0) {
    return colors.map((color) => ({
      colorId: color.id,
      sizeId: null,
      colorLabel: color.color,
      sizeLabel: "—",
    }));
  }
  return sizes.map((size) => ({
    colorId: null,
    sizeId: size.id,
    colorLabel: "—",
    sizeLabel: size.size,
  }));
}

/**
 * Admin section: per-store inventory matrix for a product (门店库存 / Store stock).
 * Saves via PUT /api/store-product-stock; does not touch global product_stock.
 */
const StoreProductStockSection: React.FC<StoreProductStockSectionProps> = ({
  productId,
}) => {
  const { showAlert } = useAlertContext();
  const { productColors } = useProductColorContext();
  const { productSizes } = useProductSizeContext();

  const [stores, setStores] = useState<ActiveStore[]>([]);
  const [draftCounts, setDraftCounts] = useState<DraftCounts>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const colorsForProduct = useMemo((): ProductColor[] => {
    if (typeof productId !== "string" || productId.length === 0) {
      return [];
    }
    return productColors.filter(
      (c) =>
        c.product_id === productId &&
        c.active === true &&
        !isSoftDeletedRow(c)
    );
  }, [productColors, productId]);

  const sizesForProduct = useMemo((): ProductSize[] => {
    if (typeof productId !== "string" || productId.length === 0) {
      return [];
    }
    return productSizes.filter(
      (s) =>
        s.product_id === productId &&
        s.active === true &&
        !isSoftDeletedRow(s)
    );
  }, [productId, productSizes]);

  const variants = useMemo(
    () => buildVariantCombos(colorsForProduct, sizesForProduct),
    [colorsForProduct, sizesForProduct]
  );

  /**
   * Loads active stores and existing store stock into the draft matrix.
   */
  const loadData = useCallback(async (): Promise<void> => {
    if (typeof productId !== "string" || productId.length === 0) {
      return;
    }
    setLoading(true);
    try {
      const [storesRes, stockRes] = await Promise.all([
        fetch("/api/store-locations"),
        fetch(`/api/store-product-stock?productId=${encodeURIComponent(productId)}`),
      ]);

      if (!storesRes.ok) {
        showAlert("Failed to load store locations", "error");
        return;
      }
      if (!stockRes.ok) {
        const errBody: unknown = await stockRes.json().catch(() => null);
        const message =
          typeof errBody === "object" &&
          errBody !== null &&
          "error" in errBody &&
          typeof (errBody as { error: unknown }).error === "string"
            ? (errBody as { error: string }).error
            : "Failed to load store stock";
        showAlert(message, "error");
        return;
      }

      const storesJson: unknown = await storesRes.json();
      const stockJson: unknown = await stockRes.json();

      const storeList =
        typeof storesJson === "object" &&
        storesJson !== null &&
        "storeLocations" in storesJson &&
        Array.isArray((storesJson as { storeLocations: unknown }).storeLocations)
          ? ((storesJson as { storeLocations: ActiveStore[] }).storeLocations)
          : [];

      const activeStores = storeList.filter((s) => s.active === true);
      setStores(activeStores);

      const stockRows =
        typeof stockJson === "object" &&
        stockJson !== null &&
        "rows" in stockJson &&
        Array.isArray((stockJson as { rows: unknown }).rows)
          ? ((stockJson as { rows: StoreProductStockListItem[] }).rows)
          : [];

      const nextDraft: DraftCounts = {};
      for (const store of activeStores) {
        for (const variant of buildVariantCombos(colorsForProduct, sizesForProduct)) {
          nextDraft[cellKey(store.id, variant.colorId, variant.sizeId)] = 0;
        }
      }
      for (const row of stockRows) {
        nextDraft[cellKey(row.storeLocationId, row.colorId, row.sizeId)] = row.count;
      }
      setDraftCounts(nextDraft);
    } catch (error: unknown) {
      console.error("StoreProductStockSection loadData", error);
      showAlert("Failed to load store stock", "error");
    } finally {
      setLoading(false);
    }
  }, [colorsForProduct, productId, showAlert, sizesForProduct]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /**
   * Updates one cell count in the draft matrix.
   */
  const handleCountChange = useCallback(
    (key: StockCellKey, rawValue: string): void => {
      const parsed = Number.parseInt(rawValue, 10);
      const nextCount = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
      setDraftCounts((prev) => ({ ...prev, [key]: nextCount }));
    },
    []
  );

  /**
   * Upserts all non-empty draft cells (and zeros that already exist as edits).
   * Sends the full matrix so staff can set zeros intentionally.
   */
  const handleSave = useCallback(async (): Promise<void> => {
    if (typeof productId !== "string" || productId.length === 0) {
      return;
    }
    if (stores.length === 0 || variants.length === 0) {
      showAlert("No stores or variants to save", "error");
      return;
    }

    const rows = stores.flatMap((store) =>
      variants.map((variant) => ({
        storeLocationId: store.id,
        colorId: variant.colorId,
        sizeId: variant.sizeId,
        count: draftCounts[cellKey(store.id, variant.colorId, variant.sizeId)] ?? 0,
      }))
    );

    setSaving(true);
    try {
      const response = await fetch("/api/store-product-stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rows }),
      });
      if (!response.ok) {
        const errBody: unknown = await response.json().catch(() => null);
        const message =
          typeof errBody === "object" &&
          errBody !== null &&
          "error" in errBody &&
          typeof (errBody as { error: unknown }).error === "string"
            ? (errBody as { error: string }).error
            : "Failed to save store stock";
        showAlert(message, "error");
        return;
      }
      showAlert("Store stock saved", "success");
      await loadData();
    } catch (error: unknown) {
      console.error("StoreProductStockSection save", error);
      showAlert("Failed to save store stock", "error");
    } finally {
      setSaving(false);
    }
  }, [draftCounts, loadData, productId, showAlert, stores, variants]);

  if (typeof productId !== "string" || productId.length === 0) {
    return (
      <div className="mt-4 rounded border border-dashed border-gray-300 p-4 dark:border-gray-600">
        <Label>门店库存 / Store stock</Label>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Save the product first, then set per-store inventory by color and size.
        </p>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="mt-4 rounded border border-dashed border-gray-300 p-4 dark:border-gray-600">
        <Label>门店库存 / Store stock</Label>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Add at least one color or size above before editing store stock.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <Label>门店库存 / Store stock</Label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Counts per active store × color × size. Separate from Stock Place / Stock Code.
          </p>
        </div>
        <Button
          color="primary"
          size="sm"
          disabled={saving || loading || stores.length === 0}
          onClick={() => {
            void handleSave();
          }}
        >
          {saving ? "Saving…" : "Save store stock"}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading store stock…</p>
      ) : stores.length === 0 ? (
        <p className="text-sm text-gray-500">No active store locations found.</p>
      ) : (
        <div className="max-h-96 overflow-auto rounded border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 font-medium">Store</th>
                <th className="px-3 py-2 font-medium">Mall</th>
                <th className="px-3 py-2 font-medium">Color</th>
                <th className="px-3 py-2 font-medium">Size</th>
                <th className="px-3 py-2 font-medium">Count</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) =>
                variants.map((variant) => {
                  const key = cellKey(store.id, variant.colorId, variant.sizeId);
                  return (
                    <tr
                      key={key}
                      className="border-t border-gray-100 dark:border-gray-700"
                    >
                      <td className="px-3 py-1.5 whitespace-nowrap">{store.name}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{store.mall_name}</td>
                      <td className="px-3 py-1.5">
                        <span className="inline-flex items-center gap-1">
                          {variant.colorId !== null ? (
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: variant.colorLabel }}
                              title={variant.colorLabel}
                            />
                          ) : null}
                          {variant.colorLabel}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">{variant.sizeLabel}</td>
                      <td className="px-3 py-1.5">
                        <TextInput
                          type="number"
                          min={0}
                          sizing="sm"
                          className="w-24"
                          value={String(draftCounts[key] ?? 0)}
                          onChange={(e) => handleCountChange(key, e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StoreProductStockSection;
