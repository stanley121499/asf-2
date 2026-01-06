# Development Guide

**Last Updated**: January 6, 2026  
**Target Audience**: Developers working on ASF-2

---

## Coding Standards

### TypeScript Standards

#### 1. Strict Type Safety

**RULE**: Use strict TypeScript notation, define new types as necessary

```typescript
// ❌ BAD: Using 'any'
function processData(data: any) {
  return data.value;
}

// ✅ GOOD: Define proper types
interface DataObject {
  value: string;
  id: number;
}

function processData(data: DataObject): string {
  return data.value;
}
```

#### 2. No 'any' Type

**RULE**: Never use the `any` type

```typescript
// ❌ BAD
const items: any[] = fetchItems();

// ✅ GOOD
interface Item {
  id: string;
  name: string;
}

const items: Item[] = fetchItems();
```

#### 3. No Non-Null Assertion Operator

**RULE**: Do not use the non-null assertion operator (`!`)

```typescript
// ❌ BAD
const user = users.find((u) => u.id === userId)!;
console.log(user.name); // Can crash if user is undefined

// ✅ GOOD
const user = users.find((u) => u.id === userId);
if (user) {
  console.log(user.name);
} else {
  console.error("User not found");
}

// ✅ ALSO GOOD: Use optional chaining
const userName = users.find((u) => u.id === userId)?.name;
```

#### 4. No Casting to Unknown

**RULE**: Do not cast to `unknown` (e.g., `as unknown as T`)

```typescript
// ❌ BAD
const data = response as unknown as UserData;

// ✅ GOOD: Use type guards
function isUserData(data: unknown): data is UserData {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "name" in data
  );
}

if (isUserData(response)) {
  const data = response;
}
```

---

### String Standards

#### 1. Use Double Quotes

**RULE**: Use double quotes (`"`) for strings

```typescript
// ❌ BAD
const message = 'Hello, world!';

// ✅ GOOD
const message = "Hello, world!";
```

#### 2. Use Template Literals for Concatenation

**RULE**: Use template literals or `.join()` instead of operational concatenation

```typescript
// ❌ BAD
const fullName = firstName + " " + lastName;
const url = baseUrl + "/api/" + endpoint;

// ✅ GOOD: Template literals
const fullName = `${firstName} ${lastName}`;
const url = `${baseUrl}/api/${endpoint}`;

// ✅ ALSO GOOD: .join() for arrays
const path = ["api", "v1", "users", userId].join("/");
```

---

### Code Completeness

#### 1. No Placeholders

**RULE**: Generate full code, no placeholders

```typescript
// ❌ BAD
function createProduct(data: ProductData) {
  // TODO: Implement this
  // ...
}

// ✅ GOOD
function createProduct(data: ProductData): Promise<Product> {
  return supabase
    .from("products")
    .insert(data)
    .select()
    .single();
}
```

#### 2. If Unable to Complete, Explain in Comments

```typescript
/**
 * Creates a new product with variants
 * 
 * @param data - Product data
 * @param colors - Array of color strings
 * @param sizes - Array of size strings
 * @returns Created product with variants
 * 
 * NOTE: This function currently has a bug where colors and sizes are created
 * using forEach(async), which doesn't wait for completion. See CRITICAL_BUGS.md
 * for the fix: Use Promise.all(colors.map(async ...)) instead.
 */
function createProductWithVariants(
  data: ProductData,
  colors: string[],
  sizes: string[]
): Promise<Product> {
  // Implementation with detailed comments explaining the bug
}
```

---

### Comments & Documentation

#### 1. JSDoc Headers

**RULE**: Include clear JSDoc headers for functions

```typescript
/**
 * Fetches all products from the database with related data
 * 
 * @param filters - Optional filters to apply
 * @param filters.active - Filter by active status
 * @param filters.brandId - Filter by brand ID
 * @returns Promise resolving to array of products with categories, colors, sizes
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * const products = await fetchProducts({ active: true, brandId: "brand-123" });
 * ```
 */
