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
import { ProductMedia } from "./ProductMediaContext";
import { Category } from "./CategoryContext";
import { useProductCategoryContext } from "./ProductCategoryContext";
import { ProductCategory } from "./ProductCategoryContext";
import { useProductSizeContext } from "./ProductSizeContext";
import { useProductColorContext } from "./ProductColorContext";
import { ProductColor } from "./ProductColorContext";
import { ProductSize } from "./ProductSizeContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/** Product with computed client-side fields */
export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  medias: ProductMedia[];
  product_categories: ProductCategory[];
  product_colors: ProductColor[];
  product_sizes: ProductSize[];
  stock_status: string;
  stock_count: number;
};
export type Products = { products: Product[] };
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

interface ProductContextProps {
  products: Product[];
  createProduct: (
    product: ProductInsert,
    selectedColors: string[],
    selectedSizes: string[],
    selectedCategories: Category[]
  ) => Promise<Product | undefined>;
  updateProduct: (
    product: ProductUpdate,
    selectedColors: string[],
    selectedSizes: string[],
    selectedCategories: Category[]
  ) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  loading: boolean;
  updateProductTimePost: (
    productId: string,
    _productTimePost: string
  ) => Promise<void>;
}

const ProductContext = createContext<ProductContextProps | undefined>(undefined);

