# Database Schema Documentation

**Database**: PostgreSQL (Supabase)  
**Last Updated**: January 6, 2026  
**Type Definitions**: `database.types.ts` (auto-generated)

---

## Overview

The database consists of **42 tables** organized into the following modules:
- Products & Inventory (15 tables)
- Orders & Payments (6 tables)
- Social Media Posts (4 tables)
- Community & Messaging (4 tables)
- Users & Membership (4 tables)
- Support/Ticketing (2 tables)
- Promotions (4 tables)
- Miscellaneous (3 tables)

---

## Database Entity Relationship Diagram

```
Users (user_details)
    ├── Orders (orders)
    │   ├── Order Items (order_items) → Products
    │   └── Payments (payments)
    ├── Cart (add_to_carts) → Products, Colors, Sizes
    ├── User Points (user_points)
    └── Conversations (conversation_participants)

Products (products)
    ├── Product Colors (product_colors)
    ├── Product Sizes (product_sizes)
    ├── Product Media (product_medias)
    ├── Product Categories (product_categories) → Categories
    ├── Product Stock (product_stock) → Colors, Sizes
    ├── Product Events (product_events)
    ├── Product Folders (product_folders)
    └── Product Folder Media (product_folder_medias)

Categories (categories)
    ├── Brand (brand)
    ├── Department (departments)
    └── Range (ranges)

Posts (posts)
    ├── Post Media (post_medias)
    ├── Post Folders (post_folders)
    └── Post Folder Media (post_folder_medias)

Promotions (promotions)
    ├── Promotion Products (promotion_product)
    ├── Promotion Folders (promotion_folders)
    └── Promotion Folder Media (promotion_folder_medias)

Communities (communities)
    └── Groups (groups)

Conversations (conversations)
    ├── Conversation Participants (conversation_participants)
    └── Chat Messages (chat_messages)

Tickets (tickets)
    └── Ticket Status Logs (ticket_status_change_logs)
```

---

## Table Schemas

### 1. Products Module

#### 1.1 `products` (Main Product Table)

**Purpose**: Core product information

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `name` | TEXT | NO | Product name |
| `description` | TEXT | YES | Product description |
| `price` | NUMERIC | NO | Product price |
| `article_number` | TEXT | YES | SKU/article number |
| `active` | BOOLEAN | NO | Product visibility |
| `brand_id` | UUID | YES | FK to `brand.id` |
| `department_id` | UUID | YES | FK to `departments.id` |
| `range_id` | UUID | YES | FK to `ranges.id` |
| `festival` | TEXT | YES | Festival/occasion |
| `season` | TEXT | YES | Season (Spring/Summer/Fall/Winter) |
| `product_folder_id` | UUID | YES | FK to `product_folders.id` |
| `created_at` | TIMESTAMP | NO | Creation timestamp |
| `updated_at` | TIMESTAMP | YES | Last update timestamp |

**Relationships**:
- `brand` → brand(id)
- `department_id` → departments(id)
- `range_id` → ranges(id)
- `product_folder_id` → product_folders(id)

**Indexes**: Likely on `active`, `brand_id`, `department_id`, `created_at`

---

#### 1.2 `product_colors`

**Purpose**: Product color variants (flexible system)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `product_id` | UUID | NO | FK to `products.id` |
| `color` | TEXT | NO | Color name (free text!) |
| `active` | BOOLEAN | NO | Color availability |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

**Relationships**:
- `product_id` → products(id) [CASCADE DELETE]

**Key Feature**: `color` is **free text**, allowing complete flexibility in color names.

---

#### 1.3 `product_sizes`

**Purpose**: Product size variants (flexible system)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `product_id` | UUID | NO | FK to `products.id` |
| `size` | TEXT | NO | Size name (free text!) |
| `active` | BOOLEAN | NO | Size availability |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

**Relationships**:
- `product_id` → products(id) [CASCADE DELETE]

**Key Feature**: `size` is **free text**, supporting any size system (S/M/L, EU sizes, numeric, etc.).

---

#### 1.4 `product_stock` ⭐ CRITICAL TABLE

