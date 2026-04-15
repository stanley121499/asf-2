# AI Agent Prompts for ASF-2 Project Fixes

**Last Updated**: January 6, 2026  
**Purpose**: Orchestrate AI agents to fix all critical issues and implement missing features

---

## Overview

This document contains **ready-to-use AI prompts** for agents to execute fixes and improvements. Each prompt is designed to fit within a reasonable context window while accomplishing a complete, testable task.

### Execution Strategy

- **Total Agents**: 16 prompts
- **Estimated Total Time**: 2-3 weeks (with parallel execution)
- **Sequential Phases**: 4 phases
- **Parallel Execution**: Up to 5-6 agents can run simultaneously in some phases

---

## Dependency Graph

```
PHASE 1 (Critical Fixes - Can run in parallel)
├── Agent 1: Fix ProductContext async bugs
├── Agent 2: Fix Product Details page
├── Agent 3: Fix useEffect in ProductFolderContext
├── Agent 4: Delete Category V2 & Fix/Delete Promotions
└── Agent 5: Fix Product Scheduling

PHASE 2 (Depends on Phase 1 - Can run in parallel)
├── Agent 6: Implement Soft Delete System (CRITICAL - data integrity)
├── Agent 7: Add memoization to Product contexts (depends on Agent 1)
├── Agent 8: Add memoization to other contexts (can run parallel to Agent 7)
├── Agent 9: Implement Cart page (depends on Agent 2)
└── Agent 10: Add Wishlist backend (can run parallel)

PHASE 3 (Depends on Phase 2 - Can run in parallel)
├── Agent 11: Fix Checkout page (depends on Agent 9)
├── Agent 12: Add Notifications backend (can run parallel)
└── Agent 13: Add Orders route for customers (can run parallel)

PHASE 4 (Performance & Architecture - Can run in parallel)
├── Agent 14: Implement lazy loading contexts
├── Agent 15: Add pagination to lists
└── Agent 16: Set up testing infrastructure
```

---

## PHASE 1: Critical Bug Fixes (Parallel Execution)

### 🔴 AGENT 1: Fix ProductContext Async Bugs

**Priority**: CRITICAL  
**Estimated Time**: 1-2 hours  
**Can Run in Parallel**: Yes (with Agents 2-5)  
**Dependencies**: None

**Files to Modify**:
- `src/context/product/ProductContext.tsx`

**AI AGENT PROMPT**:

```
You are fixing critical async/await bugs in the ProductContext file.

CONTEXT:
- File: src/context/product/ProductContext.tsx
- Problem: The createProduct and updateProduct functions use forEach(async) which doesn't wait for completion
- Impact: Product variants (colors, sizes, categories) are not being created/updated correctly

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Use template literals for concatenation
- Include JSDoc headers for all functions
- Include inline comments explaining each step

TASKS:
1. Read src/context/product/ProductContext.tsx
2. Locate the createProduct function
3. Replace ALL forEach(async) patterns with Promise.all(array.map(async))
4. Apply the same fix to updateProduct function
5. Ensure error handling wraps all Promise.all calls

EXAMPLE FIX:
// BEFORE (BUGGY):
selectedColors.forEach(async (color) => {
  await createProductColor({ product_id: newProduct.id, color });
});

// AFTER (CORRECT):
await Promise.all(
  selectedColors.map((color) =>
    createProductColor({ product_id: newProduct.id, color })
  )
);

VERIFICATION:
- No more forEach with async functions
- All async operations use Promise.all
- Error handling catches Promise.all failures
- Test by creating a product with multiple colors/sizes

REFERENCE DOCUMENTATION:
- See docs/CRITICAL_BUGS.md section "Priority 2: Async Operations in Loops"
- See docs/DEVELOPMENT_GUIDE.md section "Async Operations in Loops"
```

---

### 🔴 AGENT 2: Fix Product Details Page

**Priority**: CRITICAL  
**Estimated Time**: 3-4 hours  
**Can Run in Parallel**: Yes (with Agents 1, 3-5)  
**Dependencies**: None

**Files to Modify**:
- `src/pages/landing/ProductDetails.tsx`

**AI AGENT PROMPT**:

```
You are implementing the complete Product Details page for customers.

CONTEXT:
- File: src/pages/landing/ProductDetails.tsx
- Problem: Page is missing color/size selection, stock status, image gallery, and has hardcoded NULL bug
- Impact: Customers cannot select variants, cart items have no variant info, orders fail

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Use template literals for concatenation
- Add JSDoc headers and inline comments
- Implement error checking and validation

TASKS:
1. Read src/pages/landing/ProductDetails.tsx
2. Read src/components/product/product.tsx (this shows what customer page should look like)
3. Add useState for selectedColor and selectedSize
4. Display all product_colors as selectable buttons
5. Display all product_sizes as selectable buttons
6. Implement useMemo to find current stock based on selected color/size
7. Display stock status (In Stock / Out of Stock with quantity)
8. Implement image gallery with thumbnails (not just first image)
9. Display article_number, festival, season if they exist
10. Fix handleAddToCart to pass selectedColor.id and selectedSize.id (NOT NULL)
11. Add validation: cannot add to cart without selecting required variants
12. Add validation: cannot add out-of-stock items

CRITICAL BUG TO FIX:
// Line ~200-210, BEFORE (BUGGY):
await createAddToCart({
  product_id: product.id,
  user_id: user.id,
  amount: 1,
  color_id: null,      // ❌ HARDCODED NULL!
  size_id: null,       // ❌ HARDCODED NULL!
});

// AFTER (CORRECT):
await createAddToCart({
  product_id: product.id,
  user_id: user.id,
  amount: 1,
  color_id: selectedColor?.id || null,  // ✅ Correct!
  size_id: selectedSize?.id || null,     // ✅ Correct!
});

VERIFICATION:
- Colors display and can be selected
- Sizes display and can be selected
- Stock status shows for selected variant
- All images display in gallery
- Cannot add to cart without selecting variants (if product has variants)
- Cannot add out-of-stock items
- Cart items have correct color_id and size_id (verify in database)

REFERENCE DOCUMENTATION:
- See docs/CUSTOMER_FACING.md section "4. Product Detail Page"
- See docs/CRITICAL_BUGS.md section "Priority 1: Customer-Facing Product Detail Page"
- See docs/DATABASE.md section "product_colors", "product_sizes", "product_stock"
```