export function ProductProvider({ children }: PropsWithChildren) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { createProductColor, updateProductColor } = useProductColorContext();
  const { createProductSize, updateProductSize } = useProductSizeContext();
  const { createProductCategory, deleteProductCategory } =
    useProductCategoryContext();

  useEffect(() => {
    setLoading(true);

    const fetchProducts = async () => {
      type RpcReturnedProduct = Database["public"]["Functions"]["fetch_products_with_computed_attributes"]["Returns"][number];
      const { data, error } = await supabase.rpc("fetch_products_with_computed_attributes");

      if (error) {
        showAlert(error.message, "error");
        console.error(error);
        return;
      }

      // Map RPC result to Product with safe defaults.
      // Merge base rows to include classification ids that RPC omits
      const ids: string[] = (data ?? []).map((p) => (p as { id: string }).id);
      let rowsById: Record<string, Database["public"]["Tables"]["products"]["Row"]> = {};
      if (ids.length > 0) {
        const { data: baseRows } = await supabase
          .from("products")
          .select("*")
          .in("id", ids);
        if (baseRows) {
          rowsById = Object.fromEntries(baseRows.map((r) => [r.id, r]));
        }
      }

      const mapped: Product[] = (data ?? []).map((p: RpcReturnedProduct) => {
        const id = (p as { id: string }).id;
        const base = rowsById[id];
        const row: Database["public"]["Tables"]["products"]["Row"] = base
          ? { ...base }
          : (p as unknown as Database["public"]["Tables"]["products"]["Row"]);

        return {
          ...row,
          medias: [],
          product_categories: [],
          product_colors: [],
          product_sizes: [],
          stock_status: (p as { stock_status?: string }).stock_status ?? "",
          stock_count: typeof (p as { stock_count?: number }).stock_count === "number" ? (p as { stock_count?: number }).stock_count as number : 0,
        };
      });
      setProducts(mapped);
    };

    fetchProducts();

    const mapRowToProduct = (
      row: Database["public"]["Tables"]["products"]["Row"]
    ): Product => ({
      ...row,
      medias: [],
      product_categories: [],
      product_colors: [],
      product_sizes: [],
      stock_status: "",
      stock_count: 0,
    });

    const handleChanges = (
      payload: RealtimePostgresChangesPayload<Database["public"]["Tables"]["products"]["Row"]>
    ) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new as Database["public"]["Tables"]["products"]["Row"];
        setProducts((prev) => [...prev, mapRowToProduct(inserted)]);
      }

      if (payload.eventType === "UPDATE") {
        const updated = payload.new as Database["public"]["Tables"]["products"]["Row"];
        setProducts((prev) => prev.map((product) => (product.id === updated.id ? mapRowToProduct(updated) : product)));
      }

      if (payload.eventType === "DELETE") {
        const removed = payload.old as Database["public"]["Tables"]["products"]["Row"];
        setProducts((prev) => prev.filter((product) => product.id !== removed.id));
      }
    };

    const subscription = supabase
      .channel("products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload: RealtimePostgresChangesPayload<Database["public"]["Tables"]["products"]["Row"]>) => {
        handleChanges(payload);
      })
      .subscribe();

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createProduct = async (
    product: ProductInsert,
    selectedColors: string[],
    selectedSizes: string[],
    selectedCategories: Category[]
  ) => {
    const { data, error } = await supabase
      .from("products")
      .insert(product)
      .select();
    if (error) {
      showAlert(error.message, "error");
      console.error(error);
      return;
    }

    const newProduct = data?.[0] as Database["public"]["Tables"]["products"]["Row"];

    selectedColors.forEach(async (color) => {
      await createProductColor({
        product_id: newProduct.id,
        color: color,
        active: true,
      });
    });

    selectedSizes.forEach(async (size) => {
      await createProductSize({
        product_id: newProduct.id,
        size: size,
        active: true,
      });
    });

    selectedCategories.forEach(async (category) => {
      await createProductCategory({
        product_id: newProduct.id,
        category_id: category.id,
      });
    });

    if (!data?.[0]) return undefined;
    return {
      ...(data[0] as Database["public"]["Tables"]["products"]["Row"]),
      medias: [],
      product_categories: [],
      product_colors: [],
      product_sizes: [],
      stock_status: "",
      stock_count: 0,
    } as Product;
  };

  const updateProduct = async (
    product: ProductUpdate,
    selectedColors: string[],
    selectedSizes: string[],
    selectedCategories: Category[]
  ) => {
    if (!product.id) {
      showAlert("Missing product id for update.", "error");
      return;
    }
    const { error } = await supabase
      .from("products")
      .update(product)
      .eq("id", product.id)
      .select()
      .single();
    if (error) {
      showAlert(error.message, "error");
      console.error(error);
    }

    // Check if there are any colors to update
    if (selectedColors.length > 0) {
      const { data: colors, error: colorError } = await supabase
        .from("product_colors")
        .select("id,color")
        .eq("product_id", product.id);
      if (colorError) {
        showAlert(colorError.message, "error");
        console.error(colorError);
        return;
      }

      // Update colors that are not in selectedColors
      colors?.forEach(async (color) => {
        if (selectedColors.findIndex((c) => c === color.color) === -1) {
          await updateProductColor({ id: color.id, active: false });
        } else {
          await updateProductColor({ id: color.id, active: true });
        }
      });

      // Create new colors
      selectedColors
        .filter((color) => colors?.findIndex((c) => c.color === color) === -1)
        .forEach(async (color) => {
          if (product.id) {
            await createProductColor({
              product_id: product.id,
              color: color,
              active: true,
            });
          }
        });
    }

    // Check if there are any sizes to update
    if (selectedSizes.length > 0) {
      const { data: sizes, error: sizeError } = await supabase
        .from("product_sizes")
        .select("id,size")
        .eq("product_id", product.id);
      if (sizeError) {
        showAlert(sizeError.message, "error");
        console.error(sizeError);
        return;
      }

      // Update sizes that are not in selectedSizes
      sizes?.forEach(async (size) => {
        if (selectedSizes.findIndex((s) => s === size.size) === -1) {
          await updateProductSize({ id: size.id, active: false });
        } else {
          await updateProductSize({ id: size.id, active: true });
        }
      });

      // Create new sizes
      selectedSizes
        .filter((size) => sizes?.findIndex((s) => s.size === size) === -1)
        .forEach(async (size) => {
          if (product.id) {
            await createProductSize({
              product_id: product.id,
              size: size,
              active: true,
            });
          }
        });
    }

    // Check if there are any categories to update
    if (selectedCategories.length > 0) {
      const { data: categories, error: categoryError } = await supabase
        .from("product_categories")
        .select("id")
        .eq("product_id", product.id);
      if (categoryError) {
        showAlert(categoryError.message, "error");
        console.error(categoryError);
        return;
      }

      // Delete existing categories
      categories?.forEach(async (category) => {
        await deleteProductCategory(category.id);
      });

      // Create new categories
      selectedCategories.forEach(async (category) => {
        if (product.id) {
          await createProductCategory({
            product_id: product.id,
            category_id: category.id,
          });
        }
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (error) {
      showAlert(error.message, "error");
      console.error(error);
    }
  };

  const updateProductTimePost = async (
    productId: string,
    productTimePost: string
  ) => {
    const { error } = await supabase
      .from("products")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", productId);
    if (error) {
      showAlert(error.message, "error");
      console.error(error);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        createProduct,
        updateProduct,
        deleteProduct,
        loading,
        updateProductTimePost,
      }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProductContext must be used within a ProductProvider");
  }
  return context;
}
