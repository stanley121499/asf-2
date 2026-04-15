# Testing Guide

**Last Updated**: January 6, 2026  
**Current Status**: ❌ No automated tests implemented

---

## Overview

Currently, the ASF-2 project has **no automated tests**. This document outlines a testing strategy and provides examples for implementing tests.

---

## Testing Strategy

### Testing Pyramid

```
        /\
       /  \
      / E2E \ (10%)  - End-to-end tests
     /------\
    /  Inte  \ (30%) - Integration tests
   /----------\
  /    Unit    \ (60%) - Unit tests
 /--------------\
```

**Recommended Distribution**:
- **60% Unit Tests** - Test individual functions, components
- **30% Integration Tests** - Test contexts, API interactions
- **10% E2E Tests** - Test critical user flows

---

## Testing Tools

### Recommended Stack

1. **Unit & Integration Tests**: [Vitest](https://vitest.dev/)
   - Fast, Vite-native
   - Jest-compatible API
   - Built-in code coverage

2. **Component Testing**: [React Testing Library](https://testing-library.com/react)
   - User-centric testing
   - Best practices enforced

3. **E2E Tests**: [Playwright](https://playwright.dev/)
   - Cross-browser testing
   - Reliable, fast
   - Visual regression testing

### Installation

```powershell
# Install Vitest and React Testing Library
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Install Playwright
npm install --save-dev @playwright/test

# Initialize Playwright
npx playwright install
```

---

## Configuration

### Vitest Config (`vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.types.ts",
        "**/*.config.ts",
      ],
    },
  },
});
```

### Test Setup (`src/test/setup.ts`)

```typescript
import "@testing-library/jest-dom";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

---

## Unit Tests

### Example 1: Testing Utility Functions

**File**: `src/utils/formatPrice.ts`

```typescript
/**
 * Formats a number as a price string
 * @param price - The price to format
 * @returns Formatted price string (e.g., "$99.99")
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}
```

**Test**: `src/utils/formatPrice.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { formatPrice } from "./formatPrice";

describe("formatPrice", () => {
  it("formats whole numbers with two decimal places", () => {
    expect(formatPrice(100)).toBe("$100.00");
  });

  it("formats decimal numbers correctly", () => {
    expect(formatPrice(99.99)).toBe("$99.99");
  });

  it("rounds to two decimal places", () => {
    expect(formatPrice(99.999)).toBe("$100.00");
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("handles negative numbers", () => {
    expect(formatPrice(-50)).toBe("$-50.00");
  });
});
```

---

### Example 2: Testing Type Guards

**File**: `src/utils/typeGuards.ts`

```typescript
export function isProduct(data: unknown): data is Product {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "name" in data &&
    "price" in data
  );
}
```

**Test**: `src/utils/typeGuards.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { isProduct } from "./typeGuards";

describe("isProduct", () => {
  it("returns true for valid product", () => {
    const product = {
      id: "123",
      name: "Test Product",
      price: 99.99,
    };
    expect(isProduct(product)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isProduct(null)).toBe(false);
  });

  it("returns false for missing id", () => {
    const invalid = { name: "Test", price: 99.99 };
    expect(isProduct(invalid)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(isProduct("not an object")).toBe(false);
    expect(isProduct(123)).toBe(false);
    expect(isProduct(undefined)).toBe(false);
  });
});
```

---

## Component Tests

### Example 1: Testing Presentational Component

**Component**: `src/components/ProductCard.tsx`

```typescript
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
  onAddToCart: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div data-testid="product-card">
      <img src={product.image_url} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price.toFixed(2)}</p>
      <button onClick={() => onAddToCart(product.id)}>
        Add to Cart
      </button>
    </div>
  );
}
```

**Test**: `src/components/ProductCard.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "./ProductCard";

describe("ProductCard", () => {
  const mockProduct = {
    id: "123",
    name: "Test Product",
    price: 99.99,
    image_url: "https://example.com/image.jpg",
  };

  it("renders product information", () => {
    render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByAltText("Test Product")).toHaveAttribute(
      "src",
      mockProduct.image_url
    );
  });

  it("calls onAddToCart with product ID when button clicked", async () => {
    const handleAddToCart = vi.fn();
    render(<ProductCard product={mockProduct} onAddToCart={handleAddToCart} />);

    const addButton = screen.getByRole("button", { name: /add to cart/i });
    await userEvent.click(addButton);

    expect(handleAddToCart).toHaveBeenCalledWith("123");
    expect(handleAddToCart).toHaveBeenCalledTimes(1);
  });
});
```

---

### Example 2: Testing Form Component

**Component**: `src/components/LoginForm.tsx`

**Test**: `src/components/LoginForm.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("validates required fields", async () => {
    render(<LoginForm onSubmit={() => {}} />);

    const submitButton = screen.getByRole("button", { name: /log in/i });
    await userEvent.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it("submits form with valid data", async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
    });
  });

  it("shows loading state during submission", async () => {
    const handleSubmit = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
    render(<LoginForm onSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

---

## Integration Tests (Context)

### Example: Testing ProductContext

**Test**: `src/context/product/ProductContext.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ProductProvider, useProduct } from "./ProductContext";
import { supabase } from "../../utils/supabaseClient";

