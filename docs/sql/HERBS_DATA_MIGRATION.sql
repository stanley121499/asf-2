-- =====================================================
-- MEDICINAL HERBS DATA MIGRATION
-- Replaces fashion demo data with herbal products
-- =====================================================

-- Step 1: Clean existing data (soft delete to preserve order history)
-- =====================================================

UPDATE products SET deleted_at = NOW() WHERE deleted_at IS NULL;
UPDATE brands SET deleted_at = NOW() WHERE deleted_at IS NULL;  
UPDATE categories SET deleted_at = NOW() WHERE deleted_at IS NULL;
UPDATE departments SET deleted_at = NOW() WHERE deleted_at IS NULL;
UPDATE ranges SET deleted_at = NOW() WHERE deleted_at IS NULL;

-- Step 2: Insert Brands (Herb Suppliers)
-- =====================================================

INSERT INTO brands (id, name, description, active, created_at, updated_at) VALUES
('b1000000-0000-0000-0000-000000000001', 'Nature''s Apothecary', 'Premium organic herbs sourced from certified farms', true, NOW(), NOW()),
('b1000000-0000-0000-0000-000000000002', 'Traditional Herbal Co.', 'Classic herbal formulations based on traditional medicine', true, NOW(), NOW()),
('b1000000-0000-0000-0000-000000000003', 'Green Earth Botanicals', 'Sustainably harvested herbs with eco-friendly packaging', true, NOW(), NOW()),
('b1000000-0000-0000-0000-000000000004', 'Ancient Remedies', 'Time-tested herbal preparations from ancient traditions', true, NOW(), NOW()),
('b1000000-0000-0000-0000-000000000005', 'Pure Herb Wellness', 'Lab-tested quality supplements and herbal products', true, NOW(), NOW()),
('b1000000-0000-0000-0000-000000000006', 'Mountain Valley Herbs', 'Wild-harvested herbs from pristine mountain regions', true, NOW(), NOW());

-- Step 3: Insert Departments
-- =====================================================

INSERT INTO departments (id, name, description, active, created_at, updated_at) VALUES
('d1000000-0000-0000-0000-000000000001', 'Herbal Medicine', 'Traditional and modern herbal remedies', true, NOW(), NOW()),
('d1000000-0000-0000-0000-000000000002', 'Wellness & Prevention', 'Daily wellness and preventive health herbs', true, NOW(), NOW()),
('d1000000-0000-0000-0000-000000000003', 'Therapeutic Herbs', 'Targeted therapeutic herbal solutions', true, NOW(), NOW());

-- Step 4: Insert Ranges
-- =====================================================

INSERT INTO ranges (id, name, description, active, created_at, updated_at) VALUES
('r1000000-0000-0000-0000-000000000001', 'Immunity Boosters', 'Herbs that support immune system function', true, NOW(), NOW()),
('r1000000-0000-0000-0000-000000000002', 'Digestive Health', 'Herbs for digestive wellness and gut health', true, NOW(), NOW()),
('r1000000-0000-0000-0000-000000000003', 'Stress & Sleep', 'Calming and sleep-supporting herbs', true, NOW(), NOW()),
('r1000000-0000-0000-0000-000000000004', 'Pain Relief', 'Natural pain management and anti-inflammatory herbs', true, NOW(), NOW()),
('r1000000-0000-0000-0000-000000000005', 'Cognitive Support', 'Memory and brain function enhancement', true, NOW(), NOW()),
('r1000000-0000-0000-0000-000000000006', 'Energy & Vitality', 'Adaptogenic and energizing herbs', true, NOW(), NOW());

-- Step 5: Insert Categories
-- =====================================================

INSERT INTO categories (id, name, description, active, created_at, updated_at) VALUES
('c1000000-0000-0000-0000-000000000001', 'Dried Herbs', 'Loose dried herbs for tea and cooking', true, NOW(), NOW()),
('c1000000-0000-0000-0000-000000000002', 'Herbal Teas', 'Pre-packaged herbal tea blends', true, NOW(), NOW()),
('c1000000-0000-0000-0000-000000000003', 'Tinctures & Extracts', 'Concentrated liquid herbal extracts', true, NOW(), NOW()),
('c1000000-0000-0000-0000-000000000004', 'Capsules & Tablets', 'Standardized herbal supplements', true, NOW(), NOW()),
('c1000000-0000-0000-0000-000000000005', 'Powders', 'Herbal powders for beverages and smoothies', true, NOW(), NOW()),
('c1000000-0000-0000-0000-000000000006', 'Essential Oils', 'Pure essential oils for aromatherapy', true, NOW(), NOW()),
('c1000000-0000-0000-0000-000000000007', 'Topical Products', 'Herbal salves, creams, and balms', true, NOW(), NOW());