---

### 🔴 AGENT 3: Fix ProductFolderContext useEffect

**Priority**: HIGH  
**Estimated Time**: 1-2 hours  
**Can Run in Parallel**: Yes (with Agents 1-2, 4-5)  
**Dependencies**: None

**Files to Modify**:
- `src/context/product/ProductFolderContext.tsx`

**AI AGENT PROMPT**:

```
You are fixing useEffect dependency issues causing unnecessary re-renders and re-fetches.

CONTEXT:
- File: src/context/product/ProductFolderContext.tsx
- Problem: useEffect has productFolderMedias in dependencies, causing full re-fetch when media changes
- Impact: Performance issues, unnecessary database queries, UI lag

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Use useCallback for all functions
- Use useMemo for computed values
- Add JSDoc headers and inline comments

TASKS:
1. Read src/context/product/ProductFolderContext.tsx
2. Identify the useEffect that has [productFolderMedias, showAlert] in dependencies
3. Split into two separate concerns:
   a. useEffect for initial fetch (dependencies: [])
   b. useMemo to compute folders with medias (dependencies: [productFolders, productFolderMedias])
4. Memoize the fetchProductFolders function with useCallback
5. Remove showAlert from dependencies (it's not memoized in AlertContext)
6. Return computed foldersWithMedias in context value

EXAMPLE FIX:
// BEFORE (BUGGY):
useEffect(() => {
  const fetchProductFolders = async () => {
    // ... fetch folders
    for (const folder of data) {
      folder.medias = productFolderMedias.filter(...);
    }
    setProductFolders(data);
  };
  fetchProductFolders();
}, [productFolderMedias, showAlert]); // ❌ Re-fetches when media changes

// AFTER (CORRECT):
const fetchProductFolders = useCallback(async () => {
  // ... fetch folders only
  setProductFolders(data);
}, []);

useEffect(() => {
  fetchProductFolders();
}, []); // ✅ Fetch only once

const foldersWithMedias = useMemo(() => {
  return productFolders.map((folder) => ({
    ...folder,
    medias: productFolderMedias.filter((m) => m.product_folder_id === folder.id),
  }));
}, [productFolders, productFolderMedias]); // ✅ Compute when either changes

VERIFICATION:
- Folders fetch only once on mount (not on every media change)
- Folders update when productFolders or productFolderMedias changes
- No infinite loops
- Test by uploading folder media and verify folders don't re-fetch

REFERENCE DOCUMENTATION:
- See docs/PERFORMANCE_ISSUES.md section "Problem 3C: Circular Dependencies"
- See docs/DEVELOPMENT_GUIDE.md section "React Hooks Best Practices"
```

---

### 🟡 AGENT 4: Delete Category V2 & Fix/Delete Promotions

**Priority**: MEDIUM (Cleanup)  
**Estimated Time**: 1-2 hours  
**Can Run in Parallel**: Yes (with Agents 1-3, 5)  
**Dependencies**: None

**Files to Delete/Modify**:
- `src/pages/products/category-v2-page.tsx` (DELETE)
- `src/pages/promotions/list.tsx` (DELETE or rewrite)
- `src/pages/promotions/create-promotion-page.tsx` (DELETE or rewrite)
- `src/pages/promotions/promotion-editor.tsx` (DELETE or rewrite)
- `src/App.tsx` (remove routes)

**AI AGENT PROMPT**:

```
You are cleaning up broken/orphaned code that uses localStorage or is non-functional.

CONTEXT:
- Category V2 page uses localStorage instead of database (creates inconsistency)
- Promotions module is copy-paste of product pages, completely non-functional
- Impact: Confusing codebase, potential bugs from localStorage usage

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings

TASKS:
1. Read src/pages/products/category-v2-page.tsx
2. Confirm it uses localStorage (not database)
3. DELETE src/pages/products/category-v2-page.tsx
4. Read src/App.tsx and remove the route for category-v2
5. Read src/pages/promotions/list.tsx
6. Confirm it displays products (not promotions)
7. DELETE all files in src/pages/promotions/ directory:
   - list.tsx
   - create-promotion-page.tsx
   - promotion-editor.tsx
8. Remove promotions routes from src/App.tsx

DECISION POINT FOR PROMOTIONS:
If you find that a PromotionContext exists and promotions table exists in database:
  - Note in comments that promotions can be re-implemented later
  - Keep the context but delete the broken pages
Else:
  - Delete everything promotions-related

VERIFICATION:
- src/pages/products/category-v2-page.tsx deleted
- src/pages/promotions/ directory deleted (or pages deleted)
- No routes pointing to deleted pages
- App compiles without errors
- No references to deleted files remain (use grep to check)

REFERENCE DOCUMENTATION:
- See docs/UNUSED_CODE.md section "Orphaned Files" and "Broken/Non-Functional Modules"
- See docs/CRITICAL_BUGS.md section "Priority 4: Promotions Module"
```

---

### 🟡 AGENT 5: Fix Product Scheduling

**Priority**: MEDIUM  
**Estimated Time**: 1-2 hours  
**Can Run in Parallel**: Yes (with Agents 1-4)  
**Dependencies**: None

**Files to Modify**:
- `src/pages/products/schedule-product-page.tsx`

**AI AGENT PROMPT**:

```
You are fixing bugs in the product scheduling page.

CONTEXT:
- File: src/pages/products/schedule-product-page.tsx
- Problems: Array(10) rendering bug, updateProductTimePost commented out
- Impact: Incorrect rendering, scheduling might not work

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Add JSDoc headers and inline comments

TASKS:
1. Read src/pages/products/schedule-product-page.tsx
2. Find the Array(10) rendering pattern
3. Replace Array(10).fill(null).map() with direct .map() on the actual data array
4. Find commented-out updateProductTimePost call
5. Uncomment it and verify it has proper error handling
6. Add try-catch if missing
7. Test that scheduled posts are created correctly

EXAMPLE FIX:
// BEFORE (BUGGY):
{products.flatMap((product) =>
  Array(10).fill(null).map((_, index) => (
    <Card key={`${product.id}-${index}`}>
      {/* ... */}
    </Card>
  ))
)}

// AFTER (CORRECT):
{products.map((product) => (
  <Card key={product.id}>
    {/* ... */}
  </Card>
))}

VERIFICATION:
- No Array(10) or Array(1) patterns in rendering
- updateProductTimePost is uncommented and functional
- Scheduling creates product_events records in database
- No duplicate renders

REFERENCE DOCUMENTATION:
- See docs/CRITICAL_BUGS.md section "11. Product Scheduling - Incomplete/Buggy"
- See docs/PERFORMANCE_ISSUES.md section "Issue 5: Unnecessary Array Operations"
```

---

## PHASE 2: Soft Delete & Context Memoization (Mixed Execution)

### 🔴 AGENT 6: Implement Soft Delete System

**Priority**: CRITICAL (Data Integrity)  
**Estimated Time**: 3-4 hours  
**Can Run in Parallel**: Yes (with Agents 7-9)  
**Dependencies**: None (but recommended to complete early)

**Files to Create**:
- `src/utils/softDelete.ts`
- `src/pages/products/deleted-products.tsx`
- Database migration script

**Files to Modify**:
- All context files with delete functions
- `src/App.tsx` (add route for deleted items)

**AI AGENT PROMPT**:

```
You are implementing a soft delete system to prevent foreign key constraint errors and preserve data integrity.

CONTEXT:
- Problem: Deleting products causes foreign key constraint errors (referenced by orders, cart, stock, etc.)
- Impact: Cannot delete products, database errors, data loss risk
- Solution: Soft delete (mark as deleted without removing from database)

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Use template literals for concatenation
- Add JSDoc headers and inline comments
- Implement error checking and validation

BACKGROUND:
When trying to delete a product, you get errors like:
"ERROR: update or delete on table 'products' violates foreign key constraint"
This is because orders, cart items, and stock records reference the product.

Soft delete solves this by:
1. Adding deleted_at timestamp column (NULL = active, timestamp = deleted)
2. Filtering queries to exclude deleted_at IS NOT NULL
3. Preserving all historical data and relationships
4. Allowing "restore" functionality

TASKS:

STEP 1 - Database Migration:
Create SQL migration script to add deleted_at columns:

```sql
-- Add deleted_at to main tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE product_colors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE product_sizes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE brand ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE ranges ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE product_folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE post_folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at) WHERE deleted_at IS NULL;

-- Add comments
COMMENT ON COLUMN products.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
```

STEP 2 - Create Utility Functions:
Create src/utils/softDelete.ts:

```typescript
import { supabase } from "./supabaseClient";

/**
 * Adds soft delete filter to Supabase query
 * @param query - Supabase query builder
 * @param includeDeleted - Whether to include deleted records
 * @returns Modified query
 */
export function withSoftDelete<T>(query: any, includeDeleted: boolean = false): any {
  if (!includeDeleted) {
    return query.is("deleted_at", null);
  }
  return query;
}

/**
 * Soft deletes a record by setting deleted_at timestamp
 * @param table - Table name
 * @param id - Record ID
 */
export async function softDelete(table: string, id: string): Promise<void> {
  const { error } = await supabase
    .from(table)
    .update({ 
      deleted_at: new Date().toISOString(),
      active: false
    })
    .eq("id", id);
  
  if (error) throw error;
}

/**
 * Restores a soft-deleted record
 * @param table - Table name
 * @param id - Record ID
 */
export async function restoreRecord(table: string, id: string): Promise<void> {
  const { error } = await supabase
    .from(table)
    .update({ 
      deleted_at: null,
      active: true
    })
    .eq("id", id);
  
  if (error) throw error;
}
```

STEP 3 - Update ProductContext:
Modify src/context/product/ProductContext.tsx:

1. Import soft delete utilities
2. Update fetchProducts to filter deleted_at IS NULL:
   ```typescript
   const query = supabase.from("products").select("*");
   const { data, error } = await withSoftDelete(query);
   ```
3. Replace deleteProduct to use soft delete:
   ```typescript
   const deleteProduct = useCallback(async (id: string) => {
     try {
       await softDelete("products", id);
       showAlert("Product deleted successfully", "default");
     } catch (error) {
       console.error("Failed to delete product:", error);
       showAlert("Failed to delete product", "destructive");
       throw error;
     }
   }, [showAlert]);
   ```
4. Add restoreProduct function:
   ```typescript
   const restoreProduct = useCallback(async (id: string) => {
     try {
       await restoreRecord("products", id);
       showAlert("Product restored successfully", "default");
     } catch (error) {
       console.error("Failed to restore product:", error);
       throw error;
     }
   }, [showAlert]);
   ```
5. Add to context value

STEP 4 - Update Other Contexts:
Apply the same pattern to:
- src/context/product/ProductColorContext.tsx
- src/context/product/ProductSizeContext.tsx
- src/context/CategoryContext.tsx
- src/context/BrandContext.tsx
- src/context/DepartmentContext.tsx
- src/context/RangeContext.tsx
- src/context/post/PostContext.tsx

STEP 5 - Create Admin UI for Deleted Items:
Create src/pages/products/deleted-products.tsx:

```typescript
/**
 * Admin page to view and restore deleted products
 */
