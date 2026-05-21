/**
 * Fallback mock data for the Stocks pages (Overview, All Products, Reports).
 * Used only when the DB returns empty results (fresh / demo environment).
 *
 * Type shapes mirror the exact DB-generated types used by each context so
 * TypeScript is satisfied without any `any` casts.
 */

import type { Database } from "@/database.types";

// ─── Type aliases ──────────────────────────────────────────────────────────────

type ProductsRow = Database["public"]["Tables"]["products"]["Row"];
type ProductEventsRow = Database["public"]["Tables"]["product_events"]["Row"];
type ProductReportsRow = Database["public"]["Tables"]["product_reports"]["Row"];
type ProductPurchaseOrdersRow =
  Database["public"]["Tables"]["product_purchase_orders"]["Row"];

/** ProductEvent as defined in ProductEventContext — Row + embedded product Row */
export type MockProductEvent = ProductEventsRow & { product: ProductsRow };

/** ProductPurchaseOrder as defined in ProductPurchaseOrderContext — Row + items */
export type MockProductPurchaseOrder = ProductPurchaseOrdersRow & {
  items: ProductPurchaseOrdersRow[];
};

// ─── Shared product rows ────────────────────────────────────────────────────────

/** Minimal helper to build a complete ProductsRow with sensible defaults. */
function makeProductRow(
  id: string,
  name: string,
  price: number,
  description: string | null = null
): ProductsRow {
  const now = new Date().toISOString();
  return {
    id,
    name,
    price,
    description,
    status: "active",
    created_at: now,
    updated_at: now,
    deleted_at: null,
    article_number: null,
    brand_id: null,
    category_id: null,
    department_id: null,
    festival: null,
    product_folder_id: null,
    range_id: null,
    season: null,
    stock_code: null,
    stock_place: null,
    time_post: null,
    warranty_description: null,
    warranty_period: null,
  };
}

/** All shared product rows — referenced by events, product list, etc. */
const PRODUCTS: ProductsRow[] = [
  makeProductRow("prod-0001", "Coca Cola Classic (330ml)", 2.5, "Carbonated soft drink"),
  makeProductRow("prod-0002", "Nescafé Original 3-in-1 (30s)", 18.9, "Instant coffee mix"),
  makeProductRow("prod-0003", "Dutch Lady Full Cream Milk (1L)", 6.9, "Fresh pasteurised milk"),
  makeProductRow("prod-0004", "Milo Activ-Go (1kg)", 22.5, "Chocolate malt energy drink"),
  makeProductRow("prod-0005", "Lipton Yellow Label Tea (100s)", 12.9, "Classic black tea bags"),
  makeProductRow("prod-0006", "Korean Spicy Noodles (5-pack)", 9.9, "Instant noodle variety pack"),
  makeProductRow("prod-0007", "Pringles Original (110g)", 7.5, "Potato crisps"),
  makeProductRow("prod-0008", "Highland Still Water (1.5L × 6)", 8.5, "Still mineral water"),
  makeProductRow("prod-0009", "Ribena Blackcurrant (1L)", 7.9, "Blackcurrant fruit drink"),
  makeProductRow("prod-0010", "100Plus Original (325ml × 24)", 35, "Isotonic drink"),
  makeProductRow("prod-0011", "Gardenia Bread (400g)", 3.5, "White sandwich bread"),
  makeProductRow("prod-0012", "Yakult (5-pack)", 5.9, "Probiotic fermented milk drink"),
];

// ─── Mock ProductEvents (for Stocks Overview & Reports) ────────────────────────

function makeEvent(
  id: string,
  productId: string,
  type: "Low" | "Keep Stock" | "Fast" | "Normal",
  purchaseOrderId: string | null = null,
  reportId: string | null = null
): MockProductEvent {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    throw new Error(`Mock product ${productId} not found`);
  }
  return {
    id,
    created_at: new Date().toISOString(),
    product_id: productId,
    type,
    purchase_order_id: purchaseOrderId,
    report_id: reportId,
    product,
  };
}