-- Step 6: Insert Products (25 Medicinal Herbs)
-- =====================================================

-- Product 1: Turmeric
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000001', 
 'Organic Turmeric Root Powder', 
 'Premium organic turmeric (Curcuma longa) root powder. Known for powerful anti-inflammatory properties due to curcumin content. Traditionally used in Ayurvedic medicine for joint health and overall wellness. Add to smoothies, teas, or golden milk recipes. Non-GMO, gluten-free, and sustainably sourced.',
 18.99,
 'TUR-PWD-001',
 'b1000000-0000-0000-0000-000000000003',
 'd1000000-0000-0000-0000-000000000001',
 'r1000000-0000-0000-0000-000000000004',
 'active',
 NOW(), NOW());

-- Product 2: Ginger Root
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000002',
 'Dried Ginger Root Slices',
 'Premium dried ginger root (Zingiber officinale) slices perfect for tea and cooking. Supports digestive health, reduces nausea, and has natural anti-inflammatory properties. Can be steeped as tea or rehydrated for cooking. Wild-harvested and sustainably sourced.',
 14.99,
 'GIN-DRY-002',
 'b1000000-0000-0000-0000-000000000006',
 'd1000000-0000-0000-0000-000000000002',
 'r1000000-0000-0000-0000-000000000002',
 'active',
 NOW(), NOW());

-- Product 3: Echinacea
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000003',
 'Echinacea Immune Support Capsules',
 'Standardized Echinacea purpurea extract capsules for immune system support. Contains 400mg per capsule with 4% echinacosides. Traditionally used to reduce duration and severity of colds. Third-party tested for purity and potency.',
 24.99,
 'ECH-CAP-003',
 'b1000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000002',
 'r1000000-0000-0000-0000-000000000001',
 'active',
 NOW(), NOW());

-- Product 4: Chamomile
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000004',
 'Chamomile Flowers - Organic',
 'Whole dried chamomile (Matricaria chamomilla) flowers for calming herbal tea. Promotes relaxation, aids sleep, and soothes digestive discomfort. Certified organic, caffeine-free. Beautiful golden flowers with sweet, apple-like aroma.',
 12.99,
 'CHA-TEA-004',
 'b1000000-0000-0000-0000-000000000001',
 'd1000000-0000-0000-0000-000000000002',
 'r1000000-0000-0000-0000-000000000003',
 'active',
 NOW(), NOW());

-- Product 5: Ashwagandha
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000005',
 'Ashwagandha Root Powder - KSM-66',
 'Premium Ashwagandha (Withania somnifera) root extract powder featuring clinically-studied KSM-66 extract. Adaptogenic herb for stress management, energy, and cognitive function. 500mg per serving. Certified organic and vegan.',
 29.99,
 'ASH-PWD-005',
 'b1000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000003',
 'r1000000-0000-0000-0000-000000000006',
 'active',
 NOW(), NOW());

-- Product 6: Milk Thistle
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000006',
 'Milk Thistle Liver Support',
 'Milk Thistle (Silybum marianum) seed extract standardized to 80% silymarin. Supports liver health and detoxification. 175mg silymarin per capsule. Non-GMO, gluten-free. Ideal for liver cleansing protocols.',
 22.99,
 'MLK-CAP-006',
 'b1000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000003',
 'r1000000-0000-0000-0000-000000000002',
 'active',
 NOW(), NOW());

-- Product 7: Ginkgo Biloba
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000007',
 'Ginkgo Biloba Memory Support',
 'Ginkgo biloba leaf extract standardized to 24% flavone glycosides and 6% terpene lactones. Supports cognitive function, memory, and circulation. 120mg per capsule. Vegan, non-GMO.',
 26.99,
 'GNK-CAP-007',
 'b1000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000003',
 'r1000000-0000-0000-0000-000000000005',
 'active',
 NOW(), NOW());

-- Product 8: St. John's Wort
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000008',
 'St. John''s Wort Mood Support',
 'St. John''s Wort (Hypericum perforatum) extract standardized to 0.3% hypericin. Traditionally used for mood support and emotional wellness. 300mg per capsule. Third-party tested. Consult healthcare provider before use.',
 19.99,
 'SJW-CAP-008',
 'b1000000-0000-0000-0000-000000000002',
 'd1000000-0000-0000-0000-000000000003',
 'r1000000-0000-0000-0000-000000000003',
 'active',
 NOW(), NOW());

-- Product 9: Valerian Root
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000009',
 'Valerian Root Sleep Formula',
 'Valerian (Valeriana officinalis) root extract for natural sleep support. 500mg per capsule with 0.8% valerenic acids. Promotes relaxation and restful sleep. Non-habit forming. Take 30-60 minutes before bedtime.',
 16.99,
 'VAL-CAP-009',
 'b1000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000002',
 'r1000000-0000-0000-0000-000000000003',
 'active',
 NOW(), NOW());

