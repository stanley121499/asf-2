import type { PropsWithChildren } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLocale } from "@/context/LocaleContext";
import type { Database } from "@/database.types";
import { resolveField } from "@/i18n/resolveContent";
import type { Locale } from "@/i18n/types";
import { supabase } from "@/lib/supabase";

type ProductTranslationRow =
  Database["public"]["Tables"]["product_translations"]["Row"];
type CategoryTranslationRow =
  Database["public"]["Tables"]["category_translations"]["Row"];
type BrandTranslationRow =
  Database["public"]["Tables"]["brand_translations"]["Row"];
type DepartmentTranslationRow =
  Database["public"]["Tables"]["department_translations"]["Row"];
type RangeTranslationRow =
  Database["public"]["Tables"]["range_translations"]["Row"];
type PostTranslationRow =
  Database["public"]["Tables"]["post_translations"]["Row"];

/** Translatable product fields overlaid from `product_translations`. */
type ProductField =
  | "name"
  | "description"
  | "warranty_description"
  | "warranty_period";

/** Translatable post fields overlaid from `post_translations`. */
type PostField = "name" | "caption" | "cta_text";

type ProductTranslation = Pick<
  ProductTranslationRow,
  "name" | "description" | "warranty_description" | "warranty_period"
>;

type PostTranslation = Pick<PostTranslationRow, "name" | "caption" | "cta_text">;

type TranslationMaps = {
  products: Map<string, ProductTranslation>;
  categories: Map<string, Pick<CategoryTranslationRow, "name">>;
  brands: Map<string, Pick<BrandTranslationRow, "name">>;
  departments: Map<string, Pick<DepartmentTranslationRow, "name">>;
  ranges: Map<string, Pick<RangeTranslationRow, "name">>;
  posts: Map<string, PostTranslation>;
};

const EMPTY_MAPS: TranslationMaps = {
  products: new Map(),
  categories: new Map(),
  brands: new Map(),
  departments: new Map(),
  ranges: new Map(),
  posts: new Map(),
};

type ContentTranslationContextValue = {
  translateCategory: (id: string, baseName: string | null) => string;
  translateBrand: (id: string, baseName: string | null) => string;
  translateDepartment: (id: string, baseName: string | null) => string;
  translateRange: (id: string, baseName: string | null) => string;
  translatePost: (
    id: string,
    field: PostField,
    baseValue: string | null,
  ) => string;
  translateProduct: (
    id: string,
    field: ProductField,
    baseValue: string | null,
  ) => string;
};

const ContentTranslationContext =
  createContext<ContentTranslationContextValue | undefined>(undefined);

/**
 * Builds a product_id → translation fields map from fetched rows.
 */
function buildProductMap(
  rows: Array<
    Pick<
      ProductTranslationRow,
      | "product_id"
      | "name"
      | "description"
      | "warranty_description"
      | "warranty_period"
    >
  >,
): Map<string, ProductTranslation> {
  const map = new Map<string, ProductTranslation>();
  for (const row of rows) {
    map.set(row.product_id, {
      name: row.name,
      description: row.description,
      warranty_description: row.warranty_description,
      warranty_period: row.warranty_period,
    });
  }
  return map;
}

/**
 * Builds a category_id → name map from fetched rows.
 */
function buildCategoryMap(
  rows: Array<Pick<CategoryTranslationRow, "category_id" | "name">>,
): Map<string, Pick<CategoryTranslationRow, "name">> {
  const map = new Map<string, Pick<CategoryTranslationRow, "name">>();
  for (const row of rows) {
    map.set(row.category_id, { name: row.name });
  }
  return map;
}

/**
 * Builds a brand_id → name map from fetched rows.
 */
function buildBrandMap(
  rows: Array<Pick<BrandTranslationRow, "brand_id" | "name">>,
): Map<string, Pick<BrandTranslationRow, "name">> {
  const map = new Map<string, Pick<BrandTranslationRow, "name">>();
  for (const row of rows) {
    map.set(row.brand_id, { name: row.name });
  }
  return map;
}

/**
 * Builds a department_id → name map from fetched rows.
 */
function buildDepartmentMap(
  rows: Array<Pick<DepartmentTranslationRow, "department_id" | "name">>,
): Map<string, Pick<DepartmentTranslationRow, "name">> {
  const map = new Map<string, Pick<DepartmentTranslationRow, "name">>();
  for (const row of rows) {
    map.set(row.department_id, { name: row.name });
  }
  return map;
}

/**
 * Builds a range_id → name map from fetched rows.
 */
function buildRangeMap(
  rows: Array<Pick<RangeTranslationRow, "range_id" | "name">>,
): Map<string, Pick<RangeTranslationRow, "name">> {
  const map = new Map<string, Pick<RangeTranslationRow, "name">>();
  for (const row of rows) {
    map.set(row.range_id, { name: row.name });
  }
  return map;
}

/**
 * Builds a post_id → translation fields map from fetched rows.
 */
function buildPostMap(
  rows: Array<
    Pick<PostTranslationRow, "post_id" | "name" | "caption" | "cta_text">
  >,
): Map<string, PostTranslation> {
  const map = new Map<string, PostTranslation>();
  for (const row of rows) {
    map.set(row.post_id, {
      name: row.name,
      caption: row.caption,
      cta_text: row.cta_text,
    });
  }
  return map;
}