// Mock Supabase
vi.mock("../../utils/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

describe("ProductContext", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("fetches products on mount", async () => {
    const mockProducts = [
      { id: "1", name: "Product 1", price: 99.99 },
      { id: "2", name: "Product 2", price: 49.99 },
    ];

    // Mock Supabase query
    const selectMock = vi.fn().mockResolvedValue({
      data: mockProducts,
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: selectMock,
    } as any);

    // Mock channel subscription
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    } as any);

    const { result } = renderHook(() => useProduct(), {
      wrapper: ProductProvider,
    });

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for products to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
  });

  it("creates a new product", async () => {
    const newProduct = { name: "New Product", price: 79.99 };
    const createdProduct = { id: "3", ...newProduct };

    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: createdProduct,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any);

    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    } as any);

    const { result } = renderHook(() => useProduct(), {
      wrapper: ProductProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Create product
    await result.current.createProduct(newProduct, [], [], []);

    expect(insertMock).toHaveBeenCalledWith(newProduct);
  });

  it("handles fetch errors gracefully", async () => {
    const errorMessage = "Database connection failed";

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      }),
    } as any);

    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    } as any);

    const { result } = renderHook(() => useProduct(), {
      wrapper: ProductProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual([]);
  });
});
```

---

## E2E Tests (Playwright)

### Example 1: User Authentication Flow

**Test**: `e2e/auth.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("user can sign up", async ({ page }) => {
    await page.goto("/signup");

    // Fill signup form
    await page.fill('input[name="email"]', "newuser@example.com");
    await page.fill('input[name="password"]', "SecurePassword123!");
    await page.fill('input[name="full_name"]', "Test User");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard or success message
    await expect(page).toHaveURL(/\/(dashboard|home)/);
    await expect(page.locator("text=Welcome")).toBeVisible();
  });

  test("user can log in", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "user@example.com");
    await page.fill('input[name="password"]', "password123");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/(dashboard|home)/);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "invalid@example.com");
    await page.fill('input[name="password"]', "wrongpassword");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=/Invalid credentials/i")).toBeVisible();
  });
});
```

---

### Example 2: Product Purchase Flow

**Test**: `e2e/purchase.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Product Purchase Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill('input[name="email"]', "user@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|home)/);
  });

  test("user can purchase a product", async ({ page }) => {
    // Navigate to product
    await page.goto("/product/test-product-id");

    // Select color
    await page.click('button:has-text("Red")');

    // Select size
    await page.click('button:has-text("M")');

    // Verify stock is available
    await expect(page.locator("text=/In Stock/i")).toBeVisible();

    // Add to cart
    await page.click('button:has-text("Add to Cart")');

    // Verify success message
    await expect(page.locator("text=/Added to cart/i")).toBeVisible();

    // Go to cart (assuming cart page exists)
    await page.goto("/cart");

    // Verify product in cart
    await expect(page.locator("text=/Test Product/i")).toBeVisible();
    await expect(page.locator("text=/Red/i")).toBeVisible();
    await expect(page.locator("text=/M/i")).toBeVisible();

    // Proceed to checkout
    await page.click('button:has-text("Checkout")');

    // Fill shipping address
    await page.fill('input[name="address"]', "123 Main St");
    await page.fill('input[name="city"]', "New York");
    await page.fill('input[name="zip"]', "10001");

    // Submit order
    await page.click('button:has-text("Place Order")');

    // Verify order confirmation
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator("text=/Order placed successfully/i")).toBeVisible();
  });

  test("cannot add out-of-stock product to cart", async ({ page }) => {
    await page.goto("/product/out-of-stock-product-id");

    await page.click('button:has-text("Blue")');
    await page.click('button:has-text("L")');

    await expect(page.locator("text=/Out of Stock/i")).toBeVisible();

    const addToCartButton = page.locator('button:has-text("Add to Cart")');
    await expect(addToCartButton).toBeDisabled();
  });
});
```

---

## Test Coverage Goals

### Minimum Coverage Targets

- **Overall**: 70%
- **Critical Paths**: 90%
  - Authentication
  - Product purchase flow
  - Order creation
  - Stock management
- **Contexts**: 80%
- **Utility Functions**: 90%
- **Components**: 70%

### Running Coverage Reports

```powershell
# Run tests with coverage
npm run test:coverage

# Open coverage report
start coverage/index.html
```

---

## Continuous Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`)

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Run unit tests
        run: npm run test

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Testing Checklist

### Before Writing Tests
- [ ] Understand the feature/function to test
- [ ] Identify edge cases
- [ ] Determine test type (unit/integration/E2E)

### While Writing Tests
- [ ] Write descriptive test names
- [ ] Test happy path
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Mock external dependencies (Supabase, APIs)
- [ ] Keep tests independent (no shared state)

### After Writing Tests
- [ ] All tests pass
- [ ] Coverage meets targets
- [ ] Tests are readable and maintainable
- [ ] Tests run quickly (<5s for unit tests)

---

## Best Practices

### Do's
- ✅ Write tests before fixing bugs (TDD)
- ✅ Test user behavior, not implementation details
- ✅ Use descriptive test names
- ✅ Keep tests simple and focused
- ✅ Mock external dependencies
- ✅ Test edge cases and error handling

### Don'ts
- ❌ Don't test implementation details
- ❌ Don't share state between tests
- ❌ Don't make tests depend on each other
- ❌ Don't test library code (React, Supabase, etc.)
- ❌ Don't write tests that are flaky
- ❌ Don't skip cleanup

---

## Next Steps

1. **Install Testing Tools** (Vitest, React Testing Library, Playwright)
2. **Configure Tests** (vitest.config.ts, setup files)
3. **Start with High-Priority Tests**:
   - ProductContext (used throughout app)
   - AddToCartContext (critical for e-commerce)
   - Authentication flow (critical for security)
4. **Add Tests Incrementally** (aim for 10% increase per week)
5. **Integrate with CI/CD** (run tests on every PR)

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Goal**: Reach 70% test coverage within 2-3 months to ensure code quality and prevent regressions.


