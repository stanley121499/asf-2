import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Spinner } from "flowbite-react";
import { supabase } from "../../utils/supabaseClient";
import type { Database } from "../../database.types";
import { useAlertContext } from "../../context/AlertContext";
import { useProductContext } from "../../context/product/ProductContext";
import { isSoftDeletedRow, readDeletedAt } from "../../utils/softDeleteRuntime";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

/**
 * Admin page to view and restore soft-deleted products.
 *
 * Notes:
 * - This page intentionally queries Supabase directly for deleted records because
 *   `ProductContext` filters out deleted products for normal app usage.
 */
const DeletedProductsPage: React.FC = () => {
  const { showAlert } = useAlertContext();
  const { restoreProduct } = useProductContext();

  const [loading, setLoading] = useState<boolean>(true);
  const [deletedProducts, setDeletedProducts] = useState<ProductRow[]>([]);

  const deletedCount: number = deletedProducts.length;

  const fetchDeletedProducts = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setDeletedProducts(data ?? []);
    } catch (error: unknown) {
      console.error("Failed to fetch deleted products:", error);
      showAlert("Failed to fetch deleted products", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    void fetchDeletedProducts();
  }, [fetchDeletedProducts]);

  const handleRestore = useCallback(
    async (productId: string): Promise<void> => {
      if (productId.trim().length === 0) {
        showAlert("Product id is required to restore.", "error");
        return;
      }

      try {
        await restoreProduct(productId);
        // Optimistically remove from this list; the admin view is "deleted only".
        setDeletedProducts((prev) => prev.filter((p) => p.id !== productId));
      } catch (error: unknown) {
        // restoreProduct already alerts; we keep a console entry for debugging.
        console.error("Restore product failed:", error);
      }
    },
    [restoreProduct, showAlert]
  );

  const items = useMemo(() => {
    return deletedProducts
      .filter((p) => isSoftDeletedRow(p))
      .map((p) => {
        const deletedAtIso = readDeletedAt(p);
        const deletedAtText =
          typeof deletedAtIso === "string" && deletedAtIso.length > 0
            ? new Date(deletedAtIso).toLocaleString()
            : "Unknown";

        return { product: p, deletedAtText };
      });
  }, [deletedProducts]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Deleted Products
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {deletedCount === 1 ? "1 product" : `${deletedCount} products`}
          </p>
        </div>
        <Button color="light" onClick={() => void fetchDeletedProducts()}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Spinner size="md" />
          <span>Loading deleted products…</span>
        </div>
      ) : deletedProducts.length === 0 ? (
        <Card>
          <p className="text-gray-700 dark:text-gray-200">
            No deleted products found.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(({ product, deletedAtText }) => (
            <Card key={product.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {product.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Deleted: {deletedAtText}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    color="blue"
                    onClick={() => void handleRestore(product.id)}
                  >
                    Restore
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeletedProductsPage;