export const MOCK_PRODUCT_EVENTS: MockProductEvent[] = [
  // Low stock — needs a report
  makeEvent("evt-0001", "prod-0001", "Low", null, "rep-0001"),
  makeEvent("evt-0002", "prod-0006", "Low", null, "rep-0002"),
  makeEvent("evt-0003", "prod-0011", "Low"),

  // Keep Stock (holding too long)
  makeEvent("evt-0004", "prod-0007", "Keep Stock", null, "rep-0003"),
  makeEvent("evt-0005", "prod-0009", "Keep Stock"),

  // Fast moving — needs purchase order
  makeEvent("evt-0006", "prod-0002", "Fast", "po-0001"),
  makeEvent("evt-0007", "prod-0004", "Fast", "po-0002"),
  makeEvent("evt-0008", "prod-0010", "Fast"),

  // Normal
  makeEvent("evt-0009", "prod-0003", "Normal"),
  makeEvent("evt-0010", "prod-0005", "Normal"),
  makeEvent("evt-0011", "prod-0008", "Normal"),
  makeEvent("evt-0012", "prod-0012", "Normal"),
];

// ─── Mock Products for Stocks All-Products page ────────────────────────────────

/**
 * Products with client-side computed fields (stock_status, stock_count).
 * `medias`, `product_categories`, `product_colors`, `product_sizes` are
 * left empty — the All Products page only reads `stock_status` and `stock_count`.
 */
export const MOCK_PRODUCTS = PRODUCTS.map((p, i) => {
  const statuses: Array<"low" | "fast" | "normal" | "hold"> = [
    "low", "fast", "normal", "hold",
    "normal", "low", "fast", "normal",
    "normal", "fast", "normal", "normal",
  ];
  const counts = [8, 150, 95, 42, 110, 12, 200, 78, 60, 180, 25, 88];
  return {
    ...p,
    medias: [],
    product_categories: [],
    product_colors: [],
    product_sizes: [],
    stock_status: statuses[i] ?? "normal",
    stock_count: counts[i] ?? 50,
  };
});

// ─── Mock ProductReports (for Stocks Reports page) ────────────────────────────

function makeReport(
  id: string,
  productEventId: string,
  productId: string,
  company: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
  daysAgo: number
): ProductReportsRow {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id,
    product_event: productEventId,
    product_id: productId,
    company,
    status,
    created_at: d.toISOString(),
    department: "Procurement",
    oc_department: null,
    oc_name: null,
    person_in_charge: null,
    reason: null,
  };
}

export const MOCK_PRODUCT_REPORTS: ProductReportsRow[] = [
  makeReport("rep-0001", "evt-0001", "prod-0001", "Coca Cola Malaysia Sdn Bhd", "APPROVED", 5),
  makeReport("rep-0002", "evt-0002", "prod-0006", "Samyang Foods Co Ltd", "PENDING", 2),
  makeReport("rep-0003", "evt-0004", "prod-0007", "Kellogg's Malaysia Sdn Bhd", "PENDING", 1),
];

// ─── Mock ProductPurchaseOrders (for Stocks Reports page) ─────────────────────

function makePurchaseOrder(
  id: string,
  productEventId: string,
  productId: string,
  poNo: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
  daysAgo: number
): MockProductPurchaseOrder {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id,
    product_event: productEventId,
    product_id: productId,
    purchase_order_no: poNo,
    status,
    created_at: d.toISOString(),
    brand: null,
    cancel_date: null,
    delivery_address: "No. 1 Jalan Industri, Shah Alam, Selangor",
    delivery_date: null,
    order_date: d.toISOString(),
    order_no: null,
    salesman_no: null,
    shipping_date: null,
    terms: 30,
    items: [],
  };
}

export const MOCK_PURCHASE_ORDERS: MockProductPurchaseOrder[] = [
  makePurchaseOrder("po-0001", "evt-0006", "prod-0002", "PO-2026-0001", "APPROVED", 7),
  makePurchaseOrder("po-0002", "evt-0007", "prod-0004", "PO-2026-0002", "PENDING", 3),
];
