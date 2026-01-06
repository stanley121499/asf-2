# System Architecture

## Overview

ASF-2 is a full-stack e-commerce and social media management platform with separate admin and customer-facing interfaces. The application uses a **Context-heavy architecture** with React Context API for state management.

---

## Technology Stack

### Frontend

- **Framework**: React 18.3.1 with TypeScript 5.6.2
- **Build Tool**: Vite 5.4.2
- **Routing**: React Router DOM 6.26.2
- **Styling**: Tailwind CSS 3.4.11
- **Icons**: Lucide React 0.441.0
- **UI Components**: Custom components with Tailwind
- **State Management**: React Context API (35+ providers)

### Backend

- **BaaS**: Supabase
  - PostgreSQL database
  - Authentication & Authorization
  - File Storage
  - Realtime subscriptions
- **Supabase Client**: @supabase/supabase-js 2.45.4

### Development Tools

- **Linting**: ESLint 9.9.1
- **Type Checking**: TypeScript with strict mode
- **Package Manager**: npm

---

## Project Structure

```
asf-2/
├── public/                    # Static assets
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── product/         # Product display components
│   │   ├── ui/              # Generic UI components
│   │   └── ...
│   ├── context/             # React Context providers (35+ contexts)
│   │   ├── product/         # Product-related contexts
│   │   ├── post/            # Post-related contexts
│   │   ├── community/       # Community-related contexts
│   │   └── ...
│   ├── pages/               # Page components (routes)
│   │   ├── landing/         # Customer-facing pages
│   │   ├── products/        # Admin product management
│   │   ├── posts/           # Admin post management
│   │   ├── orders/          # Order management
│   │   ├── stock/           # Stock management
│   │   ├── promotions/      # Promotions (BROKEN)
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript type definitions
│   ├── supabaseClient.ts    # Supabase client configuration
│   ├── database.types.ts    # Auto-generated Supabase types
│   ├── App.tsx              # Root component with ALL providers
│   └── main.tsx             # Application entry point
├── docs/                    # Project documentation (this folder)
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── vite.config.ts           # Vite configuration
```

---

## Architecture Patterns

### 1. Context Provider Architecture

**Location**: `src/App.tsx`

The application uses a **ProviderComposer** pattern to wrap the entire app with 35+ context providers:

```typescript
<ProviderComposer
  providers={[
    ProductPurchaseOrderProvider,
    ProductReportProvider,
    AuthProvider,
    PointsMembershipProvider,
    UserProvider,
    PostProvider,
    PostFolderProvider,
    PostFolderMediaProvider,
    PostMediaProvider,
    BrandProvider,
    DepartmentProvider,
    RangeProvider,
    CategoryProvider,
    ProductProvider,
    ProductCategoryProvider,
    ProductSizeProvider,
    ProductColorProvider,
    ProductMediaProvider,
    ProductFolderProvider,
    ProductFolderMediaProvider,
    ProductEventProvider,
    ProductStockLogProvider,
    ProductStockProvider,
    AddToCartLogProvider,
    AddToCartProvider,
    OrderProvider,
    PaymentProvider,
    HomePageElementProvider,
    CommunityProvider,
    GroupProvider,
    ConversationParticipantProvider,
    TicketProvider,
    TicketStatusLogProvider,
    ConversationProvider,
  ]}>
  {/* App content */}
</ProviderComposer>
```

**⚠️ CRITICAL ISSUE**: This architecture causes **massive re-rendering problems**. See [PERFORMANCE_ISSUES.md](./PERFORMANCE_ISSUES.md) for details.

### 2. Realtime Subscription Pattern

Most contexts use Supabase's realtime subscriptions to keep data in sync:

```typescript
const subscription = supabase
  .channel("products")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "products" }, (payload) => {
    // Handle new product
  })
  .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, (payload) => {
    // Handle product update
  })
  .on("postgres_changes", { event: "DELETE", schema: "public", table: "products" }, (payload) => {
    // Handle product deletion
  })
  .subscribe();
```

**⚠️ ISSUE**: Subscription handlers iterate through entire arrays, causing performance problems.

### 3. Data Flow

```
Database (Supabase)
    ↓
Context Providers (Realtime subscriptions)
    ↓
React Components (useContext hooks)
    ↓
UI Updates
```

**Alternative flow** (for mutations):

```
User Action
    ↓
Component calls Context function
    ↓
Context function makes Supabase API call
    ↓
Supabase updates database
    ↓
Realtime subscription triggers
    ↓
Context updates state
    ↓
UI re-renders
```

---

## Routing Architecture

### Admin Routes (Protected)

```typescript
/products              → Product list
/products/folders      → Product folders
/products/stock        → Stock management
/products/create       → Create product
/products/schedule     → Schedule product
/posts                 → Post list
/posts/folders         → Post folders
/posts/create          → Create post
/posts/schedule        → Schedule post
/orders                → Order management
/promotions            → Promotions (BROKEN)
/categories-v2         → Category management (uses localStorage!)
```

### Customer Routes (Public)

```typescript
/                      → Landing page
/login                 → Login page
/signup                → Signup page
/product/:id           → Product detail page (INCOMPLETE)
/checkout              → Checkout (uses mock data)
/settings              → User settings (✅ well implemented)
/order-detail/:id      → Order detail page
/notifications         → Notifications (uses mock data)
```

