import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";
import { Product } from "./ProductContext";

export type ProductStock =
  Database["public"]["Tables"]["product_stock"]["Row"] & {
    product: Product;
    product_stock: Database["public"]["Tables"]["product_stock"]["Row"];
  };
export type ProductStocks = {
  productStocks: ProductStock[];
};
export type ProductStockInsert =
  Database["public"]["Tables"]["product_stock"]["Insert"];
export type ProductStockUpdate =
  Database["public"]["Tables"]["product_stock"]["Update"];

interface ProductStockContextProps {
  productStocks: ProductStock[];
  createProductStock: (
    productStockLog: ProductStockInsert
  ) => Promise<ProductStock | undefined>;
  updateProductStock: (
    productStockLog: ProductStockUpdate
  ) => Promise<void>;
  deleteProductStock: (productStockLogId: string) => Promise<void>;
  loading: boolean;
}

const ProductStockContext = createContext<ProductStockContextProps>(
  undefined!
);

export function ProductStockProvider({ children }: PropsWithChildren) {
  const [productStocks, setProductStocks] = useState<ProductStock[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    const fetchProductStocks = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("product_stock")
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          showAlert(error.message, "error");
          console.error(error);
        }
        setProductStocks(data || []);
        setLoading(false);
      } catch (error) {
        showAlert(
          "An error occurred while fetching product stock logs",
          "error"
        );
      }
    };

    fetchProductStocks();
  }, [showAlert]);

  async function createProductStock(
    productStockLog: ProductStockInsert
  ): Promise<ProductStock | undefined> {
    try {
      const { data, error } = await supabase
        .from("product_stock")
        .insert(productStockLog)
        .single();
      if (error) {
        showAlert(error.message, "error");
        console.error(error);
        return undefined;
      }
      setProductStocks([data!, ...productStocks]);
      return data!;
    } catch (error) {
      showAlert("An error occurred while creating product stock log", "error");
      return undefined;
    }
  }

  async function updateProductStock(
    productStockLog: ProductStockUpdate
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("product_stock")
        .update(productStockLog)
        .eq("id", productStockLog.id);
      if (error) {
        showAlert(error.message, "error");
        console.error(error);
      }
      const updatedProductStocks = productStocks.map((p) =>
        p.id === productStockLog.id ? { ...p, ...productStockLog } : p
      );
      setProductStocks(updatedProductStocks);
    } catch (error) {
      showAlert("An error occurred while updating product stock log", "error");
    }
  }

  async function deleteProductStock(
    productStockLogId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("product_stock")
        .delete()
        .eq("id", productStockLogId);
      if (error) {
        showAlert(error.message, "error");
        console.error(error);
      }
      setProductStocks(
        productStocks.filter((p) => p.id !== productStockLogId)
      );
    } catch (error) {
      showAlert("An error occurred while deleting product stock log", "error");
    }
  }

  return (
    <ProductStockContext.Provider
      value={{
        productStocks,
        createProductStock,
        updateProductStock,
        deleteProductStock,
        loading,
      }}>
      {children}
    </ProductStockContext.Provider>
  );
}

export const useProductStockContext = () => {
  const context = useContext(ProductStockContext);
  if (!context) {
    throw new Error(
      "useProductStockContext must be used within a ProductStockProvider"
    );
  }
  return context;
};
