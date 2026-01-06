# Critical Bugs & Issues

**Priority**: 🔴 **MUST FIX BEFORE PRODUCTION**

Last Updated: January 6, 2026

---

## 🚨 Priority 1: Customer-Facing Product Detail Page - Incomplete & Broken

### Issue

**Location**: `src/pages/landing/ProductDetails.tsx`

The customer-facing product detail page is **critically incomplete** and **non-functional** for variant products:

#### Missing Information
- ❌ No color selection UI
- ❌ No size selection UI
- ❌ No stock status display
- ❌ No stock count display
- ❌ No article number
- ❌ No festival/season information
- ❌ Only shows first image (no gallery)
- ❌ No variant-specific pricing

#### Critical Bug: Hardcoded NULL Variants

```typescript
// Current buggy code (lines ~200-210)
await createAddToCart({
  product_id: product.id,
  user_id: user.id,
  amount: 1,
  color_id: null,      // ❌ HARDCODED NULL!
  size_id: null,       // ❌ HARDCODED NULL!
});
```

**Impact**: 
- Customers cannot select product variants
- All cart items have `null` color/size
- Stock system cannot track variant-level inventory
- Orders will fail or have incorrect data

### How It Manifests

1. Customer views product detail page
2. Sees basic info only (name, description, price, brand)
3. Cannot see or select colors/sizes
4. Clicks "Add to Cart"
5. Item added without variant information
6. Stock not decremented correctly
7. Order fulfillment impossible (no variant info)

### Root Cause

The component was implemented with only basic product information, ignoring:
- `product.product_colors` array
- `product.product_sizes` array
- `product_media` array (image gallery)
- `product_stock` variant-level inventory

### Fix Required

**Refactor** `src/pages/landing/ProductDetails.tsx` to include:

1. **Color Selection UI**
   ```typescript
   const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
   
   // Display color swatches
   {product.product_colors?.map((color) => (
     <button
       key={color.id}
       onClick={() => setSelectedColor(color)}
       className={/* active state styling */}
     >
       {color.color}
     </button>
   ))}
   ```

2. **Size Selection UI**
   ```typescript
   const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
   
   // Display size buttons
   {product.product_sizes?.map((size) => (
     <button
       key={size.id}
       onClick={() => setSelectedSize(size)}
     >
       {size.size}
     </button>
   ))}
   ```

3. **Stock Display**
   ```typescript
   const currentStock = useMemo(() => {
     if (!selectedColor || !selectedSize) return null;
     return productStocks.find(
       (stock) =>
         stock.product_id === product.id &&
         stock.color_id === selectedColor.id &&
         stock.size_id === selectedSize.id
     );
   }, [selectedColor, selectedSize, productStocks, product.id]);
   
   // Display stock status
   {currentStock && (
     <p className={currentStock.quantity > 0 ? "text-green-600" : "text-red-600"}>
       {currentStock.quantity > 0 ? `In Stock (${currentStock.quantity})` : "Out of Stock"}
     </p>
   )}
   ```

4. **Image Gallery**
   ```typescript
   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
   
   // Main image
   <img src={productMedia[selectedImageIndex]?.media_url} />
   
   // Thumbnail gallery
   {productMedia.map((media, index) => (
     <img
       key={media.id}
       src={media.media_url}
       onClick={() => setSelectedImageIndex(index)}
     />
   ))}
   ```

5. **Fix Add to Cart**
   ```typescript
   const handleAddToCart = async () => {
     // Validation
     if (!selectedColor || !selectedSize) {
       showAlert("Please select color and size", "destructive");
       return;
     }
     
     // Check stock
     if (!currentStock || currentStock.quantity < 1) {
       showAlert("Product out of stock", "destructive");
       return;
     }
     
     // Add to cart with correct variant IDs
     await createAddToCart({
       product_id: product.id,
       user_id: user.id,
       amount: 1,
       color_id: selectedColor.id,  // ✅ Correct!
       size_id: selectedSize.id,     // ✅ Correct!
     });
   };
   ```