async function fetchProducts(filters?: {
  active?: boolean;
  brandId?: string;
}): Promise<Product[]> {
  // Implementation
}
```

#### 2. Inline Comments

**RULE**: Include clear inline comments describing each step

```typescript
async function createOrderWithItemsAndStock(
  orderData: OrderData,
  items: OrderItem[]
): Promise<Order> {
  // Step 1: Create the order record
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderData)
    .select()
    .single();
  
  if (orderError) throw orderError;
  
  // Step 2: Create order items
  const orderItemsWithOrderId = items.map((item) => ({
    ...item,
    order_id: order.id,
  }));
  
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsWithOrderId);
  
  if (itemsError) {
    // Rollback: Delete the order if items creation fails
    await supabase.from("orders").delete().eq("id", order.id);
    throw itemsError;
  }
  
  // Step 3: Decrement stock for each item
  for (const item of items) {
    // Query stock record by product_id, color_id, size_id
    const { data: stockRecord, error: stockError } = await supabase
      .from("product_stock")
      .select("*")
      .eq("product_id", item.product_id)
      .eq("color_id", item.color_id || null)
      .eq("size_id", item.size_id || null)
      .single();
    
    if (stockError) throw stockError;
    
    // Check if sufficient stock available
    if (stockRecord.quantity < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.product_id}`);
    }
    
    // Decrement stock quantity
    const { error: updateError } = await supabase
      .from("product_stock")
      .update({ quantity: stockRecord.quantity - item.quantity })
      .eq("id", stockRecord.id);
    
    if (updateError) throw updateError;
  }
  
  return order;
}
```

---

### Error Handling

#### 1. Implement Error Checking

**RULE**: Implement error checking and validation

```typescript
// ❌ BAD: No error handling
async function updateProduct(id: string, data: ProductData) {
  const { data: product } = await supabase
    .from("products")
    .update(data)
    .eq("id", id);
  
  return product;
}

// ✅ GOOD: Comprehensive error handling
async function updateProduct(id: string, data: ProductData): Promise<Product> {
  // Validation
  if (!id) {
    throw new Error("Product ID is required");
  }
  
  if (!data || Object.keys(data).length === 0) {
    throw new Error("No data provided for update");
  }
  
  // Update with error handling
  const { data: product, error } = await supabase
    .from("products")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Failed to update product:", error);
    throw new Error(`Failed to update product: ${error.message}`);
  }
  
  if (!product) {
    throw new Error(`Product with ID ${id} not found`);
  }
  
  return product;
}
```

#### 2. Type Validation

```typescript
/**
 * Validates product data before creation
 * 
 * @param data - Product data to validate
 * @throws Error if validation fails
 */
function validateProductData(data: unknown): asserts data is ProductData {
  if (typeof data !== "object" || data === null) {
    throw new Error("Product data must be an object");
  }
  
  const product = data as Record<string, unknown>;
  
  if (typeof product.name !== "string" || product.name.trim().length === 0) {
    throw new Error("Product name is required and must be a non-empty string");
  }
  
  if (typeof product.price !== "number" || product.price <= 0) {
    throw new Error("Product price must be a positive number");
  }
  
  // Additional validations...
}

// Usage
function createProduct(data: unknown): Promise<Product> {
  validateProductData(data); // Now TypeScript knows data is ProductData
  return supabase.from("products").insert(data).select().single();
}
```

---

## Project-Specific Guidelines

### Context Provider Pattern

When creating a new context:

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { supabase } from "../utils/supabaseClient";

// 1. Define types
interface Item {
  id: string;
  name: string;
  created_at: string;
}

interface ItemContextState {
  items: Item[];
  loading: boolean;
}

interface ItemContextProps extends ItemContextState {
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<Item, "id" | "created_at">) => Promise<void>;
  updateItem: (id: string, data: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

// 2. Create context with undefined default
const ItemContext = createContext<ItemContextProps | undefined>(undefined);

// 3. Provider component
export const ItemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // 4. Fetch function with useCallback
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("items").select("*");
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 5. CRUD functions with useCallback
  const createItem = useCallback(async (data: Omit<Item, "id" | "created_at">) => {
    try {
      const { error } = await supabase.from("items").insert(data);
      if (error) throw error;
      // Success handled by realtime subscription
    } catch (error) {
      console.error("Failed to create item:", error);
      throw error;
    }
  }, []);

  const updateItem = useCallback(async (id: string, data: Partial<Item>) => {
    try {
      const { error } = await supabase.from("items").update(data).eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("Failed to update item:", error);
      throw error;
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("Failed to delete item:", error);
      throw error;
    }
  }, []);

  // 6. Initial fetch and realtime subscription
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await fetchItems();
    };

    initialize();

    // Set up realtime subscription
    const subscription = supabase
      .channel("items")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "items" }, (payload) => {
        if (isMounted) {
          setItems((prev) => [...prev, payload.new as Item]);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "items" }, (payload) => {
        if (isMounted) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === payload.new.id ? { ...item, ...(payload.new as Item) } : item
            )
          );
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "items" }, (payload) => {
        if (isMounted) {
          setItems((prev) => prev.filter((item) => item.id !== payload.old.id));
        }
      })
      .subscribe();

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchItems]);

  // 7. Memoize context value
  const value = useMemo<ItemContextProps>(
    () => ({
      items,
      loading,
      fetchItems,
      createItem,
      updateItem,
      deleteItem,
    }),
    [items, loading, fetchItems, createItem, updateItem, deleteItem]
  );

  return <ItemContext.Provider value={value}>{children}</ItemContext.Provider>;
};