**Purpose**: Track inventory at the **variant level** (product + color + size)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `product_id` | UUID | NO | FK to `products.id` |
| `color_id` | UUID | YES | FK to `product_colors.id` |
| `size_id` | UUID | YES | FK to `product_sizes.id` |
| `quantity` | INTEGER | NO | Stock quantity |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

**Relationships**:
- `product_id` → products(id) [CASCADE DELETE]
- `color_id` → product_colors(id) [CASCADE DELETE]
- `size_id` → product_sizes(id) [CASCADE DELETE]

**Important Notes**:
- **Variant-level tracking**: `color_id` and `size_id` can be combined to track specific variants
- `color_id` and `size_id` can be `NULL` for products without variants
- Unique constraint likely on `(product_id, color_id, size_id)`

**Example Stock Records**:

| product_id | color_id | size_id | quantity | Meaning |
|------------|----------|---------|----------|---------|
| prod-123 | color-red | size-M | 50 | Red T-shirt, size M: 50 units |
| prod-123 | color-blue | size-L | 30 | Blue T-shirt, size L: 30 units |
| prod-456 | NULL | NULL | 100 | Product without variants: 100 units |

---

#### 1.5 `product_stock_logs`

**Purpose**: Audit trail for stock changes

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `product_stock_id` | UUID | NO | FK to `product_stock.id` |
| `quantity` | INTEGER | NO | Quantity changed (+/-) |
| `action_type` | TEXT | NO | "add" / "return" / "sale" |
| `created_at` | TIMESTAMP | NO | When change occurred |

**Relationships**:
- `product_stock_id` → product_stock(id) [CASCADE DELETE]

---

#### 1.6 `product_medias`

**Purpose**: Product images/videos

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `product_id` | UUID | NO | FK to `products.id` |
| `media_url` | TEXT | NO | Supabase Storage URL |
| `arrangement` | INTEGER | YES | Display order |
| `created_at` | TIMESTAMP | NO | Upload timestamp |

**Relationships**:
- `product_id` → products(id) [CASCADE DELETE]

---

#### 1.7 `product_categories`

**Purpose**: Many-to-many linking products to categories

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `product_id` | UUID | NO | FK to `products.id` |
| `category_id` | UUID | NO | FK to `categories.id` |
| `created_at` | TIMESTAMP | NO | Link timestamp |

**Relationships**:
- `product_id` → products(id) [CASCADE DELETE]
- `category_id` → categories(id) [CASCADE DELETE]

---

#### 1.8 `product_folders`

**Purpose**: Organize products into folders

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `name` | TEXT | NO | Folder name |
| `parent` | UUID | YES | FK to parent folder (self-reference) |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

**Features**: Supports **nested folders** via `parent` column.

---

#### 1.9 `product_folder_medias`

**Purpose**: Images for product folders

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `product_folder_id` | UUID | NO | FK to `product_folders.id` |
| `media_url` | TEXT | NO | Supabase Storage URL |
| `created_at` | TIMESTAMP | NO | Upload timestamp |

---

#### 1.10 `product_events`

**Purpose**: Scheduled product posts/events

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `product_id` | UUID | NO | FK to `products.id` |
| `scheduled_time` | TIMESTAMP | NO | When to post |
| `status` | TEXT | YES | "pending" / "posted" |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 1.11 `product_reports`

**Purpose**: Product analytics/reports

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `product_id` | UUID | NO | FK to `products.id` |
| `views` | INTEGER | YES | View count |
| `clicks` | INTEGER | YES | Click count |
| `sales` | INTEGER | YES | Sales count |
| `revenue` | NUMERIC | YES | Revenue generated |
| `date` | DATE | NO | Report date |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 1.12 `product_purchase_orders`

**Purpose**: Purchase orders for restocking

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `order_number` | TEXT | NO | PO number |
| `supplier` | TEXT | YES | Supplier name |
| `status` | TEXT | NO | "pending" / "received" / "cancelled" |
| `order_date` | DATE | NO | Order date |
| `expected_date` | DATE | YES | Expected delivery date |
| `total_amount` | NUMERIC | YES | Total cost |
| `notes` | TEXT | YES | Notes |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 1.13 `product_purchase_order_entries`

