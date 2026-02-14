# Quick Start: Medicinal Herbs Data Migration

## Overview
This guide will help you replace the fashion demo data with medicinal herbs data in 4 simple steps.

---

## Step 1: Execute SQL Migration (5 minutes)

### Via Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy content from `docs/sql/HERBS_DATA_MIGRATION.sql`
6. Paste into editor
7. Click **RUN** button
8. Verify success message

### What This Does:
- Soft deletes existing fashion products (preserves order history)
- Creates 6 herb supplier brands
- Creates 7 product categories (Dried Herbs, Teas, Capsules, etc.)
- Creates 3 departments and 6 ranges
- Inserts 25 medicinal herb products with full descriptions

---

## Step 2: Download Product Images (15-30 minutes)

### Manual Download (Recommended):
1. Open `docs/HERBS_IMAGES_SOURCES.md`
2. For each product (1-25):
   - Click the Unsplash/Pexels link
   - Download high-res image (free, no account needed)
   - Rename file to match product (e.g., `turmeric-powder.jpg`)
3. Save all images in a folder on your desktop

### Image Requirements:
- **Size**: 1200x1200px or larger
- **Format**: JPG or PNG
- **Background**: White or neutral
- **Quality**: High resolution

---

## Step 3: Upload Images to Supabase Storage (10 minutes)

### Via Supabase Dashboard:
1. Go to **Storage** in Supabase dashboard
2. Find or create bucket: `product-images`
3. Make bucket **public** (if not already)
4. Upload all 25 images
5. Copy URLs for each image (right-click → Copy URL)

### Via Admin UI (Alternative):
1. Log in to your app as admin
2. Go to **Products** → **List**
3. Click on each product
4. Upload image via product editor
5. Save changes

---

## Step 4: Link Images to Products (10 minutes)

### Option A: Via Admin UI (Easiest):
1. Go to your app → Products → List
2. For each product:
   - Click **Edit**
   - Go to **Media** section
   - Upload or paste image URL
   - Save

### Option B: Via SQL (Faster):
```sql
-- Example for first 3 products
INSERT INTO product_media (product_id, media_url, media_type, active) VALUES
('p1000000-0000-0000-0000-000000000001', 
 'https://YOUR-SUPABASE-URL/storage/v1/object/public/product-images/turmeric-powder.jpg',
 'image', true),
('p1000000-0000-0000-0000-000000000002',
 'https://YOUR-SUPABASE-URL/storage/v1/object/public/product-images/ginger-root.jpg',
 'image', true),
('p1000000-0000-0000-0000-000000000003',
 'https://YOUR-SUPABASE-URL/storage/v1/object/public/product-images/echinacea-capsules.jpg',
 'image', true);
-- Repeat for all 25 products
```

---

## Step 5: Add Product Variants & Stock (Optional, 15 minutes)

### Via Admin UI:
1. Go to Products → Stock Management
2. For each product:
   - Add sizes (2 oz, 4 oz, 60 capsules, etc.)
   - Add packaging types (Glass Bottle, Amber Jar, etc.)
   - Set stock quantities
   - Save

### Via SQL (Example):
```sql
-- Add sizes for Turmeric
INSERT INTO product_sizes (product_id, size, active) VALUES
('p1000000-0000-0000-0000-000000000001', '2 oz', true),
('p1000000-0000-0000-0000-000000000001', '4 oz', true),
('p1000000-0000-0000-0000-000000000001', '8 oz', true);

-- Add stock
INSERT INTO product_stock (product_id, quantity, created_at) VALUES
('p1000000-0000-0000-0000-000000000001', 150, NOW());
```

---

## Verification Checklist

After migration, verify:

### Homepage:
- [ ] Homepage loads without errors
- [ ] No fashion products visible
- [ ] Herb products display if featured

### Product List:
- [ ] Browse all products
- [ ] See 25 herb products
- [ ] All have images
- [ ] Prices display correctly
- [ ] Descriptions are complete

### Product Detail:
- [ ] Click on any product
- [ ] Image displays
- [ ] Description shows
- [ ] Price is correct
- [ ] Department/Category shown

### Categories:
- [ ] Browse by category
- [ ] 7 categories visible (Dried Herbs, Teas, etc.)
- [ ] Products filter correctly

### Admin Panel:
- [ ] Can edit products
- [ ] Can add stock
- [ ] Can upload new images
- [ ] Can create new herb products

---

## Troubleshooting

### Products Not Showing:
- Check products table: `SELECT * FROM products WHERE deleted_at IS NULL LIMIT 10`
- Verify `status = 'active'`
- Clear browser cache

### Images Not Loading:
- Verify Supabase Storage bucket is **public**
- Check image URLs are correct
- Try re-uploading images

### Categories Empty:
- Link products to categories via admin UI
- Or use SQL: `INSERT INTO product_categories (product_id, category_id) VALUES (...)`

### Stock Issues:
- Add stock via admin Stock Management page
- Or SQL: `INSERT INTO product_stock (product_id, quantity) VALUES (...)`

---

## Next Steps

### Customize Further:
1. **Adjust Prices**: Update pricing based on your market
2. **Add More Products**: Create additional herbs via admin UI
3. **Create Bundles**: Group related herbs together
4. **Add Reviews**: Enable customer reviews
5. **Set Up Promotions**: Create special offers

### Content Updates:
1. Update homepage hero text
2. Create herb-focused blog posts
3. Add about page explaining your herb focus
4. Update email templates for herbs

---

## Rollback (If Needed)

If something goes wrong:

### Restore Original Data:
```sql
-- Un-soft-delete original products
UPDATE products SET deleted_at = NULL 
WHERE deleted_at IS NOT NULL 
AND created_at < 'YOUR-MIGRATION-DATE';

-- Delete herb products
DELETE FROM products 
WHERE id LIKE 'p1000000-0000-0000-0000-%';

-- Delete herb brands/categories
DELETE FROM brands WHERE id LIKE 'b1000000-0000-0000-0000-%';
DELETE FROM categories WHERE id LIKE 'c1000000-0000-0000-0000-%';
```

---

## Support

Need help? Check:
- `implementation_plan.md` - Detailed technical plan
- `HERBS_IMAGES_SOURCES.md` - Image download links
- `HERBS_DATA_MIGRATION.sql` - Full SQL script

**Estimated Total Time**: 45-60 minutes for complete migration
