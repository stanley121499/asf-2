# Performance Fix Agent Prompts — Round 4 (2026)

> **For the implementer:** Each section below is a self-contained prompt for a separate agent run. Copy the full section content when passing to the agent. Each agent works on a distinct set of files with no overlap. Do NOT redo Round 3 fixes that are confirmed applied (e.g., `home.tsx`, `HomeHighlightsCard.tsx`, `orders/detail.tsx` console.error).

---

## AGENT 1 — `Math.random()` Upload IDs + `Array(1).fill()` Anti-Pattern

### Your Task

You are a senior TypeScript/React developer. Fix two categories of bugs across 5 files:

1. Replace `Math.random().toString(36)...` with `crypto.randomUUID()` for all Supabase Storage upload file IDs.
2. Remove the `Array(1).fill(null)` anti-pattern in `create-post-page.tsx`.
3. Guard all bare `console.error` calls in these files with dev guards.

### Why `Math.random()` is wrong here

`Math.random().toString(36).substring(2)` produces ~8-character pseudo-random strings. With several uploads per session, the collision probability is high enough to cause `upsert: false` upload failures. `crypto.randomUUID()` generates RFC-4122 UUIDs — globally unique, no import needed, available in all modern browsers and Node 14+.

---

### File 1: `src/pages/products/create-set-modal.tsx`

**Line 32** (inside `handleCreate`):
```tsx
// BEFORE:
const randomId = Math.random().toString(36).substring(2);
const { data, error } = await supabase.storage
  .from("product_medias")
  .upload(`${randomId}`, file, { cacheControl: "3600", upsert: false });
if (error) {
  console.error(error);
  showAlert("Failed to upload file", "error");
  return;
}

// AFTER:
const uploadId = crypto.randomUUID();
const { data, error } = await supabase.storage
  .from("product_medias")
  .upload(uploadId, file, { cacheControl: "3600", upsert: false });
if (error) {
  if (process.env.NODE_ENV === "development") {
    console.error(error);
  }
  showAlert("Failed to upload file", "error");
  return;
}
```

No other logic changes. The media URL construction (`data.path`) is unchanged.

---

### File 2: `src/pages/products/create-category-modal.tsx`

**Line 35** (inside `handleAddCategory`):
```tsx
// BEFORE:
const randomId = Math.random().toString(36).substring(2);
const { data, error } = await supabase.storage
  .from("product_medias")
  .upload(`${randomId}`, file, {
    cacheControl: "3600",
    upsert: false,
  });
if (error) {
  console.error(error);
  showAlert("Failed to upload file", "error");
  return;
}

// AFTER:
const uploadId = crypto.randomUUID();
const { data, error } = await supabase.storage
  .from("product_medias")
  .upload(uploadId, file, {
    cacheControl: "3600",
    upsert: false,
  });
if (error) {
  if (process.env.NODE_ENV === "development") {
    console.error(error);
  }
  showAlert("Failed to upload file", "error");
  return;
}
```

---

### File 3: `src/pages/products/create-product-page.tsx`

**Line 89** (inside `handleUpload`, inside `Promise.all` `acceptedFiles.map`):

This handler appends the original file extension to the storage path (for correct Content-Type). Only change the ID generation, keep the extension logic:

```tsx
// BEFORE:
const randomId = Math.random().toString(36).substring(2);
const ext = file.name.includes(".")
  ? `.${file.name.split(".").pop() ?? ""}`
  : "";
const storagePath = `${randomId}${ext}`;

// AFTER:
const uploadId = crypto.randomUUID();
const ext = file.name.includes(".")
  ? `.${file.name.split(".").pop() ?? ""}`
  : "";
const storagePath = `${uploadId}${ext}`;
```

Also guard the two `console.error` calls in this file (lines 104 and 122):
```tsx
// BEFORE:
console.error(error);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.error(error);
}
```

And at line 122:
```tsx
// BEFORE:
console.error(err);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.error(err);
}
```

---

### File 4: `src/pages/posts/create-post-page.tsx`

**Fix 1 — Line 73** (inside `handleUpload`, inside `acceptedFiles.forEach`):

```tsx
// BEFORE:
const randomId = Math.random().toString(36).substring(2);
const ext = file.name.includes(".")
  ? `.${file.name.split(".").pop() ?? ""}`
  : "";
const storagePath = `${randomId}${ext}`;

// AFTER:
const uploadId = crypto.randomUUID();
const ext = file.name.includes(".")
  ? `.${file.name.split(".").pop() ?? ""}`
  : "";
const storagePath = `${uploadId}${ext}`;
```

