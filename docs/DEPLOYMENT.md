# Deployment Guide

**Last Updated**: January 6, 2026  
**Platform**: Windows 11 Development → Cloud Production

---

## Overview

This guide covers deploying the ASF-2 application to production. The application consists of:
- **Frontend**: React SPA built with Vite
- **Backend**: Supabase (managed service)
- **Storage**: Supabase Storage (for images/media)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All critical bugs fixed (see [CRITICAL_BUGS.md](./CRITICAL_BUGS.md))
- [ ] Performance optimizations applied (see [PERFORMANCE_ISSUES.md](./PERFORMANCE_ISSUES.md))
- [ ] All console errors resolved
- [ ] All TypeScript errors resolved
- [ ] Code linted (`npm run lint`)

### Testing
- [ ] All features tested manually
- [ ] Product detail page tested (variants, stock, images)
- [ ] Checkout flow tested end-to-end
- [ ] Mobile responsiveness tested
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] User authentication tested
- [ ] Admin panel tested

### Security
- [ ] Environment variables secured (no secrets in code)
- [ ] Supabase RLS policies verified
- [ ] API keys rotated (use production keys, not development)
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Input validation implemented
- [ ] XSS protection verified

### Performance
- [ ] Images optimized (WebP format, compressed)
- [ ] Bundle size optimized (<500KB gzipped)
- [ ] Lazy loading implemented
- [ ] Code splitting configured
- [ ] Caching strategy defined

### Database
- [ ] Database migrations applied
- [ ] Database backed up
- [ ] RLS policies tested
- [ ] Indexes created for performance
- [ ] Connection pooling configured

---

## Deployment Options

### Option 1: Vercel (Recommended for Vite/React)

#### Advantages
- ✅ Free tier available
- ✅ Automatic deployments from Git
- ✅ Built-in CI/CD
- ✅ Excellent performance (CDN)
- ✅ Zero config for Vite apps

#### Setup Steps

1. **Install Vercel CLI**
   ```powershell
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```powershell
   vercel login
   ```

3. **Deploy**
   ```powershell
   # First deployment (will prompt for configuration)
   vercel
   
   # Production deployment
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add:
     ```
     VITE_SUPABASE_URL=<production-supabase-url>
     VITE_SUPABASE_ANON_KEY=<production-anon-key>
     ```

5. **Connect Git Repository**
   - In Vercel Dashboard, connect your Git repository
   - Enable automatic deployments on push to `main` branch

#### Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### Option 2: Netlify

#### Advantages
- ✅ Free tier available
- ✅ Form handling
- ✅ Serverless functions
- ✅ Split testing

#### Setup Steps

1. **Install Netlify CLI**
   ```powershell
   npm install -g netlify-cli
   ```

2. **Login**
   ```powershell
   netlify login
   ```

3. **Deploy**
   ```powershell
   netlify deploy --prod
   ```

4. **Configuration** (`netlify.toml`)
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

---

### Option 3: AWS S3 + CloudFront

#### Advantages
- ✅ Highly scalable
- ✅ Full control
- ✅ CDN integration

#### Setup Steps

1. **Build Application**
   ```powershell
   npm run build
   ```

2. **Create S3 Bucket**
   - Go to AWS Console → S3
   - Create bucket with static website hosting enabled
   - Set bucket policy for public read access

3. **Upload Build**
   ```powershell
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

4. **Create CloudFront Distribution**
   - Point to S3 bucket
   - Configure SSL certificate
   - Set caching rules

5. **Configure Route53**
   - Create DNS record pointing to CloudFront distribution

---

### Option 4: Render

#### Advantages
- ✅ Free tier with custom domain
- ✅ Auto-deploy from Git
- ✅ Environment variables management

#### Setup Steps

1. Go to [render.com](https://render.com)
2. Connect Git repository
3. Create new "Static Site"
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variables
7. Deploy

---

## Supabase Production Configuration

### 1. Separate Production Project

**Recommended**: Use separate Supabase projects for development and production

**Production Setup**:
1. Create new Supabase project for production
2. Apply all database migrations
3. Set up RLS policies
4. Create storage buckets
5. Configure authentication providers
6. Set up backups

### 2. Environment Variables

**Production `.env` (not committed to Git)**:
```env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
```

### 3. Database Backups

**Enable Automated Backups**:
- Go to Supabase Dashboard → Settings → Database
- Enable daily backups
- Set retention policy

**Manual Backup**:
```sql
-- Export database
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql

-- Restore database
psql -h db.your-project.supabase.co -U postgres -d postgres < backup.sql
```

### 4. Rate Limiting

Configure Supabase rate limits to prevent abuse:
- API rate limits
- Storage upload limits
- Authentication rate limits

---

## Build Optimization

### 1. Analyze Bundle Size

```powershell
# Install analyzer
npm install --save-dev rollup-plugin-visualizer

# Build with analysis
npm run build

# View report
start dist/stats.html
```

### 2. Optimize Images

**Before Deployment**:
- Convert images to WebP format
- Compress images (use tools like TinyPNG, ImageOptim)
- Use responsive images

**Example**:
```typescript
<img 
  srcSet="image-300w.webp 300w, image-600w.webp 600w, image-1200w.webp 1200w"
  sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
  src="image-300w.webp"
  alt="Product"
/>
```

### 3. Code Splitting

Ensure lazy loading is implemented:

```typescript
import { lazy, Suspense } from "react";