// 8. Custom hook with error handling
export const useItem = (): ItemContextProps => {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error("useItem must be used within an ItemProvider");
  }
  return context;
};
```

---

### Async Operations in Loops

**CRITICAL RULE**: Never use `forEach` with `async/await`

```typescript
// ❌ BAD: forEach doesn't wait
colors.forEach(async (color) => {
  await createProductColor({ product_id: productId, color });
});

// ✅ GOOD: Use Promise.all with map
await Promise.all(
  colors.map((color) =>
    createProductColor({ product_id: productId, color })
  )
);

// ✅ ALSO GOOD: For sequential operations (when order matters)
for (const color of colors) {
  await createProductColor({ product_id: productId, color });
}
```

---

### React Hooks Best Practices

#### 1. useMemo for Expensive Computations

```typescript
// ✅ GOOD
const filteredProducts = useMemo(() => {
  return products
    .filter((p) => p.active && p.price > 0)
    .sort((a, b) => b.price - a.price);
}, [products]);
```

#### 2. useCallback for Functions

```typescript
// ✅ GOOD
const handleSubmit = useCallback(
  async (data: FormData) => {
    await createProduct(data);
    showAlert("Product created successfully", "default");
  },
  [createProduct, showAlert]
);
```

#### 3. useEffect Cleanup

```typescript
// ✅ GOOD
useEffect(() => {
  let isMounted = true;

  const fetchData = async () => {
    const data = await fetch("/api/data");
    if (isMounted) {
      setData(data);
    }
  };

  fetchData();

  return () => {
    isMounted = false;
  };
}, []);
```

---

## Git Workflow

### Branch Naming

```
feature/product-variant-selection
bugfix/cart-null-variants
hotfix/checkout-crash
refactor/context-memoization
```

### Commit Messages

**Format**: `type(scope): message`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(products): add color and size selection to product details page
fix(cart): pass variant IDs instead of null when adding to cart
refactor(contexts): add memoization to all context providers
docs(readme): update setup instructions
```

### Pull Request Process

