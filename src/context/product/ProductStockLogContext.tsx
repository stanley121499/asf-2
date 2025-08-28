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

export type ProductStockLog =
  Database["public"]["Tables"]["product_stock_logs"]["Row"] & {
    product: Product;
    product_stock: Database["public"]["Tables"]["product_stock"]["Row"];
  };
export type ProductStockLogs = {
  productStockLogs: ProductStockLog[];
};
export type ProductStockLogInsert =
  Database["public"]["Tables"]["product_stock_logs"]["Insert"];
export type ProductStockLogUpdate =
  Database["public"]["Tables"]["product_stock_logs"]["Update"];

interface ProductStockLogContextProps {
  productStockLogs: ProductStockLog[];
  createProductStockLog: (
    productStockLog: ProductStockLogInsert
  ) => Promise<ProductStockLog | undefined>;
  updateProductStockLog: (
    productStockLog: ProductStockLogUpdate
  ) => Promise<void>;
  deleteProductStockLog: (productStockLogId: string) => Promise<void>;
  loading: boolean;
}

const ProductStockLogContext = createContext<ProductStockLogContextProps>(
  undefined!
);

export function ProductStockLogProvider({ children }: PropsWithChildren) {
  const [productStockLogs, setProductStockLogs] = useState<ProductStockLog[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    const fetchProductStockLogs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("product_stock_logs")
          .select("*, product_stock:product_stock_id(*)")
          .order("created_at", { ascending: false });

        if (error) {
          showAlert(error.message, "error");
          console.error(error);
        }
        
        // setProductStockLogs(data || []);
        setLoading(false);
      } catch (error) {
        showAlert(
          "An error occurred while fetching product stock logs",
          "error"
        );
      }
    };

    fetchProductStockLogs();

    const handleChanges = async (payload: any) => {
      if (payload.eventType === "INSERT") {
        const productStock = await supabase
          .from("product_stock")
          .select("*")
          .eq("id", payload.new.product_stock_id)
          .single();

        if (productStock.error) {
          showAlert(productStock.error.message, "error");
          console.error(productStock.error);
          return;
        }

        setProductStockLogs((prev) => [
          {
            ...payload.new,
            product_stock: productStock.data,
          },
          ...prev,
        ]);
        
      }
      if (payload.eventType === "UPDATE") {
        setProductStockLogs(
          productStockLogs.map((p) =>
            p.id === payload.new.id ? payload.new : p
          )
        );
      }
      if (payload.eventType === "DELETE") {
        setProductStockLogs(
          productStockLogs.filter((p) => p.id !== payload.old.id)
        );
      }
    };

    const subscription = supabase
      .channel("product_stock_logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_stock_logs" },
        (payload) => {
          console.log(payload);
          handleChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  async function createProductStockLog(
    productStockLog: ProductStockLogInsert
  ): Promise<ProductStockLog | undefined> {
    try {
      const { data, error } = await supabase
        .from("product_stock_logs")
        .insert(productStockLog)
        .single();
      if (error) {
        showAlert(error.message, "error");
        console.error(error);
        return undefined;
      }
      return data!;
    } catch (error) {
      showAlert("An error occurred while creating product stock log", "error");
      return undefined;
    }
  }

  async function updateProductStockLog(
    productStockLog: ProductStockLogUpdate
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("product_stock_logs")
        .update(productStockLog)
        .eq("id", productStockLog.id!);
      if (error) {
        showAlert(error.message, "error");
        console.error(error);
      }
      const updatedProductStockLogs = productStockLogs.map((p) =>
        p.id === productStockLog.id ? { ...p, ...productStockLog } : p
      );
      setProductStockLogs(updatedProductStockLogs);
    } catch (error) {
      showAlert("An error occurred while updating product stock log", "error");
    }
  }

  async function deleteProductStockLog(
    productStockLogId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("product_stock_logs")
        .delete()
        .eq("id", productStockLogId);
      if (error) {
        showAlert(error.message, "error");
        console.error(error);
      }
      setProductStockLogs(
        productStockLogs.filter((p) => p.id !== productStockLogId)
      );
    } catch (error) {
      showAlert("An error occurred while deleting product stock log", "error");
    }
  }

  return (
    <ProductStockLogContext.Provider
      value={{
        productStockLogs,
        createProductStockLog,
        updateProductStockLog,
        deleteProductStockLog,
        loading,
      }}>
      {children}
    </ProductStockLogContext.Provider>
  );
}

export const useProductStockLogContext = () => {
  const context = useContext(ProductStockLogContext);
  if (!context) {
    throw new Error(
      "useProductStockLogContext must be used within a ProductStockLogProvider"
    );
  }
  return context;
};
