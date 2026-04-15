# Soft Delete Implementation Strategy

**Last Updated**: January 6, 2026  
**Priority**: 🔴 **CRITICAL** - Must implement before production

---

## Problem Statement

### Current Issues

**Foreign Key Dependency Hell**:
- Deleting products fails due to foreign key constraints
- Multiple tables reference products (orders, cart, stock, media, etc.)
- No CASCADE DELETE configured properly
- Data integrity errors when attempting deletion
- Cannot delete products that have ever been ordered

**Example Error**:
```
ERROR: update or delete on table "products" violates foreign key constraint
DETAIL: Key (id)=(xxx) is still referenced from table "order_items"
```

### Why Hard Delete is Problematic

1. **Order History**: Cannot delete products that exist in historical orders
2. **Analytics**: Lose sales data and reporting history
3. **Audit Trail**: Cannot track what was sold or when
4. **Cart Issues**: Users with product in cart see errors if product deleted
5. **Foreign Keys**: Cascading deletes could accidentally remove order history

---

## Soft Delete Solution

### Concept

**Soft Delete** = Mark as deleted without actually removing from database

- Add `deleted_at` timestamp column (NULL = active, timestamp = deleted)
- Add `active` boolean flag where not already present
- Modify queries to filter out deleted records
- Preserve all historical data
- Enable "undo" functionality

---

## Implementation Plan

### Phase 1: Database Schema Changes

#### Tables Requiring Soft Delete

**High Priority** (user-facing data):
1. ✅ `products` - Already has `active` boolean, add `deleted_at`
2. ✅ `product_colors` - Already has `active` boolean, add `deleted_at`
3. ✅ `product_sizes` - Already has `active` boolean, add `deleted_at`
4. ✅ `categories` - Already has `active` boolean, add `deleted_at`
5. ✅ `brand` - Already has `active` boolean, add `deleted_at`
6. ✅ `departments` - Already has `active` boolean, add `deleted_at`
7. ✅ `ranges` - Already has `active` boolean, add `deleted_at`
8. ✅ `posts` - Add `active` and `deleted_at`
9. ✅ `product_folders` - Add `active` and `deleted_at`
10. ✅ `post_folders` - Add `active` and `deleted_at`

**Medium Priority** (admin data):
11. `promotions` - Add `active` and `deleted_at`
12. `communities` - Add `deleted_at`
13. `groups` - Add `deleted_at`

**Do NOT Soft Delete** (transactional data):
- ❌ `orders` - Use status field instead
- ❌ `order_items` - Part of immutable order history
- ❌ `payments` - Financial records must be permanent
- ❌ `add_to_carts` - Can be hard deleted (temporary data)
- ❌ `product_stock` - Inventory records, use logs for history
- ❌ All `*_logs` tables - Audit trails, never delete

### SQL Migration Script

```sql
-- ============================================
-- SOFT DELETE MIGRATION
-- ============================================

-- Add deleted_at columns to tables
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

ALTER TABLE promotions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add active columns where missing
ALTER TABLE posts ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE product_folders ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE post_folders ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_colors_deleted_at ON product_colors(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_sizes_deleted_at ON product_sizes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at) WHERE deleted_at IS NULL;

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_active_deleted ON products(active, deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_active_deleted ON categories(active, deleted_at);

COMMENT ON COLUMN products.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN product_colors.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
```

---

## Code Implementation

### 1. Update Context Queries

**Pattern for Fetching Data**:

```typescript
// BEFORE (shows all including deleted):
const { data, error } = await supabase
  .from("products")
  .select("*");

// AFTER (filters out deleted):
const { data, error } = await supabase
  .from("products")
  .select("*")
  .is("deleted_at", null);

// For admin views that need to show deleted items:
const { data, error } = await supabase
  .from("products")
  .select("*")
  .order("deleted_at", { ascending: false, nullsFirst: true });
```

### 2. Update Delete Functions

**Replace Hard Delete with Soft Delete**:

```typescript
// BEFORE (hard delete):
const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
};

// AFTER (soft delete):
const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("products")
    .update({ 
      deleted_at: new Date().toISOString(),
      active: false // Also mark as inactive
    })
    .eq("id", id);
  
  if (error) throw error;
};

// Add restore function:
const restoreProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("products")
    .update({ 
      deleted_at: null,
      active: true
    })
    .eq("id", id);
  
  if (error) throw error;
};
```

### 3. Create Utility Functions

**File**: `src/utils/softDelete.ts`