const ProductList = lazy(() => import("./pages/products/list"));
const ProductEditor = lazy(() => import("./pages/products/product-editor"));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/products" element={<ProductList />} />
    <Route path="/products/edit" element={<ProductEditor />} />
  </Routes>
</Suspense>
```

### 4. Compression

Most hosting platforms (Vercel, Netlify) automatically enable gzip/brotli compression. Verify it's enabled.

---

## Domain Configuration

### 1. Custom Domain Setup

**Vercel**:
- Go to Project Settings → Domains
- Add custom domain
- Update DNS records (Vercel provides instructions)

**Netlify**:
- Go to Domain Settings
- Add custom domain
- Update DNS records

### 2. SSL Certificate

Most platforms (Vercel, Netlify) provide free SSL certificates via Let's Encrypt. Enable automatic renewal.

### 3. DNS Configuration

**Example DNS Records**:
```
Type    Name    Value                       TTL
A       @       <hosting-provider-ip>       3600
CNAME   www     <hosting-provider-domain>   3600
```

---

## Monitoring & Analytics

### 1. Error Tracking

**Recommended**: Integrate Sentry for error tracking

```powershell
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-sentry-dsn",
  environment: "production",
});
```

### 2. Analytics

**Options**:
- Google Analytics
- Plausible Analytics (privacy-friendly)
- Mixpanel (user behavior)

**Example**: Google Analytics

```typescript
// Add to index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

### 3. Performance Monitoring

**Recommended**: Vercel Analytics or Lighthouse CI

```powershell
# Run Lighthouse
npx lighthouse https://your-site.com --view
```

---

## CI/CD Pipeline

### Example GitHub Actions Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run linter
        run: npm run lint
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Post-Deployment Checklist

### Functional Testing
- [ ] Homepage loads correctly
- [ ] User can sign up and login
- [ ] Products display correctly
- [ ] Product detail page shows all information (colors, sizes, stock)
- [ ] Add to cart works (with correct variant IDs)
- [ ] Checkout flow completes successfully
- [ ] Orders appear in admin panel
- [ ] Stock decrements correctly after purchase
- [ ] Admin panel accessible (admin users only)

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] Images load quickly
- [ ] Mobile performance acceptable

### Security Testing
- [ ] HTTPS enforced
- [ ] No secrets exposed in client-side code
- [ ] RLS policies prevent unauthorized access
- [ ] Authentication works correctly
- [ ] Admin routes protected

---

## Rollback Plan

### If Deployment Fails

**Vercel/Netlify**:
- Go to Deployments
- Find previous successful deployment
- Click "Promote to Production"

**Manual Rollback**:
```powershell
# Checkout previous commit
git log
git checkout <previous-commit-hash>

# Redeploy
vercel --prod
```

---

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
VITE_SUPABASE_URL=<dev-url>
VITE_SUPABASE_ANON_KEY=<dev-key>
VITE_API_ENDPOINT=http://localhost:5173
```

### Staging
```env
NODE_ENV=staging
VITE_SUPABASE_URL=<staging-url>
VITE_SUPABASE_ANON_KEY=<staging-key>
VITE_API_ENDPOINT=https://staging.yoursite.com
```

### Production
```env
NODE_ENV=production
VITE_SUPABASE_URL=<prod-url>
VITE_SUPABASE_ANON_KEY=<prod-key>
VITE_API_ENDPOINT=https://yoursite.com
```

---

## Maintenance

### Regular Tasks

**Weekly**:
- [ ] Check error logs (Sentry)
- [ ] Review performance metrics
- [ ] Check database backup status

**Monthly**:
- [ ] Update dependencies (`npm outdated`, `npm update`)
- [ ] Review and optimize database queries
- [ ] Review and clean up unused storage

**Quarterly**:
- [ ] Security audit
- [ ] Performance audit
- [ ] Code review of recent changes
- [ ] Update documentation

---

## Scaling Considerations

### Database Scaling (Supabase)

As your app grows:
1. **Upgrade Supabase Plan** - More resources, better performance
2. **Optimize Queries** - Add indexes, use views
3. **Connection Pooling** - Handle more concurrent connections
4. **Read Replicas** - Offload read queries

### Frontend Scaling

1. **CDN** - Serve static assets from CDN
2. **Code Splitting** - Load only what's needed
3. **Lazy Loading** - Defer non-critical resources
4. **Service Workers** - Cache assets for offline access

### Media Storage Scaling

1. **Image Optimization** - Compress and resize on upload
2. **CDN** - Serve images from CDN
3. **Lazy Loading** - Load images as user scrolls
4. **WebP Format** - Smaller file sizes

---

## Troubleshooting Common Deployment Issues

### Build Fails

**Error**: TypeScript errors

**Solution**: Fix TypeScript errors locally before deploying

---

### Environment Variables Not Working

**Error**: App can't connect to Supabase

**Solution**: 
1. Ensure variables are prefixed with `VITE_`
2. Rebuild after changing variables
3. Check hosting provider dashboard for environment variables

---

### 404 Errors on Page Refresh

**Error**: SPA routing doesn't work (404 on direct URL access)

**Solution**: Configure redirects/rewrites (see platform-specific configs above)

---

### Slow Loading Times

**Issue**: Large bundle size

**Solution**:
1. Analyze bundle with rollup-plugin-visualizer
2. Implement code splitting
3. Lazy load routes
4. Optimize images

---

## Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com/)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Vite Deployment**: [vitejs.dev/guide/static-deploy](https://vitejs.dev/guide/static-deploy.html)

---

**Deployment Complete!** 🚀 Monitor your application and respond to issues quickly.