/**
 * Batch-fetches translation rows when locale is `en` or `ms` and exposes
 * resolve helpers via {@link resolveField}. Skips fetch for `zh-CN` (base tables).
 * Does not change ProductContext fetches or call `fetch_products_with_computed_attributes`.
 */
export function ContentTranslationProvider({
  children,
}: PropsWithChildren): React.ReactElement {
  const { locale } = useLocale();
  const [maps, setMaps] = useState<TranslationMaps>(EMPTY_MAPS);

  useEffect(() => {
    if (locale === "zh-CN") {
      setMaps(EMPTY_MAPS);
      return;
    }

    let isActive = true;

    const loadTranslations = async (): Promise<void> => {
      const [
        productResult,
        categoryResult,
        brandResult,
        departmentResult,
        rangeResult,
        postResult,
      ] = await Promise.all([
        supabase
          .from("product_translations")
          .select(
            "product_id, name, description, warranty_description, warranty_period",
          )
          .eq("locale", locale),
        supabase
          .from("category_translations")
          .select("category_id, name")
          .eq("locale", locale),
        supabase
          .from("brand_translations")
          .select("brand_id, name")
          .eq("locale", locale),
        supabase
          .from("department_translations")
          .select("department_id, name")
          .eq("locale", locale),
        supabase
          .from("range_translations")
          .select("range_id, name")
          .eq("locale", locale),
        supabase
          .from("post_translations")
          .select("post_id, name, caption, cta_text")
          .eq("locale", locale),
      ]);

      if (!isActive) {
        return;
      }

      const errors = [
        productResult.error,
        categoryResult.error,
        brandResult.error,
        departmentResult.error,
        rangeResult.error,
        postResult.error,
      ].filter(
        (error): error is NonNullable<typeof error> => error !== null,
      );

      if (errors.length > 0 && __DEV__) {
        console.warn(
          "[ContentTranslationContext] Translation fetch failed (tables may not exist yet):",
          errors.map((error) => error.message).join("; "),
        );
      }

      setMaps({
        products: buildProductMap(productResult.data ?? []),
        categories: buildCategoryMap(categoryResult.data ?? []),
        brands: buildBrandMap(brandResult.data ?? []),
        departments: buildDepartmentMap(departmentResult.data ?? []),
        ranges: buildRangeMap(rangeResult.data ?? []),
        posts: buildPostMap(postResult.data ?? []),
      });
    };

    void loadTranslations();

    return () => {
      isActive = false;
    };
  }, [locale]);

  const resolveWithLocale = useCallback(
    (
      activeLocale: Locale,
      base: string | null,
      translated: string | null | undefined,
    ): string => resolveField(activeLocale, base, translated),
    [],
  );

  const translateCategory = useCallback(
    (id: string, baseName: string | null): string => {
      const translated = maps.categories.get(id)?.name;
      return resolveWithLocale(locale, baseName, translated);
    },
    [locale, maps.categories, resolveWithLocale],
  );

  const translateBrand = useCallback(
    (id: string, baseName: string | null): string => {
      const translated = maps.brands.get(id)?.name;
      return resolveWithLocale(locale, baseName, translated);
    },
    [locale, maps.brands, resolveWithLocale],
  );

  const translateDepartment = useCallback(
    (id: string, baseName: string | null): string => {
      const translated = maps.departments.get(id)?.name;
      return resolveWithLocale(locale, baseName, translated);
    },
    [locale, maps.departments, resolveWithLocale],
  );

  const translateRange = useCallback(
    (id: string, baseName: string | null): string => {
      const translated = maps.ranges.get(id)?.name;
      return resolveWithLocale(locale, baseName, translated);
    },
    [locale, maps.ranges, resolveWithLocale],
  );

  const translatePost = useCallback(
    (id: string, field: PostField, baseValue: string | null): string => {
      const translation = maps.posts.get(id);
      const translated = translation?.[field];
      return resolveWithLocale(locale, baseValue, translated);
    },
    [locale, maps.posts, resolveWithLocale],
  );

  const translateProduct = useCallback(
    (id: string, field: ProductField, baseValue: string | null): string => {
      const translation = maps.products.get(id);
      const translated = translation?.[field];
      return resolveWithLocale(locale, baseValue, translated);
    },
    [locale, maps.products, resolveWithLocale],
  );

  const value = useMemo<ContentTranslationContextValue>(
    () => ({
      translateCategory,
      translateBrand,
      translateDepartment,
      translateRange,
      translatePost,
      translateProduct,
    }),
    [
      translateCategory,
      translateBrand,
      translateDepartment,
      translateRange,
      translatePost,
      translateProduct,
    ],
  );

  return (
    <ContentTranslationContext.Provider value={value}>
      {children}
    </ContentTranslationContext.Provider>
  );
}

/**
 * Hook for DB content display-name overlays.
 * Must be used inside {@link ContentTranslationProvider}.
 */
export function useContentTranslation(): ContentTranslationContextValue {
  const context = useContext(ContentTranslationContext);
  if (!context) {
    throw new Error(
      "useContentTranslation must be used within a ContentTranslationProvider",
    );
  }
  return context;
}
