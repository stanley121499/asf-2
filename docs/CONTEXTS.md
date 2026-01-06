# React Context Providers Documentation

**Total Contexts**: 35+  
**Last Updated**: January 6, 2026

---

## Overview

The application uses **React Context API** for global state management. All contexts follow a similar pattern:
1. Fetch data from Supabase
2. Set up realtime subscriptions
3. Provide CRUD functions
4. Manage loading/error states
5. Show alerts on success/error

---

## Context Architecture

```
App.tsx (ProviderComposer with 35+ providers)
    ├── Core Contexts (Always needed)
    │   ├── AuthContext
    │   ├── UserContext
    │   └── AlertContext (implicit)
    │
    ├── Product Contexts (10)
    │   ├── ProductProvider
    │   ├── ProductColorProvider
    │   ├── ProductSizeProvider
    │   ├── ProductCategoryProvider
    │   ├── ProductMediaProvider
    │   ├── ProductFolderProvider
    │   ├── ProductFolderMediaProvider
    │   ├── ProductEventProvider
    │   ├── ProductStockProvider
    │   └── ProductStockLogProvider
    │
    ├── Categorization Contexts (4)
    │   ├── BrandProvider
    │   ├── DepartmentProvider
    │   ├── RangeProvider
    │   └── CategoryProvider
    │
    ├── Post Contexts (4)
    │   ├── PostProvider
    │   ├── PostFolderProvider
    │   ├── PostFolderMediaProvider
    │   └── PostMediaProvider
    │
    ├── Order & Payment Contexts (3)
    │   ├── AddToCartProvider
    │   ├── OrderProvider
    │   └── PaymentProvider
    │
    ├── Community Contexts (4)
    │   ├── CommunityProvider
    │   ├── GroupProvider
    │   ├── ConversationProvider
    │   └── ConversationParticipantProvider
    │
    ├── Support Contexts (2)
    │   ├── TicketProvider
    │   └── TicketStatusLogProvider
    │
    └── Miscellaneous Contexts (8)
        ├── PointsMembershipProvider
        ├── ProductPurchaseOrderProvider
        ├── ProductReportProvider
        ├── AddToCartLogProvider
        └── HomePageElementProvider
```

---

## Core Contexts

### 1. AuthContext

**Location**: `src/context/AuthContext.tsx`

**Purpose**: Manage authentication state and Supabase Auth integration

**State**:
```typescript
{
  user: User | null,
  session: Session | null,
  loading: boolean
}
```

**Functions**:
- `signIn(email, password)` - User login
- `signUp(email, password, userData)` - User registration
- `signOut()` - User logout
- `resetPassword(email)` - Password reset

**Key Features**:
- Listens to Supabase auth state changes
- Persists session automatically
- Provides user object to entire app

---

### 2. UserContext

**Location**: `src/context/UserContext.tsx`

**Purpose**: Manage user profile data and user-related operations

**State**:
```typescript
{
  users: UserDetail[],
  currentUser: UserDetail | null,
  loading: boolean
}
```

**Functions**:
- `fetchUsers()` - Get all users
- `createUser(data)` - Create user profile
- `updateUser(id, data)` - Update user profile
- `deleteUser(id)` - Delete user

**Dependencies**: `AuthContext` (for current user ID)

---

### 3. AlertContext (Implicit)

**Location**: Not directly visible, but used by all contexts via `showAlert` function

**Purpose**: Display toast notifications

**Usage**:
```typescript
showAlert("Operation successful", "default");
showAlert("Error occurred", "destructive");
```

---

## Product Contexts

### 4. ProductContext ⭐

**Location**: `src/context/product/ProductContext.tsx`

**Purpose**: Main product management

**State**:
```typescript
{
  products: Product[],
  selectedProduct: Product | null,
  loading: boolean
}
```

**Functions**:
- `fetchProducts()` - Get all products
- `createProduct(data, colors, sizes, categories)` - Create product with variants
- `updateProduct(id, data, colors, sizes, categories)` - Update product
- `deleteProduct(id)` - Delete product
- `selectProduct(product)` - Set selected product for editing

**Realtime**: Subscribes to `products` table changes

