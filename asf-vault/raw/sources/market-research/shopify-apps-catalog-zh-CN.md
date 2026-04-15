# Shopify 应用商店：官方分类全表 + Shopify 自家应用 + 举例说明（中文版）

**更新：** 2026 年 4 月  
**英文对照版：** [shopify-apps-catalog.md](shopify-apps-catalog.md)（与本文结构一致，便于核对）

---

## 给委托方 / 读者：关于「要看完整应用清单」的说明

### 为什么不能提供「每一个插件的名字都列出来」的完整清单？

1. **数量太大**
  Shopify 公开宣传其应用商店里有 **超过 16,000 个** 第三方应用（见 [Shopify App Store](https://apps.shopify.com/)）。任何 Word / Excel / Markdown **静态文件**都不可能在不立刻过期的前提下，把一万六千多条名称、简介、价格全部抄全。
2. **每天都在变**
  新应用上架、旧应用下架、改名、合并、被收购，**列表不是固定的**。今天打印的「完整名单」明天就不完整。
3. **「完整」有两种含义**
  - **名单式完整**：每一个应用的名称——只有 Shopify 自己的实时数据库能做到；对外只有分页浏览和搜索。  
  - **分类式完整**：Shopify **官方规定的每一种应用类型（标签）**——这是 **有限且封闭的列表**，来自 Shopify 开发者文档，可以 **100% 穷举**。

### 我们采用了哪种做法？（对竞品调研仍有用）


| 做法                            | 是否「每一条应用名都列」           | 对调研的价值                                     |
| ----------------------------- | ---------------------- | ------------------------------------------ |
| **穷举 Shopify 官方「标签」taxonomy** | 否（不是一万六千个名字）           | **高**：能回答「Shopify 生态在功能上覆盖哪些赛道」，和自有产品矩阵对照。 |
| **每个标签配 1 个举例应用 + 白话说明**      | 否                      | **高**：让人理解「这一类应用大概长什么样」；举例 **不代表推荐**，仅作插图。 |
| **列出 Shopify 官方自研应用（第一方）**    | 第一方可以接近列全（约数十个，会随时间增减） | **高**：看清平台自己补了哪些能力。                        |
| **附上如何在官网自行浏览「全部第三方应用」**      | —                      | **高**：需要点名某竞品应用时，请用链接里的搜索与分类自行查最新结果。       |


**结论（可写入汇报）：**  
我们无法也不建议承诺「Shopify 全部第三方应用名称的静态完整清单」；**替代方案是提供 Shopify 官方分类体系的完整映射 + 典型举例 + 第一方应用表 + 官方检索入口**，这在竞品分析中通常 **更有结构、更可对比**，且 **可维护**。

---

## 1. Shopify 上叫「应用」不叫「插件」

Shopify 对外统一用 **App（应用）**。应用可以扩展：**后台管理、结账、主题扩展、客户账户、销售渠道** 等。上架前需经 Shopify 审核（官网称有多项检查）。

---

## 2. 官方应用商店分类（每一类标签均已列出）

Shopify 给每个应用打 **一个主标签**（可选次要标签）。下表分类体系来自 Shopify 开发者文档（权威来源）：  
[App listing categories（应用上架分类）](https://shopify.dev/docs/apps/launch/app-store-review/app-listing-categories)

**说明：** 分类可能随 Shopify 治理调整；若与官网不一致，以英文文档为准。

**表头说明**

- **官方标签（英文）**：App Store 里用的英文分类名，便于您去英文后台或文档里核对。  
- **Shopify 定义（中译）**：官方对该标签的界定。  
- **实际能做什么**：店主/业务侧通常想达到的效果（白话）。  
- **举例（第三方）**：该类型下 **常见** 的一个应用，**仅作举例，不是广告或排名**；同类型还有很多替代品。

### 2.1 销售渠道（Sales channels）

**类别意图：** 通过各类「渠道」把货卖给客人。


| 官方标签（英文）                      | Shopify 定义（中译）           | 实际能做什么                                                 | 举例（第三方）                                                                                   |
| ----------------------------- | ------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Marketplaces**              | 在电商平台上发布商品。              | 把同一批商品挂到 Amazon、eBay、TikTok Shop、Etsy 等，并同步订单与库存，减少超卖。 | [LitCommerce](https://apps.shopify.com/litcommerce)                                       |
| **Product feeds**             | 用结构化数据文件管理商品信息。          | 给谷歌购物、Meta 目录、微软广告、联盟网络等做干净商品流，排错、定时更新。                | [Simprosys Google Shopping Feed](https://apps.shopify.com/simprosys-google-shopping-feed) |
| **Store data importer**       | 在 Shopify 与其他平台之间迁移店铺数据。 | 换平台、合并店铺时搬迁商品、客户、订单或评论；批量 CSV/API 类操作。                 | [Matrixify](https://apps.shopify.com/excel-export-import)                                 |
| **Selling online - Other**    | 其他网上销售方式。                | 社交橱窗、达人工具、非标准卖场通道等「杂项」。                                | [Instafeed](https://apps.shopify.com/instafeed)                                           |
| **Retail**                    | 线下收款或库存同步。               | 快闪店、市集、门店收银与网店库存联动（常与 **Shopify POS** 第一方一起用）。         | [ConnectPOS](https://apps.shopify.com/connectpos)                                         |
| **Store locator**             | 帮客人找线下门店。                | 经销商/分店地图、营业时间、路线。                                      | [Stockist Store Locator](https://apps.shopify.com/store-locator)                          |
| **SKU and barcodes**          | 为商品生成 SKU 与条码。           | 按规格生成/打印条码，方便发货或门店扫码。                                  | [Multi‑Label Barcodes](https://apps.shopify.com/multi-label-barcodes)                     |
| **Selling in person - Other** | 其他线下销售工具。                | 活动签到、移动售卖、混合流程等。                                       | [EasyTeam](https://apps.shopify.com/easyteam)                                             |


### 2.2 找货源（Finding products）

**类别意图：** 帮店主找货、进货。


| 官方标签（英文）                     | Shopify 定义（中译） | 实际能做什么                               | 举例（第三方）                                                                                                                                 |
| ---------------------------- | -------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Dropshipping**             | 管理第三方库存与代发货。   | 导入供应商目录、订单自动转给供应商、不自己囤货发货。           | [DSers](https://apps.shopify.com/dsers)                                                                                                 |
| **Print on demand (POD)**    | 合作方按需印刷并发货。    | T 恤、家居印图等，先卖后做，无大批量库存。               | [Printful](https://apps.shopify.com/printful)                                                                                           |
| **Wholesale**                | 批发采购或批发销售。     | 向 B2B 平台进货 **或** 给自己的 B2B 买家批发价、账期等。 | [Faire: Sell Wholesale](https://apps.shopify.com/faire-buy-wholesale) / [Wholesale Gorilla](https://apps.shopify.com/wholesale-gorilla) |
| **Sourcing options - Other** | 其他货源方式。        | 找供应商、调研爆款、自动化寻源等。                    | [Spocket](https://apps.shopify.com/spocket)                                                                                             |


### 2.3 卖货与支付相关（Selling products）

**类别意图：** 扩展商品形态或收款方式。


| 官方标签（英文）                               | Shopify 定义（中译） | 实际能做什么                              | 举例（第三方）                                                                                |
| -------------------------------------- | -------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| **Subscriptions**                      | 商品订阅制扣款。       | 「定期购」、订阅盒、会员周期扣款与客户自助门户。            | [Appstle Subscriptions](https://apps.shopify.com/subscriptions-by-appstle)             |
| **Payments**                           | 分期、融资类支付能力。    | 先买后付、分期，客人分期付、您按合作方规则收款。            | [Klarna On‑Site Messaging](https://apps.shopify.com/klarna-on-site-messaging)（视地区是否可用） |
| **Cash on delivery (COD)**             | 货到付款相关。        | 自定义 COD 结账、电话确认、手续费、验证码流程等（部分市场常用）。 | [Releasit COD Form & Upsells](https://apps.shopify.com/releasit-cod-order-form)        |
| **Payment options - Other**            | 其他支付形态。        | 其他网关、部分付款、定金、账期支付等。                 | [Splitit](https://apps.shopify.com/splitit)                                            |
| **Pricing optimization**               | 优化定价策略。        | 监控竞品或规则调价（需注意信任与最低零售价政策）。           | [Prisync](https://apps.shopify.com/prisync)                                            |
| **Pricing quotes**                     | 询价与自定义报价。      | B2B 或定制商品先询价再下单，不直接标网价成交。           | [Globo Request a Quote](https://apps.shopify.com/globo-request-quote)                  |
| **Pricing - Other**                    | 其他定价工具。        | 量级折扣、登录后可见价、复杂价目表。                  | [B2B Wholesale Club](https://apps.shopify.com/b2b-wholesale-club)                      |
| **Digital products**                   | 销售数字商品。        | 安全下载、授权码、购买后流媒体链接等。                 | [Sky Pilot](https://apps.shopify.com/sky-pilot)                                        |
| **NFTs and tokengating**               | NFT 与持币权益。     | 钱包门槛、NFT 发售（合规要求高）。                 | [Manifold](https://apps.shopify.com/manifold-merch)                                    |
| **Event booking**                      | 课程、演出等活动售票/预约。 | 预约时段、票务、人数上限。                       | [Sesami](https://apps.shopify.com/sesami)                                              |
| **Digital goods and services - Other** | 其他数字/服务类销售。    | 许可证、与数字交付绑定的会员等。                    | [SendOwl](https://apps.shopify.com/sendowl)                                            |
| **Product variants**                   | 超出系统默认的规格选项。   | 更多选项、色卡、条件字段、组合购等。                  | [Infinite Options](https://apps.shopify.com/infinite-options)                          |
| **Custom file upload**                 | 客人上传图片/定制信息。   | 刻字、印图、审稿用稿件上传等。                     | [Zepto Product Personalizer](https://apps.shopify.com/product-personalizer)            |
| **Custom products - Other**            | 其他定制流程。        | 复杂配置器、定做行项目规则。                      | [SC Product Options](https://apps.shopify.com/product-options)                         |


### 2.4 店铺设计与展示（Store design）

**类别意图：** 店面外观、内容、多语言多货币等。


| 官方标签（英文）                          | Shopify 定义（中译）         | 实际能做什么                          | 举例（第三方）                                                                          |
| --------------------------------- | ---------------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| **Page builder**                  | 在主题内搭建页面。              | 拖拽做落地页、首页板块、活动页，少写代码。           | [PageFly](https://apps.shopify.com/pagefly)                                      |
| **Mobile app builder**            | 品牌购物 App（iOS/Android）。 | 品牌 App、推送通知、移动陈列（多为订阅收费）。       | [Tapcart](https://apps.shopify.com/tapcart)                                      |
| **Storefronts - Other**           | 其他店面形态。                | 替代排版引擎、微站、区块库扩展主题。              | [GemPages](https://apps.shopify.com/gempages)                                    |
| **SEO**                           | 搜索引擎优化。                | 标题模板、结构化数据、死链、与速度相关的 SEO。       | [Plug In SEO](https://apps.shopify.com/plug-in-seo)                              |
| **Accessibility**                 | 无障碍购物辅助。               | 辅助功能小组件与检测（仍建议专家复核）。            | [Accessibility Enabler](https://apps.shopify.com/accessibility)                  |
| **Site optimization - Other**     | 其他性能与体验优化。             | 压图、懒加载、脚本控制、核心网页指标监控。           | [Tiny SEO Speed Image Optimizer](https://apps.shopify.com/smart-image-optimizer) |
| **Search and filters**            | 搜索与分面筛选。               | 即时搜索、同义词、容错、高级集合筛选。             | [Searchanise Search & Filter](https://apps.shopify.com/searchanise)              |
| **Navigation and menus**          | 导航与菜单。                 | 大型菜单、多列导航、下拉里放精选集合。             | [Globo Mega Menu](https://apps.shopify.com/mega-menu-navigation)                 |
| **Search and navigation - Other** | 其他浏览体验。                | Lookbook、非常规浏览路径。               | [Zooomy Lookbook](https://apps.shopify.com/lookbook)                             |
| **Image gallery**                 | 图片画廊。                  | 可购物图集、Lookbook、策展式图片展示。         | [Covet.pics](https://apps.shopify.com/covet-pics)                                |
| **Image editor**                  | 编辑与优化图片。               | 批量改尺寸、压缩、重命名、抠图等。               | [Photo Resize](https://apps.shopify.com/photo-resize)                            |
| **Video and livestream**          | 视频与可购物直播。              | 商品页视频、UGC 视频、直播回放嵌入。            | [Videowise](https://apps.shopify.com/videowise)                                  |
| **3D/AR/VR**                      | 三维/试穿试放。               | 3D 展示、AR 摆放、虚拟试穿（视品类）。          | [Zakeke](https://apps.shopify.com/zakeke-customizer-2)                           |
| **Images and media - Other**      | 其他富媒体。                 | 360° 旋转、放大镜、混合轮播。               | [Sirv](https://apps.shopify.com/sirv)                                            |
| **Animation and effects**         | 动效与音效。                 | 公告动效、悬停动效、节日动效（注意速度）。           | [Hextom Quick Announcement Bar](https://apps.shopify.com/quick-announcement-bar) |
| **Badges and icons**              | 徽章与图标。                 | 支付/物流信任标、「新品/促销」角标等。            | [Trust Badges Bear](https://apps.shopify.com/trust-badges)                       |
| **Design elements - Other**       | 其他装饰界面。                | 礼花、光标效果等。                       | [Proof Bear — Sales Pop](https://apps.shopify.com/proof-bear)                    |
| **Banners**                       | 顶栏与横幅公告。               | 满额包邮、截单时间、大促与运维通知。              | [Essential Free Shipping Bar](https://apps.shopify.com/free-shipping-bar)        |
| **Pop-ups**                       | 弹窗。                    | 留邮箱、优惠券、退出意图、公告。                | [Privy](https://apps.shopify.com/privy)                                          |
| **Forms**                         | 表单收集信息。                | 联系、批发申请、维修登记、自定义字段进后台。          | [Hulk Form Builder](https://apps.shopify.com/hulk-form-builder)                  |
| **Notifications - Other**         | 其他站内提醒。                | 网页推送订阅、滑入条、粘性按钮等。               | [PushOwl Web Push](https://apps.shopify.com/pushowl)                             |
| **Metafields**                    | 资源的自定义字段。              | 批量编辑元字段、规格模板、与主题区块对接。           | [Metafields Guru](https://apps.shopify.com/metafields-editor-2)                  |
| **Product content**               | 商品文案与描述。               | AI 辅助文案、批量改写、规格表、统一格式。          | [Describely](https://apps.shopify.com/describely)                                |
| **Blogs**                         | 博客展示与排版。               | 更丰富的文章版式、文中关联商品等。               | [Bloggle Powerful Blog Builder](https://apps.shopify.com/bloggle)                |
| **Content - Other**               | 其他内容工具。                | 帮助中心、FAQ 聚合、结构化内容块。             | [HelpCenter](https://apps.shopify.com/helpcenter)                                |
| **Product comparison**            | 并排对比。                  | 多款商品规格对比。                       | [Comparable](https://apps.shopify.com/comparable)                                |
| **Collections**                   | 集合批量管理。                | 自动排序、陈列规则、集合成员导入导出。             | [Collection Merchandiser](https://apps.shopify.com/collection-merchandiser)      |
| **Product display - Other**       | 其他商品陈列。                | 尺码表、标签页、搭配推荐模块。                 | [Kiwi Size Chart & Recommender](https://apps.shopify.com/kiwi-sizing)            |
| **Currency and translation**      | 多货币与翻译。                | 翻译界面与内容、在支持地区显示当地货币。            | [Weglot](https://apps.shopify.com/weglot)                                        |
| **Geolocation**                   | 基于地理位置的体验。             | 引导正确市场/语言/货币、分地区文案。             | [Orbe](https://apps.shopify.com/orbe)                                            |
| **Cookie consent**                | Cookie 与隐私横幅。          | 同意记录、Cookie 分类、脚本拦截（法律事宜请咨询律师）。 | [Pandectes GDPR Compliance](https://apps.shopify.com/pandectes-gdpr)             |
| **Internationalization - Other**  | 其他全球化体验。               | 分地区落地页、复杂多语言流程。                 | [Langify](https://apps.shopify.com/langify)                                      |


### 2.5 订单与物流（Orders and shipping）

**类别意图：** 接单、发货、库存、退换与保修相关。


| 官方标签（英文）                         | Shopify 定义（中译） | 实际能做什么                        | 举例（第三方）                                                                  |
| -------------------------------- | -------------- | ----------------------------- | ------------------------------------------------------------------------ |
| **Order tracking**               | 向客人同步物流状态。     | 品牌化追踪页、邮件/短信通知，减少客服问「货在哪」。    | [17TRACK Order Tracking](https://apps.shopify.com/17track)               |
| **Order editing**                | 下单后改单。         | 员工或客人在规则内加购、换规格、改地址。          | [Cleverific Order Editing](https://apps.shopify.com/edit-order)          |
| **Invoices and receipts**        | 单据类文件。         | PDF 发票、报价单、装箱单、退货单等品牌化打印。     | [Order Printer Pro](https://apps.shopify.com/order-printer-pro)          |
| **Orders - Other**               | 其他订单操作。        | 批量操作、打标、风控暂扣、自定义流程。           | [Mechanic](https://apps.shopify.com/mechanic)                            |
| **Shipping**                     | 发货、面单、报表。      | 打单、批量打单、多承运商、在后台完成发货流程。       | [ShipStation](https://apps.shopify.com/shipstation)                      |
| **Shipping rates**               | 结账时运费报价。       | 实时承运商运费、组合规则、分区满额包邮。          | [Easyship](https://apps.shopify.com/easyship)                            |
| **Third-party logistics (3PL)**  | 第三方仓配。         | 订单推给外包仓，回传库存与追踪号。             | [ShipBob](https://apps.shopify.com/shipbob-fulfillment)                  |
| **Delivery and pickup**          | 同城配送或到店取货。     | 配送时段、门店取货位、简单路线。              | [Zapiet ‑ Pickup + Delivery](https://apps.shopify.com/click-and-collect) |
| **Shipping solutions - Other**   | 其他履约边缘场景。      | 代发+自营仓混合、按供应商拆单路由等。           | [ShipHero](https://apps.shopify.com/shiphero)                            |
| **Inventory sync**               | 跨系统库存一致。       | 与亚马逊、POS、ERP、卖场双向同步，防超卖。      | [Syncio](https://apps.shopify.com/syncio)                                |
| **Inventory optimization**       | 预测与补货。         | 再订货点、需求信号、采购提醒。               | [Inventory Planner](https://apps.shopify.com/inventory-planner)          |
| **ERP**                          | 企业资源/财务主干对接。   | 订单、费用、SKU 同步进会计或 ERP（实施通常较重）。 | [A2X Accounting](https://apps.shopify.com/a2x-accounting)                |
| **Inventory - Other**            | 其他库存工具。        | 盘点、库位、多仓规则、低库存提醒。             | [Stock Sync](https://apps.shopify.com/stock-sync)                        |
| **Returns and exchanges**        | 退换货流程（RMA）。    | 自助退货门户、退货运单、退款、换货 SKU。        | [Loop Returns](https://apps.shopify.com/loop-returns)                    |
| **Warranties and insurance**     | 结账加购保修/运输险。    | 延保、运输险等增值项。                   | [Mulberry Warranty](https://apps.shopify.com/mulberry)                   |
| **Returns and warranty - Other** | 其他售后保障。        | 店铺积分退货、部分退款、补货费自动化。           | [ReturnGO](https://apps.shopify.com/returngo)                            |


### 2.6 营销与转化（Marketing and conversion）

**类别意图：** 拉新、促购、提高客单价与信任。


| 官方标签（英文）                       | Shopify 定义（中译） | 实际能做什么                              | 举例（第三方）                                                                                                             |
| ------------------------------ | -------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Ads**                        | 各渠道付费广告。       | 目录广告、再营销、归因看板（常与 Meta/Google 工具配合）。 | [AdRoll Advertising & Marketing](https://apps.shopify.com/adroll)                                                   |
| **Affiliate programs**         | 联盟/达人佣金。       | 招募链接、折扣码、多级佣金、结算跟踪。                 | [UpPromote Affiliate Marketing](https://apps.shopify.com/affiliate-by-secomapp)                                     |
| **Advertising - Other**        | 其他付费增长。        | 达人市场、播客码、公关码批量管理。                   | [Aspire](https://apps.shopify.com/aspireiq)                                                                         |
| **Email marketing**            | 邮件营销与自动化。      | 流程、分群、周刊、邮件内嵌商品。                    | [Klaviyo](https://apps.shopify.com/klaviyo-email-marketing)                                                         |
| **SMS marketing**              | 短信营销。          | 闪购短信、到货提醒短信、合规工具（视地区法规）。            | [SMSBump](https://apps.shopify.com/smsbump)                                                                         |
| **Web push**                   | 浏览器推送。         | 降价提醒、购物车提醒（不经邮件）。                   | [PushOwl Web Push](https://apps.shopify.com/pushowl)                                                                |
| **Abandoned cart**             | 挽回弃单。          | 邮件/短信/推送组合、优惠与时间测试。                 | [Recart](https://apps.shopify.com/recart)                                                                           |
| **Marketing - Other**          | 其他触达方式。        | 直邮、二维码活动、推荐小部件。                     | [ReferralCandy](https://apps.shopify.com/referralcandy)                                                             |
| **Cart customization**         | 购物车/侧栏体验。      | 包邮进度条、加购推荐、备注、积分提示。                 | [UpCart](https://apps.shopify.com/upcart)                                                                           |
| **Order limits**               | 起订量/限购规则。      | 最低起订、整箱、批发最低、每客上限。                  | [MinMaxify](https://apps.shopify.com/minmaxify)                                                                     |
| **Checkout - Other**           | 其他结账层改动。       | 自定义字段、送货日（视套餐与支持情况）、校验规则。           | [Checkout Blocks](https://apps.shopify.com/checkout-blocks)（Shopify 第一方，部分需 Plus）/ 其他请按方案搜索「checkout customization」 |
| **Discounts**                  | 折扣与促销。         | 自动折扣、叠加规则、定时活动、买一送一等。               | [Bold Discounts](https://apps.shopify.com/discounts)                                                                |
| **Giveaways and contests**     | 抽奖与竞赛。         | 裂变抽奖、额外抽奖机会、涨邮件列表。                  | [Gleam Competitions](https://apps.shopify.com/gleam)                                                                |
| **Promotions - Other**         | 其他促销玩法。        | 神秘礼品、转盘（注意品牌形象）。                    | [BOGOS Free Gift](https://apps.shopify.com/bogos-free-gift-buy-x-get-y)                                             |
| **Gift cards**                 | 礼品卡。           | 销售与存储礼品卡；高阶批量/定时发放。                 | [Gift Card Pro](https://apps.shopify.com/gift-card-pro)                                                             |
| **Gift wrap and messages**     | 礼品包装与留言。       | 包装费、贺卡、装箱单隐藏价格。                     | [Gift Wrap Plus](https://apps.shopify.com/gift-wrap-plus)                                                           |
| **Gifts - Other**              | 其他送礼场景。        | 企业送礼门户、定时送礼、多收件人结账。                 | [Super:Gifting](https://apps.shopify.com/super-gifting)                                                             |
| **Product bundles**            | 多 SKU 组合套装。    | 固定套装、随心配、量级优惠。                      | [Bundler ‑ Product Bundles](https://apps.shopify.com/bundler-product-bundles)                                       |
| **Upsell and cross-sell**      | 加购与交叉销售。       | 经常一起买、购物车加购、加购后弹窗。                  | [Frequently Bought Together](https://apps.shopify.com/frequently-bought-together)                                   |
| **Countdown timer**            | 倒计时。           | 活动结束倒计时、新品开售倒计时。                    | [Hextom Countdown Timer](https://apps.shopify.com/countdown-timer-bar)                                              |
| **Stock alerts**               | 到货通知。          | 缺货登记、回货通知、需求收集。                     | [Back in Stock ‑ Restock Alerts](https://apps.shopify.com/back-in-stock-restock-alerts)                             |
| **Pre-orders**                 | 预售。            | 先收订金或全款、预计到货说明。                     | [Preorder Wolf](https://apps.shopify.com/preorder-now)                                                              |
| **Upsell and bundles - Other** | 其他提客单手段。       | 下单后一键加购、小费、慈善加捐。                    | [ReConvert](https://apps.shopify.com/reconvert)                                                                     |
| **Product reviews**            | 评分与文字评价。       | 收集评价、晒图、问答、同步到谷歌购物等。                | [Judge.me](https://apps.shopify.com/judgeme)                                                                        |
| **Social proof**               | 社会认同信号。        | 「X 人正在浏览」、最近成交弹窗、低库存提示。             | [Fomo](https://apps.shopify.com/fomo)                                                                               |
| **Social trust - Other**       | 其他信任建设。        | 与结账绑定的 UGC 画廊等。                     | [Loox](https://apps.shopify.com/loox)                                                                               |
| **Loyalty and rewards**        | 积分与会员层级。       | 积分兑换、推荐奖励、VIP、线上线下同步。               | [Smile.io](https://apps.shopify.com/smile-io)                                                                       |
| **Wishlists**                  | 心愿单。           | 降价通知、分享清单、礼品登记。                     | [Wishlist Plus](https://apps.shopify.com/swym-relay)                                                                |
| **Donations**                  | 慈善捐赠。          | 凑整捐、按 SKU 捐赠。                       | [ShoppingGives](https://apps.shopify.com/shopping-gives)                                                            |
| **Customer loyalty - Other**   | 其他留存机制。        | 付费会员、抢先购等。                          | [Inveterate](https://apps.shopify.com/inveterate)                                                                   |


### 2.7 店铺管理（Store management）

**类别意图：** 运营、安全、财务、客服等后台能力。


| 官方标签（英文）                | Shopify 定义（中译） | 实际能做什么                         | 举例（第三方）                                                               |
| ----------------------- | -------------- | ------------------------------ | --------------------------------------------------------------------- |
| **Workflow automation** | 多步骤后台自动化。      | 购买后自动打标签、风险单自动取消、定时上架等。        | [Mechanic](https://apps.shopify.com/mechanic)                         |
| **Bulk editor**         | 批量编辑目录数据。      | 批量改价、alt 文本、元字段、类 CSV 流程。      | [Bulk Product Edit](https://apps.shopify.com/bulk-product-edit)       |
| **Staff notifications** | 员工/供应商提醒。      | 新单、低库存、拒付等发 Slack/邮件。          | [Order Automator](https://apps.shopify.com/order-automator)           |
| **Analytics**           | 比默认后台更深的报表。    | 队列分析、广告效率类指标、自定义 KPI。          | [Polar](https://apps.shopify.com/polar-analytics)                     |
| **Operations - Other**  | 其他运营胶水能力。      | 数据清洗、SKU 规范化、定时导出。             | [Matrixify](https://apps.shopify.com/excel-export-import)             |
| **Legal**               | 政策与合规展示。       | Cookie 政策、条款勾选、年龄门（法律问题请咨询律师）。 | [Enzuzo GDPR/CCPA](https://apps.shopify.com/enzuzo)                   |
| **Fraud**               | 欺诈筛查与规则。       | 拦截高风险单、AVS/CVV、白名单。            | [NoFraud Fraud Protection](https://apps.shopify.com/nofraud)          |
| **Anti theft**          | 防盗图/盗内容。       | 禁右键、水印等（防君子不防小人）。              | [Cozy Image Gallery](https://apps.shopify.com/cozy-image-gallery)     |
| **Accounts and login**  | 客户登录体验。        | 社交登录、一次性密码登录、B2B 注册门槛。         | [Flare Social Login](https://apps.shopify.com/flare)                  |
| **Security - Other**    | 其他安全相关。        | IP 策略、后台异常监控等（产品更迭快，请比评评价与文档）。 | 在 [App Store](https://apps.shopify.com/) 搜索 “security” / “monitoring” |
| **Accounting**          | 记账软件对接。        | 销售、手续费、退款、打款入账到账本。             | [QuickBooks Sync](https://apps.shopify.com/quickbooks-online)         |
| **Taxes**               | 税费计算与申报辅助。     | 自动税率、豁免处理、面向申报的导出（视地区）。        | [TaxJar Sales Tax Automation](https://apps.shopify.com/taxjar)        |
| **Finances - Other**    | 其他资金操作。        | 发票、应收、对账等超出单一连接器时。             | [Xero](https://apps.shopify.com/xero)                                 |
| **Chat**                | 在线聊天。          | 网站聊天窗口、机器人、快捷回复。               | [Tidio](https://apps.shopify.com/tidio-chat)                          |
| **Helpdesk**            | 工单客服。          | 订单上下文进工单、宏、SLA 视图。             | [Gorgias](https://apps.shopify.com/gorgias)                           |
| **FAQ**                 | 自助问答。          | 可搜索帮助页、减少重复咨询。                 | [HelpCenter](https://apps.shopify.com/helpcenter)                     |
| **Surveys**             | 调研。            | NPS、购后问卷、产品调研投票。               | [Zigpoll](https://apps.shopify.com/zigpoll)                           |
| **Support - Other**     | 其他客户体验工具。      | 保修登记、与聊天/电话日志衔接等。              | [Richpanel](https://apps.shopify.com/richpanel)                       |


---

## 3. Shopify 官方自研应用（第一方，尽量列全）

以下为 **Shopify 自己开发** 的应用（多数免费或按规则计费，由 Shopify 支持）。**权威名单**以以下页面为准（会增减改名）：

- [Apps made by Shopify（帮助中心）](https://help.shopify.com/en/manual/apps/apps-by-shopify)  
- [Apps by Shopify（应用商店合作伙伴页）](https://apps.shopify.com/partners/shopify)

下表为 **名称 + 作用简述**（据 2026 年 4 月前后帮助中心 / 商店文案整理；**数量以官网为准**）。


| 应用名称（英文）                           | 作用简述                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Buy Button channel**             | 在外部网站、博客或邮件中嵌入 **购买按钮**，结账仍走 Shopify。                                                                            |
| **Data Exporter - Tax Compliance** | 导出数据供 **税务机关** 报送使用（见 [税务说明](https://help.shopify.com/en/manual/taxes/data-exporter-app)）。                       |
| **Digital Downloads**              | 购买后交付 **电子书、音频、设计稿等数字文件**。                                                                                       |
| **Shopify Audiences**              | 利用 Shopify 体量信号优化 **Meta、谷歌、TikTok、Pinterest、Snapchat、Criteo** 等广告投放。                                            |
| **Shopify Bill Pay**               | 通过 **Shopify Balance**、银行卡或 **ACH** 支付经营账单。                                                                      |
| **Shopify Bundles**                | 销售 **固定组合/多件装** 提高客单价。                                                                                           |
| **Shopify Checkout Blocks**        | 用区块自定义 **结账页、感谢页、订单状态页**；部分能力需 **Plus**（企业方案）。                                                                   |
| **Shopify Collabs**                | 对接 **达人/网红/联盟客** 并跟踪推广效果。                                                                                        |
| **Shopify Collective**             | **零售商** 从其他 Shopify 品牌 **导入商品**，价格与库存实时同步。                                                                       |
| **Shopify Collective: Supplier**   | **品牌方** 通过 Collective 向零售商共享商品（价目表、代售模式）。                                                                        |
| **Shopify Combined Listings**      | **Plus** — 在网店上把商品合并为 **增强型组合展示**。                                                                               |
| **Shopify Counter**                | 连接 **Counter** 硬件/体验，**实时展示销量与订单**等里程碑（[商店页](https://apps.shopify.com/shopify-counter)）。                         |
| **Shopify Messaging**              | **邮件与短信** 营销、分群、模板与报表（[商店页](https://apps.shopify.com/shopify-messaging)）；帮助中心有时仍称 **Shopify Email**。             |
| **Shopify Flow**                   | **可视化自动化**：事件—条件—动作，处理后台常见重复劳动。                                                                                  |
| **Shopify Forms**                  | 嵌入式 **表单**，收集潜客、壮大邮件/短信列表。                                                                                       |
| **Shopify Fraud Control**          | 监控店铺 **欺诈风险** 与安全相关信号。                                                                                           |
| **Shopify Fulfillment Network**    | 对接 **第三方物流** 伙伴（如 Flexport、ShipBob、Shipfusion、ShipMonk 等，以官网为准）。                                                 |
| **Shopify Headless**               | **无头电商销售渠道**：在后台管理 **Storefront API** 令牌与无头集成。                                                                   |
| **Hydrogen**（开发者向）                 | 与 Oxygen 配套的 **无头** 技术栈，面向定制店面开发。                                                                                |
| **Shopify Inbox**                  | 网店 **在线聊天**、自动回复、外观设置、会话数据。                                                                                      |
| **Shopify Knowledge Base**         | 编辑供 **AI 购物助手** 使用的 **常见问题**。                                                                                    |
| **Shopify Launch Check**           | **AI 辅助** 全店 **上线前检查**、建议与团队共享清单（[商店页](https://apps.shopify.com/launch-check)）。                                  |
| **Shopify Launchpad**              | **Plus** — 编排 **大促、上新、补货** 等活动时间。                                                                                |
| **Shopify Marketplace Connect**    | 在 **亚马逊、Target Plus、沃尔玛、eBay** 等上架；在后台同步订单、库存与刊登。                                                                |
| **Shopify Order Printer**          | 打印 **发票、标签、小票、装箱单** 等。                                                                                           |
| **Shopify Product Network**        | 展示 **第三方商品即时目录** 与推荐；成交可获得 **佣金或广告额度** 等（[商店页](https://apps.shopify.com/product-network)）。                       |
| **Shopify Planet**                 | 资助 **碳清除项目**，用于宣传 **碳中和物流** 等。                                                                                   |
| **Shopify POS**                    | **实体店收银**；与网店目录/库存联动（iOS/Android）。                                                                               |
| **Retail Barcode Labels**          | 生成并打印 **商品条码标签**。                                                                                                |
| **Shopify Search & Discovery**     | 调整店面 **搜索、筛选与推荐**（[帮助](https://help.shopify.com/en/manual/online-store/storefront-search#search-and-discovery)）。 |
| **Sell on WordPress**              | 在 **WordPress** 站点展示商品/集合，商务仍在 Shopify 管理。                                                                       |
| **Shop channel**                   | 管理店铺在 **Shop** 消费者应用中的展示与相关设置。                                                                                   |
| **Shopcodes**                      | 生成指向商品或结账的 **二维码**。                                                                                              |
| **Stocky**                         | **库存**：预测、**采购单**、盘点、调拨等。                                                                                        |
| **Shopify SimGym**                 | **AI 模拟购物者** 在主题上浏览，压力测试 **导航与加购**（可能按次计费，[商店页](https://apps.shopify.com/simgym)）。                               |
| **Store import / migration**       | 帮助中心说明可从其他平台导入 **商品与客户**；具体入口可能是后台 **迁移** 流程，应用商店上的独立应用名会变化，请以当时文档为准。                                            |
| **Shopify Subscriptions**          | 符合条件的店铺使用 **原生订阅** 销售。                                                                                           |
| **Theme Access**                   | 为外包/合作方提供更安全的 **主题协作权限**。                                                                                        |
| **Shopify Translate & Adapt**      | **翻译** 商品、集合、博客、政策、页面等。                                                                                          |
| **TSE (KassenSichV)**              | **德国** POS **KassenSichV / TSE** 合规记录与导出。                                                                        |


**数量说明：** 合作伙伴页曾显示约 **39** 个应用；上表含 **渠道 + 开发工具** 等，可能与页面计数方式不完全一致。**以帮助中心与合作伙伴页为准。**

---

## 4. 如何自己在官网浏览「全部第三方应用」


| 目的                       | 网址或方法                                                                          |
| ------------------------ | ------------------------------------------------------------------------------ |
| 浏览全部应用（分页、搜索、筛选）         | [apps.shopify.com](https://apps.shopify.com/)                                  |
| 按大类浏览                    | 应用商店顶部 **Categories（分类）**，与本文 **第 2 节** 对应                                     |
| 「Built for Shopify」高质量集合 | [Built for Shopify](https://apps.shopify.com/collections/built-for-shopify)    |
| 仅看 Shopify 官方自研          | [apps.shopify.com/partners/shopify](https://apps.shopify.com/partners/shopify) |


**第三方举例（远非完整列表）：** Judge.me（评价）、Klaviyo（邮件/短信）、DSers（代发）、Printful（按需印刷）、PageFly（页面）、各类 **马来西亚支付网关**、**Shopee/Lazada 同步** 等——同一标签下仍有成千上万款应用，请用官网搜索。

---

## 5. 相关链接

- 马来西亚情境与收费概览：[shopify.md](shopify.md)  
- 非技术读者白话入门（中文）：[shopify-competitor-primer-zh-CN.md](shopify-competitor-primer-zh-CN.md)  
- 本资料夹索引：[README.md](README.md)

## 6. 来源

- [Shopify App Store](https://apps.shopify.com/)  
- [应用上架分类（完整 taxonomy）](https://shopify.dev/docs/apps/launch/app-store-review/app-listing-categories)  
- [Apps made by Shopify](https://help.shopify.com/en/manual/apps/apps-by-shopify)  
- [Apps by Shopify 合作伙伴页](https://apps.shopify.com/partners/shopify)