Also guard the two `console.error` calls (at lines 88 and 106):
```tsx
if (process.env.NODE_ENV === "development") {
  console.error(error);
}
```

**Fix 2 — `Array(1).fill(null)` anti-pattern** (post folder list, line ~161):

```tsx
// BEFORE:
{postFolders.map((folder) =>
  Array(1)
    .fill(null)
    .map((_, index) => (
      <Card
        key={`${folder.id}-${index}`}
        ...
      >
        ...
      </Card>
    ))
)}

// AFTER:
{postFolders.map((folder) => (
  <Card
    key={folder.id}
    ...
  >
    ...
  </Card>
))}
```

**Fix 3 — `Array(1).fill(null)` anti-pattern** (posts list, line ~217):

```tsx
// BEFORE:
{posts
  .filter((post) => post.post_folder_id === selectedFolder?.id)
  .flatMap((post) =>
    Array(1)
      .fill(null)
      .map((_, index) => (
        <Card
          key={`${post.id}-${index}`}
          ...
        >
          ...
        </Card>
      ))
  )}

// AFTER:
{posts
  .filter((post) => post.post_folder_id === selectedFolder?.id)
  .map((post) => (
    <Card
      key={post.id}
      ...
    >
      ...
    </Card>
  ))}
```

---

### File 5: `src/utils/upload.ts`

**Line 18**:
```ts
// BEFORE:
const path = `${folder}/${timestamp}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

// AFTER:
const path = `${folder}/${timestamp}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;
```

This preserves the timestamp prefix (for ordering/debugging) and keeps the length of the random segment constant (~8 chars), but sourced from a UUID instead of `Math.random()`.

No other changes in `upload.ts`.

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders or `// ... rest of code`.
2. TypeScript strict mode — no `any` types added; pre-existing `any` (e.g., `(acceptedFiles[0] as any).path`) OK to keep.
3. Double quotes `"` for all strings. Template literals for concatenation.
4. JSDoc on all exported functions and complex logic.
5. `process.env.NODE_ENV === "development"` guard around all `console.error` / `console.log`.

---

---

## AGENT 2 — Round 3 Residue: Chat, Internal Chat, CheckoutButton, Stock & Post Modals

### Your Task

You are a senior TypeScript/React developer. Apply Round 3 fixes that were not executed. Wrap all bare `console.log` and `console.error` calls with dev guards across 6 files.

### Background

These files were scheduled in Round 3 but the agents did not run. The pattern is uniform across all files:
```tsx
// BEFORE:
console.error("message", data);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.error("message", data);
}
```

---

### File 1: `src/pages/landing/Chat.tsx`

Wrap these 3 `console.error` calls (do NOT touch `console.log` calls — those were already guarded in Round 2):

```tsx
// Line ~247 — inside handleCreateChat:
// BEFORE:
if (!ticket?.id) {
  console.error("Failed to create ticket");
  return;
}
// AFTER:
if (!ticket?.id) {
  if (process.env.NODE_ENV === "development") {
    console.error("Failed to create ticket");
  }
  return;
}

// Line ~261:
// BEFORE:
if (!created?.id) {
  console.error("Failed to create conversation");
  return;
}
// AFTER:
if (!created?.id) {
  if (process.env.NODE_ENV === "development") {
    console.error("Failed to create conversation");
  }
  return;
}

// Line ~283 in catch block:
// BEFORE:
} catch (error) {
  console.error("Error creating ticket and conversation:", error);
}
// AFTER:
} catch (error) {
  if (process.env.NODE_ENV === "development") {
    console.error("Error creating ticket and conversation:", error);
  }
}
```

---

### File 2: `src/pages/internal-chat/index.tsx`

Wrap **every** bare `console.log` and `console.error` call in the file with a dev guard. Key locations:

- Lines ~64–67: `console.log("[DirectChat Debug]", {...})`
- Lines ~95–100: `console.log("[DirectChat Debug - Names]", {...})`
- Line ~264: `console.log("[InternalChat] Creating direct conversation", {...})`
- Line ~276: `console.log("[InternalChat] Direct conversation ready", {...})`
- Line ~283: `console.error("[InternalChat] Error starting direct message", e)`
- Line ~292: `console.error("[InternalChat] No group selected for invitation")`
- Line ~301: `console.error("[InternalChat] No conversation found for group", ...)`
- Line ~310: `console.log("[InternalChat] User already in group")`
- Line ~324: `console.log("[InternalChat] User invited to group successfully", {...})`
- Line ~331: `console.error("[InternalChat] Error inviting user to group", e)`
- Line ~502: `console.error("[InternalChat] Error creating group conversation:", error)`
- Line ~879: `console.log("[InternalChat] Group created", row)`
- Line ~908: `console.log("[InternalChat] Community created", row)`

