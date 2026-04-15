# Shopify App Store: taxonomy + first-party apps

**Updated:** April 2026  
**中文版（含「为何无逐条第三方名单」说明）:** [shopify-apps-catalog-zh-CN.md](shopify-apps-catalog-zh-CN.md)  
**Purpose:** Clarify what “Shopify plugins” (**apps**) are, list **every official App Store tag** (what third-party apps are *classified* as), and list **every app made by Shopify** with a short description.  

**Important:** The public App Store contains **well over 16,000** third-party apps ([Shopify marketing copy](https://apps.shopify.com/)). A static file cannot list **every** third-party app by name; that set changes daily. Use the browse links at the end to explore the live directory.

---

## 1. What counts as a “plugin” on Shopify?

Shopify uses the term **app** (not “plugin”). Apps extend the **admin**, **checkout**, **theme app extensions**, **customer accounts**, and **sales channels**. Each listing is reviewed before publication (Shopify cites a multi-checkpoint process on the App Store home page).

---

## 2. Official App Store taxonomy (every category, subcategory, and tag)

Shopify assigns each app to **one primary tag** (and optionally a secondary tag). The table below is the **authoritative taxonomy** from Shopify’s developer documentation: [App listing categories](https://shopify.dev/docs/apps/launch/app-store-review/app-listing-categories).  

**Note:** Shopify states that taxonomy **can change** over time (“taxonomy governance”). If this file drifts, use the dev doc link.

**How to read the extra columns**

- **What you can do** — practical outcomes merchants usually want from this tag (not Shopify’s legal wording).
- **Example app** — one well-known **third-party** app that often carries this tag (illustration only; not a recommendation; many alternatives exist on the App Store).

### 2.1 Sales channels

**Category intent:** Apps that let merchants sell to customers using sales channels.


| Tag                           | Shopify’s definition                                                | What you can do                                                                                                                   | Example app                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Marketplaces**              | Publish products on online marketplaces.                            | List the same catalog on Amazon, eBay, TikTok Shop, Etsy, etc.; sync orders and stock so you do not oversell.                     | [LitCommerce](https://apps.shopify.com/litcommerce) (multichannel listing / sync)                             |
| **Product feeds**             | Use structured data files to manage product information.            | Build clean feeds for Google Shopping, Meta catalogs, Microsoft Ads, affiliate networks; fix errors and schedule updates.         | [Simprosys Google Shopping Feed](https://apps.shopify.com/simprosys-google-shopping-feed)                     |
| **Store data importer**       | Migrate product and store data between Shopify and other platforms. | Move products, customers, orders, or reviews when replatforming or merging stores; bulk CSV/API style workflows.                  | [Matrixify](https://apps.shopify.com/excel-export-import)                                                     |
| **Selling online - Other**    | Other ways to sell online.                                          | Catch-all: social storefronts, creator tools, or niche channels that are not a standard marketplace feed.                         | [Instafeed](https://apps.shopify.com/instafeed) (Instagram content / social proof on storefront)              |
| **Retail**                    | In-person payment or inventory sync.                                | Run pop-ups, markets, or outlets with hardware and stock tied to Shopify (often alongside **Shopify POS**, which is first-party). | [ConnectPOS](https://apps.shopify.com/connectpos) (third-party omnichannel POS example)                       |
| **Store locator**             | Help customers find retail locations.                               | Show a map of stockists, dealers, or your own branches with hours and directions.                                                 | [Stockist Store Locator](https://apps.shopify.com/store-locator)                                              |
| **SKU and barcodes**          | Create SKUs and barcodes for products.                              | Generate/print barcode labels that match variants for scanning at dispatch or retail.                                             | [Multi‑Label Barcodes](https://apps.shopify.com/multi-label-barcodes) (example category fit; compare reviews) |
| **Selling in person - Other** | Other in-person selling tools.                                      | Edge cases: event check-in, mobile selling, or hybrid flows beyond classic POS.                                                   | [EasyTeam](https://apps.shopify.com/easyteam) (staff POS / commissions angle—verify fit for your stack)       |


### 2.2 Finding products

**Category intent:** Apps that help merchants find and source products for their store.


| Tag                          | Shopify’s definition                               | What you can do                                                                                        | Example app                                                                                                                             |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Dropshipping**             | Manage third-party inventory and fulfillment.      | Import supplier catalogs, auto-send orders to a supplier, and track fulfillment without holding stock. | [DSers](https://apps.shopify.com/dsers)                                                                                                 |
| **Print on demand (POD)**    | Partner prints and ships custom-designed products. | Launch apparel or home goods with mockups; no bulk inventory up front.                                 | [Printful](https://apps.shopify.com/printful)                                                                                           |
| **Wholesale**                | Buy or sell products wholesale.                    | Source B2B inventory **or** offer wholesale price lists and net terms to business buyers.              | [Faire: Sell Wholesale](https://apps.shopify.com/faire-buy-wholesale) / [Wholesale Gorilla](https://apps.shopify.com/wholesale-gorilla) |
| **Sourcing options - Other** | Other sourcing methods.                            | Discover suppliers, research products, or automate sourcing outside one dropship rail.                 | [Spocket](https://apps.shopify.com/spocket)                                                                                             |


### 2.3 Selling products

**Category intent:** Apps that expand a merchant’s product offerings or payment options.


| Tag                                    | Shopify’s definition                        | What you can do                                                                             | Example app                                                                                               |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Subscriptions**                      | Ongoing subscription payments for products. | Sell “subscribe and save”, boxes, or memberships with billing cycles and customer portals.  | [Appstle Subscriptions](https://apps.shopify.com/subscriptions-by-appstle)                                |
| **Payments**                           | Financing / pay-over-time style options.    | Offer BNPL or installments so customers split payment while you get paid per partner rules. | [Klarna On‑Site Messaging](https://apps.shopify.com/klarna-on-site-messaging) (check region availability) |
| **Cash on delivery (COD)**             | Collect or verify payment on delivery.      | Custom COD checkout, phone confirmation, fees, or OTP flows common in certain markets.      | [Releasit COD Form & Upsells](https://apps.shopify.com/releasit-cod-order-form)                           |
| **Payment options - Other**            | Other payment experiences.                  | Alternate gateways, partial payments, deposits, or invoice-pay workflows.                   | [Splitit](https://apps.shopify.com/splitit) (installments; verify regions)                                |
| **Pricing optimization**               | Improve pricing strategy.                   | Monitor competitors or rules to adjust prices (use carefully for trust and MAP policies).   | [Prisync](https://apps.shopify.com/prisync)                                                               |
| **Pricing quotes**                     | Custom prices or quote requests.            | Let B2B or made-to-order buyers request a quote instead of paying list price online.        | [Globo Request a Quote](https://apps.shopify.com/globo-request-quote)                                     |
| **Pricing - Other**                    | Other pricing tools.                        | Volume breaks, hidden prices until login, or complex price lists.                           | [B2B Wholesale Club](https://apps.shopify.com/b2b-wholesale-club)                                         |
| **Digital products**                   | Sell and deliver digital products.          | Secure downloads, license keys, or streaming links after purchase.                          | [Sky Pilot](https://apps.shopify.com/sky-pilot)                                                           |
| **NFTs and tokengating**               | NFT sales and tokengated perks.             | Gate collections or content to wallet holders; NFT drops (compliance-heavy).                | [Manifold](https://apps.shopify.com/manifold-merch)                                                       |
| **Event booking**                      | Sell access to classes, shows, events.      | Appointment scheduling, tickets, or capacity-managed sessions.                              | [Sesami](https://apps.shopify.com/sesami)                                                                 |
| **Digital goods and services - Other** | Other digital / service selling.            | Licenses, memberships bolted to digital delivery, or hybrid service SKUs.                   | [SendOwl](https://apps.shopify.com/sendowl)                                                               |
| **Product variants**                   | Multiple variations beyond native limits.   | Extra options, swatches, conditional fields, or “build your own” bundles.                   | [Infinite Options](https://apps.shopify.com/infinite-options)                                             |
| **Custom file upload**                 | Customer images / custom info on orders.    | Personalization: monograms, photos for print, or artwork upload for review.                 | [Zepto Product Personalizer](https://apps.shopify.com/product-personalizer)                               |
| **Custom products - Other**            | Other customization flows.                  | Engraving text rules, complex configurators, or made-to-order line items.                   | [SC Product Options](https://apps.shopify.com/product-options)                                            |


### 2.4 Store design

**Category intent:** Apps that help merchants customize the look and feel of their store.


| Tag                               | Shopify’s definition                    | What you can do                                                                                           | Example app                                                                      |
| --------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Page builder**                  | Build and customize pages in the theme. | Drag‑and‑drop landing pages, home sections, and campaign pages without coding each block by hand.         | [PageFly](https://apps.shopify.com/pagefly)                                      |
| **Mobile app builder**            | Branded iOS/Android shopping apps.      | Publish a branded app with push notifications and mobile-first merchandising (often subscription-priced). | [Tapcart](https://apps.shopify.com/tapcart)                                      |
| **Storefronts - Other**           | Other storefront experiences.           | Alternative layout engines, microsites, or section libraries that extend the theme.                       | [GemPages](https://apps.shopify.com/gempages)                                    |
| **SEO**                           | Improve search visibility.              | Meta templates, structured data, broken-link checks, and speed-related SEO fixes.                         | [Plug In SEO](https://apps.shopify.com/plug-in-seo)                              |
| **Accessibility**                 | Assistive-technology-friendly shopping. | Widgets and audits aimed at WCAG-style accessibility (still validate with experts).                       | [Accessibility Enabler](https://apps.shopify.com/accessibility)                  |
| **Site optimization - Other**     | Other performance / UX tuning.          | Image compression, lazy loading, script control, Core Web Vitals monitoring.                              | [Tiny SEO Speed Image Optimizer](https://apps.shopify.com/smart-image-optimizer) |
| **Search and filters**            | Search and faceted browse.              | Instant search, synonyms, typo tolerance, and advanced collection filters.                                | [Searchanise Search & Filter](https://apps.shopify.com/searchanise)              |
| **Navigation and menus**          | Menus and wayfinding.                   | Mega menus, multi-column navigation, highlighted collections in flyouts.                                  | [Globo Mega Menu](https://apps.shopify.com/mega-menu-navigation)                 |
| **Search and navigation - Other** | Other discovery UX.                     | Lookbooks, curated paths, or nonstandard browse patterns.                                                 | [Zooomy Lookbook](https://apps.shopify.com/lookbook)                             |
| **Image gallery**                 | Galleries of images.                    | Shoppable Instagram-style grids, lookbooks, or curated photo sets.                                        | [Covet.pics](https://apps.shopify.com/covet-pics)                                |
| **Image editor**                  | Edit and optimize images.               | Bulk resize, compress, rename, or background-remove catalog images.                                       | [Photo Resize](https://apps.shopify.com/photo-resize)                            |
| **Video and livestream**          | Video and shoppable live.               | Product page video tabs, UGC video, replays, or live-sale embeds.                                         | [Videowise](https://apps.shopify.com/videowise)                                  |
| **3D/AR/VR**                      | 3D / try-on experiences.                | 3D viewers, AR placement, virtual try-on for eligible categories.                                         | [Zakeke](https://apps.shopify.com/zakeke-customizer-2)                           |
| **Images and media - Other**      | Other rich media.                       | 360° spins, zoom viewers, mixed media carousels.                                                          | [Sirv](https://apps.shopify.com/sirv)                                            |
| **Animation and effects**         | Motion and sound on the storefront.     | Announcement motion, hover effects, seasonal animations (watch page weight).                              | [Hextom Quick Announcement Bar](https://apps.shopify.com/quick-announcement-bar) |
| **Badges and icons**              | Icons and trust marks.                  | Payment/shipping badges, “sale/new” labels, custom icon rows.                                             | [Trust Badges Bear](https://apps.shopify.com/trust-badges)                       |
| **Design elements - Other**       | Other decorative UI.                    | Confetti, cursor effects, decorative overlays.                                                            | [Proof Bear — Sales Pop](https://apps.shopify.com/proof-bear)                    |
| **Banners**                       | Announcement bars and banners.          | Free-shipping thresholds, cut-off times, promos, operational notices.                                     | [Essential Free Shipping Bar](https://apps.shopify.com/free-shipping-bar)        |
| **Pop-ups**                       | Pop-up modals.                          | Lead capture, discount offers, exit intent, announcements.                                                | [Privy](https://apps.shopify.com/privy)                                          |
| **Forms**                         | Capture structured customer info.       | Contact, wholesale application, repair intakes, custom fields to Admin.                                   | [Hulk Form Builder](https://apps.shopify.com/hulk-form-builder)                  |
| **Notifications - Other**         | Other on-site messaging.                | Web push opt-in, slide-ins, sticky CTAs beyond classic banners.                                           | [PushOwl Web Push](https://apps.shopify.com/pushowl)                             |
| **Metafields**                    | Custom data on resources.               | Edit metafields in bulk, templates for specs, connect data to theme sections.                             | [Metafields Guru](https://apps.shopify.com/metafields-editor-2)                  |
| **Product content**               | Better listings and descriptions.       | AI-assisted copy, bulk rewrites, spec tables, consistent formatting.                                      | [Describely](https://apps.shopify.com/describely)                                |
| **Blogs**                         | Blog UX and layout.                     | Richer article layouts, related products in posts, editorial components.                                  | [Bloggle Powerful Blog Builder](https://apps.shopify.com/bloggle)                |
| **Content - Other**               | Other content tooling.                  | FAQ hubs, help centers, structured content blocks.                                                        | [HelpCenter](https://apps.shopify.com/helpcenter)                                |
| **Product comparison**            | Side‑by‑side compare.                   | Compare specs across a shortlist of products.                                                             | [Comparable](https://apps.shopify.com/comparable)                                |
| **Collections**                   | Bulk collection work.                   | Automated sorting, merchandising rules, import/export of collection membership.                           | [Collection Merchandiser](https://apps.shopify.com/collection-merchandiser)      |
| **Product display - Other**       | Other merchandising display.            | Size charts, tabs, complete-the-look modules.                                                             | [Kiwi Size Chart & Recommender](https://apps.shopify.com/kiwi-sizing)            |
| **Currency and translation**      | Multi-currency / language.              | Translate UI and content; show prices in local currency where supported.                                  | [Weglot](https://apps.shopify.com/weglot)                                        |
| **Geolocation**                   | Location-based experiences.             | Suggest correct market, language, or currency; geo-targeted messaging.                                    | [Orbe](https://apps.shopify.com/orbe)                                            |
| **Cookie consent**                | Cookie / privacy banners.               | Consent logging, cookie categorization, script blocking (legal review advised).                           | [Pandectes GDPR Compliance](https://apps.shopify.com/pandectes-gdpr)             |
| **Internationalization - Other**  | Other global commerce UX.               | Regional landing pages, mixed-language workflows beyond one app’s scope.                                  | [Langify](https://apps.shopify.com/langify)                                      |


### 2.5 Orders and shipping

**Category intent:** Apps that help merchants manage and process orders for customers.


| Tag                              | Shopify’s definition                      | What you can do                                                                    | Example app                                                              |
| -------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Order tracking**               | Share order status with customers.        | Branded tracking pages, email/SMS updates, reduce “where is my order?” tickets.    | [17TRACK Order Tracking](https://apps.shopify.com/17track)               |
| **Order editing**                | Change orders after placement.            | Let staff or customers add items, swap variants, or fix addresses within rules.    | [Cleverific Order Editing](https://apps.shopify.com/edit-order)          |
| **Invoices and receipts**        | Documents for accounting and fulfillment. | PDF invoices, quotes, packing slips, return forms with your branding.              | [Order Printer Pro](https://apps.shopify.com/order-printer-pro)          |
| **Orders - Other**               | Other order operations.                   | Bulk actions, tagging rules, fraud holds, custom order workflows.                  | [Mechanic](https://apps.shopify.com/mechanic)                            |
| **Shipping**                     | Fulfillment, labels, reporting.           | Buy labels, batch print, manifest, multi-carrier fulfillment from Admin.           | [ShipStation](https://apps.shopify.com/shipstation)                      |
| **Shipping rates**               | Checkout shipping quotes.                 | Live carrier rates, blended rules, free-shipping thresholds by zone.               | [Easyship](https://apps.shopify.com/easyship)                            |
| **Third-party logistics (3PL)**  | Outsource storage and shipping.           | Send orders to a 3PL, sync inventory, and receive tracking back.                   | [ShipBob](https://apps.shopify.com/shipbob-fulfillment)                  |
| **Delivery and pickup**          | Local delivery or pickup.                 | Delivery windows, store pickup slots, driver routing basics.                       | [Zapiet ‑ Pickup + Delivery](https://apps.shopify.com/click-and-collect) |
| **Shipping solutions - Other**   | Other fulfillment edges.                  | Hybrid flows (dropship + warehouse), per-vendor routing.                           | [ShipHero](https://apps.shopify.com/shiphero)                            |
| **Inventory sync**               | Keep stock aligned across systems.        | Two-way sync with Amazon, POS, ERP, or marketplaces to prevent oversells.          | [Syncio](https://apps.shopify.com/syncio)                                |
| **Inventory optimization**       | Forecasting and replenishment.            | Reorder points, demand signals, stock alerts for purchasers.                       | [Inventory Planner](https://apps.shopify.com/inventory-planner)          |
| **ERP**                          | Finance and operations backbone.          | Sync orders, payouts, fees, and SKUs into accounting / ERP (implementation-heavy). | [A2X Accounting](https://apps.shopify.com/a2x-accounting)                |
| **Inventory - Other**            | Other stock tooling.                      | Stock takes, bin locations, multi-warehouse rules, low-stock alerts.               | [Stock Sync](https://apps.shopify.com/stock-sync)                        |
| **Returns and exchanges**        | RMA workflows.                            | Self-service returns portal, labels, refunds, exchange SKUs.                       | [Loop Returns](https://apps.shopify.com/loop-returns)                    |
| **Warranties and insurance**     | Add-on protection at checkout.            | Offer extended warranty or shipping protection for a fee.                          | [Mulberry Warranty](https://apps.shopify.com/mulberry)                   |
| **Returns and warranty - Other** | Other post-purchase protection.           | Store-credit returns, partial refunds, restocking fee automation.                  | [ReturnGO](https://apps.shopify.com/returngo)                            |


### 2.6 Marketing and conversion

**Category intent:** Apps that help merchants promote and motivate customers to buy.


| Tag                            | Shopify’s definition              | What you can do                                                                                      | Example app                                                                                                                                             |
| ------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ads**                        | Paid ads across channels.         | Create/sync catalog ads, retargeting, and attribution dashboards (often alongside Meta/Google apps). | [AdRoll Advertising & Marketing](https://apps.shopify.com/adroll)                                                                                       |
| **Affiliate programs**         | Partner / influencer commissions. | Recruitment links, coupon codes, tiered commissions, payout tracking.                                | [UpPromote Affiliate Marketing](https://apps.shopify.com/affiliate-by-secomapp)                                                                         |
| **Advertising - Other**        | Other paid growth tools.          | Influencer marketplaces, podcast codes, PR promo codes at scale.                                     | [Aspire](https://apps.shopify.com/aspireiq)                                                                                                             |
| **Email marketing**            | Email campaigns and automation.   | Flows, segments, newsletters, product blocks in email.                                               | [Klaviyo](https://apps.shopify.com/klaviyo-email-marketing)                                                                                             |
| **SMS marketing**              | SMS campaigns and automation.     | Flash sales, back-in-stock SMS, compliance tooling (TCPA/region rules).                              | [SMSBump](https://apps.shopify.com/smsbump)                                                                                                             |
| **Web push**                   | Browser push notifications.       | Price-drop alerts, cart reminders without email.                                                     | [PushOwl Web Push](https://apps.shopify.com/pushowl)                                                                                                    |
| **Abandoned cart**             | Recover abandoned checkouts.      | Sequences across email/SMS/push with incentives and timing tests.                                    | [Recart](https://apps.shopify.com/recart)                                                                                                               |
| **Marketing - Other**          | Other outreach.                   | Direct mail integrations, QR campaigns, referral widgets.                                            | [ReferralCandy](https://apps.shopify.com/referralcandy)                                                                                                 |
| **Cart customization**         | Richer cart / drawer UX.          | Free-shipping progress, upsell tiles, notes, rewards hints in cart.                                  | [UpCart](https://apps.shopify.com/upcart)                                                                                                               |
| **Order limits**               | Min/max purchase rules.           | MOQs, case packs, wholesale minimums, max per customer.                                              | [MinMaxify](https://apps.shopify.com/minmaxify)                                                                                                         |
| **Checkout - Other**           | Other checkout tweaks.            | Custom fields, delivery date pickers (where supported), validation rules.                            | [Checkout Blocks](https://apps.shopify.com/checkout-blocks) (Shopify; Plus-gated features) / third-party: search “checkout customization” for your plan |
| **Discounts**                  | Codes and promotions.             | Automatic discounts, stack rules, scheduled sales, BOGO.                                             | [Bold Discounts](https://apps.shopify.com/discounts)                                                                                                    |
| **Giveaways and contests**     | Contests and sweepstakes.         | Viral giveaways, bonus entries, list growth tied to promos.                                          | [Gleam Competitions](https://apps.shopify.com/gleam)                                                                                                    |
| **Promotions - Other**         | Other deal mechanics.             | Mystery gifts, spin wheels (use carefully for brand fit).                                            | [BOGOS Free Gift](https://apps.shopify.com/bogos-free-gift-buy-x-get-y)                                                                                 |
| **Gift cards**                 | Digital gift cards.               | Sell/store gift cards; sometimes advanced scheduling or bulk issuance.                               | [Gift Card Pro](https://apps.shopify.com/gift-card-pro)                                                                                                 |
| **Gift wrap and messages**     | Gifting options at checkout.      | Wrap fees, gift messages, hide prices on packing slips.                                              | [Gift Wrap Plus](https://apps.shopify.com/gift-wrap-plus)                                                                                               |
| **Gifts - Other**              | Other gifting flows.              | Corporate gifting portals, scheduled gift sends, multi-recipient checkout.                           | [Super:Gifting](https://apps.shopify.com/super-gifting)                                                                                                 |
| **Product bundles**            | Multi-SKU bundles.                | Fixed bundles, mix-and-match, volume breaks.                                                         | [Bundler ‑ Product Bundles](https://apps.shopify.com/bundler-product-bundles)                                                                           |
| **Upsell and cross-sell**      | Add-ons before purchase.          | Frequently bought together, cart upsell, post-add popups.                                            | [Frequently Bought Together](https://apps.shopify.com/frequently-bought-together)                                                                       |
| **Countdown timer**            | Urgency timers.                   | Sale end timers, launch countdowns on product or collection pages.                                   | [Hextom Countdown Timer](https://apps.shopify.com/countdown-timer-bar)                                                                                  |
| **Stock alerts**               | Back-in-stock comms.              | Notify waitlist when inventory returns; capture demand signals.                                      | [Back in Stock ‑ Restock Alerts](https://apps.shopify.com/back-in-stock-restock-alerts)                                                                 |
| **Pre-orders**                 | Sell before stock lands.          | Charge now or later, ETA messaging, deposit pre-orders.                                              | [Preorder Wolf](https://apps.shopify.com/preorder-now)                                                                                                  |
| **Upsell and bundles - Other** | Other revenue lift tactics.       | Post-purchase one-click upsell, tip jars, charity add-ons.                                           | [ReConvert](https://apps.shopify.com/reconvert)                                                                                                         |
| **Product reviews**            | Ratings and written reviews.      | Collect reviews, photos, Q&A, syndicate to Google Shopping.                                          | [Judge.me](https://apps.shopify.com/judgeme)                                                                                                            |
| **Social proof**               | Activity and popularity cues.     | “X people viewing”, recent sales popups, low-stock nudges.                                           | [Fomo](https://apps.shopify.com/fomo)                                                                                                                   |
| **Social trust - Other**       | Other trust signals.              | UGC galleries tied to checkout trust.                                                                | [Loox](https://apps.shopify.com/loox)                                                                                                                   |
| **Loyalty and rewards**        | Points and VIP tiers.             | Earn/redeem points, referrals, VIP perks, POS + online sync.                                         | [Smile.io](https://apps.shopify.com/smile-io)                                                                                                           |
| **Wishlists**                  | Save for later lists.             | Email-me when on sale, shareable wishlists, wedding registries.                                      | [Wishlist Plus](https://apps.shopify.com/swym-relay)                                                                                                    |
| **Donations**                  | Charity add-ons.                  | Round-up donations or SKU-linked giving.                                                             | [ShoppingGives](https://apps.shopify.com/shopping-gives)                                                                                                |
| **Customer loyalty - Other**   | Other retention mechanics.        | Paid memberships, early access drops.                                                                | [Inveterate](https://apps.shopify.com/inveterate)                                                                                                       |


### 2.7 Store management

**Category intent:** Apps that help merchants manage their store.


| Tag                     | Shopify’s definition                 | What you can do                                                                             | Example app                                                                  |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Workflow automation** | Automate multi-step admin work.      | Tag customers on purchase, auto-cancel risky orders, scheduled publishing.                  | [Mechanic](https://apps.shopify.com/mechanic)                                |
| **Bulk editor**         | Mass updates to catalog data.        | Bulk price changes, image alt text, metafields, CSV-style workflows.                        | [Bulk Product Edit](https://apps.shopify.com/bulk-product-edit)              |
| **Staff notifications** | Alerts to team / vendors.            | Slack/Email alerts for new orders, low stock, chargebacks.                                  | [Order Automator](https://apps.shopify.com/order-automator)                  |
| **Analytics**           | Deeper reporting than default Admin. | Cohort views, MER/ROAS style dashboards, custom metrics.                                    | [Polar](https://apps.shopify.com/polar-analytics)                            |
| **Operations - Other**  | Other back-office glue.              | Data cleanup, SKU normalization, scheduled exports.                                         | [Matrixify](https://apps.shopify.com/excel-export-import)                    |
| **Legal**               | Policies and compliance surfacing.   | Cookie policies, terms acceptance checkboxes, age gates (lawyer review still required).     | [Enzuzo GDPR/CCPA](https://apps.shopify.com/enzuzo)                          |
| **Fraud**               | Fraud screening and rules.           | Block high-risk orders, AVS/CVV checks, allowlists.                                         | [NoFraud Fraud Protection](https://apps.shopify.com/nofraud)                 |
| **Anti theft**          | Protect store media / content.       | Disable right-click, watermark images, deter casual copying.                                | [Cozy Image Gallery](https://apps.shopify.com/cozy-image-gallery)            |
| **Accounts and login**  | Customer identity UX.                | Social login, OTP login, B2B registration gates.                                            | [Flare Social Login](https://apps.shopify.com/flare)                         |
| **Security - Other**    | Other risk controls.                 | IP allowlists, admin alerts, anomaly monitoring (offerings change quickly—compare reviews). | Search [App Store](https://apps.shopify.com/) for “security” / “monitoring”. |
| **Accounting**          | Bookkeeping integrations.            | Post sales, fees, refunds, payouts to accounting ledgers.                                   | [QuickBooks Sync](https://apps.shopify.com/quickbooks-online)                |
| **Taxes**               | Tax calculation / filing help.       | Automated rates, exemption handling, filing-oriented exports (region-dependent).            | [TaxJar Sales Tax Automation](https://apps.shopify.com/taxjar)               |
| **Finances - Other**    | Other money ops.                     | Invoicing, AR, payout reconciliation beyond one connector.                                  | [Xero](https://apps.shopify.com/xero)                                        |
| **Chat**                | Real-time customer chat.             | Live chat widget, bots, FAQ shortcuts in chat.                                              | [Tidio](https://apps.shopify.com/tidio-chat)                                 |
| **Helpdesk**            | Ticketed support from orders.        | View order context inside tickets; macros; SLA views.                                       | [Gorgias](https://apps.shopify.com/gorgias)                                  |
| **FAQ**                 | Self-service answers.                | Searchable FAQ pages, contact deflection, help widgets.                                     | [HelpCenter](https://apps.shopify.com/helpcenter)                            |
| **Surveys**             | Feedback collection.                 | NPS, post-purchase surveys, product research polls.                                         | [Zigpoll](https://apps.shopify.com/zigpoll)                                  |
| **Support - Other**     | Other CX tooling.                    | Warranty registration, RMA chat handoff, phone support logging.                             | [Richpanel](https://apps.shopify.com/richpanel)                              |


---

## 3. Apps made by Shopify (first-party list)

These are **Shopify-built** apps (usually free; supported by Shopify). The canonical list and descriptions are maintained here:

- [Apps made by Shopify — Help Center](https://help.shopify.com/en/manual/apps/apps-by-shopify)  
- [Apps by Shopify — App Store partner page](https://apps.shopify.com/partners/shopify) (count was **39** apps at time of research)

Alphabetical **name → what it does** (summarized from Help Center / App Store copy, April 2026):


| App                                | What it does                                                                                                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Buy Button channel**             | Embeds a **Buy Button** on external sites, blogs, or emails so buyers use **Shopify Checkout**.                                                                                                                                     |
| **Data Exporter - Tax Compliance** | Exports store data for submission to **tax authorities** ([tax help](https://help.shopify.com/en/manual/taxes/data-exporter-app)).                                                                                                  |
| **Digital Downloads**              | Delivers **digital files** (e-books, audio, graphics, etc.) after purchase.                                                                                                                                                         |
| **Shopify Audiences**              | Uses Shopify-scale signals to improve **ad performance** on **Meta, Google, TikTok, Pinterest, Snapchat, Criteo**.                                                                                                                  |
| **Shopify Bill Pay**               | Pays business bills from **Shopify Balance**, cards, or **ACH**.                                                                                                                                                                    |
| **Shopify Bundles**                | Sells **fixed bundles / multipacks** to increase basket size.                                                                                                                                                                       |
| **Shopify Checkout Blocks**        | Customizes **Checkout**, **Thank you**, and **Order status** with blocks, branding, discounts (**Plus** for some features).                                                                                                         |
| **Shopify Collabs**                | Recruits **creators / influencers / affiliates** and tracks promotion performance.                                                                                                                                                  |
| **Shopify Collective**             | **Retailers** import products from other **Shopify brands** with live sync (pricing, inventory, details).                                                                                                                           |
| **Shopify Collective: Supplier**   | **Brands** share products with retailers via Collective (price lists, sell-on-your-behalf model).                                                                                                                                   |
| **Shopify Combined Listings**      | **Plus** — merges products into **enhanced combined listings** on the storefront.                                                                                                                                                   |
| **Shopify Counter**                | Connects to **Counter** hardware / experience to **display live sales and orders** and milestones ([App Store](https://apps.shopify.com/shopify-counter)).                                                                          |
| **Shopify Messaging**              | **Email and SMS** campaigns, segments, templates, and reporting—built by Shopify ([App Store](https://apps.shopify.com/shopify-messaging)). Help Center may still refer to this product area as **Shopify Email**.                  |
| **Shopify Flow**                   | **Visual automation** for admin tasks (events, conditions, actions).                                                                                                                                                                |
| **Shopify Forms**                  | Embeddable **forms** to capture leads and grow marketing lists.                                                                                                                                                                     |
| **Shopify Fraud Control**          | Monitors **fraud risk** and security signals for the store.                                                                                                                                                                         |
| **Shopify Fulfillment Network**    | Connects merchants to **3PL** partners (e.g. Flexport, ShipBob, Shipfusion, ShipMonk).                                                                                                                                              |
| **Shopify Headless**               | **Sales channel** to manage **Storefront API** tokens and headless integrations from Admin.                                                                                                                                         |
| **Hydrogen** (tooling)             | **Headless** stack (with Oxygen) for custom storefronts — developer-oriented.                                                                                                                                                       |
| **Shopify Inbox**                  | **Chat** with online customers, automations, appearance controls, conversation analytics.                                                                                                                                           |
| **Shopify Knowledge Base**         | Edits **FAQs** used by **AI shopping agents** answering shopper questions.                                                                                                                                                          |
| **Shopify Launch Check**           | **AI-assisted** store-wide **pre-launch** checklist, recommendations, and shared team checklist ([App Store](https://apps.shopify.com/launch-check)).                                                                               |
| **Shopify Launchpad**              | **Plus** — schedules **events**, sales, drops, inventory restocks.                                                                                                                                                                  |
| **Shopify Marketplace Connect**    | Lists on **Amazon, Target Plus, Walmart, eBay**; syncs orders, inventory, listings in Admin.                                                                                                                                        |
| **Shopify Order Printer**          | Prints **invoices, labels, receipts, packing slips**, and related documents.                                                                                                                                                        |
| **Shopify Product Network**        | Surfaces an **instant catalog** of third-party products with **recommendations**; earn **commissions** or ad credits when customers buy; multi-brand checkout ([App Store](https://apps.shopify.com/product-network)).              |
| **Shopify Planet**                 | Funds **carbon removal** to offer **carbon-neutral shipping** positioning.                                                                                                                                                          |
| **Shopify POS**                    | **Point of sale** for retail; unifies with online catalog/inventory (iOS/Android).                                                                                                                                                  |
| **Retail Barcode Labels**          | Creates and prints **product barcode labels**.                                                                                                                                                                                      |
| **Shopify Search & Discovery**     | Tunes **search**, **filters**, and **recommendations** on the storefront ([help](https://help.shopify.com/en/manual/online-store/storefront-search#search-and-discovery)).                                                          |
| **Sell on WordPress**              | Shows **products/collections** on **WordPress** while managing commerce in Shopify.                                                                                                                                                 |
| **Shop channel**                   | Controls how the store appears in the **Shop** consumer app and related settings.                                                                                                                                                   |
| **Shopcodes**                      | Generates **QR codes** linking to products or checkout.                                                                                                                                                                             |
| **Stocky**                         | **Inventory** tooling: forecasting, **purchase orders**, stocktakes, transfers.                                                                                                                                                     |
| **Shopify SimGym**                 | **AI “shoppers”** simulate browsing on your theme to stress-test **navigation** and **add-to-cart** before you go live; usage-based pricing may apply ([App Store](https://apps.shopify.com/simgym)).                               |
| **Store import / migration**       | Help Center describes importing **products and customers** from other platforms; the exact **App Store** surface can change (sometimes Admin **migration** flows rather than a standalone listing—confirm in current Shopify docs). |
| **Shopify Subscriptions**          | Native **subscription** selling option for eligible stores.                                                                                                                                                                         |
| **Theme Access**                   | Safer **collaborator access** for agencies/partners working on themes.                                                                                                                                                              |
| **Shopify Translate & Adapt**      | **Translations** for products, collections, blogs, policies, pages.                                                                                                                                                                 |
| **TSE (KassenSichV)**              | **Germany** — **POS** transaction recording/export for **KassenSichV / TSE** compliance.                                                                                                                                            |


**Count drift:** Shopify adds, renames, or retires first-party apps. The partner page listed **39** apps at research time; the table above may include **channels + tooling** that are listed separately (for example **Hydrogen**). Treat [Apps made by Shopify](https://help.shopify.com/en/manual/apps/apps-by-shopify) and [partners/shopify](https://apps.shopify.com/partners/shopify) as **source of truth**.

---

## 4. Third-party apps: how to browse “everything”


| Goal                             | URL / method                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| All apps (paginated)             | [apps.shopify.com](https://apps.shopify.com/) — search and filters.                                                    |
| By high-level category           | App Store **Categories** menu (Sales channels, Finding products, …) — aligns with §2.                                  |
| Built for Shopify (quality tier) | [Built for Shopify collection](https://apps.shopify.com/collections/built-for-shopify) (1,000+ apps as of early 2026). |
| Only Shopify-built               | [apps.shopify.com/partners/shopify](https://apps.shopify.com/partners/shopify)                                         |


**Examples of third-party apps (illustrative only — not exhaustive):** Judge.me (reviews), Klaviyo (email/SMS), DSers (AliExpress dropshipping), Printful (POD), PageFly (pages), various **Malaysian payment gateway** apps, **Shopee/Lazada sync** apps, etc. Thousands more exist under the tags in §2.

---

## 5. Cross-links

- Malaysia-focused Shopify overview: [shopify.md](shopify.md)  
- Market research index: [README.md](README.md)

## 6. Sources

- [Shopify App Store](https://apps.shopify.com/)  
- [App listing categories (full taxonomy)](https://shopify.dev/docs/apps/launch/app-store-review/app-listing-categories)  
- [Apps made by Shopify](https://help.shopify.com/en/manual/apps/apps-by-shopify)  
- [Apps by Shopify partner page](https://apps.shopify.com/partners/shopify)