### Testing Checklist

After fixing:
- [ ] Color selection works and displays available colors
- [ ] Size selection works and displays available sizes
- [ ] Stock status updates when selecting variants
- [ ] Image gallery displays all product images
- [ ] Cannot add out-of-stock items to cart
- [ ] Cart items have correct `color_id` and `size_id`
- [ ] Article number, festival, season displayed
- [ ] Mobile responsive

---

## 🚨 Priority 2: Async Operations in Loops

### Issue

**Location**: `src/context/product/ProductContext.tsx` (lines ~140-160)

Using `forEach` with `async/await` creates **race conditions** and **data inconsistency**:

```typescript
// ❌ BUGGY CODE
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
```

### Why This Is Broken

`forEach` **does not wait** for async operations. The code continues immediately, leading to:
- Race conditions
- Partial data creation
- Product marked as created before variants are saved
- No error handling if variant creation fails

### Fix Required

```typescript
// ✅ CORRECT CODE
await Promise.all(
  selectedColors.map((color) =>
    createProductColor({
      product_id: newProduct.id,
      color: color,
      active: true,
    })
  )
);

await Promise.all(
  selectedSizes.map((size) =>
    createProductSize({
      product_id: newProduct.id,
      size: size,
      active: true,
    })
  )
);

await Promise.all(
  selectedCategories.map((category) =>
    createProductCategory({
      product_id: newProduct.id,
      category_id: category,
    })
  )
);
```

### Affected Functions

- `createProduct()` in `ProductContext`
- `updateProduct()` in `ProductContext`
- Any other context using `forEach(async)`

---

## 🚨 Priority 3: useEffect Dependency Hell

### Issue

**Location**: Multiple contexts, especially `ProductContext.tsx`, `ProductFolderContext.tsx`

`useEffect` hooks have **problematic dependencies** causing:
- Infinite re-render loops
- Unnecessary re-fetches
- Stale data
- Unresponsive UI

### Example 1: Loading State Set Prematurely

```typescript
// ❌ BUGGY CODE
useEffect(() => {
  setLoading(true);
  
  const fetchProducts = async () => {
    // ... async fetch
  };
  
  fetchProducts();
  
  setLoading(false);  // ❌ Runs IMMEDIATELY, not after fetch!
  
}, [showAlert]);  // ❌ Dangerous dependency
```

**Fix**:

```typescript
// ✅ CORRECT CODE
useEffect(() => {
  let isMounted = true;
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // ... async fetch
    } finally {
      if (isMounted) {
        setLoading(false);  // ✅ Runs after fetch completes
      }
    }
  };
  
  fetchProducts();
  
  return () => {
    isMounted = false;
  };
}, []); // ✅ Removed showAlert dependency
```

### Example 2: Circular Dependencies

**Location**: `ProductFolderContext.tsx`

```typescript
// ❌ BUGGY CODE
useEffect(() => {
  // ... fetch productFolders
  for (const productFolder of productFolders) {
    productFolder.medias = productFolderMedias.filter(...);
  }
  setProductFolders(productFolders);
}, [productFolderMedias, showAlert]);  // ❌ Re-fetches when productFolderMedias changes
```

**Problem**: When `productFolderMedias` updates, this re-fetches ALL folders, even though media is already in state.

**Fix**:

```typescript
// ✅ CORRECT CODE
// Separate effect for initial fetch
useEffect(() => {
  const fetchProductFolders = async () => {
    // ... fetch folders only
  };
  fetchProductFolders();
}, []);

// Compute medias from state, no fetch needed
const foldersWithMedias = useMemo(() => {
  return productFolders.map((folder) => ({
    ...folder,
    medias: productFolderMedias.filter((media) => media.product_folder_id === folder.id),
  }));
}, [productFolders, productFolderMedias]);
```

### Example 3: Product Editor State Not Clearing

**Location**: `src/pages/products/product-editor.tsx`