```typescript
/**
 * Soft delete utility functions
 */

/**
 * Adds soft delete filter to Supabase query
 * @param query - Supabase query builder
 * @param includeDeleted - Whether to include deleted records
 * @returns Modified query
 */
export function withSoftDelete<T>(
  query: any,
  includeDeleted: boolean = false
): any {
  if (!includeDeleted) {
    return query.is("deleted_at", null);
  }
  return query;
}

/**
 * Soft deletes a record
 * @param table - Table name
 * @param id - Record ID
 */
export async function softDelete(
  table: string,
  id: string
): Promise<void> {
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
export async function restoreRecord(
  table: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .update({ 
      deleted_at: null,
      active: true
    })
    .eq("id", id);
  
  if (error) throw error;
}

/**
 * Permanently deletes a soft-deleted record
 * @param table - Table name
 * @param id - Record ID
 * @warning This is irreversible!
 */
export async function hardDelete(
  table: string,
  id: string
): Promise<void> {
  // Only allow hard delete if already soft deleted
  const { data } = await supabase
    .from(table)
    .select("deleted_at")
    .eq("id", id)
    .single();
  
  if (!data?.deleted_at) {
    throw new Error("Record must be soft deleted before hard delete");
  }
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}
```

### 4. Update All Contexts

**Files to Update**:
- `src/context/product/ProductContext.tsx`
- `src/context/product/ProductColorContext.tsx`
- `src/context/product/ProductSizeContext.tsx`
- `src/context/CategoryContext.tsx`
- `src/context/BrandContext.tsx`
- `src/context/DepartmentContext.tsx`
- `src/context/RangeContext.tsx`
- `src/context/post/PostContext.tsx`
- `src/context/product/ProductFolderContext.tsx`
- `src/context/post/PostFolderContext.tsx`

**Pattern for Each Context**:

```typescript
import { softDelete, restoreRecord, withSoftDelete } from "../utils/softDelete";

// In fetch function:
const fetchProducts = useCallback(async () => {
  setLoading(true);
  try {
    const query = supabase.from("products").select("*");
    const { data, error } = await withSoftDelete(query, false);
    
    if (error) throw error;
    setProducts(data || []);
  } catch (error) {
    console.error("Failed to fetch products:", error);
  } finally {
    setLoading(false);
  }
}, []);

// Update delete function:
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

// Add restore function:
const restoreProduct = useCallback(async (id: string) => {
  try {
    await restoreRecord("products", id);
    showAlert("Product restored successfully", "default");
  } catch (error) {
    console.error("Failed to restore product:", error);
    showAlert("Failed to restore product", "destructive");
    throw error;
  }
}, [showAlert]);

// Add to context value:
const value = useMemo<ProductContextProps>(
  () => ({
    products,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct, // ✅ New
  }),
  [products, loading, fetchProducts, createProduct, updateProduct, deleteProduct, restoreProduct]
);
```

---

## Admin UI Changes

### 1. Add "Deleted Items" View

**File**: `src/pages/products/deleted-products.tsx` (new file)

```typescript
/**
 * View for managing deleted products (soft deleted)
 * Allows admins to restore or permanently delete
 */
export function DeletedProducts() {
  const { products, restoreProduct, hardDeleteProduct } = useProduct();
  
  // Fetch deleted products
  const deletedProducts = useMemo(() => {
    return products.filter((p) => p.deleted_at !== null);
  }, [products]);
  
  return (
    <div>
      <h1>Deleted Products</h1>
      {deletedProducts.map((product) => (
        <div key={product.id}>
          <span>{product.name}</span>
          <span>Deleted: {new Date(product.deleted_at).toLocaleDateString()}</span>
          <button onClick={() => restoreProduct(product.id)}>
            Restore
          </button>
          <button 
            onClick={() => {
              if (confirm("Permanently delete? This cannot be undone!")) {
                hardDeleteProduct(product.id);
              }
            }}
          >
            Permanently Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 2. Update Product List UI

Add indicator for deleted status:

```typescript
// In product card/list item:
{product.deleted_at && (
  <span className="text-red-600 text-sm">
    Deleted {new Date(product.deleted_at).toLocaleDateString()}
  </span>
)}
```

### 3. Add "View Deleted" Toggle

```typescript
const [showDeleted, setShowDeleted] = useState(false);