**Purpose**: Line items for purchase orders

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `purchase_order_id` | UUID | NO | FK to `product_purchase_orders.id` |
| `product_id` | UUID | NO | FK to `products.id` |
| `color_id` | UUID | YES | FK to `product_colors.id` |
| `size_id` | UUID | YES | FK to `product_sizes.id` |
| `quantity` | INTEGER | NO | Quantity ordered |
| `unit_price` | NUMERIC | YES | Price per unit |
| `total_price` | NUMERIC | YES | Total line item price |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

**Note**: Also supports **variant-level** POs with `color_id` and `size_id`.

---

#### 1.14 `add_to_cart_logs`

**Purpose**: Track add-to-cart analytics

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `product_id` | UUID | NO | FK to `products.id` |
| `action_type` | TEXT | NO | "add" / "remove" |
| `amount` | INTEGER | NO | Quantity |
| `created_at` | TIMESTAMP | NO | Action timestamp |

---

### 2. Categorization Tables

#### 2.1 `categories`

**Purpose**: Product categories with hierarchy

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `name` | TEXT | NO | Category name |
| `media_url` | TEXT | NO | Category image |
| `parent` | UUID | YES | FK to parent category (self-reference) |
| `arrangement` | INTEGER | YES | Display order |
| `active` | BOOLEAN | NO | Visibility |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

**Features**: Supports **nested categories** via `parent`.

---

#### 2.2 `brand`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `name` | TEXT | YES | Brand name |
| `media_url` | TEXT | YES | Brand logo |
| `active` | BOOLEAN | YES | Visibility |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 2.3 `departments`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `name` | TEXT | YES | Department name |
| `active` | BOOLEAN | YES | Visibility |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 2.4 `ranges`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `name` | TEXT | YES | Range name |
| `active` | BOOLEAN | YES | Visibility |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

### 3. Shopping Cart & Orders

#### 3.1 `add_to_carts` ⭐ CRITICAL TABLE

**Purpose**: Shopping cart items

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | FK to users |
| `product_id` | UUID | NO | FK to `products.id` |
| `color_id` | UUID | **YES** | FK to `product_colors.id` |
| `size_id` | UUID | **YES** | FK to `product_sizes.id` |
| `amount` | INTEGER | NO | Quantity |
| `created_at` | TIMESTAMP | NO | Added timestamp |

**Relationships**:
- `user_id` → user_details(id) [likely]
- `product_id` → products(id) [CASCADE DELETE]
- `color_id` → product_colors(id) [CASCADE DELETE]
- `size_id` → product_sizes(id) [CASCADE DELETE]

**⚠️ CRITICAL ISSUE**: `color_id` and `size_id` are nullable, but the **frontend currently passes NULL** instead of selected variant IDs!

---

#### 3.2 `orders`

**Purpose**: Customer orders

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | FK to users |
| `order_number` | TEXT | NO | Order number |
| `status` | TEXT | NO | "pending" / "processing" / "shipped" / "delivered" / "cancelled" |
| `total_amount` | NUMERIC | NO | Order total |
| `shipping_address` | TEXT | YES | Shipping address |
| `billing_address` | TEXT | YES | Billing address |
| `notes` | TEXT | YES | Order notes |
| `created_at` | TIMESTAMP | NO | Order timestamp |
| `updated_at` | TIMESTAMP | YES | Last update |

---

#### 3.3 `order_items` ⭐ CRITICAL TABLE

**Purpose**: Line items for orders

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `order_id` | UUID | NO | FK to `orders.id` |
| `product_id` | UUID | NO | FK to `products.id` |
| `color_id` | UUID | **YES** | FK to `product_colors.id` |
| `size_id` | UUID | **YES** | FK to `product_sizes.id` |
| `quantity` | INTEGER | NO | Quantity ordered |
| `price` | NUMERIC | NO | Price at time of order |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

