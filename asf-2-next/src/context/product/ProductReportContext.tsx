"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "../AlertContext";

export type ProductReport =
  Database["public"]["Tables"]["product_reports"]["Row"];
export type ProductReports = {
  product_reports: ProductReport[];
};
export type ProductReportInsert =
  Database["public"]["Tables"]["product_reports"]["Insert"];
export type ProductReportUpdate =
  Database["public"]["Tables"]["product_reports"]["Update"];

interface ProductReportContextProps {
  product_reports: ProductReport[];
  createProductReport: (
    product_report: ProductReportInsert
  ) => Promise<ProductReport | undefined>;
  updateProductReport: (product_report: ProductReportUpdate) => Promise<void>;
  deleteProductReport: (product_reportId: string) => Promise<void>;
  loading: boolean;
}

const ProductReportContext = createContext<ProductReportContextProps>(
  undefined!
);

export function ProductReportProvider({ children }: PropsWithChildren) {
  const [product_reports, setProductReports] = useState<ProductReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  const showAlertRef = useRef<typeof showAlert | null>(null);
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  const fetchProductReports = useCallback(async () => {
    const { data, error } = await supabase.from("product_reports").select("*");

    if (error) {
      showAlertRef.current?.(error.message, "error");
    } else {
      setProductReports(data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProductReports();
  }, [fetchProductReports]);

  const createProductReport = useCallback(async (product_report: ProductReportInsert) => {
    const { data, error } = await supabase
      .from("product_reports")
      .insert(product_report)
      .select("*") 
      .single();

    if (error) {
      showAlertRef.current?.(error.message, "error");
    } else {
      showAlertRef.current?.("Product report created successfully", "success");
      return data;
    }
  }, []);

  const updateProductReport = useCallback(async (product_report: ProductReportUpdate) => {
    const { error } = await supabase
      .from("product_reports")
      .update(product_report)
      .match({ id: product_report.id });

    if (error) {
      showAlertRef.current?.(error.message, "error");
    } else {
      showAlertRef.current?.("Product report updated successfully", "success");
    }
  }, []);

  const deleteProductReport = useCallback(async (product_reportId: string) => {
    const { error } = await supabase
      .from("product_reports")
      .delete()
      .match({ id: product_reportId });

    if (error) {
      showAlertRef.current?.(error.message, "error");
    } else {
      showAlertRef.current?.("Product report deleted successfully", "success");
    }
  }, []);

  const value = useMemo<ProductReportContextProps>(
    () => ({
      product_reports,
      createProductReport,
      updateProductReport,
      deleteProductReport,
      loading,
    }),
    [
      product_reports,
      loading,
      createProductReport,
      updateProductReport,
      deleteProductReport,
    ]
  );

  return (
    <ProductReportContext.Provider value={value}>
      {children}
    </ProductReportContext.Provider>
  );
}

export function useProductReportContext() {
  const context = useContext(ProductReportContext);

  if (!context) {
    throw new Error(
      "useProductReportContext must be used within a ProductReportProvider"
    );
  }

  return context;
}

