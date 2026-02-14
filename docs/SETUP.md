# Development Environment Setup Guide

**Last Updated**: January 6, 2026  
**Platform**: Windows 11 (64-bit)  
**Terminal**: PowerShell (Administrator)  
**Browser**: Opera GX

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```powershell
   # Check version
   node --version
   npm --version
   ```
   
   If not installed, download from [nodejs.org](https://nodejs.org/)

2. **Git**
   ```powershell
   # Check version
   git --version
   ```
   
   If not installed, download from [git-scm.com](https://git-scm.com/)

3. **Code Editor**
   - Cursor IDE (recommended)
   - VS Code

---

## Project Setup

### 1. Clone Repository

```powershell
# Navigate to your projects directory
cd E:\Dev\GitHub

# Clone the repository
git clone <repository-url> asf-2

# Navigate into project
cd asf-2
```

---

### 2. Install Dependencies

```powershell
# Install all npm packages
npm install
```

**Expected Installation Time**: 2-5 minutes

**Package Count**: 50+ packages including:
- React 18.3.1
- TypeScript 5.6.2
- Vite 5.4.2
- Tailwind CSS 3.4.11
- Supabase JS 2.45.4
- Lucide React 0.441.0

---

### 3. Environment Configuration

#### Create Environment File

```powershell
# Copy example environment file
cp .env.example .env

# Or create manually
New-Item -Path .env -ItemType File
```

#### Configure Environment Variables

Open `.env` and add your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to Get Supabase Credentials**:

1. Go to [supabase.com](https://supabase.com/)
2. Login to your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

**⚠️ SECURITY WARNING**: 
- **NEVER** commit `.env` file to version control
- `.env` should be in `.gitignore`
- Use different credentials for development and production

---

### 4. Database Setup

#### Option A: Connect to Existing Database

If the database already exists:
1. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
2. No additional setup needed

#### Option B: Set Up New Database

If starting fresh:

1. **Create Supabase Project**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Create new project
   - Wait for provisioning (~2 minutes)

2. **Run Database Migrations**
   
   Navigate to **SQL Editor** in Supabase dashboard and run migration scripts (if provided in `/migrations` folder)

3. **Generate TypeScript Types**
   
   ```powershell
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Generate types
   npx supabase gen types typescript --project-id <your-project-id> > database.types.ts
   ```
   
   **Note**: Replace `<your-project-id>` with your actual Supabase project ID (found in project settings)

4. **Set Up Row Level Security (RLS)**
   
   In Supabase dashboard, navigate to **Authentication** → **Policies** and set up policies for each table. Example:
   
   ```sql
   -- Allow users to read all products
   CREATE POLICY "Public products are viewable by everyone"
   ON products FOR SELECT
   USING (true);
   
   -- Allow users to read only their own cart items
   CREATE POLICY "Users can view their own cart"
   ON add_to_carts FOR SELECT
   USING (auth.uid() = user_id);
   ```

---

### 5. Storage Buckets Setup (Supabase)

Create storage buckets for media files:

1. Go to **Storage** in Supabase dashboard
2. Create the following buckets:
   - `product-media` (public)
   - `post-media` (public)
   - `user-avatars` (public)
   - `folder-media` (public)

3. Set bucket policies to allow public access for read operations

---

## Running the Application

### Development Mode

```powershell
# Start development server
npm run dev
```

**Default URL**: `http://localhost:5173`

**Expected Output**:
```
VITE v5.4.2  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**⚠️ IMPORTANT**: 
- **DO NOT** run `npm start` or `npm run build` if a terminal is already running the dev server
- The dev server **hot-reloads** on file changes
- Check existing terminals before starting a new server

---

### Build for Production

```powershell
# Create production build
npm run build
```

**Output Directory**: `dist/`

**Build Time**: ~30-60 seconds

---

### Preview Production Build

```powershell
# Preview production build locally
npm run preview
```

**Default URL**: `http://localhost:4173`

---

## Project Structure Verification

After setup, verify the following structure:

```
asf-2/
├── node_modules/         ✅ Should exist after npm install
├── src/
│   ├── components/       ✅ React components
│   ├── context/          ✅ Context providers
│   ├── pages/            ✅ Page components
│   ├── utils/            ✅ Utility functions
│   ├── App.tsx           ✅ Root component
│   └── main.tsx          ✅ Entry point
├── public/               ✅ Static assets
├── docs/                 ✅ Documentation (this folder)
├── database.types.ts     ✅ Supabase types
├── .env                  ✅ Environment variables (create this)
├── .gitignore            ✅ Git ignore file
├── package.json          ✅ Dependencies
├── tsconfig.json         ✅ TypeScript config
├── tailwind.config.js    ✅ Tailwind config
└── vite.config.ts        ✅ Vite config
```

---

## Common Setup Issues

### Issue 1: `npm install` Fails

**Symptoms**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions**:
```powershell
# Try legacy peer deps
npm install --legacy-peer-deps

# Or clear cache and retry
npm cache clean --force
npm install
```

---

### Issue 2: Environment Variables Not Loading

**Symptoms**:
- App can't connect to Supabase
- Console errors: "Invalid API Key" or "Invalid URL"

**Solutions**:
1. Verify `.env` file is in project root (same level as `package.json`)
2. Ensure variables start with `VITE_` prefix
3. Restart dev server after changing `.env`
4. Check for trailing spaces in variable values

---

### Issue 3: Port Already in Use

**Symptoms**:
```
Error: Port 5173 is already in use
```

**Solutions**:
```powershell
# Option 1: Kill existing process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force

# Option 2: Use different port
npm run dev -- --port 5174
```

---

### Issue 4: TypeScript Errors

**Symptoms**:
- Red squiggly lines in editor
- Type errors in terminal

**Solutions**:
1. Regenerate `database.types.ts` (see Database Setup)
2. Restart TypeScript server in VS Code/Cursor
3. Check `tsconfig.json` configuration

---

### Issue 5: Supabase Connection Fails

**Symptoms**:
- Console errors: "Failed to fetch"
- Data not loading

**Solutions**:
1. Verify Supabase project is active (not paused)
2. Check internet connection
3. Verify `.env` credentials are correct
4. Check Supabase dashboard for project status
5. Verify RLS policies allow your operations

---

## Development Tools Setup

### VS Code / Cursor Extensions (Recommended)

1. **ESLint** - Code linting
2. **Prettier** - Code formatting
3. **Tailwind CSS IntelliSense** - Tailwind autocomplete
4. **TypeScript React Code Snippets** - React snippets
5. **GitLens** - Git integration

### Browser Extensions (Recommended)

1. **React Developer Tools** - React debugging
2. **Redux DevTools** - State debugging (if using Redux)

---

## Verification Checklist

After setup, verify the following:

- [ ] `npm install` completed successfully
- [ ] `.env` file created with correct Supabase credentials
- [ ] `npm run dev` starts without errors
- [ ] App opens in browser at `http://localhost:5173`
- [ ] Login/Signup pages load
- [ ] Can create a test user account
- [ ] Products load on homepage (if database seeded)
- [ ] No console errors related to Supabase connection
- [ ] Hot reload works (change a file, see it update in browser)

---

## Database Seeding (Optional)

To populate the database with test data:

1. **Create Seed Script**
   
   Create `scripts/seed.ts` with sample data:
   
   ```typescript
   import { supabase } from "./src/utils/supabaseClient";
   
   const seedData = async () => {
     // Insert brands
     await supabase.from("brand").insert([
       { name: "Brand A", active: true },
       { name: "Brand B", active: true },
     ]);
     
     // Insert categories
     // Insert products
     // etc.
   };
   
   seedData();
   ```

2. **Run Seed Script**
   ```powershell
   npx ts-node scripts/seed.ts
   ```

---

## Next Steps After Setup

1. **Read Documentation**
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand system design
   - [CRITICAL_BUGS.md](./CRITICAL_BUGS.md) - Known issues
   - [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Coding standards

2. **Explore Codebase**
   - Start with `src/App.tsx`
   - Look at `src/pages/landing/` for customer-facing pages
   - Explore `src/context/` to understand state management

3. **Run Application**
   - Test login/signup functionality
   - Browse products
   - Try creating a product (admin)

4. **Start Development**
   - Pick a task from [CRITICAL_BUGS.md](./CRITICAL_BUGS.md)
   - Create a feature branch
   - Make changes
   - Test thoroughly

---

## Getting Help

### Resources
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **React Docs**: [react.dev](https://react.dev/)
- **Vite Docs**: [vitejs.dev](https://vitejs.dev/)
- **Tailwind Docs**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

### Common Commands Reference

```powershell
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Generate Supabase types
npx supabase gen types typescript --project-id <project-id> > database.types.ts

# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

---

**Setup Complete!** 🎉 You're ready to start developing!


