# Performance Fix Agent Prompts — Round 5 (2026)

> **For the implementer:** Copy the full section below when passing to the final polishing agent. Ensure they apply all fixes precisely. No overlap with prior rounds is required.

---

## AGENT 1 — Final Polishing: `Math.random` Eradication & Remaining Warnings

### Your Task

You are a senior TypeScript/React developer handling the final performance and code quality polish pass on 6 files. You need to eradicate the final 3 uses of `Math.random` that escaped previous rounds, remove some lingering `eslint-disable` comments, and dev-guard the last 3 `console.warn` outputs.

---

### File 1: `src/pages/support/chat-window.tsx`

**Line 153** (inside `handleFileChange -> newAttachments.map`):
```tsx
// BEFORE:
const id = Math.random().toString(36).substring(2, 9);

// AFTER:
const id = crypto.randomUUID().substring(0, 8);
```
*(This guarantees a collision-free short ID for temporary attachments)*

---

### File 2: `src/pages/landing/Cart.tsx`

**Fix 1 — Line ~349** (fake Stripe session ID):
```tsx
// BEFORE:
const fakeId = `cs_test_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

// AFTER:
const fakeId = `cs_test_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
```

**Fix 2 — Lines ~150-168** (remove `eslint-disable` comments entirely inside the `// Keep UI usable even if one query fails` block):

There are four blocks that look like this:
```tsx
// BEFORE:
if (productsRes.error) {
  // Keep UI usable even if one query fails
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.error(productsRes.error);
  }
}
if (mediasRes.error) {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.error(mediasRes.error);
  }
}
if (colorsRes && "error" in colorsRes && colorsRes.error) {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.error(colorsRes.error);
  }
}
if (sizesRes && "error" in sizesRes && sizesRes.error) {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.error(sizesRes.error);
  }
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

---

### File 3: `src/pages/landing/Checkout.tsx`

**Line 153** (inside `handlePlaceOrder`):
The frontend currently uses `Math.random` to generate a faux order number for display. Replace it with a combination of `Date.now()`.
```tsx
// BEFORE:
// Generate a random order number
const randomOrderNum = Math.floor(100000 + Math.random() * 900000);

// AFTER:
// Generate a pseudo-random order number from timestamp
const randomOrderNum = Math.floor(100000 + (Date.now() % 900000));
```

---

### File 4: `src/pages/internal-chat/index.tsx`

**Line 269** (inside `handleStartDirectMessage`):
```tsx
// BEFORE:
if (!created?.id) {
  console.warn("[InternalChat] Failed to create conversation");
  return;
}

// AFTER:
if (!created?.id) {
  if (process.env.NODE_ENV === "development") {
    console.warn("[InternalChat] Failed to create conversation");
  }
  return;
}
```

---

### File 5: `src/context/WishlistContext.tsx`

**Line 134** (inside `fetchWishlist`, catch block):
```tsx
// BEFORE:
// Missing table error Code = '42P01' from Supabase
if (err?.code === "42P01") {
  console.warn("Wishlist table does not exist yet. Skipping fetch.");
  setWishlist([]); // fail gracefully
  return;
}

// AFTER:
// Missing table error Code = '42P01' from Supabase
if (err?.code === "42P01") {
  if (process.env.NODE_ENV === "development") {
    console.warn("Wishlist table does not exist yet. Skipping fetch.");
  }
  setWishlist([]); // fail gracefully
  return;
}
```

---

### File 6: `src/components/stripe/OrderSuccess.tsx`

**Line 144** (inside `createPoints` fallback catch):
```tsx
// BEFORE:
} catch (createError) {
  console.warn("Failed to create user_points, attempting to fetch again:", createError);
  
// AFTER:
} catch (createError) {
  if (process.env.NODE_ENV === "development") {
    console.warn("Failed to create user_points, attempting to fetch again:", createError);
  }
```

---

### CODING STANDARDS (mandatory)
1. Output the complete modified file(s) — no placeholders.
2. TypeScript strict — no new `any` types. 
3. Double quotes `"` for all strings.
4. JSDoc on all exported functions.
5. Exact block matches for formatting.

---