-- Product 10: Peppermint Leaf
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000010',
 'Organic Peppermint Leaf Tea',
 'Premium organic peppermint (Mentha piperita) leaves for refreshing herbal tea. Supports digestive comfort, freshens breath, and provides natural energy. Caffeine-free. Perfect hot or iced.',
 11.99,
 'PEP-TEA-010',
 'b1000000-0000-0000-0000-000000000001',
 'd1000000-0000-0000-0000-000000000002',
 'r1000000-0000-0000-0000-000000000002',
 'active',
 NOW(), NOW());

-- Product 11: Lavender
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000011',
 'Lavender Essential Oil - Therapeutic Grade',
 'Pure lavender (Lavandula angustifolia) essential oil. Steam-distilled from French lavender flowers. Promotes relaxation, aids sleep, and soothes skin. 100% pure, no additives. For aromatherapy and topical use (diluted).',
 24.99,
 'LAV-OIL-011',
 'b1000000-0000-0000-0000-000000000003',
 'd1000000-0000-0000-0000-000000000002',
 'r1000000-0000-0000-0000-000000000003',
 'active',
 NOW(), NOW());

-- Product 12: Elderberry
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000012',
 'Elderberry Immune Syrup',
 'Concentrated elderberry (Sambucus nigra) syrup with honey and spices. Rich in antioxidants and immune-supporting compounds. Take at first sign of cold or daily for prevention. Great taste loved by kids and adults.',
 19.99,
 'ELD-SYR-012',
 'b1000000-0000-0000-0000-000000000004',
 'd1000000-0000-0000-0000-000000000002',
 'r1000000-0000-0000-0000-000000000001',
 'active',
 NOW(), NOW());

-- Product 13: Panax Ginseng
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000013',
 'Korean Red Ginseng - Premium',
 'Premium Korean red ginseng (Panax ginseng) root extract. Standardized to 5% ginsenosides. Supports energy, stamina, and cognitive function. 500mg per capsule. 6-year aged roots for maximum potency.',
 39.99,
 'GNS-CAP-013',
 'b1000000-0000-0000-0000-000000000004',
 'd1000000-0000-0000-0000-000000000003',
 'r1000000-0000-0000-0000-000000000006',
 'active',
 NOW(), NOW());

-- Product 14: Holy Basil (Tulsi)
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000014',
 'Holy Basil Adaptogenic Tea',
 'Sacred Tulsi (Ocimum sanctum) tea blend with three varieties: Rama, Vana, and Krishna. Adaptogenic herb for stress resilience and mental clarity. Caffeine-free. Aromatic and flavorful. Organic and fair-trade.',
 13.99,
 'TUL-TEA-014',
 'b1000000-0000-0000-0000-000000000001',
 'd1000000-0000-0000-0000-000000000002',
 'r1000000-0000-0000-0000-000000000006',
 'active',
 NOW(), NOW());

-- Product 15: Dandelion Root
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000015',
 'Roasted Dandelion Root Tea',
 'Roasted dandelion (Taraxacum officinale) root for coffee-like herbal tea. Supports liver function and digestion. Rich, earthy flavor. Caffeine-free coffee alternative. Wild-harvested and organic.',
 12.99,
 'DAN-TEA-015',
 'b1000000-0000-0000-0000-000000000006',
 'd1000000-0000-0000-0000-000000000002',
 'r1000000-0000-0000-0000-000000000002',
 'active',
 NOW(), NOW());

-- Product 16: Nettle Leaf
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000016',
 'Nettle Leaf - Freeze Dried',
 'Freeze-dried nettle (Urtica dioica) leaf powder. Rich in vitamins and minerals. Supports seasonal wellness and histamine balance. Add to smoothies or take as capsules. Non-GMO, gluten-free.',
 17.99,
 'NET-PWD-016',
 'b1000000-0000-0000-0000-000000000003',
 'd1000000-0000-0000-0000-000000000002',
 'r1000000-0000-0000-0000-000000000001',
 'active',
 NOW(), NOW());

-- Product 17: Rosemary
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000017',
 'Rosemary Leaf - Whole',
 'Whole dried rosemary (Rosmarinus officinalis) leaves. Aromatic herb for cooking and tea. Supports memory, circulation, and antioxidant protection. Certified organic. Mediterranean quality.',
 10.99,
 'ROS-DRY-017',
 'b1000000-0000-0000-0000-000000000001',
 'd1000000-0000-0000-0000-000000000001',
 'r1000000-0000-0000-0000-000000000005',
 'active',
 NOW(), NOW());

