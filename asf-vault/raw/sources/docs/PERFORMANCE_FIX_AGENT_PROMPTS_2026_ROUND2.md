# Performance Fix Agent Prompts – Round 2 (2026)

> **For the implementer:** Each section below is a self-contained prompt for a separate Gemini agent run. Copy the full section content when passing to the agent. Each agent works on a distinct set of files with no overlap.

---

## AGENT 1 – Remove Admin API Calls From Admin Pages

### Your Task

You are a senior TypeScript/React developer. Fix N+1 query problems and remove expensive admin-API calls in three admin pages of a React + Supabase application.

### Background

The app uses Supabase as its backend. There is a `supabaseAdmin` client (service-role key) and a regular `supabase` client. Currently three admin pages are calling `supabaseAdmin.auth.admin.listUsers()` or `supabaseAdmin.auth.admin.getUserById()` to get user names/emails — this is extremely expensive because it hits the Supabase auth admin endpoint on every page load.

**Critical database schema note:**  
The `user_details` table has these columns (from `database.types.ts`):
- `id` (uuid, primary key — same as the auth user's id)
- `first_name` (string | null)
- `last_name` (string | null)
- `role`, `lifetime_val`, `profile_image`, `birthdate`, `city`, `state`, `race`
- **There is NO `email` column in `user_details`.**

The `payments` table itself has direct `email` (string | null) and `name` (string | null) columns — use those instead of the admin API.

Build user display names as: `` `${first_name ?? ""} ${last_name ?? ""}`.trim() || `User ${id.substring(0, 8)}` ``

---

### File 1: `src/pages/orders/list.tsx`

**Problem:** `fetchOrderDetails` calls `supabaseAdmin.auth.admin.listUsers()` (fetches ALL users in the system into memory) and queries `order_items` in a per-order loop (N+1 pattern).

**Fix the `fetchOrderDetails` function (lines ~185–253):**

Current problematic code:
```tsx
// Get auth users for email
const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
if (authError) {
  console.error("Error fetching auth users:", authError);
}

// Fetch order item counts
const orderItemCounts = await Promise.all(
  orders.map(async (order) => {
    const { data: items } = await supabase
      .from("order_items")
      .select("amount")
      .eq("order_id", order.id);

    const itemCount = (items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    return { orderId: order.id, itemCount };
  })
);

// Combine order data with user details and item counts
const enrichedOrders: OrderWithUser[] = orders.map(order => {
  const authUser = authUsers?.users?.find(u => u.id === order.user_id);
  const itemData = orderItemCounts.find(item => item.orderId === order.id);
  const userName = authUser?.email?.split("@")[0] || "Unknown User";
  return {
    ...order,
    user_name: userName,
    user_email: authUser?.email || "",
    item_count: itemData?.itemCount || 0,
  };
});
```

**Replace with:**
1. Get unique `userIds` from orders (already done above this block).
2. Query `user_details` once: `.select("id, first_name, last_name").in("id", userIds as string[])`.
3. Fetch ALL `order_items` for all orders in ONE query: `.select("order_id, amount").in("order_id", orderIds)`.
4. Build a `userDetailMap: Map<string, { first_name: string | null; last_name: string | null }>` and `orderItemTotalMap: Map<string, number>`.
5. Build `enrichedOrders` using the maps.
6. Remove `supabaseAdmin` import if no longer used anywhere else in the file (check first).

Also: wrap the `console.error("Error fetching order details:", error)` with `if (process.env.NODE_ENV === "development") { ... }`.

---

### File 2: `src/pages/orders/detail.tsx`

**Problem:** `fetchOrderDetails` calls `supabaseAdmin.auth.admin.getUserById()` for a single user on every page load.

Current problematic code section (inside `fetchOrderDetails`):
```tsx
if (orderData.user_id) {
  // Get user details from user_details table (for future use)
  await supabase
    .from("user_details")
    .select("*")
    .eq("id", orderData.user_id)
    .single();

  // Get email from auth users
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(orderData.user_id);
  if (authData.user?.email) {
    userEmail = authData.user.email;
    userName = authData.user.email.split("@")[0];
  }
}
```

**Replace with:**
```tsx
if (orderData.user_id) {
  const { data: userDetailData } = await supabase
    .from("user_details")
    .select("first_name, last_name")
    .eq("id", orderData.user_id)
    .single();

  if (userDetailData) {
    const firstName = userDetailData.first_name ?? "";
    const lastName = userDetailData.last_name ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    userName = fullName.length > 0 ? fullName : `User ${orderData.user_id.substring(0, 8)}`;
  }
  // Note: email is not available without admin API — leave userEmail as ""
}
```

Remove `supabaseAdmin` import if it's no longer used anywhere in the file. Wrap any remaining `console.error` calls with the dev check.

---

### File 3: `src/pages/payments/detail.tsx`

**Problem:** `fetchPaymentDetails` calls `supabaseAdmin.auth.admin.getUserById()` for a single user.

Current problematic code section:
```tsx
if (paymentData.user_id) {
  // Get email from auth users
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(paymentData.user_id);
  if (authData.user?.email) {
    userEmail = authData.user.email;
    userName = authData.user.email.split("@")[0];
  }
} else if (paymentData.email) {
  // Use payment email if no user_id
  userEmail = paymentData.email;
  userName = paymentData.name || paymentData.email.split("@")[0];
}
```

**Replace with (no admin API at all):**
```tsx
if (paymentData.email) {
  // Use the payment's own email/name fields first (most reliable)
  userEmail = paymentData.email;
  userName = paymentData.name ?? paymentData.email.split("@")[0];
} else if (paymentData.user_id) {
  // Fall back to user_details for display name only (no email available without admin API)
  const { data: userDetailData } = await supabase
    .from("user_details")
    .select("first_name, last_name")
    .eq("id", paymentData.user_id)
    .single();

  if (userDetailData) {
    const firstName = userDetailData.first_name ?? "";
    const lastName = userDetailData.last_name ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    userName = fullName.length > 0 ? fullName : `User ${paymentData.user_id.substring(0, 8)}`;
  }
}
```

Remove `supabaseAdmin` import if no longer used. Wrap remaining `console.error` calls with dev check.

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders or `// ... rest of code` comments.
2. TypeScript strict — no `any`, no `!` non-null assertion, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for string concatenation.
4. JSDoc comments on all exported functions and complex logic blocks.
5. All async operations must have proper `try/catch` error handling.
6. `process.env.NODE_ENV === "development"` guard around all `console.error` / `console.log` calls.

---

---

## AGENT 2 – Fix PaymentContext User Enrichment

### Your Task

You are a senior TypeScript/React developer. Fix the `PaymentContext` so that payments display real user display names instead of truncated UUID strings.

### Background

In a previous fix attempt, the admin API call was correctly removed, but the replacement was left incomplete — the `usersData` array was declared but never populated, so every payment now shows `"User abc12345"` as the user name. You need to properly query the `user_details` table.

**Critical database schema note:**  
The `user_details` table columns (from `database.types.ts`):
- `id` (uuid) — same as auth user id
- `first_name` (string | null)
- `last_name` (string | null)
- **NO `email` column exists**

The `payments` table itself has a direct `email` (string | null) column available on the `PaymentRow` type. The user email for a payment comes from `payment.email`, not from `user_details`.

**Build display name as:** `` `${first_name ?? ""} ${last_name ?? ""}`.trim() || `User ${id.substring(0, 8)}` ``

---

### Current File: `src/context/PaymentContext.tsx`

The broken section in `fetchPayments` (around lines 137–169):

```tsx
// Get unique user IDs for fetching user details
const userIds = Array.from(new Set(rawPayments.map(getOrderUserId).filter((v): v is string => typeof v === "string")));

// Fetch user details if there are any user IDs
let usersData: { id: string; email?: string }[] = [];
// Note: 'email' column does not exist in 'user_details' according to database types.
// Falling back to deriving the name from the order's user_id only.

// Enrich payments with user details and computed fields
const enrichedPayments: PaymentWithDetails[] = rawPayments
  .map((payment): PaymentWithDetails | null => {
    if (!isRecord(payment) || typeof payment["id"] !== "string") {
      return null;
    }

    const userId = getOrderUserId(payment);
    const orderItemsCount = getOrderItemsAmountSum(payment);

    // Find user details
    const email = "";
    const userName = typeof userId === "string" && userId.length >= 8 
      ? `User ${userId.substring(0, 8)}` 
      : "Unknown User";

    return {
      ...(payment as PaymentRow),
      user_name: userName,
      user_email: email,
      order_items_count: orderItemsCount,
      payment_events: getPaymentEvents(payment),
    };
  })
  .filter((p): p is PaymentWithDetails => p !== null);
```

**Replace with:**
1. After collecting `userIds`, query `user_details` with `.select("id, first_name, last_name").in("id", userIds)` (handle the case where `userIds` is empty to avoid unnecessary DB call).
2. Build a `userDetailMap: Map<string, { first_name: string | null; last_name: string | null }>`.
3. In the `.map()` for enrichment:
   - Look up `userId` in `userDetailMap`
   - Build display name from `first_name` + `last_name`, fallback to `User ${userId.substring(0, 8)}`
   - For `user_email`: use `(payment as PaymentRow).email ?? ""` — the payments table has its own `email` column

---

### Full Current File (for your reference):

```tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
export type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];
export type PaymentEventRow = Database["public"]["Tables"]["payment_events"]["Row"];

export interface PaymentWithDetails extends PaymentRow {
  user_name?: string;
  user_email?: string;
  order_items_count?: number;
  payment_events?: PaymentEventRow[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getOrderUserId(payment: unknown): string | null {
  if (!isRecord(payment)) return null;
  const orderValue = payment["order"];
  if (!isRecord(orderValue)) return null;
  const userId = orderValue["user_id"];
  return typeof userId === "string" ? userId : null;
}

function getOrderItemsAmountSum(payment: unknown): number {
  if (!isRecord(payment)) return 0;
  const orderValue = payment["order"];
  if (!isRecord(orderValue)) return 0;
  const itemsValue = orderValue["order_items"];
  if (!Array.isArray(itemsValue)) return 0;
  return itemsValue.reduce((sum: number, item: unknown) => {
    if (!isRecord(item)) return sum;
    const amount = item["amount"];
    return typeof amount === "number" && Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
}

function getPaymentEvents(payment: unknown): PaymentEventRow[] {
  if (!isRecord(payment)) return [];
  const eventsValue = payment["payment_events"];
  if (!Array.isArray(eventsValue)) return [];
  return eventsValue as PaymentEventRow[];
}

interface PaymentContextProps {
  payments: PaymentWithDetails[];
  loading: boolean;
  refreshPayments: () => Promise<void>;
  updatePaymentStatus: (paymentId: string, newStatus: Database["public"]["Enums"]["payment_status"]) => Promise<boolean>;
  updateRefundStatus: (paymentId: string, newRefundStatus: Database["public"]["Enums"]["refund_status"], refundedAmount: number) => Promise<boolean>;
}

const PaymentContext = createContext<PaymentContextProps | undefined>(undefined);

export const PaymentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert } = useAlertContext();

  const showAlertRef = useRef<typeof showAlert | null>(null);
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  const fetchPayments = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          *,
          payment_events(*),
          order:orders(
            id,
            user_id,
            order_items(
              id,
              amount
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (paymentsError) {
        throw paymentsError;
      }

      const rawPayments: unknown[] = Array.isArray(paymentsData) ? (paymentsData as unknown[]) : [];

      // Get unique user IDs for fetching user details
      const userIds = Array.from(new Set(rawPayments.map(getOrderUserId).filter((v): v is string => typeof v === "string")));

      // <<< BROKEN SECTION STARTS HERE — THIS IS WHAT YOU NEED TO FIX >>>
      let usersData: { id: string; email?: string }[] = [];
      // Note: 'email' column does not exist in 'user_details' according to database types.

      const enrichedPayments: PaymentWithDetails[] = rawPayments
        .map((payment): PaymentWithDetails | null => {
          if (!isRecord(payment) || typeof payment["id"] !== "string") {
            return null;
          }
          const userId = getOrderUserId(payment);
          const orderItemsCount = getOrderItemsAmountSum(payment);
          const email = "";
          const userName = typeof userId === "string" && userId.length >= 8 
            ? `User ${userId.substring(0, 8)}` 
            : "Unknown User";
          return {
            ...(payment as PaymentRow),
            user_name: userName,
            user_email: email,
            order_items_count: orderItemsCount,
            payment_events: getPaymentEvents(payment),
          };
        })
        .filter((p): p is PaymentWithDetails => p !== null);
      // <<< BROKEN SECTION ENDS HERE >>>

      setPayments(enrichedPayments);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showAlertRef.current?.(message, "error");
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching payments:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ... rest of the file (refreshPayments, updatePaymentStatus, updateRefundStatus, useEffect, value) stays the same
};
```

> Output the COMPLETE updated file with all the other functions intact and the broken section replaced.

---

### CODING STANDARDS (mandatory)
1. Output the complete file — no placeholders or `// ... rest of code` comments.
2. TypeScript strict — no `any`, no `!` non-null assertion, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for concatenation.
4. JSDoc comments on all exported functions.
5. All async operations must have proper `try/catch` error handling.
6. `process.env.NODE_ENV === "development"` guard around any `console.error` / `console.log`.

---

---

## AGENT 3 – Console Log Cleanup + ProductPurchaseOrderContext Correctness

### Your Task

You are a senior TypeScript/React developer. Fix three files:
1. Remove bare `console.error` calls running in production from `ProductContext.tsx`.
2. Fix a stale closure bug + remove debug logs + fix broken `useEffect` deps in `ProductPurchaseOrderContext.tsx`.
3. Remove/guard debug `console.log` calls in `Chat.tsx`.

---

### File 1: `src/context/product/ProductContext.tsx`

**Only change:** Wrap every bare `console.error(...)` call with `if (process.env.NODE_ENV === "development") { ... }`. Do NOT change any logic, structure, or other code.

The `console.error` calls appear on these lines (search for them):
- `console.error(error);` after the RPC fetch error
- `console.error("[ProductContext] Failed to fetch products:", error);` in the catch
- `console.error(error);` in `createProduct` variant creation errors (×3 try/catch blocks)
- `console.error(colorError);`, `console.error(sizeError);`, `console.error(categoryError);` in sync helpers
- `console.error("Failed to delete product:", error);`
- `console.error("Failed to restore product:", error);`
- `console.error(error);` in `updateProduct` and `updateProductTimePost`

---

### File 2: `src/context/product/ProductPurchaseOrderContext.tsx`

This file has multiple issues. Fix ALL of them:

**Issue 1 – Debug `console.log` calls in `createProductPurchaseOrder`:**
```tsx
async function createProductPurchaseOrder(...) {
  console.log(product_purchase_order_entries)  // ← REMOVE THIS
  console.log(product_purchase_order)           // ← REMOVE THIS
  ...
  if (entriesError) {
    showAlert(entriesError.message, "error");
    console.log(entriesError);  // ← REMOVE THIS (or guard with dev check)
    return;
  }
```

**Issue 2 – Bare `console.error(error)` calls:** Guard with `if (process.env.NODE_ENV === "development")`.

**Issue 3 – Stale closure in realtime `handleChanges`:**
The function is defined inside `useEffect` and reads `product_purchase_orders` directly from the closure, which is stale after the first render. Fix by using functional setState updates:

```tsx
// BEFORE (stale closure):
const handleChanges = (payload: any) => {
  if (payload.eventType === "INSERT") {
    setProductPurchaseOrders([...product_purchase_orders, payload.new]);
  } else if (payload.eventType === "UPDATE") {
    const updatedProductPurchaseOrders = product_purchase_orders.map(
      (product_purchase_order) =>
        product_purchase_order.id === payload.new.id
          ? payload.new
          : product_purchase_order
    );
    setProductPurchaseOrders(updatedProductPurchaseOrders);
  } else if (payload.eventType === "DELETE") {
    const updatedProductPurchaseOrders = product_purchase_orders.filter(
      (product_purchase_order) =>
        product_purchase_order.id !== payload.old.id
    );
    setProductPurchaseOrders(updatedProductPurchaseOrders);
  }
};

// AFTER (functional setState — no stale closure):
const handleChanges = (payload: { eventType: string; new: ProductPurchaseOrder; old: ProductPurchaseOrder }) => {
  if (payload.eventType === "INSERT") {
    setProductPurchaseOrders((prev) => [...prev, payload.new]);
  } else if (payload.eventType === "UPDATE") {
    setProductPurchaseOrders((prev) =>
      prev.map((order) => (order.id === payload.new.id ? payload.new : order))
    );
  } else if (payload.eventType === "DELETE") {
    setProductPurchaseOrders((prev) =>
      prev.filter((order) => order.id !== payload.old.id)
    );
  }
};
```

**Issue 4 – `useEffect` has `[showAlert]` as dependency with eslint-disable:**
Use the `showAlertRef` pattern instead:
1. Add `useRef` to the imports.
2. Add `const showAlertRef = useRef<typeof showAlert | null>(null);` and a sync effect.
3. Replace the single `showAlert(error.message, "error")` call inside `fetchProductPurchaseOrders` with `showAlertRef.current?.(error.message, "error")`.
4. Change the `useEffect` deps to `[]`.
5. Remove the `// eslint-disable-line react-hooks/exhaustive-deps` comment.

---

### Full Current File: `src/context/product/ProductPurchaseOrderContext.tsx`

```tsx
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

export type ProductPurchaseOrder =
  Database["public"]["Tables"]["product_purchase_orders"]["Row"] & {
    items: any[];
  }
export type ProductPurchaseOrders = {
  product_purchase_orders: ProductPurchaseOrder[];
};
export type ProductPurchaseOrderInsert =
  Database["public"]["Tables"]["product_purchase_orders"]["Insert"];
export type ProductPurchaseOrderUpdate =
  Database["public"]["Tables"]["product_purchase_orders"]["Update"];

export type ProductPurchaseOrderEntry =
  Database["public"]["Tables"]["product_purchase_order_entries"]["Row"];
export type ProductPurchaseOrderEntries = {
  product_purchase_order_entries: ProductPurchaseOrderEntry[];
};
export type ProductPurchaseOrderEntryInsert =
  Database["public"]["Tables"]["product_purchase_order_entries"]["Insert"];
export type ProductPurchaseOrderEntryUpdate =
  Database["public"]["Tables"]["product_purchase_order_entries"]["Update"];

interface ProductPurchaseOrderContextProps {
  product_purchase_orders: ProductPurchaseOrder[];
  createProductPurchaseOrder: (
    product_purchase_order: ProductPurchaseOrderInsert,
    product_purchase_order_entries: any[]
  ) => Promise<ProductPurchaseOrder | undefined>;
  updateProductPurchaseOrder: (
    product_purchase_order: ProductPurchaseOrderUpdate
  ) => Promise<void>;
  deleteProductPurchaseOrder: (
    product_purchase_orderId: string
  ) => Promise<void>;
  loading: boolean;
}

const ProductPurchaseOrderContext =
  createContext<ProductPurchaseOrderContextProps>(undefined!);

export function ProductPurchaseOrderProvider({ children }: PropsWithChildren) {
  const [product_purchase_orders, setProductPurchaseOrders] = useState<
    ProductPurchaseOrder[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);
    const fetchProductPurchaseOrders = async () => {
      const { data, error } = await supabase.rpc("fetch_purchase_orders");

      if (error) {
        showAlert(error.message, "error");
        console.error(error);
      } else {
        const mapped = (data ?? []) as Array<
          Database["public"]["Functions"]["fetch_purchase_orders"]["Returns"][number]
        >;
        setProductPurchaseOrders(mapped as unknown as ProductPurchaseOrder[]);
        setLoading(false);
      }
    };

    fetchProductPurchaseOrders();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setProductPurchaseOrders([...product_purchase_orders, payload.new]);
      } else if (payload.eventType === "UPDATE") {
        const updatedProductPurchaseOrders = product_purchase_orders.map(
          (product_purchase_order) =>
            product_purchase_order.id === payload.new.id
              ? payload.new
              : product_purchase_order
        );
        setProductPurchaseOrders(updatedProductPurchaseOrders);
      } else if (payload.eventType === "DELETE") {
        const updatedProductPurchaseOrders = product_purchase_orders.filter(
          (product_purchase_order) =>
            product_purchase_order.id !== payload.old.id
        );
        setProductPurchaseOrders(updatedProductPurchaseOrders);
      }
    };

    const subscription = supabase
      .channel("product_purchase_orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_purchase_orders" },
        (payload) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]); // eslint-disable-line react-hooks/exhaustive-deps

  async function createProductPurchaseOrder(
    product_purchase_order: ProductPurchaseOrderInsert,
    product_purchase_order_entries: any[]
  ) {
    console.log(product_purchase_order_entries)
    console.log(product_purchase_order)
    const { data, error } = await supabase
      .from("product_purchase_orders")
      .insert(product_purchase_order)
      .select("*")
      .single();

    if (error) {
      console.error(error);
      showAlert(error.message, "error");
    } else {
      const newProductPurchaseOrder = data as ProductPurchaseOrder;
      const newProductPurchaseOrderEntries = product_purchase_order_entries.map(
        (product_purchase_order_entry) => ({
          ...product_purchase_order_entry,
          product_purchase_order_id: newProductPurchaseOrder.id,
        })
      );
      const entries: ProductPurchaseOrderEntryInsert[] = [];
      newProductPurchaseOrderEntries.forEach((entry) => {
        const { sizes, ...rest } = entry;
        sizes.forEach((size: any) => {
          entries.push({
            ...rest,
            size_id: size.size,
            quantity: size.quantity,
          });
        });
      });

      const { error: entriesError } = await supabase
        .from("product_purchase_order_entries")
        .insert(entries);

      if (entriesError) {
        showAlert(entriesError.message, "error");
        console.log(entriesError);
        return;
      }

      showAlert("Product purchase order created", "success");
      return newProductPurchaseOrder;
    }
  }

  async function updateProductPurchaseOrder(
    product_purchase_order: ProductPurchaseOrderUpdate
  ) {
    if (!product_purchase_order.id) {
      showAlert("Missing purchase order id for update.", "error");
      return;
    }
    const { error } = await supabase
      .from("product_purchase_orders")
      .update(product_purchase_order)
      .eq("id", product_purchase_order.id)
      .single();

    if (error) {
      showAlert(error.message, "error");
    } else {
      showAlert("Product purchase order updated", "success");
    }
  }

  async function deleteProductPurchaseOrder(product_purchase_orderId: string) {
    const { error } = await supabase
      .from("product_purchase_orders")
      .delete()
      .eq("id", product_purchase_orderId);

    if (error) {
      showAlert(error.message, "error");
    } else {
      const updatedProductPurchaseOrders = product_purchase_orders.filter(
        (product_purchase_order) =>
          product_purchase_order.id !== product_purchase_orderId
      );
      setProductPurchaseOrders(updatedProductPurchaseOrders);
      showAlert("Product purchase order deleted", "success");
    }
  }

  return (
    <ProductPurchaseOrderContext.Provider
      value={{
        product_purchase_orders,
        createProductPurchaseOrder,
        updateProductPurchaseOrder,
        deleteProductPurchaseOrder,
        loading,
      }}>
      {children}
    </ProductPurchaseOrderContext.Provider>
  );
}

export function useProductPurchaseOrderContext() {
  const context = useContext(ProductPurchaseOrderContext);
  if (!context) {
    throw new Error(
      "useProductPurchaseOrderContext must be used within a ProductPurchaseOrderProvider"
    );
  }
  return context;
}
```

**Additional note on types:** The `items: any[]` in `ProductPurchaseOrder` and the `any[]` params in function signatures exist in the original — do not change them (they are pre-existing type compromises in the codebase). Your job is the stale closure + logging fixes only.

---

### File 3: `src/pages/landing/Chat.tsx`

**Only change:** Find and guard/remove `console.log` calls. There are 3 in the file:

```tsx
// Line ~159 — inside useEffect, hot path:
console.log("[Chat] Waiting for data", { hasUser: !!user, loading, ticketsLoading });

// Line ~166 — inside useEffect:
console.log("[Chat] Open ticket lookup", { openTicket, ticketsCount: tickets.length });

// Line ~185 — inside useEffect:
console.log("[Chat] Using existing support conversation", { conversationId: existing.id, ... });

// Line ~262 — inside handleTicketFormSubmit:
console.log("[Chat] Created support conversation", { conversationId: created.id, ticketId: ticket.id });
```

Wrap ALL of them with `if (process.env.NODE_ENV === "development") { ... }`. Keep the `console.error` calls (they're already handling real errors). Do not change any other logic.

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders or `// ... rest of code` comments.
2. TypeScript strict — no `any` types added (existing `any` in `ProductPurchaseOrderContext` is pre-existing, leave it), no `!`, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for concatenation.
4. JSDoc comments on all exported functions.
5. `process.env.NODE_ENV === "development"` guard around all `console.error` / `console.log`.

---

---

## AGENT 4 – Memoization + Placeholder Image Cleanup

### Your Task

You are a senior TypeScript/React developer. Fix three files to improve render performance and eliminate external HTTP requests for placeholder images.

---

### File 1: `src/pages/landing/ProductSection.tsx`

**Problem 1 – `filteredProducts` not memoized:**  
The `filteredProducts` variable is computed as a plain JavaScript expression (not `useMemo`) after an early return. This means it re-runs on every render. It also appears after the `if (productsLoading) return (...)` early return — to use `useMemo` it must be moved **before** the early return (React rules prohibit hooks after conditional returns).

Current broken pattern (lines ~101–129, AFTER the loading check):
```tsx
const filteredProducts = products
  .filter((product) => {
    if (selectedCategory) {
      return product.category_id === selectedCategory.id;
    }
    if (departmentId && departmentId !== "all") {
      return product.department_id === departmentId;
    }
    if (rangeId && rangeId !== "all") {
      return product.range_id === rangeId;
    }
    if (brandId && brandId !== "all") {
      return product.brand_id === brandId;
    }
    return true;
  })
  .sort((a, b) => {
    if (selectedSort === "Price: Low to High") {
      return a.price - b.price;
    } else if (selectedSort === "Price: High to Low") {
      return b.price - a.price;
    } else {
      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    }
  });
```

**Fix:** Move this before `if (productsLoading) return (...)` and wrap in `useMemo`:
```tsx
const filteredProducts = useMemo(() => {
  return products
    .filter((product) => {
      // ... same filter logic
    })
    .sort((a, b) => {
      // ... same sort logic
    });
}, [products, selectedCategory, departmentId, rangeId, brandId, selectedSort]);
```

**Problem 2 – `productMedias.find()` called inline in JSX (O(n²)):**  
Currently in the `filteredProducts.map()` render:
```tsx
const mediaUrl =
  productMedias.find((media) => media.product_id === product.id)?.media_url ??
  "/default-image.jpg";
```

**Fix:** Add a `productMediaMap` memoized before the early return:
```tsx
const productMediaMap = useMemo(
  () => new Map(productMedias.map((m) => [m.product_id, m.media_url ?? ""])),
  [productMedias]
);
```
Then in the map: `const mediaUrl = productMediaMap.get(product.id) ?? "/default-image.jpg";`

---

### File 2: `src/pages/landing/Highlights.tsx`

**Problem:** 7+ fallback strings use `https://via.placeholder.com/...` which makes external HTTP requests when real media is not available. Replace them all with a module-level SVG data-URI helper.

**Step 1:** Add this function at module scope (outside the component, before the component definition):

```tsx
/**
 * Generates an inline SVG data-URI placeholder — no external HTTP request.
 * @param text - Label text for the placeholder image.
 * @returns A data: URI string for use in img src attributes.
 */
const makePlaceholderImageUrl = (text: string): string => {
  const safeText = text.replace(/[<>&"]/g, (ch) => {
    const escapes: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" };
    return escapes[ch] ?? ch;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#e5e7eb"/><text x="400" y="305" font-family="sans-serif" font-size="18" fill="#6b7280" text-anchor="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
```

**Step 2:** Replace all `https://via.placeholder.com/...` fallback strings. These appear at:
- Hero banner: `"https://via.placeholder.com/800x600?text=Featured+Highlight"` → `makePlaceholderImageUrl("Featured Highlight")`
- Festival banner: `"https://via.placeholder.com/800x600?text=Festival+Collection"` → `makePlaceholderImageUrl("Festival Collection")`
- Spring Vacay: `"https://via.placeholder.com/800x500?text=Spring+Vacay"` → `makePlaceholderImageUrl("Spring Vacay")`
- Spotlight items: `` `https://via.placeholder.com/400x500?text=Spotlight+${index + 1}` `` → `` makePlaceholderImageUrl(`Spotlight ${index + 1}`) ``
- Trending products: `` `https://via.placeholder.com/400x400?text=Product+${index + 1}` `` → `` makePlaceholderImageUrl(`Product ${index + 1}`) ``
- Featured Collection (row 1): `"https://via.placeholder.com/800x400?text=Featured+Collection"` → `makePlaceholderImageUrl("Featured Collection")`
- Collection side items: `` `https://via.placeholder.com/400x600?text=Collection+${index + 1}` `` → `` makePlaceholderImageUrl(`Collection ${index + 1}`) ``
- Street Meets Chic: `"https://via.placeholder.com/800x400?text=Street+Meets+Chic"` → `makePlaceholderImageUrl("Street Meets Chic")`
- Texture Talks: `"https://via.placeholder.com/800x400?text=Texture+Talks"` → `makePlaceholderImageUrl("Texture Talks")`
- All posts grid: `` `https://via.placeholder.com/400x400?text=Item+${index + 1}` `` → `` makePlaceholderImageUrl(`Item ${index + 1}`) ``

Do not change any other logic.

---

### File 3: `src/pages/landing/home.tsx`

**Problem 1 – `makePlaceholderImageUrl` defined inside the component:**  
Currently on approximately line 106, it is defined as a `const` inside the `HomePage` component body. This means it gets recreated on every render. Move it to **module scope** (outside and above the `HomePage` component function).

Current location (inside `HomePage` component, around line 106):
```tsx
const HomePage: React.FC = () => {
  // ...useState, useMemo hooks...

  /**
   * Generates a local SVG data-URI placeholder image with centred text.
   */
  const makePlaceholderImageUrl = (text: string): string => {
    const safeText = text.replace(/[<>&"]/g, (ch) => {
      const escapes: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" };
      return escapes[ch] ?? ch;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#e5e7eb"/><text x="150" y="105" font-family="sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">${safeText}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };
```

Move this function definition to just before the `ScrollableSection` component at the top of the file (before any components), removing it from inside `HomePage`.

**Problem 2 – 2 remaining `https://via.placeholder.com` instances in JSX:**  
Search for `https://via.placeholder.com` in `home.tsx`. There should be 2 remaining after previous fixes — one for post media fallback and one for product media fallback. Replace both with `makePlaceholderImageUrl(...)` calls.

For example:
- Post fallback: `` `https://via.placeholder.com/300x200?text=Post+${index + 1}` `` → `` makePlaceholderImageUrl(`Post ${index + 1}`) ``
- Product fallback: `` `https://via.placeholder.com/160?text=商品+${index + 1}` `` → `` makePlaceholderImageUrl(`商品 ${index + 1}`) ``

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders or `// ... rest of code` comments.
2. TypeScript strict — no `any`, no `!`, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for string concatenation.
4. JSDoc comments on all module-level helper functions added.
5. `useMemo` must be imported at the top of files where you add it (check existing imports first).

---

---

## AGENT 5 – Fix Hook Dependency Issues (CartContext, AddToCartLogContext, ProductReportContext)

### Your Task

You are a senior TypeScript/React developer. Three context files suppress ESLint hook dependency warnings with `// eslint-disable-line react-hooks/exhaustive-deps`. Each one has a real underlying issue: functions are defined as plain `async function` or `const` inside the component but are referenced in `useMemo` or `useEffect` without being listed as dependencies (because they'd change on every render without `useCallback`). Fix each file properly.

### The Pattern to Apply

For each context:
1. Add `useCallback` and `useRef` to the React imports.
2. Add `const showAlertRef = useRef<typeof showAlert | null>(null)` + a sync `useEffect` to keep it current.
3. Wrap each CRUD function in `useCallback`. Use `showAlertRef.current?.(...)` instead of `showAlert(...)` inside them, so `showAlert` doesn't need to be in their deps.
4. Update the `useMemo` (or `useEffect`) dependency array to include all the `useCallback`-wrapped functions.
5. Remove the `// eslint-disable-line react-hooks/exhaustive-deps` comment.

---

### File 1: `src/context/product/CartContext.tsx`

**Current state of the useMemo (end of file):**
```tsx
const value = useMemo<AddToCartContextProps>(
  () => ({
    add_to_carts,
    createAddToCart,
    updateAddToCart,
    deleteAddToCart,
    fetchByUser,
    clearCartByUser,
    loading,
  }),
  [add_to_carts, loading] // eslint-disable-line react-hooks/exhaustive-deps
);
```

The functions `createAddToCart`, `updateAddToCart`, `deleteAddToCart`, `fetchByUser`, `clearCartByUser` are plain `async function` / `const` declarations — not wrapped in `useCallback`. They are missing from the `useMemo` deps (hence the eslint-disable).

**Fix:**
- Wrap each of the 5 functions in `useCallback`.
- Use `showAlertRef.current?.(...)` in place of `showAlert(...)` inside each function (after adding the `showAlertRef` pattern).
- The `useEffect` that does `fetchAll()` and sets up the realtime subscription currently has `[showAlert]` in deps — keep using `showAlertRef` there too so deps can be `[]`.
- Update `useMemo` deps to: `[add_to_carts, loading, createAddToCart, updateAddToCart, deleteAddToCart, fetchByUser, clearCartByUser]`.
- Remove `// eslint-disable-line react-hooks/exhaustive-deps`.

---

### File 2: `src/context/product/AddToCartLogContext.tsx`

Same pattern as `CartContext.tsx`. The `useMemo` at the end has:
```tsx
[add_to_cart_logs, loading] // eslint-disable-line react-hooks/exhaustive-deps
```
but it includes functions `createAddToCartLog`, `updateAddToCartLog`, `deleteAddToCartLog`, `fetchByProductId` that are not wrapped in `useCallback`.

Apply the same fix:
- Add `useCallback`, `useRef` to imports.
- Add `showAlertRef` pattern.
- Wrap `createAddToCartLog`, `updateAddToCartLog`, `deleteAddToCartLog`, `fetchByProductId` in `useCallback`.
- Use `showAlertRef.current?.()` in place of `showAlert()`.
- Fix `useEffect` deps to `[]` using `showAlertRef`.
- Update `useMemo` deps to include all functions.
- Remove `// eslint-disable-line`.

---

### File 3: `src/context/product/ProductReportContext.tsx`

**Current state:**
```tsx
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
```

`fetchProductReports` is in the `useEffect` body but not in deps because it's recreated each render (not `useCallback`).

**Fix:**
1. Add `useCallback`, `useRef` to imports.
2. Add `showAlertRef` pattern.
3. Wrap `fetchProductReports` in `useCallback` with `[]` deps (uses `showAlertRef.current?.()` internally).
4. Wrap `createProductReport`, `updateProductReport`, `deleteProductReport` in `useCallback` too (they call `showAlert` directly — use `showAlertRef`).
5. Change `useEffect` deps to `[fetchProductReports]` (no eslint-disable needed now).
6. The context value is currently spread directly (no `useMemo`) — wrap it in `useMemo` with all functions and `[product_reports, loading, fetchProductReports, createProductReport, updateProductReport, deleteProductReport]` as deps.

**Note on `createContext` call:** The current code has `createContext<ProductReportContextProps>(undefined!)`. Keep this as-is — it's pre-existing. Do not change the context initialisation.

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders or `// ... rest of code` comments.
2. TypeScript strict — no `any` (existing `any` in these files can stay if they're pre-existing), no `!` added by you, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for concatenation.
4. JSDoc comments on all exported functions.
5. All async operations must have proper `try/catch` error handling.
6. `process.env.NODE_ENV === "development"` guard around any `console.error` / `console.log`.
7. No `// eslint-disable` comments in the output — fix the root cause instead.