Scan the entire file for any other bare console calls and wrap them all.

---

### File 3: `src/components/stripe/CheckoutButton.tsx`

**Lines 80–81**:
```tsx
// BEFORE:
console.log(env, appUrl, portEnv, isDev);
console.log("Condition Check:", isDev);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.log(env, appUrl, portEnv, isDev);
  console.log("Condition Check:", isDev);
}
```

---

### File 4: `src/pages/products/add-stock-modal.tsx`

**Line 48** (inside render or effect where `stockLogs` is accessed):
```tsx
// BEFORE:
console.log(stockLogs);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.log(stockLogs);
}
```

Also remove any **commented-out** `// console.log(productStocks)` lines entirely.

---

### File 5: `src/pages/products/add-return-modal.tsx`

**Line 49**:
```tsx
// BEFORE:
console.log(stockLogs);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.log(stockLogs);
}
```

---

### File 6: `src/pages/posts/post-editor.tsx`

**Lines 67–68** (inside save handler):
```tsx
// BEFORE:
console.log("Save post");
console.log(postData);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.log("Save post");
  console.log(postData);
}
```

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no `// ... rest of code` placeholders.
2. TypeScript strict — no new `any` types.
3. Double quotes `"` for all strings.
4. JSDoc on exported functions.
5. `process.env.NODE_ENV === "development"` guard around all `console.error` / `console.log`.

---

---

## AGENT 3 — Settings, Cart, Payments, Orders: console Cleanup

### Your Task

You are a senior TypeScript/React developer. Guard bare `console.error` calls across 5 pages and fix an anti-pattern in `Cart.tsx` where `// eslint-disable-next-line no-console` is used instead of a proper dev guard.

---

### File 1: `src/pages/landing/Settings.tsx`

Wrap **all** bare `console.error` calls in this file with dev guards. The calls are:

- Line 75: `console.error("Error fetching user points:", err)` — in `fetchUserPoints`
- Line 136: `console.error("Avatar upload error:", uploadError.message)` — in `handleUploadAvatar`
- Line 148: `console.error("Updating profile image failed:", updateError.message)` — in `handleUploadAvatar`
- Line 154: `console.error("Unexpected avatar upload error:", err)` — catch in `handleUploadAvatar`
- Line 171: `console.error("Updating user_details failed:", detailErr.message)` — in `handleSaveProfile`
- Line 184: `console.error("Updating auth user metadata failed:", authErr.message)` — in `handleSaveProfile`
- Line 192: `console.error("Unexpected save profile error:", err)` — catch in `handleSaveProfile`
- Line 206: `console.error("Password update error:", error.message)` — in `handleUpdatePassword`
- Line 213: `console.error("Unexpected password update error:", err)` — catch in `handleUpdatePassword`

Pattern for each:
```tsx
// BEFORE:
console.error("Avatar upload error:", uploadError.message);
return;

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.error("Avatar upload error:", uploadError.message);
}
return;
```

---

### File 2: `src/pages/landing/Cart.tsx`

Lines 147–161 have four `console.error` calls each preceded by `// eslint-disable-next-line no-console`. Replace the eslint-disable approach with dev guards:

```tsx
// BEFORE:
if (productsRes.error) {
  // Keep UI usable even if one query fails
  // eslint-disable-next-line no-console
  console.error(productsRes.error);
}
if (mediasRes.error) {
  // eslint-disable-next-line no-console
  console.error(mediasRes.error);
}
if (colorsRes && "error" in colorsRes && colorsRes.error) {
  // eslint-disable-next-line no-console
  console.error(colorsRes.error);
}
if (sizesRes && "error" in sizesRes && sizesRes.error) {
  // eslint-disable-next-line no-console
  console.error(sizesRes.error);
}

// AFTER:
if (productsRes.error) {
  // Keep UI usable even if one query fails
  if (process.env.NODE_ENV === "development") {
    console.error(productsRes.error);
  }
}
if (mediasRes.error) {
  if (process.env.NODE_ENV === "development") {
    console.error(mediasRes.error);
  }
}
if (colorsRes && "error" in colorsRes && colorsRes.error) {
  if (process.env.NODE_ENV === "development") {
    console.error(colorsRes.error);
  }
}
if (sizesRes && "error" in sizesRes && sizesRes.error) {
  if (process.env.NODE_ENV === "development") {
    console.error(sizesRes.error);
  }
}
```

