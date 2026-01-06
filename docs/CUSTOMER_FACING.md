# Customer-Facing Pages Documentation

**Last Updated**: January 6, 2026  
**Status**: 🟡 Partially Implemented

---

## Overview

Customer-facing pages are located in `src/pages/landing/` and provide the shopping experience for end users. Many pages are **incomplete** or use **mock data**.

---

## Page Inventory

### 1. Landing Page / Home Page

**Location**: `src/pages/landing/home.tsx`

**Route**: `/`

**Status**: ✅ Implemented

**Features**:
- Hero section
- Featured products
- Categories display
- Promotional banners

**Issues**: None identified

---

### 2. Login Page

**Location**: `src/pages/landing/LoginPage.tsx`

**Route**: `/login`

**Status**: ✅ Fully Functional

**Features**:
- Email/password login
- Supabase Auth integration
- Form validation
- Error handling

**Issues**: None identified

---

### 3. Signup Page

**Location**: `src/pages/landing/SignupPage.tsx`

**Route**: `/signup`

**Status**: ✅ Fully Functional

**Features**:
- User registration
- Profile data collection
- Supabase Auth integration
- Form validation

**Issues**: None identified

---

### 4. Product Detail Page ⚠️ CRITICAL

**Location**: `src/pages/landing/ProductDetails.tsx`

**Route**: `/product/:id`

**Status**: 🔴 **CRITICALLY INCOMPLETE**

**Current Implementation**:
- ✅ Product name
- ✅ Product description
- ✅ Product price
- ✅ Brand display
- ✅ First image only
- ✅ Basic "Add to Cart" button

**Missing Features**:
- ❌ **Color selection** (data exists, not displayed)
- ❌ **Size selection** (data exists, not displayed)
- ❌ **Stock status** (In Stock / Out of Stock)
- ❌ **Stock quantity**
- ❌ **Article number**
- ❌ **Festival information**
- ❌ **Season information**
- ❌ **Image gallery** (only shows first image)
- ❌ **Low stock warnings**
- ❌ **Variant-specific pricing** (if applicable)

**Critical Bug**:

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
- Cart items have no variant information
- Stock tracking broken
- Order fulfillment impossible

**Required Fixes**:

1. **Display Color Options**
   ```typescript
   const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
   
   <div className="space-y-2">
     <label className="font-semibold">Color:</label>
     <div className="flex gap-2">
       {product.product_colors?.map((color) => (
         <button
           key={color.id}
           onClick={() => setSelectedColor(color)}
           className={`px-4 py-2 border rounded ${
             selectedColor?.id === color.id ? "bg-blue-500 text-white" : "bg-white"
           }`}
         >
           {color.color}
         </button>
       ))}
     </div>
   </div>
   ```

2. **Display Size Options**
   ```typescript
   const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
   
   <div className="space-y-2">
     <label className="font-semibold">Size:</label>
     <div className="flex gap-2">
       {product.product_sizes?.map((size) => (
         <button
           key={size.id}
           onClick={() => setSelectedSize(size)}
           className={`px-4 py-2 border rounded ${
             selectedSize?.id === size.id ? "bg-blue-500 text-white" : "bg-white"
           }`}
         >
           {size.size}
         </button>
       ))}
     </div>
   </div>
   ```

