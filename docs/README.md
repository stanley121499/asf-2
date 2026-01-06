# ASF-2 Project Documentation

**Version:** 1.0  
**Last Updated:** January 6, 2026  
**Status:** Active Development

## 📖 Documentation Index

This documentation serves as the **source of truth** for the ASF-2 project. All developers working on this codebase should reference these documents to understand the system architecture, existing issues, and implementation guidelines.

### Core Documentation

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture, technology stack, and project structure
2. **[DATABASE.md](./DATABASE.md)** - Database schema, relationships, and data model
3. **[CRITICAL_BUGS.md](./CRITICAL_BUGS.md)** - Critical bugs that MUST be fixed before production
4. **[FEATURES.md](./FEATURES.md)** - Feature inventory, implementation status, and missing features
5. **[SETUP.md](./SETUP.md)** - Development environment setup and configuration
6. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide and production considerations
7. **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Coding standards, best practices, and workflows

### Module Documentation

8. **[CONTEXTS.md](./CONTEXTS.md)** - All React Context providers and state management
9. **[CUSTOMER_FACING.md](./CUSTOMER_FACING.md)** - Customer-facing pages and components
10. **[ADMIN_PANEL.md](./ADMIN_PANEL.md)** - Admin panel features and pages
11. **[PRODUCTS_MODULE.md](./PRODUCTS_MODULE.md)** - Product management system
12. **[STOCK_MODULE.md](./STOCK_MODULE.md)** - Stock management and inventory tracking
13. **[ORDERS_MODULE.md](./ORDERS_MODULE.md)** - Order processing and payment handling
14. **[POSTS_MODULE.md](./POSTS_MODULE.md)** - Social media post management
15. **[COMMUNITY_MODULE.md](./COMMUNITY_MODULE.md)** - Community, groups, and messaging

### Technical Guides

16. **[PERFORMANCE_ISSUES.md](./PERFORMANCE_ISSUES.md)** - Detailed analysis of performance problems
17. **[UNUSED_CODE.md](./UNUSED_CODE.md)** - Unused components, files, and dependencies
18. **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing strategy and test coverage

---

## 🚨 Critical Issues to Address

Before continuing development, please review:

1. **[CRITICAL_BUGS.md](./CRITICAL_BUGS.md)** - Immediate fixes required
2. **[PERFORMANCE_ISSUES.md](./PERFORMANCE_ISSUES.md)** - Re-rendering and state management problems
3. **[CUSTOMER_FACING.md](./CUSTOMER_FACING.md)** - Incomplete customer-facing pages

---

## 📦 Project Overview

ASF-2 is a comprehensive e-commerce and social media management platform built with React, TypeScript, and Supabase. It features:

- **Product Management**: CRUD operations, stock tracking, variants (colors/sizes)
- **Order Processing**: Cart, checkout, payment integration
- **Social Media Management**: Posts, scheduling, media management
- **Community Features**: Groups, conversations, messaging
- **Admin Panel**: Complete backend management interface
- **Customer Portal**: Shopping experience with account management

---

## 🏗️ Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

For detailed setup instructions, see **[SETUP.md](./SETUP.md)**.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: React Context API (35+ providers)
- **UI Components**: Lucide React, custom components
- **Build Tool**: Vite
- **Routing**: React Router v6

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for detailed stack information.

---

## 📊 Project Health Status

| Category | Status | Details |
|----------|--------|---------|
| **Performance** | 🔴 Critical | Massive re-rendering issues, see [PERFORMANCE_ISSUES.md](./PERFORMANCE_ISSUES.md) |
| **Customer UI** | 🟡 Incomplete | Product details missing data, see [CUSTOMER_FACING.md](./CUSTOMER_FACING.md) |
| **Stock System** | 🟡 Partial | Backend ready, frontend incomplete, see [STOCK_MODULE.md](./STOCK_MODULE.md) |
| **Promotions** | 🔴 Broken | Non-functional, see [FEATURES.md](./FEATURES.md#promotions-broken) |
| **Database** | 🟢 Good | Well-structured schema, see [DATABASE.md](./DATABASE.md) |
| **Admin Panel** | 🟢 Good | Comprehensive functionality |

---

## 👥 For New Developers

If you're new to this project, start here:

1. Read **[ARCHITECTURE.md](./ARCHITECTURE.md)** to understand system design
2. Review **[CRITICAL_BUGS.md](./CRITICAL_BUGS.md)** to know what needs fixing
3. Set up your environment with **[SETUP.md](./SETUP.md)**
4. Follow coding standards in **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**
5. Check **[FEATURES.md](./FEATURES.md)** to see what's implemented

---

## 📞 Support

For questions or issues, reference the appropriate documentation file above. If the issue is not documented, please update the relevant documentation file.

---

## 📝 Contributing to Documentation

When making changes to the codebase:

1. Update the relevant documentation file
2. Add new features to **[FEATURES.md](./FEATURES.md)**
3. Document any bugs in **[CRITICAL_BUGS.md](./CRITICAL_BUGS.md)**
4. Update context documentation in **[CONTEXTS.md](./CONTEXTS.md)**

Keep documentation up-to-date as the source of truth!