**⚠️ Known Issues**:
- `forEach(async)` bug in create/update (see [CRITICAL_BUGS.md](./CRITICAL_BUGS.md#priority-2))
- `useEffect` dependency issues
- Missing memoization

**Dependencies**:
- `ProductColorContext` - For creating/updating colors
- `ProductSizeContext` - For creating/updating sizes
- `ProductCategoryContext` - For creating/updating categories

---

### 5. ProductColorContext

**Location**: `src/context/product/ProductColorContext.tsx`

**Purpose**: Manage product color variants

**State**:
```typescript
{
  productColors: ProductColor[],
  loading: boolean
}
```

**Type**:
```typescript
interface ProductColor {
  id: string;
  product_id: string;
  color: string;      // Free text!
  active: boolean;
  created_at: string;
}
```

**Functions**:
- `fetchProductColors()` - Get all colors
- `createProductColor(data)` - Add color to product
- `updateProductColor(id, data)` - Update color
- `deleteProductColor(id)` - Remove color
- `deleteProductColorsByProductId(productId)` - Remove all colors for product

**Realtime**: Subscribes to `product_colors` table changes

**Key Feature**: Colors are **free text**, allowing complete flexibility

---

### 6. ProductSizeContext

**Location**: `src/context/product/ProductSizeContext.tsx`

**Purpose**: Manage product size variants

**State**:
```typescript
{
  productSizes: ProductSize[],
  loading: boolean
}
```

**Type**:
```typescript
interface ProductSize {
  id: string;
  product_id: string;
  size: string;       // Free text!
  active: boolean;
  created_at: string;
}
```

**Functions**:
- `fetchProductSizes()` - Get all sizes
- `createProductSize(data)` - Add size to product
- `updateProductSize(id, data)` - Update size
- `deleteProductSize(id)` - Remove size
- `deleteProductSizesByProductId(productId)` - Remove all sizes for product

**Realtime**: Subscribes to `product_sizes` table changes

**Key Feature**: Sizes are **free text** (S/M/L, EU sizes, numeric, etc.)

---

### 7. ProductCategoryContext

**Location**: `src/context/product/ProductCategoryContext.tsx`

**Purpose**: Link products to categories (many-to-many)

**State**:
```typescript
{
  productCategories: ProductCategory[],
  loading: boolean
}
```

**Type**:
```typescript
interface ProductCategory {
  id: string;
  product_id: string;
  category_id: string;
  created_at: string;
}
```

**Functions**:
- `createProductCategory(data)` - Link product to category
- `deleteProductCategory(id)` - Unlink
- `deleteProductCategoriesByProductId(productId)` - Remove all category links

---

### 8. ProductMediaContext

**Location**: `src/context/product/ProductMediaContext.tsx`

**Purpose**: Manage product images/videos

**State**:
```typescript
{
  productMedias: ProductMedia[],
  loading: boolean
}
```

**Type**:
```typescript
interface ProductMedia {
  id: string;
  product_id: string;
  media_url: string;
  arrangement: number;
  created_at: string;
}
```

**Functions**:
- `fetchProductMedias()` - Get all media
- `createProductMedia(data)` - Upload media
- `updateProductMedia(id, data)` - Update media
- `deleteProductMedia(id)` - Delete media

**Realtime**: Subscribes to `product_medias` table changes

---

### 9. ProductFolderContext

**Location**: `src/context/product/ProductFolderContext.tsx`

**Purpose**: Organize products into folders

**State**:
```typescript
{
  productFolders: ProductFolder[],
  selectedFolder: ProductFolder | null,
  loading: boolean
}
```

**Functions**:
- `fetchProductFolders()` - Get all folders
- `createProductFolder(data)` - Create folder
- `updateProductFolder(id, data)` - Update folder
- `deleteProductFolder(id)` - Delete folder
- `selectFolder(folder)` - Set selected folder

**⚠️ Known Issue**: Re-fetches all folders when `productFolderMedias` changes (see [PERFORMANCE_ISSUES.md](./PERFORMANCE_ISSUES.md))

---

### 10. ProductFolderMediaContext

**Location**: `src/context/product/ProductFolderMediaContext.tsx`

**Purpose**: Media for product folders

---

### 11. ProductStockContext ⭐

**Location**: `src/context/product/ProductStockContext.tsx`

**Purpose**: Track product inventory

**State**:
```typescript
{
  productStocks: ProductStock[],
  loading: boolean
}
```

**Type**:
```typescript
interface ProductStock {
  id: string;
  product_id: string;
  color_id: string | null;  // Variant tracking!
  size_id: string | null;   // Variant tracking!
  quantity: number;
  created_at: string;
}
```

**Functions**:
- `fetchProductStocks()` - Get all stock records
- `createProductStock(data)` - Create stock record
- `updateProductStock(id, data)` - Update stock quantity
- `deleteProductStock(id)` - Delete stock record

**Key Feature**: Supports **variant-level stock tracking** with `color_id` and `size_id`!

---

### 12. ProductStockLogContext

**Location**: `src/context/product/ProductStockLogContext.tsx`

**Purpose**: Audit trail for stock changes

**State**:
```typescript
{
  productStockLogs: ProductStockLog[],
  loading: boolean
}
```

**Functions**:
- `fetchProductStockLogs()` - Get logs
- `createProductStockLog(data)` - Log stock change

---

### 13. ProductEventContext

**Location**: `src/context/product/ProductEventContext.tsx`

**Purpose**: Schedule product posts

**State**:
```typescript
{
  productEvents: ProductEvent[],
  loading: boolean
}
```

---

## Categorization Contexts

### 14. BrandContext

**Location**: `src/context/BrandContext.tsx`

**Purpose**: Manage product brands

**State**:
```typescript
{
  brands: Brand[],
  loading: boolean
}
```

**Functions**: CRUD operations for brands

---

### 15. DepartmentContext

**Location**: `src/context/DepartmentContext.tsx`

**Purpose**: Manage departments

---

### 16. RangeContext

**Location**: `src/context/RangeContext.tsx`

**Purpose**: Manage product ranges

---

### 17. CategoryContext

**Location**: `src/context/CategoryContext.tsx`

**Purpose**: Manage product categories

**Key Feature**: Supports **hierarchical categories** with `parent` field

---

## Post Contexts

### 18. PostContext

**Location**: `src/context/post/PostContext.tsx`

**Purpose**: Manage social media posts

**State**:
```typescript
{
  posts: Post[],
  selectedPost: Post | null,
  loading: boolean
}
```

**Type**:
```typescript
interface Post {
  id: string;
  caption: string;
  facebook: boolean;
  instagram: boolean;
  tiktok: boolean;
  scheduled_time: string;
  status: string;
  post_folder_id: string;
}
```

**Functions**: Full CRUD + scheduling

---

### 19-21. PostFolderContext, PostFolderMediaContext, PostMediaContext

Similar structure to product contexts.

---

## Order & Payment Contexts

### 22. AddToCartContext

**Location**: `src/context/AddToCartContext.tsx`

**Purpose**: Manage shopping cart

**State**:
```typescript
{
  addToCarts: AddToCart[],
  loading: boolean
}
```

**Type**:
```typescript
interface AddToCart {
  id: string;
  user_id: string;
  product_id: string;
  color_id: string | null;  // ⚠️ Currently NULL from frontend!
  size_id: string | null;   // ⚠️ Currently NULL from frontend!
  amount: number;
}
```

**Functions**:
- `fetchAddToCarts()` - Get cart items
- `createAddToCart(data)` - Add to cart
- `updateAddToCart(id, data)` - Update quantity
- `deleteAddToCart(id)` - Remove from cart

**⚠️ Critical Issue**: Frontend passes `null` for `color_id` and `size_id`!

---

### 23. OrderContext ⭐

**Location**: `src/context/OrderContext.tsx`

**Purpose**: Manage orders

**State**:
```typescript
{
  orders: Order[],
  loading: boolean
}
```

**Functions**:
- `fetchOrders()` - Get all orders
- `createOrder(data)` - Create order
- `updateOrderStatus(id, status)` - Update status
- `createOrderWithItemsAndStock(orderData, items)` - **Complete checkout flow**

**Key Feature**: `createOrderWithItemsAndStock` handles:
1. Create order
2. Create order items (with variants!)
3. Decrement stock for each variant
4. Handle errors and rollback

**Stock Decrement Logic**:
```typescript
// Queries product_stock by product_id, color_id, size_id
const { data: stockRecord } = await supabase
  .from("product_stock")
  .select("*")
  .eq("product_id", item.product_id)
  .eq("color_id", item.color_id || null)
  .eq("size_id", item.size_id || null)
  .single();

// Decrements quantity
await supabase
  .from("product_stock")
  .update({ quantity: stockRecord.quantity - item.quantity })
  .eq("id", stockRecord.id);
```

**✅ Confirmation**: Backend **fully supports variant-level stock management**!

---

### 24. PaymentContext

**Location**: `src/context/PaymentContext.tsx`

**Purpose**: Manage payments and refunds

**State**:
```typescript
{
  payments: Payment[],
  loading: boolean
}
```

**Functions**:
- `refreshPayments()` - Fetch payments
- `updatePaymentStatus(id, status)` - Update payment status
- `updateRefundStatus(id, status)` - Update refund status

**⚠️ Known Issue**: Functions not memoized (see [PERFORMANCE_ISSUES.md](./PERFORMANCE_ISSUES.md))

---

## Community Contexts

### 25. CommunityContext

**Location**: `src/context/community/CommunityContext.tsx`

**Purpose**: Manage communities

**Note**: Backend ready, **no UI implemented**

---

### 26. GroupContext

**Location**: `src/context/community/GroupContext.tsx`

**Purpose**: Manage groups within communities

**Note**: Backend ready, **no UI implemented**

---

### 27. ConversationContext

**Location**: `src/context/community/ConversationContext.tsx`

**Purpose**: Manage conversations/chats

**Note**: Backend ready, **no UI implemented**

---

### 28. ConversationParticipantContext

**Location**: `src/context/community/ConversationParticipantContext.tsx`

**Purpose**: Link users to conversations

---

## Support Contexts

### 29. TicketContext

**Location**: `src/context/TicketContext.tsx`

**Purpose**: Manage support tickets

**Note**: Backend ready, **no UI implemented**

---

### 30. TicketStatusLogContext

**Location**: `src/context/TicketStatusLogContext.tsx`

**Purpose**: Audit trail for ticket status changes

---

## Miscellaneous Contexts

### 31. PointsMembershipContext

**Location**: `src/context/PointsMembershipContext.tsx`

**Purpose**: Manage user loyalty points

**Note**: Context exists but **not fully utilized in UI**

---

### 32. ProductPurchaseOrderContext

**Location**: `src/context/product/ProductPurchaseOrderContext.tsx`

**Purpose**: Manage purchase orders for restocking

**Note**: Backend ready, **no UI implemented**

---

### 33. ProductReportContext

**Location**: `src/context/product/ProductReportContext.tsx`

**Purpose**: Product analytics and reporting

---

### 34. AddToCartLogContext

**Location**: `src/context/AddToCartLogContext.tsx`

**Purpose**: Track add-to-cart analytics

---

### 35. HomePageElementContext

**Location**: `src/context/HomePageElementContext.tsx`

**Purpose**: Manage dynamic homepage elements

**Note**: Context exists, **no admin UI for editing**

---

## Context Usage Patterns

### Typical Context Structure

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../utils/supabaseClient";

interface ContextState {
  items: ItemType[];
  loading: boolean;
}

interface ContextProps extends ContextState {
  fetchItems: () => Promise<void>;
  createItem: (data: ItemType) => Promise<void>;
  updateItem: (id: string, data: Partial<ItemType>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const Context = createContext<ContextProps | undefined>(undefined);

export const ContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
    
    const subscription = supabase
      .channel("items")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, handleChange)
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("items").select("*");
    if (error) console.error(error);
    else setItems(data);
    setLoading(false);
  };

  // ... CRUD functions

  return (
    <Context.Provider value={{ items, loading, fetchItems, createItem, updateItem, deleteItem }}>
      {children}
    </Context.Provider>
  );
};

export const useContext = () => {
  const context = useContext(Context);
  if (!context) throw new Error("useContext must be used within ContextProvider");
  return context;
};
```

---

## Common Issues Across All Contexts

### 1. No Memoization
**All contexts** lack `useCallback` and `useMemo`, causing unnecessary re-renders.

### 2. useEffect Dependencies
Many contexts have problematic dependencies (`showAlert`, state variables).

### 3. Inefficient Realtime Handlers
All contexts iterate through arrays for updates/deletes (O(n) complexity).

### 4. Loading State Management
Many contexts set `loading = false` before async operations complete.

### 5. No Error Boundaries
Contexts don't have error boundaries, errors can crash the app.

---

## Recommended Refactoring

### Phase 1: Fix Critical Issues
1. Add `useCallback` to all functions
2. Add `useMemo` to all context values
3. Fix `useEffect` dependencies
4. Fix loading state management

### Phase 2: Performance Optimization
1. Use indexed data structures (Map/Record)
2. Implement optimistic updates
3. Add pagination where needed
4. Lazy load contexts

### Phase 3: Feature Enhancements
1. Add error boundaries
2. Implement caching strategies
3. Add retry logic for failed requests
4. Implement request debouncing

---

## Context Dependencies Map

```
ProductContext
  ↓ depends on
ProductColorContext, ProductSizeContext, ProductCategoryContext
  ↓ depends on
CategoryContext, BrandContext, DepartmentContext, RangeContext

PostContext
  ↓ depends on
PostMediaContext, PostFolderContext

OrderContext
  ↓ depends on
ProductStockContext, PaymentContext

AddToCartContext
  ↓ depends on
ProductContext, ProductColorContext, ProductSizeContext
```

**Problem**: Changing one context triggers cascading re-renders through dependencies.

---

## Testing Strategy

### Unit Tests (Missing)
- Test CRUD functions
- Test realtime subscription handlers
- Test error handling

### Integration Tests (Missing)
- Test context interactions
- Test data flow between contexts

### Performance Tests (Missing)
- Measure re-render counts
- Test with large datasets (1000+ items)

---

## Next Steps

1. **Fix memoization** in all 35+ contexts (see [PERFORMANCE_ISSUES.md](./PERFORMANCE_ISSUES.md))
2. **Lazy load** contexts (see [ARCHITECTURE.md](./ARCHITECTURE.md))
3. **Add tests** for all contexts
4. **Document RLS policies** that affect contexts
5. **Consider React Query** as alternative to contexts for data fetching

---

**For detailed performance issues**, see [PERFORMANCE_ISSUES.md](./PERFORMANCE_ISSUES.md).

