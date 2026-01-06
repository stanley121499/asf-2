# Admin Panel Documentation

**Last Updated**: January 6, 2026  
**Status**: ✅ Well Implemented (with some bugs)

---

## Overview

The admin panel provides comprehensive management tools for products, posts, orders, and other backend operations. Admin pages are located in `src/pages/` (not in `/landing`).

---

## Admin Routes

### Product Management

| Route | Component | Purpose | Status |
|-------|-----------|---------|--------|
| `/products` | `products/list.tsx` | List all products | ✅ Working |
| `/products/folders` | `products/folders.tsx` | Manage product folders | ✅ Working |
| `/products/stock` | `products/stock.tsx` | View/manage inventory | ✅ Working |
| `/products/create` | `products/create-product-page.tsx` | Create new product | 🟡 Has bugs |
| `/products/schedule` | `products/schedule-product-page.tsx` | Schedule product posts | 🟡 Has bugs |
| `/categories-v2` | `products/category-v2-page.tsx` | ⚠️ Uses localStorage | 🔴 Problematic |

---

### Post Management

| Route | Component | Purpose | Status |
|-------|-----------|---------|--------|
| `/posts` | `posts/create-post-page.tsx` | Create/list posts | ✅ Working |
| `/posts/folders` | `posts/folders.tsx` | Manage post folders | ✅ Working |
| `/posts/schedule` | `posts/schedule-post-page.tsx` | Schedule posts | ✅ Working |

---

### Order Management

| Route | Component | Purpose | Status |
|-------|-----------|---------|--------|
| `/orders` | `orders/` | View/manage orders | ✅ Working |

---

### Promotions ⚠️

| Route | Component | Purpose | Status |
|-------|-----------|---------|--------|
| `/promotions` | `promotions/list.tsx` | List promotions | 🔴 **BROKEN** |
| `/promotions/create` | `promotions/create-promotion-page.tsx` | Create promotion | 🔴 **BROKEN** |