Also guard line 68: `console.error("Error fetching user points:", err)` in the `fetchUserPoints` effect.

---

### File 3: `src/pages/payments/detail.tsx`

Three bare `console.error` calls:
- Line 271: `console.error("Error fetching payment details:", err)`  
- Line 302: `console.error("Error updating status:", err)`  
- Line 343: `console.error("Error updating refund:", err)`  

Wrap each with a dev guard.

---

### File 4: `src/pages/orders/list.tsx`

Three bare `console.error` calls:
- Line 207: `console.error("Error fetching users:", usersError)`  
- Line 227: `console.error("Error fetching order items:", itemsError)`  
- Line 265: `console.error("Error fetching order details:", error)`  

Wrap each with a dev guard.

---

### File 5: `src/pages/orders/detail.tsx`

One bare `console.log` call at **line 236** (the `console.error` calls in this file are already guarded from Round 3):

```tsx
// BEFORE (inside handleStatusUpdate):
// TODO: Add status change log once order_status_logs table is available
// For now, just log to console
console.log("Status change:", {
  order_id: order.id,
  old_status: order.status,
  new_status: newStatus,
  changed_by: "admin",
  user_id: order.user_id,
});

// AFTER:
// TODO: Add status change log once order_status_logs table is available
if (process.env.NODE_ENV === "development") {
  console.log("Status change:", {
    order_id: order.id,
    old_status: order.status,
    new_status: newStatus,
    changed_by: "admin",
    user_id: order.user_id,
  });
}
```

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders.
2. TypeScript strict — no new `any` types. Existing `any` usages like `Record<string, unknown>` casts in `Cart.tsx` are correct — do not change.
3. Double quotes `"` for all strings.
4. JSDoc on all exported functions.
5. `process.env.NODE_ENV === "development"` guard around all `console.error` / `console.log`.
6. Remove `// eslint-disable-next-line no-console` comments where you add dev guards (they are no longer needed).

---

---

## AGENT 4 — Schedule, Deleted Products, Support, Landing Pages: console.error Cleanup

### Your Task

You are a senior TypeScript/React developer. Wrap all bare `console.error` calls in 8 files with dev guards. These are all identical one-liner pattern fixes — no logic changes.

### Fix Pattern (apply uniformly to all occurrences in all files below)

```tsx
// BEFORE:
console.error(error);
// or:
console.error("Message", error);

// AFTER:
if (process.env.NODE_ENV === "development") {
  console.error(error);
}
// or:
if (process.env.NODE_ENV === "development") {
  console.error("Message", error);
}
```

---

### File 1: `src/pages/products/schedule-product-page.tsx`

Wrap the `console.error(error)` calls at lines **152** and **168** (inside schedule/unschedule product upload handlers).

---

### File 2: `src/pages/posts/schedule-post-page.tsx`

Wrap the `console.error(error)` calls at lines **145** and **161** (same pattern as schedule-product-page).

---

### File 3: `src/pages/products/deleted-products.tsx`

Wrap:
- Line 43: `console.error("Failed to fetch deleted products:", error)` — in `fetchDeletedProducts`
- Line 67: `console.error("Restore product failed:", error)` — in `handleRestore`

---

### File 4: `src/pages/support/chat-window.tsx`

Wrap:
- Line 50: `console.error("[SupportChat] Failed to upload attachment(s)", e)` — in attachment upload handler

---

### File 5: `src/pages/landing/ProductDetails.tsx`

Wrap:
- Line 106: `console.error("Failed to check product availability:", error)` — in availability check effect

---

### File 6: `src/pages/landing/OrderDetail.tsx`

Wrap:
- Line 86: `console.error("Error fetching order details:", err)` — in order fetch effect

---

### File 7: `src/pages/landing/components/OrdersList.tsx`

Wrap:
- Line 40: `console.error("Error fetching order items:", error)` — in order items fetch effect

---

### File 8: `src/context/product/ProductPurchaseOrderContext.tsx`

Wrap:
- Line 165: `console.log(entriesError)` — inside `createProductPurchaseOrder` error path

Note: The `console.log` here is also a logging call (not `error`), but it belongs in a dev-guarded block.

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no `// ... rest of code` placeholders.
2. TypeScript strict — no new `any` types.
3. Double quotes `"` for all strings.
4. JSDoc on all exported functions.
5. `process.env.NODE_ENV === "development"` guard around all `console.error` / `console.log`.
6. Do NOT change any logic, hooks, effects, or JSX beyond the console call wrapping.