**Relationships**:
- `order_id` → orders(id) [CASCADE DELETE]
- `product_id` → products(id)
- `color_id` → product_colors(id)
- `size_id` → product_sizes(id)

**Note**: Also tracks **variant-level** order items!

---

#### 3.4 `order_status_logs`

**Purpose**: Audit trail for order status changes

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `order_id` | UUID | NO | FK to `orders.id` |
| `status` | TEXT | NO | New status |
| `notes` | TEXT | YES | Change notes |
| `created_at` | TIMESTAMP | NO | Change timestamp |

---

#### 3.5 `payments`

**Purpose**: Payment records for orders

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `order_id` | UUID | NO | FK to `orders.id` |
| `amount` | NUMERIC | NO | Payment amount |
| `payment_method` | TEXT | YES | "credit_card" / "paypal" / etc. |
| `payment_status` | TEXT | NO | "pending" / "completed" / "failed" / "refunded" |
| `transaction_id` | TEXT | YES | External transaction ID |
| `payment_gateway` | TEXT | YES | Gateway used |
| `refund_amount` | NUMERIC | YES | Refunded amount |
| `refund_status` | TEXT | YES | Refund status |
| `paid_at` | TIMESTAMP | YES | Payment timestamp |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 3.6 `payment_events`

**Purpose**: Payment event logs

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `payment_id` | UUID | NO | FK to `payments.id` |
| `event_type` | TEXT | NO | Event type |
| `event_data` | JSONB | YES | Event payload |
| `created_at` | TIMESTAMP | NO | Event timestamp |

---

### 4. Social Media Posts

#### 4.1 `posts`

**Purpose**: Social media posts

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `caption` | TEXT | YES | Post caption |
| `facebook` | BOOLEAN | YES | Post to Facebook |
| `instagram` | BOOLEAN | YES | Post to Instagram |
| `tiktok` | BOOLEAN | YES | Post to TikTok |
| `scheduled_time` | TIMESTAMP | YES | When to post |
| `status` | TEXT | YES | "draft" / "scheduled" / "posted" |
| `post_folder_id` | UUID | YES | FK to `post_folders.id` |
| `created_at` | TIMESTAMP | NO | Creation timestamp |
| `updated_at` | TIMESTAMP | YES | Last update |

---

#### 4.2 `post_medias`

**Purpose**: Post images/videos

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `post_id` | UUID | NO | FK to `posts.id` |
| `media_url` | TEXT | NO | Supabase Storage URL |
| `arrangement` | INTEGER | YES | Display order |
| `created_at` | TIMESTAMP | NO | Upload timestamp |

---

#### 4.3 `post_folders`

**Purpose**: Organize posts into folders

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `name` | TEXT | NO | Folder name |
| `parent` | UUID | YES | FK to parent folder |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 4.4 `post_folder_medias`

**Purpose**: Images for post folders

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `post_folder_id` | UUID | NO | FK to `post_folders.id` |
| `media_url` | TEXT | NO | Supabase Storage URL |
| `created_at` | TIMESTAMP | NO | Upload timestamp |

---

### 5. Promotions

