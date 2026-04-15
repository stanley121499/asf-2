# Shopify (Malaysia-relevant research)

**Updated:** April 2026  
**Official hub:** [Shopify Malaysia](https://www.shopify.com/my/pricing)

## What it is

**Hosted** e-commerce: storefront, cart, checkout, admin, themes, app ecosystem, POS options, and integrations for selling on social and marketplaces. You do **not** run your own server for the core store.

## Core functions (product surface)

- **Storefront & checkout:** Themes (Liquid), customizable sections, checkout (high conversion focus on Shopify’s stack).
- **Catalog:** Products, variants, collections, metafields, inventory locations (plan-dependent).
- **Orders & customers:** Order management, customer accounts, basic CRM patterns; often extended via apps.
- **Payments:** Shopify Payments in **limited countries**; Malaysia merchants typically use **third-party gateways**.
- **Channels:** Social (Meta, etc.), marketplaces connectors (often via apps), B2B (higher plans / Plus).
- **POS:** Retail POS; **POS Pro** is a paid add-on per location ([POS pricing](https://www.shopify.com/my/pos/pricing)).
- **Apps:** Thousands of apps (subscriptions, bundles, reviews, Malaysian gateways, loyalty, ERP, etc.).

---

## Functions and integrations (in depth)

Below is a **granular** view of what merchants typically wire up. Availability can be **region- and plan-dependent**; Meta/Google surfaces also depend on **account approval** and policy.

### Meta (Facebook, Instagram)


| Capability             | How it usually works in Shopify                                                                                                                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sales channel**      | Official channel **“Facebook and Instagram by Meta”** (install from App Store; appears under **Sales channels**). Syncs catalog for **Facebook Shop** and **Instagram Shopping**; checkout can stay in-ecosystem where Meta allows. [Help center overview](https://help.shopify.com/en/manual/online-sales-channels/facebook-instagram-by-meta). |
| **Catalog for ads**    | Product catalog feeds **Ads Manager** for dynamic / catalog-based ads and shoppable formats.                                                                                                                                                                                                                                                     |
| **Meta Pixel**         | Create/manage pixel and **customer data-sharing levels** from the channel; supports measurement and retargeting. **Conversions API**-style sharing is documented under the same channel (reduces reliance on browser-only pixels).                                                                                                               |
| **Marketing in admin** | Shopify surfaces **“Marketing with Facebook and Instagram by Meta”** flows for campaigns tied to connected assets (ad account, page, etc.).                                                                                                                                                                                                      |
| **Eligibility**        | Requires correct **Meta Business** setup (Business Portfolio, Page permissions, commerce approvals). Errors are common during onboarding; Shopify help links Meta’s docs.                                                                                                                                                                        |


### Google (Search, Shopping, Ads, YouTube, Analytics)


| Capability                   | How it usually works in Shopify                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Google & YouTube channel** | Official app/channel connects **Google account**, **Google Merchant Center** (product sync / feed), optional **Google Ads** (e.g. Performance Max, conversion linkage), and optional **Google Analytics 4**. [Setup guide](https://help.shopify.com/en/manual/online-sales-channels/marketplaces/google/getting-setup/connect). |
| **Free listings**            | Synced products can be eligible for **free** appearances on Google surfaces (Shopping tab, Search, Images, Lens, Maps, etc.) **where Google offers that program**; US eligibility is called out explicitly in help docs—**check current rules for Malaysia** in Merchant Center.                                                |
| **Paid ads**                 | Merchant Center + Ads enables **Performance Max** and other shopping-oriented campaigns; campaign management partially reachable from Shopify’s channel UI.                                                                                                                                                                     |
| **YouTube**                  | Same channel branding; product/brand presence tied into Google’s commerce stack (exact features evolve).                                                                                                                                                                                                                        |
| **GA4**                      | Optional connection of a **GA4 property** to share ecommerce data (implementation details in Google & YouTube channel docs).                                                                                                                                                                                                    |
| **SEO on-site**              | Editable titles, meta descriptions, URL handles, blogs, redirects; automatic **sitemap.xml** and **robots.txt**; structured data for products (theme-dependent). **Search Console** is external—you verify the domain in Google’s tool.                                                                                         |


### Other sales and marketing channels (native or common apps)


| Area                         | Examples                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **TikTok**                   | **TikTok** sales channel / app: product sync, sometimes TikTok Shop linkage depending on region and program.                                    |
| **Pinterest**                | **Pinterest** channel: catalog pin sync, shopping surfaces where available.                                                                     |
| **Marketplaces**             | **Amazon**, **eBay**, **Walmart** (region-specific), **Etsy** connectors—often via **official or third-party** apps; fees and eligibility vary. |
| **Email**                    | **Shopify Email** (built-in): newsletters, automation basics; **Klaviyo**, **Omnisend**, **Mailchimp** via apps for heavier flows.              |
| **SMS / WhatsApp**           | **SMS** (where Shopify supports); **WhatsApp** usually via **Meta** paths or **third-party** apps (order updates, chat widgets).                |
| **Affiliates / influencers** | Apps for referral codes, affiliate networks, commission tracking.                                                                               |
| **Pop-ups / bars**           | Apps for capture, urgency, geo-banners (Shopify’s own app ecosystem).                                                                           |


### Storefront, merchandising, and conversion (built-in highlights)

- **Discounts:** Codes and automatic discounts (BXGY, tiered, collection/product scoped).
- **Abandoned checkout recovery:** Email recovery on higher plans (exact plan gates change—verify).
- **Gift cards:** Plan-dependent.
- **Customer accounts:** Classic vs new customer accounts; **B2B** features on **Shopify Plus** (company profiles, payment terms, etc.).
- **Internationalization:** **Markets** for pricing, domains, and localization; multi-currency display (gateway settlement still matters).
- **Subscriptions / memberships:** Core checkout is one-time by default; **subscriptions** almost always via **apps** (Shopify Subscriptions app or ReCharge, etc.).
- **Digital products / downloads:** Supported natively with fulfillment settings.
- **Local pickup / delivery:** Shipping profiles, pickup, local delivery radius (theme + settings).
- **Shop Pay / Shop app:** Shop Pay where payments stack supports it; **Shop** consumer app distribution for eligible merchants (more relevant in supported payment regions).

### Operations, reporting, and “small” admin features

- **Analytics dashboard:** Sales, sessions, conversion funnels (scope varies by plan); **reports** export.
- **Customer events / pixels:** **Customer events** settings in admin for consolidating tracking (evolving product area).
- **Inventory:** Multi-location inventory, transfers, **SKU** barcodes, inventory history (plan-dependent).
- **Fulfillment:** Partial fulfill, third-party fulfillment (3PL) integrations, dropshipping apps.
- **Tax:** Automatic tax services where available; Malaysia **SST** often needs **manual rates** or **tax apps**—validate with an accountant.
- **Automation:** **Shopify Flow** (automation rules) on qualifying plans; **Shopify Scripts** historically on Plus for line-item scripts (check current Plus feature set).

### POS and retail (summary)

- **POS Lite** bundled with plans for basic in-person selling; **POS Pro** adds retail features per location (staff, exchanges, etc.)—see [POS pricing](https://www.shopify.com/my/pos/pricing).
- Hardware: card readers and receipt printers via Shopify or regional partners.

### What often requires an app (Malaysia-focused)

- **iPay88 / local FPX-heavy gateways** as first-class checkout experience.
- **Shopee / Lazada** stock and order sync (Unicommerce, LitCommerce, EasyStore-style depth is rarer natively on Shopify without apps).
- **Advanced loyalty**, **tiered wholesale**, **complex bundles**.
- **Accounting:** Xero, QuickBooks, AutoCount-style bridges via apps or middleware.

---

## Pricing (USD — verify live)

Figures below mirror **Shopify’s Malaysia pricing page** and common partner summaries as of early 2026. **Confirm before budgeting.**


| Plan                                                          | Approx. monthly (USD)     | Notes                                                                 |
| ------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| **Starter**                                                   | ~USD 5                    | Lightweight / link-in-bio style selling; not a full store experience. |
| **Basic**                                                     | ~USD 25 (lower on annual) | Solo / small brand entry.                                             |
| **Grow** (branding varies; often “Shopify” plan historically) | ~USD 65                   | Small teams, more staff accounts / features.                          |
| **Advanced**                                                  | ~USD 399                  | Lower third-party gateway fee %, higher-scale features.               |
| **Plus**                                                      | From ~USD 2,300–2,500+    | Enterprise; custom terms.                                             |


Promotions (for example **USD 1 for the first months** after trial) appear periodically on the official site; **terms change**.

### Third-party payment fees (Malaysia context)

Because **Shopify Payments is generally not used** as the native checkout in Malaysia, Shopify charges an **extra fee** on top of your gateway’s fees when you use external providers. Public summaries commonly cite (plan-dependent) **~2% → 1% → 0.6% → 0.2%** from Basic → Advanced → Plus, and **higher** on Starter; **verify on Shopify’s current Malaysia help/pricing**.

You still pay your **gateway’s** MDR (for example FPX + card pricing from iPay88, PayPal, Stripe, etc.).

### POS add-on

**POS Pro** is commonly listed around **USD 89 / month per location** on Shopify’s POS pricing page (confirm live).

## Strengths

- **Speed to launch** for a polished DTC store; strong **global** playbook and documentation.
- **App ecosystem** covers almost any feature (with cost and complexity tradeoffs).
- **Reliability and scale:** Shopify’s infrastructure is a major selling point for peaks (sales events).
- **Omnichannel narrative:** POS + online + social in one merchant account (fees stack).

## Weaknesses / watch-outs (Malaysia)

- **Total cost:** Subscription + **third-party transaction surcharge** + **apps** + gateway MDR can exceed simpler stacks.
- **Customization:** Deep customization may need **Liquid** developers or headless builds (Plus / custom front ends).
- **Localization:** Depends on **apps** and gateway support for the exact payment methods and invoicing you need.

## Typical “plugin / app” categories merchants pay for

- Malaysian **payment gateway** connector (if not using a generic Stripe setup).
- **Shipping rates** / courier integrations, pickup, COD workflows.
- **Subscriptions**, memberships, bundles.
- **Reviews**, loyalty, affiliate, upsell.
- **ERP / accounting** sync (Xero, etc.) and marketplace sync (often third-party).

## Sources

- [Shopify Malaysia pricing](https://www.shopify.com/my/pricing)
- [Shopify Plus pricing (Malaysia)](https://www.shopify.com/my/plus/pricing)
- [Shopify POS pricing (Malaysia)](https://www.shopify.com/my/pos/pricing)
- [Facebook and Instagram by Meta — Shopify Help](https://help.shopify.com/en/manual/online-sales-channels/facebook-instagram-by-meta)
- [Google & YouTube channel — connect / Merchant Center](https://help.shopify.com/en/manual/online-sales-channels/marketplaces/google/getting-setup/connect)
- Secondary (MYR illustration, gateway note): [BigSeller — Shopify Malaysia pricing guide](https://www.bigseller.com/blog/articleDetails/3636/shopify-malaysia-pricing-guide.htm)

## App Store taxonomy and first-party apps

For **every official App Store tag** (what third-party apps are classified as) and a table of **apps made by Shopify**, see [shopify-apps-catalog.md](shopify-apps-catalog.md). **Chinese version** (same structure + explanation for stakeholders who asked for a “full list”): [shopify-apps-catalog-zh-CN.md](shopify-apps-catalog-zh-CN.md). Listing all **16,000+** third-party apps by name is not practical in a static doc; use the App Store browse links there.