const visibleProducts = useMemo(() => {
  if (showDeleted) {
    return products; // Show all including deleted
  }
  return products.filter((p) => !p.deleted_at); // Only active
}, [products, showDeleted]);
```

---

## Realtime Subscriptions Update

Update subscription handlers to respect soft delete:

```typescript
// Update handler should check deleted_at:
.on("postgres_changes", { event: "UPDATE" }, (payload) => {
  setProducts((prev) => {
    // If updated to deleted_at !== null, remove from active list
    if (payload.new.deleted_at && !showDeleted) {
      return prev.filter((p) => p.id !== payload.new.id);
    }
    
    // Otherwise update as normal
    return prev.map((p) =>
      p.id === payload.new.id ? { ...p, ...payload.new } : p
    );
  });
})
```

---

## Customer-Facing Behavior

### Product No Longer Available

When a product is soft deleted:

1. **Product Detail Page**: Show "Product no longer available"
2. **Cart Items**: Show warning "This product is no longer available"
3. **Search Results**: Exclude from results
4. **Wishlist**: Keep but mark as unavailable

**Example Error Page**:

```typescript
// In ProductDetails.tsx:
if (product.deleted_at) {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-gray-800">Product Unavailable</h1>
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

### Cart Cleanup

Add function to remove deleted products from cart:

```typescript
const removeDeletedFromCart = useCallback(async () => {
  const deletedItems = addToCarts.filter((item) => 
    products.find((p) => p.id === item.product_id && p.deleted_at !== null)
  );
  
  for (const item of deletedItems) {
    await deleteAddToCart(item.id);
  }
}, [addToCarts, products, deleteAddToCart]);

// Call on cart page load:
useEffect(() => {
  removeDeletedFromCart();
}, [removeDeletedFromCart]);
```

---

## Testing Checklist

### Database Tests
- [ ] Can soft delete product
- [ ] Product not visible in customer queries
- [ ] Product still exists in database
- [ ] Can restore soft-deleted product
- [ ] Restored product visible again
- [ ] Can hard delete after soft delete
- [ ] Cannot hard delete active product

### Context Tests
- [ ] fetchProducts excludes deleted
- [ ] deleteProduct soft deletes (not hard)
- [ ] restoreProduct works correctly
- [ ] Realtime updates respect soft delete

### UI Tests
- [ ] Admin can view deleted products
- [ ] Admin can restore deleted products
- [ ] Customer cannot see deleted products
- [ ] Cart removes deleted products
- [ ] Product detail shows "unavailable" for deleted

### Edge Cases
- [ ] Deleting product with active orders (should work)
- [ ] Deleting product in user's cart (show warning)
- [ ] Deleting product in wishlist (keep but mark unavailable)
- [ ] Restoring product updates all views
- [ ] Multiple users deleting same product (concurrency)

---

## Migration Strategy

### Step 1: Add Columns (No Breaking Changes)

```sql
-- Run migration (adds columns, doesn't affect existing queries)
-- All deleted_at default to NULL (active)
```

### Step 2: Update Code (Deploy)

- Deploy updated contexts with soft delete logic
- Old code still works (deleted_at is NULL for all records)

### Step 3: Update UI (Deploy)

- Deploy admin UI with restore functionality
- Deploy customer UI with unavailable messaging

### Step 4: Clean Up (Optional)

- After confirming everything works, can optionally clean up old deleted records
- Or keep them indefinitely for historical data

---

## Benefits of Soft Delete

### ✅ Advantages

1. **Preserve Order History**: Orders reference deleted products, no issues
2. **Audit Trail**: Know what was deleted and when
3. **Undo Functionality**: Can restore accidentally deleted items
4. **Analytics**: Historical sales data remains intact
5. **No Foreign Key Issues**: References remain valid
6. **Graceful Degradation**: Customers see "unavailable" not errors

### ⚠️ Considerations

1. **Database Size**: Deleted records still take space (minimal concern)
2. **Query Performance**: Need indexes on deleted_at (provided in migration)
3. **Code Complexity**: Need to filter deleted_at in queries (utility function helps)

---

## Future Enhancements

### Scheduled Hard Delete

Optionally, after products have been soft deleted for X days (e.g., 90 days):

```typescript
/**
 * Permanently deletes products that have been soft deleted for > 90 days
 * Run as scheduled job (cron)
 */
async function cleanupOldDeletedProducts() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const { data: oldDeleted } = await supabase
    .from("products")
    .select("id")
    .not("deleted_at", "is", null)
    .lt("deleted_at", ninetyDaysAgo.toISOString());
  
  if (oldDeleted) {
    for (const product of oldDeleted) {
      // Hard delete after 90 days
      await supabase.from("products").delete().eq("id", product.id);
    }
  }
}
```

---

## Reference Documentation

- Database schema: [DATABASE.md](./DATABASE.md)
- Context patterns: [CONTEXTS.md](./CONTEXTS.md)
- Admin panel: [ADMIN_PANEL.md](./ADMIN_PANEL.md)
- Customer pages: [CUSTOMER_FACING.md](./CUSTOMER_FACING.md)

---

**Status**: 🔴 Not implemented - Must add to agent prompts for implementation