```typescript
// ❌ BUGGY CODE
useEffect(() => {
  if (selectedProduct) {
    // Load product data
  } else {
    // Reset form
  }
}, [productFolderMedias, productMedias, selectedFolder?.id, selectedProduct]);
// ❌ Resets form when media changes!
```

**Problem**: Form resets whenever `productFolderMedias` or `productMedias` updates (which happens frequently), clearing user input.

**Fix**:

```typescript
// ✅ CORRECT CODE
useEffect(() => {
  if (selectedProduct) {
    // Load product data
  } else {
    // Reset form
  }
}, [selectedProduct]); // ✅ Only depend on selectedProduct

// Separate effect for media
useEffect(() => {
  // Load media separately
}, [selectedProduct?.id, productFolderMedias, productMedias]);
```

---

## 🚨 Priority 4: Promotions Module - Completely Broken

### Issue

**Location**: `src/pages/promotions/` (all files)

The promotions module is **non-functional**:

- `list.tsx` - Displays products, not promotions
- `create-promotion-page.tsx` - Creates products, not promotions
- `promotion-editor.tsx` - Edits products, not promotions
- No `PromotionContext` exists
- No promotion database queries
- `Array(20)` rendering bug in list view

### Why This Happened

Files were **copy-pasted** from `/products` directory without modification.

### Fix Required

1. **Create `PromotionContext`**
   - Define promotion type (discount, BOGO, free shipping, etc.)
   - Implement CRUD operations
   - Add realtime subscriptions

2. **Create Database Schema** (if not exists)
   ```sql
   CREATE TABLE promotions (
     id UUID PRIMARY KEY,
     name TEXT,
     description TEXT,
     discount_type TEXT, -- percentage, fixed, bogo
     discount_value NUMERIC,
     start_date TIMESTAMP,
     end_date TIMESTAMP,
     active BOOLEAN,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   CREATE TABLE promotion_products (
     id UUID PRIMARY KEY,
     promotion_id UUID REFERENCES promotions(id),
     product_id UUID REFERENCES products(id)
   );
   ```

3. **Rewrite All Promotion Pages**
   - Use promotion-specific logic
   - Remove product-related code
   - Implement promotion UI

---

## 🚨 Priority 5: Stock System - Frontend Not Integrated

### Issue

**Backend Status**: ✅ Fully implemented
- Database schema supports variant-level stock tracking
- `ProductStockContext` has all CRUD operations
- `OrderContext` decrements stock correctly
- `AddStockModal` and `AddReturnModal` handle variants

**Frontend Status**: ❌ Not integrated with customer-facing pages
- `ProductDetails.tsx` doesn't check stock
- `ProductDetails.tsx` doesn't display stock
- Cart doesn't validate stock before checkout
- No "low stock" warnings

### Fix Required

1. **Product Details Page** (see Priority 1)
2. **Cart Page** - Validate stock before checkout
3. **Checkout Page** - Final stock validation
4. **Product Cards** - Show "In Stock" / "Out of Stock" badges

---

## 🚨 Priority 6: Missing Context Value Memoization

### Issue

**Location**: All context providers

Context values and functions are **not memoized**, causing **unnecessary re-renders**:

```typescript
// ❌ BUGGY CODE (example from PaymentContext)
const value = useMemo<PaymentContextProps>(
  () => ({
    payments,
    loading,
    refreshPayments,      // ❌ Function recreated on every render
    updatePaymentStatus,  // ❌ Function recreated on every render
    updateRefundStatus    // ❌ Function recreated on every render
  }),
  [payments, loading]     // ❌ Functions not in dependencies
);
```

**Problem**: Functions recreated every render → Context consumers re-render unnecessarily.

### Fix Required

