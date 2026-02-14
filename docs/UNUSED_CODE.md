# Unused Code & Dependencies

**Last Updated**: January 6, 2026  
**Purpose**: Track unused/orphaned code and dependencies for cleanup

---

## Orphaned Files

### 1. Category V2 Page

**Location**: `src/pages/products/category-v2-page.tsx`

**Status**: 🔴 Orphaned / Problematic

**Issues**:
- Uses `localStorage` instead of database
- Creates parallel system not synced with `CategoryContext`
- Unclear purpose (duplicate of existing category management?)
- No route defined

**Recommendation**: **DELETE** or rewrite to use existing contexts

**Impact if Deleted**: None (not routed, not used)

---

### 2. Orders Page (Customer)

**Location**: `src/pages/landing/Orders.tsx`

**Status**: 🟡 Orphaned / No Route

**Issues**:
- No route defined in `App.tsx`
- Potential duplicate with admin `/orders` route
- Unclear if for customers or admin

**Recommendation**: 
- **Option A**: Add route `/my-orders` for customer order history
- **Option B**: Delete if not needed

**Impact if Deleted**: None currently (no route)

---

### 3. Wishlist Page

**Location**: `src/pages/landing/Wishlist.tsx`

**Status**: 🟡 Orphaned / Uses Mock Data

**Issues**:
- No route defined
- Uses mock data, no backend integration
- Fully implemented UI, just needs backend

**Recommendation**: **KEEP** and complete backend integration

**Required**:
1. Add route: `/wishlist`
2. Create database table
3. Create `WishlistContext`
4. Replace mock data

---

## Unused Contexts (Backend Ready, No UI)

### 1. CommunityContext

**Location**: `src/context/community/CommunityContext.tsx`

**Status**: ⚠️ Backend ready, no UI

**Recommendation**: 
- **Option A**: Implement UI pages for community features
- **Option B**: Remove if not planning to use

---

### 2. GroupContext

**Location**: `src/context/community/GroupContext.tsx`

**Status**: ⚠️ Backend ready, no UI

**Recommendation**: Same as CommunityContext

---

### 3. ConversationContext & ConversationParticipantContext

**Location**: `src/context/community/`

**Status**: ⚠️ Backend ready, no UI

**Recommendation**: 
- **Option A**: Implement messaging UI
- **Option B**: Remove if not planning to use

---

### 4. TicketContext & TicketStatusLogContext

**Location**: `src/context/TicketContext.tsx`, `src/context/TicketStatusLogContext.tsx`

**Status**: ⚠️ Backend ready, no UI

**Recommendation**: 
- **Option A**: Implement support/ticketing UI
- **Option B**: Remove if not planning to use

---

### 5. ProductPurchaseOrderContext

**Location**: `src/context/product/ProductPurchaseOrderContext.tsx`

**Status**: ⚠️ Backend ready, no UI

**Recommendation**: 
- **Option A**: Implement purchase order management UI for admin
- **Option B**: Keep for future use

---

### 6. HomePageElementContext

**Location**: `src/context/HomePageElementContext.tsx`

**Status**: ⚠️ Context exists, no admin UI for editing

**Recommendation**: 
- Implement admin UI for managing homepage elements
- Or manually manage via Supabase dashboard

---

### 7. PointsMembershipContext

**Location**: `src/context/PointsMembershipContext.tsx`

**Status**: ⚠️ Context exists, not fully utilized

**Recommendation**: 
- Implement points/rewards UI for customers
- Show points balance, redemption options
- Or remove if not using loyalty program

---

## Broken/Non-Functional Modules

### 1. Promotions Module

**Location**: `src/pages/promotions/`

**Status**: 🔴 **COMPLETELY BROKEN**

**Files**:
- `list.tsx`
- `create-promotion-page.tsx`
- `promotion-editor.tsx`

**Issues**:
- Copy-paste of product pages
- No promotion logic
- No `PromotionContext` (even though promotion tables exist in database!)

**Recommendation**: 
- **Option A**: Rewrite from scratch with proper promotion logic
- **Option B**: Delete if not using promotions

**Impact if Deleted**: None (currently non-functional)

---

## Unused Components (Need Verification)

### Potentially Unused Components

**Note**: These may be used but need verification:

1. Components in `src/components/` that are not imported anywhere
2. Utility functions in `src/utils/` not referenced

**Recommended Action**: 
- Run dead code elimination tool
- Use TypeScript "Find All References" to verify usage

---

## Unused Dependencies

### Analyze Dependencies

```powershell
# Install depcheck
npm install -g depcheck

# Run analysis
depcheck
```

### Common Unused Dependencies (To Verify)

**Note**: Run `depcheck` to get accurate list