**⚠️ WARNING**: Promotion **database schema exists**, but **frontend is broken** (see [CRITICAL_BUGS.md](./CRITICAL_BUGS.md#priority-4)).

#### 5.1 `promotions`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `name` | TEXT | NO | Promotion name |
| `description` | TEXT | YES | Promotion description |
| `discount_type` | TEXT | YES | "percentage" / "fixed" / "bogo" |
| `discount_value` | NUMERIC | YES | Discount amount |
| `start_date` | TIMESTAMP | YES | Start date |
| `end_date` | TIMESTAMP | YES | End date |
| `active` | BOOLEAN | NO | Promotion active |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 5.2 `promotion_product`

**Purpose**: Link promotions to products

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `promotion_id` | UUID | NO | FK to `promotions.id` |
| `product_id` | UUID | NO | FK to `products.id` |
| `created_at` | TIMESTAMP | NO | Link timestamp |

---

#### 5.3 `promotion_folders` & `promotion_folder_medias`

Similar structure to product/post folders (organization).

---

### 6. Users & Membership

#### 6.1 `user_details`

**Purpose**: User profile information

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key (from Supabase Auth) |
| `full_name` | TEXT | YES | User's full name |
| `email` | TEXT | NO | User email |
| `phone` | TEXT | YES | Phone number |
| `address` | TEXT | YES | Mailing address |
| `avatar_url` | TEXT | YES | Profile picture |
| `role` | TEXT | YES | "customer" / "admin" / "staff" |
| `created_at` | TIMESTAMP | NO | Registration timestamp |
| `updated_at` | TIMESTAMP | YES | Last update |

---

#### 6.2 `user_points`

**Purpose**: User loyalty points

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | FK to `user_details.id` |
| `points` | INTEGER | NO | Current points balance |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 6.3 `user_points_logs`

**Purpose**: Audit trail for points changes

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `user_points_id` | UUID | NO | FK to `user_points.id` |
| `points` | INTEGER | NO | Points added/deducted |
| `reason` | TEXT | YES | Reason for change |
| `created_at` | TIMESTAMP | NO | Change timestamp |

---

#### 6.4 `membership_tiers`

**Purpose**: Membership levels

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `name` | TEXT | NO | Tier name (e.g., "Gold", "Silver") |
| `min_points` | INTEGER | YES | Minimum points required |
| `benefits` | TEXT | YES | Tier benefits |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

### 7. Community & Messaging

#### 7.1 `communities`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `name` | TEXT | YES | Community name |
| `description` | TEXT | YES | Community description |
| `media_url` | TEXT | YES | Community image |
| `created_by` | UUID | YES | Creator user ID |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 7.2 `groups`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `name` | TEXT | YES | Group name |
| `description` | TEXT | YES | Group description |
| `media_url` | TEXT | YES | Group image |
| `community_id` | UUID | YES | FK to `communities.id` |
| `created_by` | UUID | YES | Creator user ID |
| `is_private` | BOOLEAN | YES | Privacy setting |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 7.3 `conversations`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `type` | TEXT | YES | "direct" / "group" |
| `name` | TEXT | YES | Conversation name |
| `group_id` | UUID | YES | FK to `groups.id` (for group chats) |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 7.4 `conversation_participants`

**Purpose**: Many-to-many linking users to conversations

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `conversation_id` | UUID | NO | FK to `conversations.id` |
| `user_id` | UUID | NO | FK to `user_details.id` |
| `created_at` | TIMESTAMP | NO | Join timestamp |

---

#### 7.5 `chat_messages`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `conversation_id` | UUID | YES | FK to `conversations.id` |
| `user_id` | UUID | YES | FK to `user_details.id` |
| `content` | TEXT | YES | Message text |
| `media_url` | TEXT | YES | Attached media |
| `type` | TEXT | YES | "text" / "image" / "video" |
| `created_at` | TIMESTAMP | NO | Message timestamp |

---

### 8. Support/Ticketing

#### 8.1 `tickets`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | YES | FK to `user_details.id` |
| `subject` | TEXT | YES | Ticket subject |
| `description` | TEXT | YES | Ticket description |
| `status` | TEXT | NO | "open" / "in_progress" / "resolved" / "closed" |
| `priority` | TEXT | YES | "low" / "medium" / "high" / "urgent" |
| `assigned_to` | UUID | YES | Assigned staff user ID |
| `created_at` | TIMESTAMP | NO | Creation timestamp |
| `updated_at` | TIMESTAMP | YES | Last update |

---

#### 8.2 `ticket_status_change_logs`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `ticket_id` | UUID | NO | FK to `tickets.id` |
| `old_status` | TEXT | YES | Previous status |
| `new_status` | TEXT | NO | New status |
| `changed_by` | UUID | YES | User who changed status |
| `created_at` | TIMESTAMP | NO | Change timestamp |

---

### 9. Miscellaneous

#### 9.1 `homepage_elements`

**Purpose**: Dynamic homepage content

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `type` | TEXT | NO | "banner" / "featured_products" / "promo" |
| `content` | JSONB | YES | Element configuration |
| `arrangement` | INTEGER | YES | Display order |
| `active` | BOOLEAN | NO | Visibility |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

#### 9.2 `sales_logs`

**Purpose**: Sales analytics

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `product_id` | UUID | NO | FK to `products.id` |
| `quantity` | INTEGER | NO | Quantity sold |
| `revenue` | NUMERIC | NO | Revenue generated |
| `date` | DATE | NO | Sale date |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

---

## Database Functions

### `fetch_products_with_computed_attributes`

**Purpose**: Fetch products with computed/aggregated data  
**Returns**: Complex product object with related data

---

### `fetch_purchase_orders`

**Purpose**: Fetch purchase orders with line items  
**Returns**: Purchase orders with entries

---

## Row Level Security (RLS)

**Status**: ⚠️ Likely implemented but not documented here

**Typical Policies**:
- Users can only see their own orders/cart items
- Admin/staff roles can see all data
- Public read access for products/categories
- Authenticated users can create orders

---

## Indexes & Performance

**Recommended Indexes** (likely exist):
- `products(active, created_at)`
- `product_stock(product_id, color_id, size_id)` (composite unique)
- `orders(user_id, created_at)`
- `order_items(order_id, product_id)`
- `add_to_carts(user_id, product_id)`

---

## Database Migrations

**Type Generation**:

```bash
npx supabase gen types typescript --project-id <project-id> > database.types.ts
```

Run this command whenever database schema changes!

---

## Key Database Design Decisions

### 1. ✅ Flexible Color/Size System

**Design**: Free-text fields for colors and sizes (not enums or fixed tables)

**Pros**:
- Complete flexibility (any color name, any size system)
- No schema changes needed for new variants

**Cons**:
- No validation (typos possible)
- No color standardization

### 2. ✅ Variant-Level Stock Tracking

**Design**: `product_stock` has `color_id` and `size_id` columns

**Result**: System can track stock for **every color-size combination**

**Example**:
```
Product: T-Shirt
- Red, Size M: 50 units
- Red, Size L: 30 units
- Blue, Size M: 20 units
- Blue, Size L: 10 units
```

### 3. ✅ Hierarchical Categories/Folders

**Design**: Self-referencing `parent` columns

**Result**: Unlimited nesting depth for organization

### 4. ✅ Comprehensive Audit Trails

**Tables**: `*_logs` tables track all changes

**Result**: Full history of stock, orders, points, tickets, etc.

---

## Database Health Status

| Aspect | Status | Notes |
|--------|--------|-------|
| **Schema Design** | ✅ Excellent | Well-structured, normalized |
| **Relationships** | ✅ Good | Proper foreign keys and cascades |
| **Variant Support** | ✅ Ready | Backend fully supports variants |
| **Stock Tracking** | ✅ Ready | Variant-level tracking implemented |
| **Audit Trails** | ✅ Good | Comprehensive logging |
| **Indexes** | 🟡 Unknown | Likely exists, needs verification |
| **RLS Policies** | 🟡 Unknown | Likely exists, needs documentation |
| **Promotions Schema** | ✅ Exists | Frontend broken, but schema ready |

---

## Critical Database-Related Issues

### 1. Frontend Not Using Variant IDs

**Issue**: Customer-facing pages pass `null` for `color_id` and `size_id` when they should pass actual IDs.

**Affects**:
- `add_to_carts` table
- `order_items` table
- Stock tracking accuracy

**Fix**: Update frontend to capture and pass variant selections.

### 2. No Wishlist Table

**Issue**: Wishlist page uses mock data, no database table exists.

**Solution**: Create `wishlist` or `user_favorites` table.

---

## Next Steps

1. **Document RLS Policies**: Export and document Supabase RLS policies
2. **Verify Indexes**: Check existing indexes and add missing ones
3. **Create Wishlist Table**: Add database support for wishlist
4. **Fix Frontend Variant Usage**: Ensure `color_id` and `size_id` are used correctly
5. **Test Stock Tracking**: Verify variant-level stock decrements work correctly

---

**For Schema Changes**: Always regenerate `database.types.ts` after database modifications!