export function DeletedProducts() {
  const { restoreProduct } = useProduct();
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  
  // Fetch deleted products
  useEffect(() => {
    const fetchDeleted = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      
      setDeletedProducts(data || []);
    };
    fetchDeleted();
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Deleted Products</h1>
      {deletedProducts.map((product) => (
        <div key={product.id} className="border p-4 mb-2 flex justify-between">
          <div>
            <h3>{product.name}</h3>
            <p className="text-sm text-gray-600">
              Deleted: {new Date(product.deleted_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => restoreProduct(product.id)}
            className="btn btn-primary"
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
```

STEP 6 - Update Customer-Facing Pages:
In src/pages/landing/ProductDetails.tsx, handle deleted products:

```typescript
// Add check after loading product:
if (product.deleted_at) {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">Product Unavailable</h1>
      <p className="text-gray-600 mt-4">
        This product is no longer available for purchase.
      </p>
      <Link to="/" className="btn btn-primary mt-6">
        Continue Shopping
      </Link>
    </div>
  );
}
```

STEP 7 - Add Route:
In src/App.tsx, add route for deleted products page:
```typescript
<Route path="/products/deleted" element={<DeletedProducts />} />
```

VERIFICATION:
- [ ] Database migration runs successfully
- [ ] Can "delete" product (soft delete) without errors
- [ ] Deleted product not visible in customer views
- [ ] Deleted product not visible in admin list (by default)
- [ ] Can view deleted products in /products/deleted
- [ ] Can restore deleted product
- [ ] Restored product visible again in all views
- [ ] Orders with deleted products still work
- [ ] Cart with deleted products shows warning
- [ ] Test with product that has: orders, cart items, stock records

IMPORTANT NOTES:
- Do NOT soft delete: orders, order_items, payments, *_logs tables (these are transactional/audit data)
- Cart items (add_to_carts) can be hard deleted (they're temporary)
- Product stock can be hard deleted (use stock_logs for history)

REFERENCE DOCUMENTATION:
- See docs/SOFT_DELETE_STRATEGY.md for complete implementation guide
- See docs/DATABASE.md for table relationships
- See docs/CONTEXTS.md for context patterns


---

### 🟡 AGENT 7: Add Memoization to Product Contexts

**Priority**: HIGH (Performance)  
**Estimated Time**: 2-3 hours  
**Can Run in Parallel**: Yes (with Agents 6, 8-10)  
**Dependencies**: Agent 1 (must complete first)

**Files to Modify**:
- `src/context/product/ProductContext.tsx`
- `src/context/product/ProductColorContext.tsx`
- `src/context/product/ProductSizeContext.tsx`
- `src/context/product/ProductCategoryContext.tsx`
- `src/context/product/ProductMediaContext.tsx`
- `src/context/product/ProductStockContext.tsx`
- `src/context/product/ProductStockLogContext.tsx`

**AI AGENT PROMPT**:

```
You are adding memoization to all product-related contexts to fix performance issues.

CONTEXT:
- Multiple product contexts lack useCallback and useMemo
- Impact: Massive re-renders, poor performance, laggy UI

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Use useCallback for ALL functions
- Use useMemo for context value
- Add JSDoc headers and inline comments

TASKS (for EACH context file listed above):
1. Read the context file
2. Wrap ALL functions with useCallback (fetchX, createX, updateX, deleteX, etc.)
3. Add proper dependencies to each useCallback
4. Ensure the context value is wrapped in useMemo
5. Include all functions in the useMemo dependencies
6. Fix any useEffect that has missing dependencies (but avoid infinite loops)

PATTERN TO FOLLOW:
const fetchProducts = useCallback(async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.from("products").select("*");
    if (error) throw error;
    setProducts(data || []);
  } catch (error) {
    console.error("Failed to fetch products:", error);
  } finally {
    setLoading(false);
  }
}, []); // Add dependencies if needed

const createProduct = useCallback(async (data: ProductData) => {
  try {
    const { error } = await supabase.from("products").insert(data);
    if (error) throw error;
  } catch (error) {
    console.error("Failed to create product:", error);
    throw error;
  }
}, []); // Add dependencies if needed

const value = useMemo<ProductContextProps>(
  () => ({
    products,
    loading,
    fetchProducts,
    createProduct,
    // ... all other functions
  }),
  [products, loading, fetchProducts, createProduct] // Include ALL values/functions
);

VERIFICATION (for each context):
- All functions wrapped in useCallback
- Context value wrapped in useMemo
- All dependencies included
- No re-renders when context value hasn't actually changed
- Test by monitoring re-render count in React DevTools

REFERENCE DOCUMENTATION:
- See docs/PERFORMANCE_ISSUES.md section "Issue 2: No Memoization of Context Values"
- See docs/DEVELOPMENT_GUIDE.md section "React Hooks Best Practices"
- See docs/CONTEXTS.md for pattern example
```

---

### 🟡 AGENT 8: Add Memoization to Non-Product Contexts

**Priority**: HIGH (Performance)  
**Estimated Time**: 3-4 hours  
**Can Run in Parallel**: Yes (with Agents 6-7, 9-10)  
**Dependencies**: None

**Files to Modify**:
- `src/context/PaymentContext.tsx`
- `src/context/OrderContext.tsx`
- `src/context/AddToCartContext.tsx`
- `src/context/BrandContext.tsx`
- `src/context/DepartmentContext.tsx`
- `src/context/RangeContext.tsx`
- `src/context/CategoryContext.tsx`
- `src/context/UserContext.tsx`
- All post contexts in `src/context/post/`
- All community contexts in `src/context/community/`
- Any other remaining contexts

**AI AGENT PROMPT**:

```
You are adding memoization to all non-product contexts to fix performance issues.

CONTEXT:
- All contexts lack proper useCallback and useMemo
- Impact: Massive re-renders, poor performance, laggy UI
- This is the same task as Agent 6 but for different contexts

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Use useCallback for ALL functions
- Use useMemo for context value
- Add JSDoc headers and inline comments

TASKS (for EACH context file):
1. List all context files in src/context/ (excluding those in Agent 6)
2. For each context file:
   a. Read the context file
   b. Wrap ALL functions with useCallback
   c. Add proper dependencies to each useCallback
   d. Ensure context value is wrapped in useMemo
   e. Include all functions in useMemo dependencies

PATTERN TO FOLLOW (same as Agent 6):
const fetchX = useCallback(async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.from("table").select("*");
    if (error) throw error;
    setData(data || []);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}, []);

const value = useMemo<ContextProps>(
  () => ({
    data,
    loading,
    fetchX,
    // ... all functions
  }),
  [data, loading, fetchX] // All dependencies
);

VERIFICATION:
- All functions in all contexts wrapped in useCallback
- All context values wrapped in useMemo
- No unnecessary re-renders
- Test with React DevTools Profiler

REFERENCE DOCUMENTATION:
- See docs/PERFORMANCE_ISSUES.md section "Issue 2: No Memoization of Context Values"
- See docs/CONTEXTS.md for full context list
```

---

### 🔴 AGENT 9: Implement Cart Page

**Priority**: CRITICAL  
**Estimated Time**: 3-4 hours  
**Can Run in Parallel**: Yes (with Agents 6-8, 10)  
**Dependencies**: Agent 2 (Product Details must be fixed first)

**Files to Create**:
- `src/pages/landing/Cart.tsx`

**Files to Modify**:
- `src/App.tsx` (add route)
- `src/components/navbar-home.tsx` (add cart link/icon)

**AI AGENT PROMPT**:

```
You are implementing a complete shopping cart page for customers.

CONTEXT:
- Cart page doesn't exist
- AddToCartContext already exists and works
- Impact: Customers cannot view/manage cart before checkout

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Use template literals for concatenation
- Add JSDoc headers and inline comments
- Implement error checking and validation

TASKS:
1. Create src/pages/landing/Cart.tsx
2. Use AddToCartContext to fetch cart items
3. Use ProductContext to get product details
4. Display cart items with:
   - Product image (first image)
   - Product name
   - Selected color and size
   - Quantity (with increment/decrement buttons)
   - Price (per item and total)
   - Remove button
5. Calculate and display subtotal, tax (if applicable), total
6. Add "Proceed to Checkout" button (navigates to /checkout)
7. Show empty cart state if no items
8. Handle quantity updates (call updateAddToCart from context)
9. Handle item removal (call deleteAddToCart from context)
10. Add route in App.tsx: <Route path="/cart" element={<Cart />} />
11. Add cart icon with badge (item count) to navbar-home.tsx

CART ITEM DISPLAY:
For each cart item:
- Show product.name, color.color, size.size
- Show quantity with +/- buttons
- Show price * quantity
- Show remove button
- Check stock availability and show warning if insufficient stock

MOBILE RESPONSIVENESS:
- Use responsive grid/flex layout
- Stack items vertically on mobile
- Ensure buttons are touch-friendly

VERIFICATION:
- Cart displays all items from AddToCartContext
- Quantity can be updated (updates database)
- Items can be removed (deletes from database)
- Total calculates correctly
- Empty cart shows appropriate message
- Checkout button navigates to /checkout
- Cart icon in navbar shows correct item count
- Mobile responsive

REFERENCE DOCUMENTATION:
- See docs/CUSTOMER_FACING.md section "Cart Page"
- See docs/CONTEXTS.md section "22. AddToCartContext"
```

---

### 🟡 AGENT 10: Add Wishlist Backend

**Priority**: MEDIUM  
**Estimated Time**: 3-4 hours  
**Can Run in Parallel**: Yes (with Agents 6-9)  
**Dependencies**: None

**Files to Create**:
- `src/context/WishlistContext.tsx`
- Database migration for wishlist table (SQL script or Supabase dashboard)

**Files to Modify**:
- `src/App.tsx` (add WishlistProvider, add route)
- `src/pages/landing/Wishlist.tsx` (replace mock data)
- `src/pages/landing/ProductDetails.tsx` (add wishlist button)

**AI AGENT PROMPT**:

```
You are implementing a complete wishlist feature with database backend.

CONTEXT:
- Wishlist page exists but uses mock data
- No WishlistContext or database table exists
- Impact: Wishlist feature is non-functional

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Use useCallback and useMemo
- Add JSDoc headers and inline comments

TASKS:
1. Create database table (provide SQL):
   ```sql
   CREATE TABLE wishlist (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES user_details(id) ON DELETE CASCADE,
     product_id UUID REFERENCES products(id) ON DELETE CASCADE,
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, product_id)
   );
   ```
2. Create src/context/WishlistContext.tsx following the pattern in docs/CONTEXTS.md
3. Implement:
   - fetchWishlist() - get user's wishlist items
   - addToWishlist(product_id) - add product
   - removeFromWishlist(product_id) - remove product
   - isInWishlist(product_id) - check if product is wishlisted
4. Set up realtime subscriptions for wishlist changes
5. Update src/pages/landing/Wishlist.tsx to use WishlistContext (remove mock data)
6. Add WishlistProvider to App.tsx
7. Add route in App.tsx: <Route path="/wishlist" element={<Wishlist />} />
8. Add wishlist button (heart icon) to ProductDetails.tsx:
   - Show filled heart if in wishlist
   - Show empty heart if not in wishlist
   - Toggle on click

WISHLIST CONTEXT PATTERN:
interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product; // Joined data
}

interface WishlistContextProps {
  wishlistItems: WishlistItem[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

VERIFICATION:
- Database table created
- WishlistContext works (CRUD operations)
- Wishlist page displays real data
- Can add/remove items from wishlist
- Heart icon on product details works
- Realtime updates work
- Only shows current user's wishlist items

REFERENCE DOCUMENTATION:
- See docs/CUSTOMER_FACING.md section "10. Wishlist Page"
- See docs/CONTEXTS.md for context pattern
- See docs/UNUSED_CODE.md section "3. Wishlist Page"
```

---

## PHASE 3: Checkout & Additional Features (Parallel Execution)

### 🔴 AGENT 11: Fix Checkout Page

**Priority**: CRITICAL  
**Estimated Time**: 3-4 hours  
**Can Run in Parallel**: Yes (with Agents 12-13)  
**Dependencies**: Agent 9 (Cart page must exist first)

**Files to Modify**:
- `src/pages/landing/Checkout.tsx`

**AI AGENT PROMPT**:

```
You are fixing the checkout page by removing mock data and implementing real order creation.

CONTEXT:
- File: src/pages/landing/Checkout.tsx
- Problem: Uses mock data, no real cart integration, payment commented out
- Impact: Cannot complete purchases

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Add JSDoc headers and inline comments
- Implement error checking and validation

TASKS:
1. Read src/pages/landing/Checkout.tsx
2. Remove all mock data (mock cartItems, mock shippingAddress)
3. Integrate with AddToCartContext to get real cart items
4. Integrate with UserContext to pre-fill shipping address
5. Integrate with OrderContext to create order
6. Display cart items with variant info (color, size)
7. Allow editing shipping address
8. Implement order creation on "Place Order":
   a. Validate all fields
   b. Call createOrderWithItemsAndStock from OrderContext
   c. Pass correct order data and items with color_id/size_id
   d. Clear cart after successful order
   e. Navigate to order confirmation page
9. Add loading state during order creation
10. Handle errors gracefully

CHECKOUT FLOW:
1. Load cart items from AddToCartContext
2. Pre-fill shipping address from currentUser
3. Display order summary (items, quantities, prices, total)
4. User confirms/edits shipping address
5. User clicks "Place Order"
6. Validate stock availability for all items
7. Create order with createOrderWithItemsAndStock
8. Clear cart
9. Redirect to /order-confirmation/:orderId

PAYMENT SECTION:
- If payment gateway integration is required, add a note for future implementation
- For now, create orders with status "pending" and payment status "pending"
- Uncomment payment section only if payment gateway credentials are available

VERIFICATION:
- Mock data removed
- Cart items load from AddToCartContext
- Shipping address pre-fills from user profile
- Order creates successfully in database
- Order items include correct color_id and size_id
- Stock decrements correctly (verify in database)
- Cart clears after order
- Redirects to order confirmation
- Handles errors (insufficient stock, etc.)

REFERENCE DOCUMENTATION:
- See docs/CUSTOMER_FACING.md section "6. Checkout Page"
- See docs/CONTEXTS.md sections "22. AddToCartContext", "23. OrderContext"
```

---

### 🟡 AGENT 12: Add Notifications Backend

**Priority**: MEDIUM  
**Estimated Time**: 3-4 hours  
**Can Run in Parallel**: Yes (with Agents 11, 13)  
**Dependencies**: None

**Files to Create**:
- `src/context/NotificationContext.tsx`
- Database migration for notifications table

**Files to Modify**:
- `src/App.tsx` (add NotificationProvider)
- `src/pages/landing/notifications.tsx` (replace mock data)

**AI AGENT PROMPT**:

```
You are implementing a complete notifications system with database backend.

CONTEXT:
- Notifications page exists but uses mock data
- No NotificationContext or database table exists
- Impact: Users cannot receive real notifications

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Use useCallback and useMemo
- Add JSDoc headers and inline comments

TASKS:
1. Create database table (provide SQL):
   ```sql
   CREATE TABLE notifications (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES user_details(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     message TEXT NOT NULL,
     type TEXT NOT NULL, -- 'order', 'promotion', 'account'
     read BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   CREATE INDEX idx_notifications_user_id ON notifications(user_id);
   CREATE INDEX idx_notifications_read ON notifications(user_id, read);
   ```
2. Create src/context/NotificationContext.tsx
3. Implement:
   - fetchNotifications() - get user's notifications
   - createNotification(data) - create notification
   - markAsRead(notificationId) - mark single notification as read
   - markAllAsRead() - mark all as read
   - deleteNotification(notificationId) - delete notification
4. Set up realtime subscriptions for new notifications
5. Update src/pages/landing/notifications.tsx to use NotificationContext
6. Add NotificationProvider to App.tsx
7. Add notification badge to navbar (unread count)

NOTIFICATION TYPES:
- 'order': Order status updates (placed, shipped, delivered)
- 'promotion': Promotional notifications
- 'account': Account-related notifications (password changed, etc.)

VERIFICATION:
- Database table created
- NotificationContext works
- Notifications page displays real data
- Can mark as read
- Realtime updates work (new notifications appear)
- Unread count shows in navbar
- Only shows current user's notifications

REFERENCE DOCUMENTATION:
- See docs/CUSTOMER_FACING.md section "9. Notifications Page"
- See docs/CONTEXTS.md for context pattern
```

---

### 🟡 AGENT 13: Add Customer Orders Route

**Priority**: MEDIUM  
**Estimated Time**: 1-2 hours  
**Can Run in Parallel**: Yes (with Agents 11-12)  
**Dependencies**: None

**Files to Modify**:
- `src/App.tsx` (add route)
- `src/pages/landing/Orders.tsx` (ensure it fetches only user's orders)

**AI AGENT PROMPT**:

```
You are adding a route for customers to view their order history.

CONTEXT:
- File: src/pages/landing/Orders.tsx exists but has no route
- Should display only current user's orders (not all orders like admin)
- Impact: Customers cannot view their order history

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Add JSDoc headers and inline comments

TASKS:
1. Read src/pages/landing/Orders.tsx
2. Ensure it uses OrderContext and filters by current user ID
3. Modify query to fetch only current user's orders:
   ```typescript
   const { orders } = useOrder();
   const { user } = useAuth();
   
   const userOrders = useMemo(() => {
     return orders.filter((order) => order.user_id === user?.id);
   }, [orders, user]);
   ```
4. Display orders in reverse chronological order (newest first)
5. Show order status, date, total, items count
6. Add click to view order details (navigate to /order-detail/:orderId)
7. Add route in App.tsx: <Route path="/my-orders" element={<Orders />} />
8. Add "My Orders" link to navbar or user menu

VERIFICATION:
- Route /my-orders works
- Only current user's orders are displayed
- Orders sorted by date (newest first)
- Clicking order navigates to order detail page
- Link accessible from navbar

REFERENCE DOCUMENTATION:
- See docs/CUSTOMER_FACING.md section "8. Orders Page (Customer)"
```

---

## PHASE 4: Performance & Testing (Parallel Execution)

### 🟡 AGENT 14: Implement Lazy Loading for Contexts

**Priority**: MEDIUM (Performance)  
**Estimated Time**: 3-4 hours  
**Can Run in Parallel**: Yes (with Agents 15-16)  
**Dependencies**: All Phase 2 agents (contexts must be memoized first)

**Files to Modify**:
- `src/App.tsx`
- Create route-specific context bundles

**AI AGENT PROMPT**:

```
You are implementing lazy loading for contexts to improve initial load performance.

CONTEXT:
- Currently all 35+ contexts load on app startup
- Impact: Slow initial load, high memory usage, unnecessary data fetching
- Goal: Load contexts only when their routes are visited

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Add JSDoc headers and inline comments

STRATEGY:
Separate contexts into:
1. Global contexts (always loaded): AuthContext, UserContext, AlertContext
2. Product contexts (load on /products routes)
3. Post contexts (load on /posts routes)
4. Community contexts (load on /community routes)
5. Other contexts (load as needed)

TASKS:
1. Read src/App.tsx
2. Identify the ProviderComposer with 35+ providers
3. Keep only global contexts in root App:
   - AuthProvider
   - UserProvider
   - (AlertProvider if it exists)
4. Create context bundles for each feature:
   a. Create src/context/bundles/ProductContextBundle.tsx
   b. Create src/context/bundles/PostContextBundle.tsx
   c. Create src/context/bundles/OrderContextBundle.tsx
5. Wrap routes with appropriate context bundles:
   ```typescript
   <Route path="/products/*" element={
     <ProductContextBundle>
       <ProductRoutes />
     </ProductContextBundle>
   } />
   ```
6. Use React.lazy for route components

EXAMPLE BUNDLE:
```typescript
// src/context/bundles/ProductContextBundle.tsx
export const ProductContextBundle: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProductProvider>
    <ProductColorProvider>
      <ProductSizeProvider>
        <ProductCategoryProvider>
          <ProductMediaProvider>
            <ProductFolderProvider>
              <ProductStockProvider>
                {children}
              </ProductStockProvider>
            </ProductFolderProvider>
          </ProductMediaProvider>
        </ProductCategoryProvider>
      </ProductSizeProvider>
    </ProductColorProvider>
  </ProductProvider>
);
```

VERIFICATION:
- Initial load only loads global contexts
- Product contexts load when visiting /products
- Post contexts load when visiting /posts
- Performance improvement measurable (check bundle size, load time)
- All features still work correctly

REFERENCE DOCUMENTATION:
- See docs/PERFORMANCE_ISSUES.md section "Issue 1: 35+ Context Providers"
- See docs/ARCHITECTURE.md section "Performance Considerations"
```

---

### 🟡 AGENT 15: Add Pagination to Lists

**Priority**: MEDIUM (Performance)  
**Estimated Time**: 3-4 hours  
**Can Run in Parallel**: Yes (with Agents 14, 16)  
**Dependencies**: None

**Files to Modify**:
- `src/pages/products/list.tsx`
- `src/pages/posts/create-post-page.tsx`
- `src/context/product/ProductContext.tsx` (add pagination to fetch)
- `src/context/post/PostContext.tsx` (add pagination to fetch)

**AI AGENT PROMPT**:

```
You are implementing pagination for product and post lists to improve performance.

CONTEXT:
- Currently all products/posts load at once (1000+ items)
- Impact: Slow load, high memory usage, laggy UI
- Goal: Load 50-100 items per page

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Add JSDoc headers and inline comments

TASKS:
1. Modify ProductContext.tsx:
   a. Add page and pageSize state
   b. Modify fetchProducts to use .range() for pagination
   c. Add fetchProductsPage(page) function
   d. Add totalCount state
2. Modify PostContext.tsx similarly
3. Update src/pages/products/list.tsx:
   a. Add pagination controls (Previous, Page X of Y, Next)
   b. Call fetchProductsPage when page changes
   c. Show loading state during page change
4. Update src/pages/posts/create-post-page.tsx similarly

PAGINATION IMPLEMENTATION:
```typescript
const PAGE_SIZE = 50;
const [page, setPage] = useState(0);
const [totalCount, setTotalCount] = useState(0);

const fetchProductsPage = useCallback(async (pageNum: number) => {
  setLoading(true);
  try {
    const { data, error, count } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    setProducts(data || []);
    setTotalCount(count || 0);
    setPage(pageNum);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}, []);
```

PAGINATION UI:
- Show "Showing X-Y of Z items"
- Previous button (disabled on first page)
- Page number
- Next button (disabled on last page)
- Optional: Page size selector (25, 50, 100)

VERIFICATION:
- Only 50 items load at a time
- Pagination controls work
- Can navigate between pages
- Total count displays correctly
- Loading state shows during page change
- Performance improved (measure load time)

REFERENCE DOCUMENTATION:
- See docs/PERFORMANCE_ISSUES.md section "Issue 7: No Pagination"
```

---

### 🟢 AGENT 16: Set Up Testing Infrastructure

**Priority**: LOW (but important for long-term)  
**Estimated Time**: 4-6 hours  
**Can Run in Parallel**: Yes (with Agents 14-15)  
**Dependencies**: None (can start anytime)

**Files to Create**:
- `vitest.config.ts`
- `src/test/setup.ts`
- `src/utils/formatPrice.test.ts` (example test)
- `src/context/product/ProductContext.test.tsx` (example test)
- `.github/workflows/test.yml` (CI/CD)

**Files to Modify**:
- `package.json` (add test scripts)

**AI AGENT PROMPT**:

```
You are setting up the testing infrastructure for the project.

CONTEXT:
- Currently no tests exist
- Goal: Set up Vitest, React Testing Library, and example tests
- Impact: Enable test-driven development and prevent regressions

CODING STANDARDS (CRITICAL):
- Use strict TypeScript (no 'any', no '!', no 'as unknown')
- Use double quotes for strings
- Add clear test descriptions

TASKS:
1. Install dependencies:
   ```bash
   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui jsdom
   ```
2. Create vitest.config.ts (see docs/TESTING_GUIDE.md)
3. Create src/test/setup.ts (see docs/TESTING_GUIDE.md)
4. Add test scripts to package.json:
   ```json
   "scripts": {
     "test": "vitest",
     "test:ui": "vitest --ui",
     "test:coverage": "vitest --coverage"
   }
   ```
5. Create example utility test (src/utils/formatPrice.test.ts)
6. Create example context test (src/context/product/ProductContext.test.tsx)
7. Create GitHub Actions workflow (.github/workflows/test.yml)
8. Document how to run tests in README or docs

EXAMPLE TEST (src/utils/formatPrice.test.ts):
```typescript
import { describe, it, expect } from "vitest";

/**
 * Formats a number as a price string
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

describe("formatPrice", () => {
  it("formats whole numbers with two decimal places", () => {
    expect(formatPrice(100)).toBe("$100.00");
  });

  it("formats decimal numbers correctly", () => {
    expect(formatPrice(99.99)).toBe("$99.99");
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });
});
```

VERIFICATION:
- npm test runs successfully
- Example tests pass
- Test coverage report generates
- CI/CD workflow runs tests on PR
- Documentation updated with testing instructions

REFERENCE DOCUMENTATION:
- See docs/TESTING_GUIDE.md for complete examples and patterns
```

---

## Execution Instructions

### How to Use These Prompts

1. **Copy the entire prompt** (including CONTEXT, CODING STANDARDS, TASKS, VERIFICATION, REFERENCE DOCUMENTATION)
2. **Paste into AI agent** (Claude, GPT-4, etc.)
3. **Provide necessary file context** by either:
   - Using file read tools
   - Pasting relevant file contents
4. **Review agent output** before applying changes
5. **Test the changes** according to VERIFICATION section
6. **Move to next agent** when complete

### Parallel Execution Strategy

**Phase 1** (Start immediately):
- Launch Agents 1, 2, 3, 4, 5 simultaneously (5 agents)
- Wait for all to complete

**Phase 2** (After Phase 1):
- Launch Agents 6, 7, 8, 9, 10 simultaneously (5 agents)
- Agent 6 can start immediately (Soft Delete - CRITICAL)
- Agent 7 starts after Agent 1 completes
- Agent 9 starts after Agent 2 completes
- Agents 8 and 10 can start immediately

**Phase 3** (After Phase 2):
- Launch Agents 11, 12, 13 simultaneously (3 agents)
- Agent 11 starts after Agent 9 completes
- Agents 12 and 13 can start immediately

**Phase 4** (After all contexts memoized):
- Launch Agents 14, 15, 16 simultaneously (3 agents)
- Agent 14 starts after all Phase 2 agents complete
- Agents 15 and 16 can start anytime

### Estimated Timeline

**With 5 parallel agents running**:
- Phase 1: 3-4 hours
- Phase 2: 3-4 hours
- Phase 3: 3-4 hours
- Phase 4: 4-6 hours
- **Total: 13-18 hours of wall-clock time** (vs 50+ hours sequential)

**With sequential execution**:
- Total: 50-60 hours

---

## Success Criteria

After all agents complete:

### Critical Bugs Fixed
- [ ] Product Details page displays variants, stock, images
- [ ] Cart items have correct color_id and size_id
- [ ] No forEach(async) bugs remain
- [ ] No useEffect infinite loops

### Features Implemented
- [ ] Cart page functional
- [ ] Checkout creates real orders
- [ ] Wishlist with database backend
- [ ] Notifications with database backend
- [ ] Customer orders route

### Performance Improved
- [ ] All contexts memoized
- [ ] Lazy loading implemented
- [ ] Pagination implemented
- [ ] Re-render count reduced by >80%

### Code Quality
- [ ] Broken modules deleted (Category V2, Promotions)
- [ ] Product Scheduling fixed
- [ ] Testing infrastructure set up
- [ ] All code follows TypeScript standards

---

## Monitoring & Validation

### After Each Phase

Run the following checks:

1. **Code compiles**: `npm run build`
2. **No linter errors**: `npm run lint`
3. **App runs**: `npm run dev`
4. **Manual testing**: Test affected features
5. **Check bundle size**: Should decrease with optimizations

### Performance Metrics to Track

**Before fixes**:
- Initial load time: ~8-12 seconds
- Re-renders per action: 100+
- Bundle size: 2-3 MB
- Memory usage: ~200 MB

**After fixes** (target):
- Initial load time: <3 seconds (60-70% improvement)
- Re-renders per action: <10 (95% reduction)
- Bundle size: <500 KB (75% reduction)
- Memory usage: <50 MB (75% reduction)

---

## Troubleshooting

### If an Agent Fails

1. **Review error messages** carefully
2. **Check file paths** are correct
3. **Verify dependencies** completed first
4. **Provide more context** to agent (additional files)
5. **Break down task** into smaller subtasks if too complex
6. **Ask agent to explain** its approach before implementing

### If Tests Fail After Changes

1. **Identify what broke** (specific feature/page)
2. **Review agent's changes** for that feature
3. **Check for typos** or missing imports
4. **Verify context dependencies** are correct
5. **Rollback if necessary** and retry agent with more guidance

---

## Next Steps After All Agents Complete

1. **Comprehensive Testing** - Test all features end-to-end
2. **Performance Testing** - Verify metrics improved
3. **Security Audit** - Review authentication, authorization
4. **Mobile Testing** - Test on real devices
5. **Deploy to Staging** - Test in production-like environment
6. **User Acceptance Testing** - Get feedback from stakeholders
7. **Deploy to Production** - 🚀

---

**Ready to start?** Begin with Phase 1, launching all 5 agents in parallel!