3. **Display Stock Status**
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
   
   {currentStock && (
     <p className={currentStock.quantity > 0 ? "text-green-600" : "text-red-600"}>
       {currentStock.quantity > 0 
         ? `In Stock (${currentStock.quantity} available)` 
         : "Out of Stock"}
     </p>
   )}
   ```

4. **Image Gallery**
   ```typescript
   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
   
   {/* Main image */}
   <img 
     src={productMedia[selectedImageIndex]?.media_url || "/default-image.jpg"}
     alt={product.name}
     className="w-full rounded-lg"
   />
   
   {/* Thumbnail gallery */}
   <div className="flex gap-2 mt-4">
     {productMedia.map((media, index) => (
       <img
         key={media.id}
         src={media.media_url}
         alt={`${product.name} ${index + 1}`}
         onClick={() => setSelectedImageIndex(index)}
         className={`w-20 h-20 object-cover rounded cursor-pointer ${
           selectedImageIndex === index ? "border-2 border-blue-500" : ""
         }`}
       />
     ))}
   </div>
   ```

5. **Fix Add to Cart**
   ```typescript
   const handleAddToCart = async () => {
     // Validation
     if (product.product_colors && product.product_colors.length > 0 && !selectedColor) {
       showAlert("Please select a color", "destructive");
       return;
     }
     
     if (product.product_sizes && product.product_sizes.length > 0 && !selectedSize) {
       showAlert("Please select a size", "destructive");
       return;
     }
     
     // Check stock
     if (currentStock && currentStock.quantity < 1) {
       showAlert("Product is out of stock", "destructive");
       return;
     }
     
     // Add to cart with correct variant IDs
     await createAddToCart({
       product_id: product.id,
       user_id: user.id,
       amount: 1,
       color_id: selectedColor?.id || null,  // ✅ Correct!
       size_id: selectedSize?.id || null,     // ✅ Correct!
     });
     
     showAlert("Added to cart successfully", "default");
   };
   ```

6. **Display Additional Metadata**
   ```typescript
   {product.article_number && (
     <p className="text-sm text-gray-600">Article #: {product.article_number}</p>
   )}
   
   {product.festival && (
     <p className="text-sm text-gray-600">Festival: {product.festival}</p>
   )}
   
   {product.season && (
     <p className="text-sm text-gray-600">Season: {product.season}</p>
   )}
   ```

**Mobile Responsiveness**: 🟡 Basic, needs testing

**Testing Checklist**:
- [ ] Colors display correctly
- [ ] Sizes display correctly
- [ ] Stock status updates when selecting variants
- [ ] Cannot add out-of-stock items to cart
- [ ] Image gallery works (all images)
- [ ] Cart items have correct `color_id` and `size_id`
- [ ] Mobile responsive

---

### 5. Settings / Profile Page ⭐

**Location**: `src/pages/landing/Settings.tsx`

**Route**: `/settings`

**Status**: ✅ **WELL IMPLEMENTED**

**Features**:
- ✅ Edit full name, email, phone, address
- ✅ Change password (basic validation)
- ✅ Upload avatar (Supabase Storage)
- ✅ Mobile responsive design
- ✅ Tabbed interface (Profile, Security)

**Minor Issues**:
- Password validation could be stricter (min length, complexity)
- No user feedback on successful save (only shows loading state)
- Minor mobile responsiveness improvement recommended:

```typescript
// Line 290 - Improve mobile max-height
<div className="space-y-6 max-h-[calc(100vh-20rem)] md:max-h-[65vh] overflow-y-auto pr-2">
```

**Overall**: This is one of the **best-implemented** customer-facing pages!

---

### 6. Checkout Page

**Location**: `src/pages/landing/Checkout.tsx`

**Route**: `/checkout`

**Status**: 🔴 **NON-FUNCTIONAL** (Uses Mock Data)

**Current Implementation**:
- 🟡 Cart items display (uses **mock data**)
- 🟡 Shipping address form (uses **mock data**)
- 🔴 Payment section (**commented out**)
- ❌ No integration with `AddToCartContext`
- ❌ No real order creation

**Mock Data Example**:

```typescript
// ❌ MOCK DATA
const [cartItems] = useState([
  { id: "1", name: "Product 1", price: 99.99, quantity: 2 },
  { id: "2", name: "Product 2", price: 49.99, quantity: 1 },
]);