Potential candidates:
- Development dependencies not used
- Libraries imported but not actually used in code
- Duplicate libraries (e.g., date libraries)

### Recommended Actions

After running `depcheck`:

```powershell
# Remove unused dependencies
npm uninstall <package-name>

# Update package.json
npm install
```

---

## Unused CSS/Styles

### Tailwind CSS

Tailwind automatically purges unused styles in production builds via `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ... other config
};
```

**Verify**: Check that `content` paths are correct to ensure unused Tailwind classes are purged.

---

## Unused Assets

### Check Public Folder

**Location**: `public/`

**Action**: Review files in `public/` folder and remove unused:
- Images not referenced in code
- Icons not used
- Old assets

---

## Dead Code in Active Files

### Common Patterns to Look For

1. **Commented Out Code**
   ```typescript
   // const oldFunction = () => {
   //   // ...
   // };
   ```
   **Action**: Remove if no longer needed

2. **Unused Imports**
   ```typescript
   import { Something } from "somewhere"; // Never used
   ```
   **Action**: Remove import

3. **Unused Variables**
   ```typescript
   const unusedVariable = "value"; // Never referenced
   ```
   **Action**: Remove variable

---

## Cleanup Priority

### High Priority (Delete/Fix Soon)

1. **Category V2 Page** - Delete or rewrite
2. **Promotions Module** - Delete or rewrite
3. **Unused imports** - Clean up across codebase

### Medium Priority (Decide & Execute)

1. **Orders Page (Customer)** - Add route or delete
2. **Wishlist Page** - Complete backend or delete
3. **Community/Messaging Contexts** - Implement UI or remove
4. **Ticket Contexts** - Implement UI or remove

### Low Priority (Future Cleanup)

1. **Unused dependencies** - Run depcheck and remove
2. **Unused assets** - Review and remove
3. **Commented code** - Remove throughout codebase

---

## Cleanup Checklist

### Before Cleanup
- [ ] Review this document
- [ ] Confirm with team which features to keep/remove
- [ ] Backup code (commit current state)
- [ ] Run `depcheck` to identify unused dependencies

### During Cleanup
- [ ] Delete orphaned files
- [ ] Remove unused contexts (if decided)
- [ ] Uninstall unused dependencies
- [ ] Remove unused imports
- [ ] Remove commented code
- [ ] Remove unused assets

### After Cleanup
- [ ] Test application thoroughly
- [ ] Verify nothing breaks
- [ ] Run build to ensure no errors
- [ ] Update documentation
- [ ] Commit changes

---

## Automated Tools

### Find Unused Exports

```powershell
# Install ts-prune
npm install -g ts-prune

# Find unused exports
ts-prune
```

### Find Unused Dependencies

```powershell
# Install depcheck
npm install -g depcheck

# Run analysis
depcheck
```

### Find Unused CSS

```powershell
# Install purgecss (if not using Tailwind's built-in purge)
npm install -g purgecss

# Analyze CSS
purgecss --css styles.css --content src/**/*.tsx
```

---

## Impact Assessment

### Files Safe to Delete (No Impact)

- `src/pages/products/category-v2-page.tsx` - Not routed
- `src/pages/promotions/*` - Non-functional

### Files to Decide On (Medium Impact)

- `src/pages/landing/Orders.tsx` - Could be useful for customers
- `src/pages/landing/Wishlist.tsx` - UI ready, just needs backend
- Community/Messaging contexts - Could be future features

### Files to Keep (High Impact if Removed)

- All product-related contexts and pages
- All post-related contexts and pages
- Order/Payment contexts
- Stock management contexts

---

## Long-Term Maintenance

### Regular Cleanup Schedule

**Monthly**:
- Run `depcheck` and remove unused dependencies
- Review new files for unused code
- Remove commented code

**Quarterly**:
- Audit entire codebase for dead code
- Review contexts for usage
- Remove orphaned files

**Before Major Releases**:
- Comprehensive cleanup
- Bundle size optimization
- Remove all TODO/commented code

---

## Estimated Size Reduction

If all unused code is removed:

| Category | Current | After Cleanup | Savings |
|----------|---------|---------------|---------|
| Bundle Size | ~2-3 MB | ~1-1.5 MB | **50%** |
| node_modules | ~200 MB | ~150 MB | **25%** |
| Source Code | ~500 files | ~450 files | **10%** |

---

## Next Steps

1. **Review with Team**: Decide which features to keep/remove
2. **Prioritize**: Start with high-priority items
3. **Test**: Thoroughly test after each removal
4. **Document**: Update this file as cleanup progresses
5. **Monitor**: Track bundle size reduction

---

**Note**: Always test thoroughly after removing code to ensure nothing breaks!