```typescript
// ✅ CORRECT CODE
const refreshPayments = useCallback(async () => {
  // ... implementation
}, [/* dependencies */]);

const updatePaymentStatus = useCallback(async (id, status) => {
  // ... implementation
}, [/* dependencies */]);

const updateRefundStatus = useCallback(async (id, status) => {
  // ... implementation
}, [/* dependencies */]);

const value = useMemo<PaymentContextProps>(
  () => ({
    payments,
    loading,
    refreshPayments,
    updatePaymentStatus,
    updateRefundStatus
  }),
  [payments, loading, refreshPayments, updatePaymentStatus, updateRefundStatus]
);
```

**Apply this fix to ALL 35+ context providers**.

---

## 🚨 Priority 7: Realtime Subscription Handlers - Inefficient

### Issue

**Location**: All contexts with realtime subscriptions

Subscription handlers iterate through **entire arrays** for updates/deletes:

```typescript
// ❌ INEFFICIENT CODE
.on("postgres_changes", { event: "UPDATE" }, (payload) => {
  setProducts((prev) =>
    prev.map((product) =>
      product.id === payload.new.id ? { ...product, ...payload.new } : product
    )
  );
})
```

**Problem**: O(n) complexity for every update, causes lag with large datasets.

### Fix Required

**Option 1**: Use indexed data structures

```typescript
// Store products as Map or Record
const [productsMap, setProductsMap] = useState<Record<string, Product>>({});

// Update in O(1) time
.on("postgres_changes", { event: "UPDATE" }, (payload) => {
  setProductsMap((prev) => ({
    ...prev,
    [payload.new.id]: { ...prev[payload.new.id], ...payload.new }
  }));
});
```

**Option 2**: Optimistic updates

```typescript
// Update immediately, verify later
const updateProduct = async (id, data) => {
  // Optimistic update
  setProducts((prev) =>
    prev.map((p) => (p.id === id ? { ...p, ...data } : p))
  );
  
  // Actual update
  const { error } = await supabase.from("products").update(data).eq("id", id);
  
  if (error) {
    // Rollback on error
    fetchProducts();
  }
};
```

---

## 🔴 Other Critical Issues

### 8. Category V2 Page - Uses localStorage Instead of Database

**Location**: `src/pages/products/category-v2-page.tsx`

Uses `localStorage` for persistence, creating a **parallel system** that doesn't sync with database.

**Fix**: Delete this file or rewrite to use existing contexts.

---

### 9. Wishlist - Implemented But No Route

**Location**: `src/pages/landing/Wishlist.tsx`

Fully implemented with mock data but:
- No route defined in `App.tsx`
- No backend integration
- Uses mock data

**Fix**: 
- Add route: `/wishlist`
- Create `WishlistContext`
- Integrate with database

---

### 10. Checkout Page - Uses Mock Data

**Location**: `src/pages/landing/Checkout.tsx`

Payment section is **commented out**, cart uses **mock data**.

**Fix**:
- Integrate with `AddToCartContext`
- Implement payment gateway
- Enable payment section

---

### 11. Product Scheduling - Incomplete

**Location**: `src/pages/products/schedule-product-page.tsx`

- `Array(10)` rendering bug
- `updateProductTimePost` call commented out

**Fix**:
- Remove `Array(10)` bug
- Uncomment and test scheduling functionality

---

## Testing Required After Fixes

After fixing each bug:
1. Manual testing of affected features
2. Cross-browser testing
3. Mobile testing
4. Edge case testing (out of stock, no variants, etc.)
5. Performance testing (re-render count)

---

## Priority Order for Fixes

1. **Product Detail Page** (Priority 1) - Blocks customer purchases
2. **Async Loop Bug** (Priority 2) - Data corruption
3. **useEffect Issues** (Priority 3) - UX problems
4. **Context Memoization** (Priority 6) - Performance
5. **Promotions** (Priority 4) - Feature incomplete
6. **Stock Integration** (Priority 5) - UX enhancement
7. **Realtime Handlers** (Priority 7) - Performance
8. **Other Issues** (8-11) - Polish

---

**Next Steps**: Start with Priority 1 (Product Detail Page) as it directly impacts customer experience and revenue.

