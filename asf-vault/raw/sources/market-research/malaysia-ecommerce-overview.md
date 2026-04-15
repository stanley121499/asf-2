# Malaysia e-commerce landscape (merchant view)

**Updated:** April 2026  

## How Malaysian sellers actually go online

Most consumers discover and buy through **Shopee**, **Lazada**, **TikTok Shop**, and **brand websites / Instagram / WhatsApp**. A “normal” small business often:

1. Starts on **marketplaces** (low setup, built-in traffic, platform logistics).
2. Adds **social selling** (Live, chat, links).
3. Later builds an **owned store** (Shopify, WooCommerce, EasyStore, SiteGiant, etc.) for margin, data, and brand.

Owned-store platforms compete on **ease of setup**, **local payment and courier integrations**, **omnichannel sync** (web + marketplace + POS), and **ongoing fees** (subscription + transaction + apps).

## Payments (owned stores)

Malaysian shoppers expect **FPX (online banking)**, **cards**, **e-wallets** (GrabPay, TnG, Boost, etc.), and increasingly **DuitNow QR**.  

- **Shopify:** [Shopify Payments is not available in Malaysia](https://www.shopify.com/my/pricing) as of common merchant guidance; stores typically use **third-party gateways** (for example iPay88, PayPal, Stripe where applicable). Shopify then charges an **additional percentage** on third-party gateways unless you are on a plan that reduces it. See [shopify.md](shopify.md).
- **WooCommerce / WordPress:** No platform transaction fee; you pay **hosting** + **gateway fees** (and premium plugins if any). See [wordpress-woocommerce.md](wordpress-woocommerce.md).
- **Local SaaS (EasyStore, SiteGiant):** Usually advertise **bundled** integrations with Malaysian gateways and couriers; verify per plan.

## Logistics

Common expectations: **Pos Laju**, **J&T**, **DHL**, **Ninja Van**, **Pgeon**, etc., with **rate tables** or **API-calculated** shipping. WooCommerce and Shopify both rely on **plugins/apps** or manual rates; local platforms often emphasize **pre-integrated** flows.

## Total cost of ownership (mental model)


| Cost bucket     | Typical components                               |
| --------------- | ------------------------------------------------ |
| Subscription    | Monthly / annual platform fee (USD or MYR)       |
| Transaction     | Platform fee + payment gateway MDR + SST on fees |
| Apps / plugins  | Shipping, subscriptions, ERP sync, SEO, bundles  |
| People / agency | Theme, custom features, ads, content             |
| Compliance      | SSM registration, invoices, tax reporting        |


## Competitor map (this research pack)


| Category                    | Examples in this pack       |
| --------------------------- | --------------------------- |
| Global SaaS, full hosted    | Shopify, BigCommerce        |
| Site builder + commerce     | Wix, Squarespace            |
| Self-hosted + plugin        | WordPress + WooCommerce     |
| Malaysia / SEA focused SaaS | EasyStore, SiteGiant        |
| Marketplaces                | Shopee, Lazada, TikTok Shop |


## Integration checklist (what “full stack” usually means)

When comparing platforms, merchants often care about these **small but decisive** hooks—not only “can I sell?”


| Need                 | What to verify in trials                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Meta (FB/IG)**     | Catalog sync, Shop / Shopping approval, **Pixel** + **Conversions API**, ad account linkage.                                        |
| **Google**           | **Merchant Center** feed quality, **free listings** eligibility by country, **Ads** / **Performance Max**, **GA4** or **Site Kit**. |
| **TikTok**           | **TikTok Shop** vs **pixel-only** vs catalog ads; region rules change often.                                                        |
| **Messaging**        | **WhatsApp** order updates, chat widgets, broadcast automation (EasyStore vs Woo plugins vs Shopify apps).                          |
| **Email / SMS**      | Transactional deliverability (SMTP on Woo), automation (Klaviyo / Omnisend / native tools).                                         |
| **SEO**              | Blog + URL control + schema + speed (WordPress wins flexibility; SaaS wins simplicity).                                             |
| **Marketplace sync** | Shopee/Lazada/TikTok **inventory** and **order** two-way sync—often the reason locals pick **EasyStore / SiteGiant**.               |


Detailed per-platform tables: [shopify.md](shopify.md), [wordpress-woocommerce.md](wordpress-woocommerce.md), [malaysia-local-platforms.md](malaysia-local-platforms.md), [other-saas-wix-squarespace-bigcommerce.md](other-saas-wix-squarespace-bigcommerce.md).

## Links

- Shopify Malaysia pricing: [https://www.shopify.com/my/pricing](https://www.shopify.com/my/pricing)
- EasyStore Malaysia pricing: [https://www.easystore.co/en-my/pricing](https://www.easystore.co/en-my/pricing)
- SiteGiant: [https://sitegiant.my/](https://sitegiant.my/)