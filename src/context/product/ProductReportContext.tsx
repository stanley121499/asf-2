import React, {
  createContext,
  useContext,
  useEffect,
  useState,
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

  useEffect(() => {
    setLoading(true);
    fetchProductReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProductReports() {
    const { data, error } = await supabase.from("product_reports").select("*");

    if (error) {
      showAlert(error.message, "error");
    } else {
      setProductReports(data);
    }

    setLoading(false);
  }

  async function createProductReport(product_report: ProductReportInsert) {
    const { data, error } = await supabase
      .from("product_reports")
      .insert(product_report)
      .select("*") 
      .single();

    if (error) {
      showAlert(error.message, "error");
    } else {
      showAlert("Product report created successfully", "success");
      return data;
    }
  }

  async function updateProductReport(product_report: ProductReportUpdate) {
    const { error } = await supabase
      .from("product_reports")
      .update(product_report)
      .match({ id: product_report.id });

    if (error) {
      showAlert(error.message, "error");
    } else {
      showAlert("Product report updated successfully", "success");
    }
  }

  async function deleteProductReport(product_reportId: string) {
    const { error } = await supabase
      .from("product_reports")
      .delete()
      .match({ id: product_reportId });

    if (error) {
      showAlert(error.message, "error");
    } else {
      showAlert("Product report deleted successfully", "success");
    }
  }

  return (
    <ProductReportContext.Provider
      value={{
        product_reports,
        createProductReport,
        updateProductReport,
        deleteProductReport,
        loading,
      }}>
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
