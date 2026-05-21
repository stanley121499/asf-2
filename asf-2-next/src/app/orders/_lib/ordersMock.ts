/**
 * Fallback mock data for the Orders list and detail pages.
 * Used only when the DB returns no orders (e.g. fresh / demo environment).
 */

import type { Database } from "@/database.types";

/** Full DB row shape for the orders table. */
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

/** An enriched order row with resolved user/item details — mirrors the shape
 *  that orders/page.tsx and orders/[orderId]/page.tsx build before display. */
export interface OrderWithUser {
  id: string;
  created_at: string;
  status: string | null;
  total_amount: number | null;
  user_id: string | null;
  shipping_address: string | null;
  user_name?: string;
  user_email?: string;
  item_count?: number;
}

/** ISO timestamp helper — n days before today */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const MOCK_ORDERS: OrderWithUser[] = [
  {
    id: "a1b2c3d4-0001-0000-0000-000000000001",
    created_at: daysAgo(0),
    status: "processing",
    total_amount: 89.9,
    user_id: "user-0001",
    shipping_address: "12 Jalan Ampang, Kuala Lumpur",
    user_name: "Aisha Binti Rahman",
    user_email: "aisha.rahman@email.com",
    item_count: 3,
  },
  {
    id: "a1b2c3d4-0002-0000-0000-000000000002",
    created_at: daysAgo(0),
    status: "pending",
    total_amount: 45.5,
    user_id: "user-0002",
    shipping_address: "88 Jalan Bukit Bintang, Kuala Lumpur",
    user_name: "David Lim Wei Jie",
    user_email: "davidlim@email.com",
    item_count: 2,
  },
  {
    id: "a1b2c3d4-0003-0000-0000-000000000003",
    created_at: daysAgo(1),
    status: "shipped",
    total_amount: 132,
    user_id: "user-0003",
    shipping_address: "5 Jalan Utama, Penang",
    user_name: "Sarah Johnson",
    user_email: "sarah.j@email.com",
    item_count: 5,
  },
  {
    id: "a1b2c3d4-0004-0000-0000-000000000004",
    created_at: daysAgo(2),
    status: "completed",
    total_amount: 210,
    user_id: "user-0004",
    shipping_address: "33 Persiaran Gurney, Penang",
    user_name: "Muhammad Faiz",
    user_email: "faiz.m@email.com",
    item_count: 7,
  },
  {
    id: "a1b2c3d4-0005-0000-0000-000000000005",
    created_at: daysAgo(2),
    status: "completed",
    total_amount: 58.8,
    user_id: "user-0005",
    shipping_address: "19 Lorong Haji Taib, Kuala Lumpur",
    user_name: "Priya Nair",
    user_email: "priya.nair@email.com",
    item_count: 2,
  },
  {
    id: "a1b2c3d4-0006-0000-0000-000000000006",
    created_at: daysAgo(3),
    status: "cancelled",
    total_amount: 74.5,
    user_id: "user-0006",
    shipping_address: "7 Jalan SS2, Petaling Jaya",
    user_name: "Lee Chun Wai",
    user_email: "lcw@email.com",
    item_count: 3,
  },
  {
    id: "a1b2c3d4-0007-0000-0000-000000000007",
    created_at: daysAgo(4),
    status: "completed",
    total_amount: 320,
    user_id: "user-0007",
    shipping_address: "45 Jalan Duta, Kuala Lumpur",
    user_name: "Nurul Hidayah",
    user_email: "nurul.h@email.com",
    item_count: 10,
  },
  {
    id: "a1b2c3d4-0008-0000-0000-000000000008",
    created_at: daysAgo(5),
    status: "processing",
    total_amount: 99.9,
    user_id: "user-0008",
    shipping_address: "22 Jalan Sultan Ismail, Kuala Lumpur",
    user_name: "Raj Kumar",
    user_email: "raj.k@email.com",
    item_count: 4,
  },
  {
    id: "a1b2c3d4-0009-0000-0000-000000000009",
    created_at: daysAgo(6),
    status: "shipped",
    total_amount: 155,
    user_id: "user-0009",
    shipping_address: "3 Jalan Telawi, Bangsar",
    user_name: "Tan Mei Ling",
    user_email: "tan.ml@email.com",
    item_count: 6,
  },
  {
    id: "a1b2c3d4-0010-0000-0000-000000000010",
    created_at: daysAgo(7),
    status: "completed",
    total_amount: 42,
    user_id: "user-0010",
    shipping_address: "14 Jalan Pahang, Johor Bahru",
    user_name: "Ahmad Zulkifli",
    user_email: "ahmad.z@email.com",
    item_count: 1,
  },
  {
    id: "a1b2c3d4-0011-0000-0000-000000000011",
    created_at: daysAgo(8),
    status: "completed",
    total_amount: 188.5,
    user_id: "user-0011",
    shipping_address: "60 Jalan Imbi, Kuala Lumpur",
    user_name: "Siti Nurhaliza",
    user_email: "siti.n@email.com",
    item_count: 8,
  },
  {
    id: "a1b2c3d4-0012-0000-0000-000000000012",
    created_at: daysAgo(10),
    status: "completed",
    total_amount: 67.3,
    user_id: "user-0012",
    shipping_address: "9 Jalan Semarak, Kuala Lumpur",
    user_name: "Kevin Chong",
    user_email: "kevin.c@email.com",
    item_count: 3,
  },
];

/**
 * Builds a complete `OrderRow`-compatible object from a mock `OrderWithUser`.
 * All DB-only fields that are not tracked in mock data are set to `null`.
 */
export function buildMockOrderRow(mock: OrderWithUser): OrderRow {
  return {
    id: mock.id,
    created_at: mock.created_at,
    status: mock.status,
    total_amount: mock.total_amount,
    user_id: mock.user_id,
    shipping_address: mock.shipping_address,
    courier_code: null,
    deleted_at: null,
    discount_amount: null,
    discount_type: null,
    discounted_amount: null,
    delyva_order_id: null,
    points_earned: null,
    points_spent: null,
    promo_code: null,
    shipping_address_structured: null,
    shipping_label_url: null,
    shipping_rate: null,
    tracking_number: null,
  };
}