const [shippingAddress] = useState({
  fullName: "John Doe",
  address: "123 Main St",
  // ...
});
```

**Required Fixes**:

1. **Integrate with AddToCartContext**
   ```typescript
   const { addToCarts, fetchAddToCarts } = useAddToCart();
   const { products } = useProduct();
   
   // Fetch cart items on load
   useEffect(() => {
     fetchAddToCarts();
   }, []);
   
   // Compute cart items with product details
   const cartItems = useMemo(() => {
     return addToCarts.map((cartItem) => {
       const product = products.find((p) => p.id === cartItem.product_id);
       const color = product?.product_colors?.find((c) => c.id === cartItem.color_id);
       const size = product?.product_sizes?.find((s) => s.id === cartItem.size_id);
       
       return {
         ...cartItem,
         product,
         color,
         size,
       };
     });
   }, [addToCarts, products]);
   ```

2. **Integrate with UserContext for Shipping Address**
   ```typescript
   const { currentUser } = useUser();
   
   const [shippingAddress, setShippingAddress] = useState({
     fullName: currentUser?.full_name || "",
     address: currentUser?.address || "",
     phone: currentUser?.phone || "",
     // ...
   });
   ```

3. **Implement Payment**
   - Uncomment payment section
   - Integrate payment gateway (Stripe, PayPal, etc.)
   - Handle payment success/failure

4. **Create Order on Checkout**
   ```typescript
   const { createOrderWithItemsAndStock } = useOrder();
   
   const handleCheckout = async () => {
     const orderData = {
       user_id: user.id,
       total_amount: calculateTotal(),
       shipping_address: JSON.stringify(shippingAddress),
       status: "pending",
     };
     
     const orderItems = cartItems.map((item) => ({
       product_id: item.product_id,
       color_id: item.color_id,
       size_id: item.size_id,
       quantity: item.amount,
       price: item.product.price,
     }));
     
     await createOrderWithItemsAndStock(orderData, orderItems);
     
     // Clear cart
     // Redirect to order confirmation
   };
   ```

**Mobile Responsiveness**: 🟡 Basic

**Priority**: 🔴 HIGH (blocking e-commerce functionality)

---

### 7. Order Detail Page

**Location**: `src/pages/landing/OrderDetail.tsx`

**Route**: `/order-detail/:id`

**Status**: 🟡 Basic Implementation

**Features**:
- ✅ Order information display
- ✅ Order items list
- ✅ Order status
- ✅ Shipping address

**Minor Issues**:
- Mobile responsiveness could be improved
- No order tracking information
- No "Cancel Order" functionality
- Limited status information

**Recommended Enhancements**:
1. Add order tracking (shipping updates)
2. Add "Cancel Order" button (for pending orders)
3. Display variant information (color/size) for order items
4. Add "Reorder" functionality
5. Improve mobile layout

**Mobile Responsiveness**: 🟡 Basic, could be improved

---

### 8. Orders Page (Customer)

**Location**: `src/pages/landing/Orders.tsx`

**Route**: **❌ NO ROUTE DEFINED**

**Status**: 🔴 **ORPHANED FILE**

**Features**:
- Order history list
- Order status filtering

**Issues**:
- **No route** defined in `App.tsx`
- Potentially duplicates admin `/orders` route
- Unclear if this is for customers or admin

**Recommendation**:
- **Add route**: `/my-orders` or `/orders`
- Clarify purpose (customer order history)
- Ensure it only shows current user's orders
- Or delete if not needed

---

### 9. Notifications Page

**Location**: `src/pages/landing/notifications.tsx`

**Route**: `/notifications` (likely defined)

**Status**: 🟡 Uses Mock Data

**Current Implementation**:
- Displays notification list (mock data)
- Basic UI for notifications

**Missing Features**:
- ❌ Database integration (no `NotificationContext`)
- ❌ Realtime updates
- ❌ "Mark as read" functionality
- ❌ Notification types (order updates, promotions, etc.)
- ❌ Push notifications

**Mock Data Example**:

```typescript
// ❌ MOCK DATA
const [notifications] = useState([
  { id: "1", title: "Order Shipped", message: "Your order #1234 has been shipped", read: false },
  // ...
]);
```

**Required Fixes**:

1. **Create NotificationContext**
   - Create `src/context/NotificationContext.tsx`
   - Set up database table for notifications
   - Implement CRUD operations
   - Set up realtime subscriptions

2. **Implement "Mark as Read"**
   ```typescript
   const markAsRead = async (notificationId: string) => {
     await updateNotification(notificationId, { read: true });
   };
   ```

3. **Add Notification Types**
   - Order status updates
   - Promotional notifications
   - Account updates
   - Low stock alerts (for wishlisted items)

**Mobile Responsiveness**: Unknown, needs testing

---

### 10. Wishlist Page

**Location**: `src/pages/landing/Wishlist.tsx`

**Route**: **❌ NO ROUTE DEFINED**

**Status**: 🔴 **ORPHANED FILE** (Uses Mock Data)

**Current Implementation**:
- Wishlist display (mock data)
- Add/remove from wishlist (mock functions)
- Well-designed UI

**Issues**:
- **No route** in `App.tsx`
- Uses mock data, no database integration
- No `WishlistContext`

**Mock Data Example**:

```typescript
// ❌ MOCK DATA
const [wishlistItems] = useState([
  { id: "1", productId: "prod-123", product: { /* ... */ } },
  // ...
]);
```

**Required Fixes**:

1. **Add Route**
   ```typescript
   // In App.tsx
   <Route path="/wishlist" element={<Wishlist />} />
   ```

2. **Create Wishlist Table**
   ```sql
   CREATE TABLE wishlist (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES user_details(id) ON DELETE CASCADE,
     product_id UUID REFERENCES products(id) ON DELETE CASCADE,
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, product_id)
   );
   ```

3. **Create WishlistContext**
   - CRUD operations for wishlist items
   - Realtime subscriptions

4. **Add Wishlist Button to Product Pages**
   - Heart icon to add/remove from wishlist
   - Show wishlist count in header

**Mobile Responsiveness**: Unknown, needs testing

---

## Cart Page

**Status**: ❌ **NOT IMPLEMENTED**

**Required Features**:
- Display cart items
- Update quantities
- Remove items
- Calculate total
- Proceed to checkout button
- Display variant information (color/size)
- Show stock availability
- Apply promo codes (if promotions implemented)

**Priority**: 🔴 HIGH (essential for e-commerce)

---

## Page Status Summary

| Page | Route | Status | Priority | Issues |
|------|-------|--------|----------|--------|
| Landing Page | `/` | ✅ | - | None |
| Login | `/login` | ✅ | - | None |
| Signup | `/signup` | ✅ | - | None |
| Product Details | `/product/:id` | 🔴 | **CRITICAL** | Missing variants, stock, images, hardcoded NULLs |
| Settings | `/settings` | ✅ | - | Minor improvements |
| Checkout | `/checkout` | 🔴 | HIGH | Mock data, no payment |
| Order Detail | `/order-detail/:id` | 🟡 | MEDIUM | Basic, needs enhancements |
| Orders (Customer) | ❌ No route | 🔴 | MEDIUM | No route defined |
| Notifications | `/notifications` | 🟡 | MEDIUM | Mock data, no backend |
| Wishlist | ❌ No route | 🔴 | LOW | No route, mock data |
| Cart | ❌ Not implemented | 🔴 | HIGH | Doesn't exist |

---

## Mobile Responsiveness Assessment

### ✅ Well Responsive
- **Settings Page**: Excellent mobile design
- **Login/Signup**: Good mobile experience

### 🟡 Needs Testing/Improvement
- **Product Details**: Basic responsive, needs testing with variants/gallery
- **Checkout**: Basic responsive
- **Order Detail**: Could be improved
- **Notifications**: Needs testing
- **Wishlist**: Needs testing

### ❌ Unknown/Not Tested
- **Landing Page**: Likely responsive, needs verification
- **Cart**: Doesn't exist

**Recommendation**: Conduct comprehensive mobile testing on all pages with real devices (iOS/Android).

---

## Missing Features

### Essential (Blocking E-commerce)
1. **Cart page** - Customers can't view/manage cart
2. **Product variant selection** - Can't select colors/sizes
3. **Stock validation** - Can add out-of-stock items
4. **Functional checkout** - Payment not integrated

### Important (UX Enhancement)
1. **Wishlist integration** - No backend, no route
2. **Order history** - No route for customers
3. **Notifications backend** - Uses mock data
4. **Password reset** - Not implemented

### Nice to Have
1. **Product reviews** - Not implemented
2. **Product search/filter** - Limited functionality
3. **Order tracking** - No shipping updates
4. **Promo code application** - Not implemented
5. **Recently viewed products** - Not implemented

---

## Comparison: Customer vs. Admin Product Display

### Admin Product Preview (`src/components/product/product.tsx`)
- ✅ Shows colors
- ✅ Shows sizes
- ✅ Shows article number
- ✅ Shows festival/season
- ✅ Shows all images
- ✅ Shows stock status

### Customer Product Details (`src/pages/landing/ProductDetails.tsx`)
- ❌ No colors
- ❌ No sizes
- ❌ No article number
- ❌ No festival/season
- ❌ Only first image
- ❌ No stock status

**Conclusion**: Admin component has ALL the features that customer page is missing!

---

## Recommended Implementation Order

### Phase 1: Critical Fixes (Week 1)
1. **Fix Product Details page** - Add variants, stock, images (Priority 1)
2. **Implement Cart page** - Essential for shopping (Priority 2)
3. **Fix Checkout page** - Remove mock data, integrate contexts (Priority 3)

### Phase 2: Essential Features (Week 2)
4. **Add Wishlist backend** - Create table, context, add route
5. **Add Orders route** - Customer order history
6. **Implement Notifications backend** - Create context, integrate

### Phase 3: Enhancements (Week 3)
7. **Improve Order Detail page** - Add tracking, cancel functionality
8. **Add Password Reset** - Complete auth flow
9. **Mobile Responsive Testing** - Test all pages on real devices

### Phase 4: Polish (Week 4)
10. **Product reviews** - Allow customer feedback
11. **Search/Filter** - Enhanced product discovery
12. **Promo codes** - If promotions module fixed

---

## Testing Checklist

### Product Details Page Testing
- [ ] Product loads correctly
- [ ] All images display in gallery
- [ ] Colors display and can be selected
- [ ] Sizes display and can be selected
- [ ] Stock status updates based on selected variant
- [ ] Cannot add out-of-stock items
- [ ] Add to cart passes correct `color_id` and `size_id`
- [ ] All metadata displayed (article #, festival, season)
- [ ] Mobile responsive
- [ ] Loading states work correctly
- [ ] Error handling works

### Checkout Page Testing
- [ ] Cart items load from `AddToCartContext`
- [ ] Correct product details displayed
- [ ] Variant information (color/size) shown
- [ ] Quantities can be updated
- [ ] Total calculates correctly
- [ ] Shipping address pre-fills from user profile
- [ ] Payment section works
- [ ] Order created successfully
- [ ] Stock decremented correctly
- [ ] Cart cleared after checkout
- [ ] Mobile responsive

---

## Next Steps

1. **Start with Product Details page** - Most critical issue
2. **Implement Cart page** - Essential missing feature
3. **Fix Checkout page** - Remove mock data
4. **Conduct mobile testing** - Verify responsiveness
5. **Add missing routes** - Wishlist, Orders
6. **Implement backend for mock data pages** - Notifications, Wishlist

---

**For detailed bug fixes**, see [CRITICAL_BUGS.md](./CRITICAL_BUGS.md).