-- Product 18: Saw Palmetto
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000018',
 'Saw Palmetto Prostate Support',
 'Saw palmetto (Serenoa repens) berry extract standardized to 85-95% fatty acids and sterols. Supports prostate health and urinary function. 320mg per softgel. Clinically studied dosage.',
 21.99,
 'SAW-CAP-018',
 'b1000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000003',
 'r1000000-0000-0000-0000-000000000002',
 'active',
 NOW(), NOW());

-- Product 19: Black Cohosh
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000019',
 'Black Cohosh Women''s Formula',
 'Black cohosh (Actaea racemosa) root extract for women''s health. Traditionally used for menopausal comfort and hormonal balance. 40mg per capsule standardized to 2.5% triterpene glycosides.',
 18.99,
 'BCO-CAP-019',
 'b1000000-0000-0000-0000-000000000002',
 'd1000000-0000-0000-0000-000000000003',
 'r1000000-0000-0000-0000-000000000003',
 'active',
 NOW(), NOW());

-- Product 20: Hawthorn Berry
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000020',
 'Hawthorn Berry Heart Tonic',
 'Hawthorn (Crataegus spp.) berry extract for cardiovascular support. Supports healthy blood pressure and circulation. 500mg per capsule with 1.8% vitexins. Vegan, non-GMO.',
 23.99,
 'HAW-CAP-020',
 'b1000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000003',
 'r1000000-0000-0000-0000-000000000004',
 'active',
 NOW(), NOW());

-- Product 21: Rhodiola Rosea
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000021',
 'Rhodiola Stress & Energy',
 'Rhodiola (Rhodiola rosea) root extract standardized to 3% rosavins and 1% salidrosides. Adaptogenic herb for stress resilience and mental performance. 500mg per capsule. Sustainably wild-harvested.',
 27.99,
 'RHO-CAP-021',
 'b1000000-0000-0000-0000-000000000006',
 'd1000000-0000-0000-0000-000000000003',
 'r1000000-0000-0000-0000-000000000006',
 'active',
 NOW(), NOW());

-- Product 22: Bacopa Monnieri
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000022',
 'Bacopa Memory & Focus',
 'Bacopa monnieri whole plant extract (Bacognize®) for cognitive enhancement. Supports memory, learning, and focus. 300mg per capsule standardized to 45% bacosides. Clinically researched.',
 28.99,
 'BAC-CAP-022',
 'b1000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000003',
 'r1000000-0000-0000-0000-000000000005',
 'active',
 NOW(), NOW());

-- Product 23: Licorice Root
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000023',
 'Organic Licorice Root Tea',
 'Sweet licorice (Glycyrrhiza glabra) root for soothing herbal tea. Supports adrenal function and digestive comfort. Naturally sweet flavor. Organic and sustainably harvested. Consult healthcare provider for long-term use.',
 13.99,
 'LIC-TEA-023',
 'b1000000-0000-0000-0000-000000000001',
 'd1000000-0000-0000-0000-000000000001',
 'r1000000-0000-0000-0000-000000000002',
 'active',
 NOW(), NOW());

-- Product 24: Calendula Salve
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000024',
 'Calendula Healing Salve',
 'Organic calendula (Calendula officinalis) flower salve for skin healing and soothing. Made with olive oil and beeswax. For minor cuts, burns, rashes, and dry skin. All-natural ingredients.',
 15.99,
 'CAL-SAL-024',
 'b1000000-0000-0000-0000-000000000003',
 'd1000000-0000-0000-0000-000000000001',
 'r1000000-0000-0000-0000-000000000004',
 'active',
 NOW(), NOW());

-- Product 25: Reishi Mushroom
INSERT INTO products (id, name, description, price, article_number, brand_id, department_id, range_id, status, created_at, updated_at) VALUES
('p1000000-0000-0000-0000-000000000025',
 'Reishi Mushroom Immune',
 'Organic Reishi (Ganoderma lucidum) mushroom extract. Dual-extracted for polysaccharides and triterpenes. Supports immune function and stress resilience. 500mg per capsule. Vegan, non-GMO.',
 32.99,
 'RSH-CAP-025',
 'b1000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000003',
 'r1000000-0000-0000-0000-000000000001',
 'active',
 NOW(), NOW());

-- Step 7: Link Products to Categories (product_categories)
-- =====================================================

-- You would add these via the admin UI or additional INSERT statements
-- Example structure:
-- INSERT INTO product_categories (product_id, category_id) VALUES
-- ('p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005'), -- Turmeric -> Powders
-- etc...

-- =====================================================
-- NEXT STEPS:
-- 1. Execute this script in Supabase SQL Editor
-- 2. Add product_categories links via admin UI
-- 3. Upload images and link via product_media
-- 4. Add stock levels via product_stock
-- 5. Create product variants (sizes, packaging) via UI
-- =====================================================