**Issue**: Promotions module is non-functional (see [CRITICAL_BUGS.md](./CRITICAL_BUGS.md#priority-4))

---

## Product Management Features

### Product List Page

**Location**: `src/pages/products/list.tsx`

**Features**:
- Grid view of all products
- Product preview cards
- Click to select for editing
- Search/filter (basic)

**Known Issues**:
- Uses `Array(1).fill(null).map()` pattern (unnecessary)
- No pagination (loads all products)

**Components Used**:
- `src/components/product/product.tsx` - Product display card

---

### Product Editor

**Location**: `src/pages/products/product-editor.tsx`

**Features**:
- ✅ Edit product name, description, price
- ✅ Select brand, department, range
- ✅ Add/remove colors (free text input)
- ✅ Add/remove sizes (free text input)
- ✅ Select categories
- ✅ Upload multiple images
- ✅ Arrange image order
- ✅ Set product folder
- ✅ Set article number, festival, season

**Known Issues**:
- `forEach(async)` bug in save (see [CRITICAL_BUGS.md](./CRITICAL_BUGS.md#priority-2))
- State not clearing correctly between products
- useEffect dependency issues

**UI Elements**:
- **Tabbed Interface**:
  - Product Info
  - Images
  - Variants (Colors/Sizes)
  - Categories

**Workflow**:
1. Select folder (left sidebar)
2. Click product or "Create New"
3. Edit product details in tabs
4. Click "Save" to commit changes

---

### Product Folders

**Location**: `src/pages/products/folders.tsx`

**Features**:
- Hierarchical folder structure
- Create/rename/delete folders
- Drag-and-drop organization (if implemented)
- Folder thumbnails

**Purpose**: Organize products for easier management

---

### Stock Management

**Location**: `src/pages/products/stock.tsx`

**Features**:
- ✅ View stock levels for all products
- ✅ Filter by product
- ✅ Add stock (via modal)
- ✅ Return stock (via modal)
- ✅ View stock logs (audit trail)
- ✅ **Variant-level stock tracking** (color + size combinations)

**Modals**:
- `add-stock-modal.tsx` - Add stock for variants
- `add-return-modal.tsx` - Return/remove stock

**Key Feature**: Stock can be managed at the **variant level** (color-size combinations)

**Example**:
```
Product: T-Shirt
- Red, Size M: Add 50 units
- Red, Size L: Add 30 units
- Blue, Size M: Add 20 units
```

**Status**: ✅ **FULLY FUNCTIONAL** - Backend supports variant-level stock!

---

### Product Scheduling

**Location**: `src/pages/products/schedule-product-page.tsx`

**Features**:
- Schedule product posts to social media
- Select time and platforms (Facebook, Instagram, TikTok)

**Known Issues**:
- `Array(10)` rendering bug
- `updateProductTimePost` call commented out

**Status**: 🟡 Partially functional, needs fixes

---

## Post Management Features

### Post Editor

**Location**: `src/pages/posts/create-post-page.tsx`

**Features**:
- ✅ Write caption
- ✅ Upload media (images/videos)
- ✅ Select platforms (Facebook, Instagram, TikTok)
- ✅ Schedule post or publish immediately
- ✅ Organize into folders

**Status**: ✅ Well implemented

---

### Post Folders

Similar to product folders, allows hierarchical organization of posts.

---

### Post Scheduling

**Location**: `src/pages/posts/schedule-post-page.tsx`

**Features**:
- Calendar view of scheduled posts
- Drag-and-drop rescheduling (if implemented)
- Edit scheduled posts

**Status**: ✅ Functional

---

## Order Management Features

### Orders Page

**Location**: `src/pages/orders/`

**Features**:
- ✅ List all orders
- ✅ Filter by status (pending, processing, shipped, delivered, cancelled)
- ✅ View order details
- ✅ Update order status
- ✅ View order items with variant info (color/size)
- ✅ View payment status
- ✅ View shipping address

**Key Functionality**:
- Order creation automatically decrements stock (variant-aware)
- Order status logs track all changes
- Payment integration ready

**Status**: ✅ **FULLY FUNCTIONAL**

---

## Component Library (Admin)

### Reusable Admin Components

#### Product Display Component

**Location**: `src/components/product/product.tsx`

**Features**:
- Displays product with all details:
  - Name, description, price
  - Brand, department, range, categories
  - Colors, sizes
  - Article number, festival, season
  - Stock status
  - All images (gallery)

**Note**: This component shows **everything** the customer-facing product detail page should show but doesn't!

#### Modals

- `add-stock-modal.tsx` - Add stock to products
- `add-return-modal.tsx` - Return stock

---

## Admin Access Control

### Current Implementation

**Status**: ⚠️ Likely basic or missing

**Recommended**:
- Check user role in `UserContext`
- Protect admin routes with auth guard
- Only allow `role === 'admin'` or `role === 'staff'`

**Example Route Guard**:

```typescript
function AdminRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "staff")) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "staff")) {
    return <div>Unauthorized</div>;
  }

  return <>{children}</>;
}

// Usage
<Route path="/products/*" element={<AdminRoute><ProductRoutes /></AdminRoute>} />
```

---

## Admin Panel UI/UX

### Layout

**Typical Structure**:
```
┌─────────────────────────────────────┐
│ Header / Navigation                 │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │  Main Content Area       │
│ (Folders/│  (Product List/Editor)   │
│  Filters)│                          │
│          │                          │
└──────────┴──────────────────────────┘
```

### Common Patterns

1. **List View** → **Editor/Detail View**
2. **Folder Selection** → **Item Management**
3. **Modal Overlays** for quick actions (add stock, create folder)

---

## Performance Considerations

### Admin Panel Performance Issues

1. **No Pagination** - Loads all products/posts at once
2. **Large Re-renders** - Context changes trigger full list re-renders
3. **No Virtualization** - Lists render all items, even off-screen

**Recommended Fixes**:
- Implement pagination (50-100 items per page)
- Add virtual scrolling for large lists
- Memoize list items with `React.memo`

---

## Admin Panel Improvements

### High Priority

1. **Fix Product Editor Bugs** (see [CRITICAL_BUGS.md](./CRITICAL_BUGS.md))
2. **Add Pagination** to product/post lists
3. **Implement Access Control** (role-based)

### Medium Priority

1. **Add Search/Filter** for products, posts, orders
2. **Improve Stock UI** - Show low stock warnings
3. **Add Analytics Dashboard** - Sales, views, top products

### Low Priority

1. **Drag-and-drop** for image reordering
2. **Bulk Operations** - Delete multiple products, update multiple orders
3. **Export Data** - CSV export for products, orders

---

## Admin Panel Testing Checklist

### Product Management
- [ ] Can create new product
- [ ] Can edit existing product
- [ ] Can delete product
- [ ] Can add/remove colors and sizes
- [ ] Can upload and arrange images
- [ ] Can assign to categories
- [ ] State clears correctly when switching products

### Stock Management
- [ ] Can view stock levels
- [ ] Can add stock for specific variants
- [ ] Can return stock
- [ ] Stock logs update correctly
- [ ] Cannot set negative stock

### Order Management
- [ ] Can view all orders
- [ ] Can filter orders by status
- [ ] Can view order details
- [ ] Can update order status
- [ ] Order items show correct variant info

### Post Management
- [ ] Can create new post
- [ ] Can schedule post
- [ ] Can upload media
- [ ] Can select platforms

---

## Admin Panel Status Summary

| Module | Status | Notes |
|--------|--------|-------|
| Product CRUD | ✅ Good | Minor bugs, see [CRITICAL_BUGS.md](./CRITICAL_BUGS.md) |
| Product Folders | ✅ Good | Well organized |
| Stock Management | ✅ Excellent | Fully functional with variant support |
| Product Scheduling | 🟡 Partial | Has bugs, needs fixes |
| Post Management | ✅ Good | Well implemented |
| Order Management | ✅ Excellent | Comprehensive functionality |
| Promotions | 🔴 Broken | Non-functional |
| Category V2 | 🔴 Problematic | Uses localStorage |

---

## Next Steps

1. **Fix Critical Bugs** - Product editor, async loops
2. **Fix/Remove Promotions** - Rewrite or delete
3. **Delete/Fix Category V2** - Uses localStorage
4. **Add Pagination** - For better performance
5. **Implement Access Control** - Secure admin routes
6. **Add Analytics** - Dashboard with key metrics

---

**Overall Assessment**: Admin panel is **well-implemented** with comprehensive features. Main issues are bugs (not architectural) and missing pagination. Once critical bugs are fixed, the admin panel will be production-ready.

For detailed bug information, see [CRITICAL_BUGS.md](./CRITICAL_BUGS.md).