1. **Create feature branch** from `main`
   ```powershell
   git checkout -b feature/my-feature
   ```

2. **Make changes** and commit frequently

3. **Push to remote**
   ```powershell
   git push origin feature/my-feature
   ```

4. **Create Pull Request**
   - Describe what was changed and why
   - Reference related issues
   - Add screenshots if UI changes

5. **Code Review**
   - Address reviewer comments
   - Make requested changes

6. **Merge** (after approval)
   - **DO NOT** force push to `main`
   - **DO NOT** skip hooks (`--no-verify`)

7. **Delete branch** after merge

---

## Testing Guidelines

### Manual Testing Checklist

Before submitting a PR:

- [ ] Code runs without errors
- [ ] No console errors or warnings
- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Mobile responsive (if applicable)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Performance acceptable (no lag)
- [ ] TypeScript compiles without errors
- [ ] Linter passes

---

## Performance Considerations

### Do's
- ✅ Use `useMemo` for expensive computations
- ✅ Use `useCallback` for functions passed as props
- ✅ Lazy load routes and components
- ✅ Optimize images (WebP, compression)
- ✅ Use pagination for large datasets
- ✅ Implement debouncing for search/filter

### Don'ts
- ❌ Don't create unnecessary re-renders
- ❌ Don't use inline functions in JSX (if passed as props)
- ❌ Don't forget to cleanup subscriptions/timers
- ❌ Don't load all data at once (use pagination)
- ❌ Don't use nested `.map()` without memoization

---

## Security Best Practices

### Do's
- ✅ Validate all user inputs
- ✅ Sanitize data before displaying
- ✅ Use Supabase RLS policies
- ✅ Store secrets in environment variables
- ✅ Use HTTPS in production
- ✅ Implement rate limiting

### Don'ts
- ❌ Don't commit `.env` files
- ❌ Don't trust client-side validation alone
- ❌ Don't expose API keys in code
- ❌ Don't store sensitive data in localStorage
- ❌ Don't allow SQL injection (use parameterized queries)

---

## Code Review Checklist

### For Reviewers

- [ ] Code follows TypeScript standards (no `any`, no `!`, no `as unknown`)
- [ ] Code uses double quotes for strings
- [ ] Code uses template literals for concatenation
- [ ] Functions have JSDoc headers
- [ ] Code has inline comments
- [ ] Error handling implemented
- [ ] Type validation implemented
- [ ] No `forEach(async)` bugs
- [ ] `useEffect` dependencies correct
- [ ] Functions memoized with `useCallback`
- [ ] Values memoized with `useMemo`
- [ ] No performance issues
- [ ] Code is readable and maintainable
- [ ] Tests pass (if applicable)

---

## Common Pitfalls to Avoid

### 1. Missing Dependencies in useEffect

```typescript
// ❌ BAD
useEffect(() => {
  fetchProducts(filters);
}, []); // filters not in dependencies!

// ✅ GOOD
useEffect(() => {
  fetchProducts(filters);
}, [filters, fetchProducts]);
```

### 2. Not Cleaning Up Subscriptions

```typescript
// ❌ BAD
useEffect(() => {
  const subscription = supabase
    .channel("products")
    .on("postgres_changes", handleChange)
    .subscribe();
  
  // No cleanup!
}, []);

// ✅ GOOD
useEffect(() => {
  const subscription = supabase
    .channel("products")
    .on("postgres_changes", handleChange)
    .subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 3. Mutating State Directly

```typescript
// ❌ BAD
products.push(newProduct);
setProducts(products);

// ✅ GOOD
setProducts([...products, newProduct]);
```

---

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## Questions?

If you encounter issues or have questions:
1. Check [CRITICAL_BUGS.md](./CRITICAL_BUGS.md) for known issues
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Check [FEATURES.md](./FEATURES.md) for feature status
4. Ask team members for clarification

---

**Happy Coding!** 🎉