**⚠️ MISSING ROUTES**:
- `/wishlist` - Component exists but no route defined
- `/orders` (customer-facing) - Component exists but no route defined

---

## Authentication Flow

1. User logs in via `src/pages/landing/LoginPage.tsx`
2. `AuthContext` handles Supabase authentication
3. Session stored in Supabase Auth
4. Protected routes check authentication status
5. `UserContext` loads user profile data

**Location**: `src/context/AuthContext.tsx`, `src/context/UserContext.tsx`

---

## State Management Strategy

### Context Responsibilities

Each context is responsible for:
- Fetching data from Supabase
- Setting up realtime subscriptions
- Providing CRUD functions
- Managing loading and error states
- Showing alerts (via `showAlert` from `AlertContext`)

### Context Dependencies

⚠️ **PROBLEM**: Many contexts depend on each other, creating a dependency web:

```
ProductContext
    ↓ depends on
ProductColorContext, ProductSizeContext, ProductCategoryContext
    ↓ depends on
CategoryContext, BrandContext, DepartmentContext, RangeContext
```

**Result**: Changing one context can trigger cascading re-renders.

---

## Database Integration

### Supabase Client

**Location**: `src/supabaseClient.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### Type Generation

Types are auto-generated from the Supabase database schema:

```bash
npx supabase gen types typescript --project-id <project-id> > src/database.types.ts
```

**Location**: `src/database.types.ts` (see [DATABASE.md](./DATABASE.md) for schema details)

---

## Component Architecture

### Admin Components

- **List Views**: Display data in grids/tables
- **Editors**: Forms for creating/updating entities
- **Modals**: Overlay forms for quick actions
- **Folders**: Hierarchical organization of products/posts

### Customer Components

- **Product Display**: Cards, details, galleries
- **Cart & Checkout**: Shopping flow
- **Account Pages**: Settings, orders, notifications
- **Landing Pages**: Home, product listings

---

## File Upload Strategy

Uses Supabase Storage:

1. User selects file
2. File uploaded to Supabase Storage bucket
3. Public URL generated
4. URL stored in database (e.g., `product_media.media_url`)

**Storage Buckets**:
- Product media
- Post media
- User avatars

---

## Error Handling

### Current Approach

```typescript
try {
  const { data, error } = await supabase.from("products").select();
  if (error) throw error;
  // Process data
} catch (error) {
  console.error(error);
  showAlert("Error message", "destructive");
}
```

**⚠️ ISSUE**: Inconsistent error handling across contexts. Some errors are caught, others are not.

---

## Performance Considerations

### Current Issues

1. **35+ Context Providers** wrapping entire app
2. **No lazy loading** of contexts
3. **No memoization** of context values
4. **Inefficient realtime subscription handlers**
5. **useEffect dependency hell**

**See**: [PERFORMANCE_ISSUES.md](./PERFORMANCE_ISSUES.md) for detailed analysis and fixes.

---

## Security

### Row Level Security (RLS)

Supabase RLS policies enforce:
- Users can only access their own data
- Admin roles for product/post management
- Public read access for products

### Environment Variables

**Required** (`.env`):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**⚠️ SECURITY**: Never commit `.env` file to version control.

---

## Build & Deployment

### Development

```bash
npm run dev
```

Runs on `http://localhost:5173` (default Vite port)

### Production Build

```bash
npm run build
```

Outputs to `dist/` folder

### Preview Production Build

```bash
npm run preview
```

**See**: [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

---

## Third-Party Integrations

### Current Integrations

- **Supabase**: Database, auth, storage, realtime
- **Lucide React**: Icon library

### Planned/Missing Integrations

- Payment gateway (checkout currently uses mock data)
- Email service (for order confirmations, notifications)
- Analytics (no tracking implemented)

---

## Scalability Concerns

### Current Limitations

1. **All data loaded upfront**: No pagination
2. **No caching strategy**: Every navigation re-fetches
3. **No CDN**: Static assets served from origin
4. **No code splitting**: Entire bundle loaded at once

### Recommendations

1. Implement pagination for lists
2. Add React Query for caching
3. Use CDN for static assets
4. Lazy load routes and contexts
5. Optimize images (WebP, responsive images)

---

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features used
- No IE11 support

---

## Accessibility

**Current Status**: ⚠️ Limited accessibility features

**Issues**:
- No ARIA labels
- Keyboard navigation not fully implemented
- No screen reader testing

**Recommendations**: Conduct accessibility audit and implement WCAG 2.1 AA standards.

---

## Testing

**Current Status**: 🔴 No tests implemented

**Missing**:
- Unit tests
- Integration tests
- E2E tests

**See**: [TESTING_GUIDE.md](./TESTING_GUIDE.md) for testing strategy.

---

## Next Steps

1. **Fix critical performance issues** (see [PERFORMANCE_ISSUES.md](./PERFORMANCE_ISSUES.md))
2. **Complete customer-facing pages** (see [CUSTOMER_FACING.md](./CUSTOMER_FACING.md))
3. **Fix promotions module** (see [FEATURES.md](./FEATURES.md))
4. **Implement testing** (see [TESTING_GUIDE.md](./TESTING_GUIDE.md))
5. **Optimize build and deployment** (see [DEPLOYMENT.md](./DEPLOYMENT.md))

