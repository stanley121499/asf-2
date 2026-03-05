# Chinese Translation Migration SQL

Copy each block into the Supabase SQL Editor and run them one table at a time.

---

## 1. Products

```sql
-- PRODUCTS: translate name, description, warranty_description, warranty_period

UPDATE products SET
  name = '缎面蝴蝶结迷你包',
  description = '极简设计融合柔美细节。这款优雅迷你手提包采用丝巾缠绕结扣把手，是展现女性魅力穿搭的不二之选。'
WHERE id = 'bf0e3561-c992-455d-b176-d9b053cb882c';

UPDATE products SET
  name = '褶皱软皮包（酒红与灰色）',
  description = '现代慵懒风格的全新诠释，这款褶皱包为您的日常携带增添质感与层次。'
WHERE id = '1c389ddb-463c-40ef-9632-69edb5186885';

UPDATE products SET
  name = '鳄鱼纹圆顶邮差包（黑色与红色）',
  description = '精致纹理与经典造型的完美融合。鳄鱼纹邮差包是干练出行造型的理想选择。'
WHERE id = '16c706ca-e10e-46a1-8d25-98df1a319165';

UPDATE products SET
  name = '极简宽松T恤',
  description = '这款挺括宽松T恤轻松打造时尚造型，是大胆叠穿或极简风格的完美基础单品。'
WHERE id = '453b3d92-a771-47ec-840f-d93b7f967d37';

UPDATE products SET
  name = '粗花呢纹理托特包（棕色与米色）',
  description = '质感与结构的完美结合。这款粗花呢手提包专为热爱中性色调的现代职场人士打造。'
WHERE id = 'b9db3188-a0f2-43b6-b492-6b0a7bd85199';

UPDATE products SET
  name = 'Adidas Originals Handball Spezial 皮革款 – 酒红/水鸭绿',
  description = '经典室内训练鞋重新演绎为日常街头穿搭。Handball Spezial 采用优质皮革鞋面搭配对比色三条纹，配有全天候舒适缓震鞋垫及耐用橡胶外底，提供抓地力与时尚感。酒红配色搭配复古细节设计，是与牛仔或休闲正装百搭的经典单品。',
  warranty_description = '12个月制造缺陷保修，不包括正常磨损、误用及意外损坏。',
  warranty_period = '制造商12个月保修'
WHERE id = '3bb0b6cb-7413-4066-b772-b38bef4885a7';

UPDATE products SET
  name = 'Adidas Originals 花卉三叶草后背印花T恤 – 深灰色',
  description = '以大胆的Adidas Originals风格刷新您的日常基础款。这款T恤采用柔软棉质平针布制成，全天舒适，正面简洁，背面饰有大号花卉三叶草图案。宽松版型搭配经典罗纹圆领，完美呈现——适合街头穿搭或休闲叠穿。',
  warranty_description = '在正常穿着条件下，面料、缝线及印花质量享有6个月制造缺陷保修。保修不包括洗涤褪色、护理不当引起的缩水、正常磨损及意外损坏。申请保修需提供购买凭证。',
  warranty_period = '制造商6个月保修'
WHERE id = 'd1985ed2-7d05-42d5-92c9-6b5c7296869d';

UPDATE products SET
  name = 'Adidas UltraBOOST 4.0 针织款 – 栗红/多色',
  description = '专为每一英里的舒适而生，UltraBOOST 4.0 配备可呼吸的Primeknit鞋面，随步态自然贴合，提供袜子般的舒适感。响应式Boost中底在每一步中回馈能量，耐用橡胶外底在城市街道提供可靠抓地力。深酒红针织图案设计，将运动科技与日常风格完美融合。',
  warranty_description = '本产品享有12个月制造商保修，涵盖正常跑步和休闲使用条件下的材料及工艺缺陷。保修不包括过度磨损、尺码不当、误用、接触有害化学品或改装造成的损坏。申请保修服务需提供购买凭证，可能需要进行产品评估。',
  warranty_period = '制造商12个月保修'
WHERE id = 'a2ffaea8-37a3-47e9-a9db-9f8c6cfc9f40';

UPDATE products SET
  name = 'Adidas Originals Firebird 运动长裤 – 酒红色',
  description = 'Adidas Originals 经典必备款，Firebird 运动长裤将传承风格带入日常穿着。采用顺滑再生涤纶三角织面料，宽松版型，腿侧饰有标志性三条纹，搭配三叶草标志打造经典完成度。侧边拉链口袋安全收纳随身物品，可调节抽绳腰头提供全天舒适感。完美适合街头穿搭或休闲放松。',
  warranty_description = '在正常穿着条件下，面料、缝线、拉链及标志贴合享有6个月制造缺陷保修。保修不包括洗涤不当、褪色、缩水、勾丝或正常磨损造成的损坏。所有保修申请均需提供购买凭证。',
  warranty_period = '制造商6个月保修'
WHERE id = '9d099f87-f996-4779-acd4-4e1d53c5efdb';

UPDATE products SET
  name = 'Adidas Performance 锥形慢跑裤 – 浅玫瑰粉',
  description = '专为运动舒适而设计，这款Adidas锥形慢跑裤将柔软绒感与修身现代版型完美结合。弹性腰头搭配抽绳提供稳固感，锥形裤腿与脚踝收口打造干净利落的轮廓。腿部下方饰有粗体Adidas标志及拉链细节，完美适合训练、出行或日常街头造型。',
  warranty_description = '本产品享有6个月制造缺陷保修，涵盖正常使用条件下的面料、缝线、拉链及标志印花。保修不包括缩水、洗涤褪色、磨损、污渍或正常磨耗。申请保修需提供购买凭证。',
  warranty_period = '制造商6个月保修'
WHERE id = '6236e840-3692-4567-ba56-4f04270ecf1a';

UPDATE products SET
  name = 'Adidas Originals Samba OG – 海军蓝/白色橡胶底',
  description = '数十年来经久不衰的时尚经典。Adidas Samba OG 忠于其传承基因，采用顺滑皮革鞋面、标志性三条纹及耐用橡胶外底，提供出色抓地力与经典风格。原为室内训练而设计，如今已成为街头穿搭必备单品——与牛仔裤、阔腿裤或日常休闲穿搭均相得益彰。',
  warranty_description = '本产品享有制造商12个月保修，涵盖正常穿着条件下的材料及工艺缺陷。保修不包括误用、水损、清洁不当、重度使用导致的鞋底磨损或改装造成的损坏。申请保修服务需提供购买凭证，可能需要进行产品检验。',
  warranty_period = '制造商12个月保修'
WHERE id = '9b0091ff-c85b-424a-a0e1-bce7dca1d077';

UPDATE products SET
  name = 'Adidas Originals Firebird 运动长裤 – 绿色/白色',
  description = '将Adidas Originals 经典活力融入您的日常穿搭。这款Firebird 运动长裤采用顺滑针织面料，舒适亲肤，复古造型简洁利落。腿侧饰有标志性三条纹，三叶草标志增添经典质感。配有侧边口袋和可调节抽绳腰头，完美适合街头穿搭或休闲放松。',
  warranty_description = '在正常穿着条件下，面料、缝线、抽绳及标志贴合享有6个月制造缺陷保修。不包括洗涤褪色、缩水、勾丝、污渍及正常磨损。所有申请均需提供购买凭证。',
  warranty_period = '制造商6个月保修'
WHERE id = '36ef2b52-b403-4c98-970b-f3e6a0ba8292';

UPDATE products SET
  name = 'Adidas Originals Samba OG – 云白/核心黑橡胶底',
  description = '永不过时的经典之作。Adidas Samba OG 配备顺滑皮革鞋面、标志性三条纹及经典橡胶外底，提供抓地力与传承魅力。原为室内训练而设计，如今已成为街头穿搭必备——与牛仔裤、西裤或休闲装搭配均游刃有余。干净、经典，专为日常穿着打造。',
  warranty_description = '在正常穿着条件下享有制造商12个月材料及工艺缺陷保修。保修不包括误用、清洁不当、水损、鞋底过度磨损或改装造成的损坏。申请保修服务需提供购买凭证，可能需要进行产品检验。',
  warranty_period = '制造商12个月保修'
WHERE id = 'a76505fd-ed90-47af-ac49-a50cb122c4e9';

UPDATE products SET
  name = 'Adidas Originals「爱让我们飞翔」印花T恤 – 水洗黑',
  description = '以这款Adidas Originals 印花T恤彰显满满正能量。采用柔软棉质平针布，宽松版型，正面简洁，背面饰有超大号「爱让我们飞翔」图案搭配粗犷艺术印花与三叶草品牌标志。轻松搭配牛仔裤、工装裤或运动裤——是日常街头穿搭的完美之选。',
  warranty_description = '在正常穿着条件下，面料、缝线及印花贴合享有6个月制造缺陷保修。保修不包括洗涤褪色、缩水、护理不当导致的开裂、污渍及正常磨损。申请保修需提供购买凭证。',
  warranty_period = '制造商6个月保修'
WHERE id = 'd8457e76-4678-489c-ac25-69aeccb1d07a';

UPDATE products SET
  name = 'Adidas Equipment 标志圆领卫衣 – 琥珀色',
  description = '灵感源于标志性的Adidas Equipment年代，这款圆领卫衣将简洁的档案馆风格与现代舒适感完美结合。采用柔软抓绒面料，保暖耐穿，胸前饰有醒目的居中EQT标志，领口精致细节呈现高级质感。与运动裤、牛仔裤或运动鞋叠穿，轻松打造街头穿搭。',
  warranty_description = '本产品享有6个月制造缺陷保修，涵盖正常穿着条件下的面料、缝线及标志印花。保修不包括褪色、洗涤不当引起的缩水、污渍、磨损或正常磨耗。申请保修需提供购买凭证。',
  warranty_period = '制造商6个月保修'
WHERE id = '02ce63b2-9584-466e-bec5-a01f75352f7c';

UPDATE products SET
  name = '有机姜黄根粉',
  description = '优质有机姜黄（Curcuma longa）根粉。因姜黄素含量丰富而以强效抗炎特性著称。传统上用于阿育吠陀医学，促进关节健康和整体健康。可添加至奶昔、茶饮或黄金奶食谱中。非转基因、无麸质，可持续来源。',
  warranty_description = '存放于阴凉干燥处，避免阳光直射。开封后密封保存。',
  warranty_period = '2年内最佳'
WHERE id = '565315ef-491d-4dd2-af08-f0e11a144f4b';

UPDATE products SET
  name = '紫锥菊免疫支持胶囊',
  description = '标准化紫锥菊（Echinacea purpurea）提取物胶囊，支持免疫系统。每粒含400mg，含4%紫锥菊苷。传统上用于缩短感冒持续时间及减轻症状。经第三方检测纯度和效力。素食、非转基因、无麸质。',
  warranty_description = '存放于阴凉干燥处。请放置于儿童不能触及之处。',
  warranty_period = '见瓶底保质期'
WHERE id = '92a09a08-d098-4ede-a5f9-fe38d65dc9f0';

UPDATE products SET
  name = '南非醉茄根粉 - KSM-66',
  description = '优质南非醉茄（Withania somnifera）根提取物粉末，含经临床研究的KSM-66提取物。适应原草本，用于压力管理、提升精力和认知功能。每份500mg。经认证有机素食。可混入奶昔、温热牛奶或饮料中。',
  warranty_description = '保持密封。冷藏可延长新鲜度。避免受潮。',
  warranty_period = '2年内最佳'
WHERE id = 'a9d14226-d49e-49ad-a369-965c5df3bcab';

UPDATE products SET
  name = '水飞蓟肝脏健康胶囊',
  description = '水飞蓟（Silybum marianum）种子提取物，标准化含80%水飞蓟素。支持肝脏健康和排毒。每粒含175mg水飞蓟素。非转基因、无麸质。适合肝脏净化方案。经第三方检测质量与纯度。',
  warranty_description = '存放于远离热源和潮湿的地方。若密封已破损请勿使用。',
  warranty_period = '见瓶底保质期'
WHERE id = 'c0b778ae-765e-4fce-9c73-babf7ce90df9';

UPDATE products SET
  name = '银杏叶记忆力支持胶囊',
  description = '银杏（Ginkgo biloba）叶提取物，标准化含24%黄酮苷和6%萜内酯。支持认知功能、记忆力和血液循环。每粒含120mg。素食、非转基因。经临床研究的最佳剂量，全面支持脑部健康。',
  warranty_description = '保持瓶盖紧闭。存放于阴凉干燥处。',
  warranty_period = '见瓶底保质期'
WHERE id = '88271ed9-ff41-4f78-8514-1081fcfaa133';

UPDATE products SET
  name = '有机薄荷叶茶',
  description = '优质有机薄荷（Mentha piperita）叶，用于清爽草本茶饮。促进消化舒适、清新口气并提供天然活力。不含咖啡因。冷热皆宜。清新浓郁的薄荷风味。沸水冲泡5-7分钟即可享用。',
  warranty_description = '使用后重新密封。避免强烈气味和潮湿环境。',
  warranty_period = '18个月内最佳'
WHERE id = 'e1e9df1b-3283-4435-b403-defbbedc6619';
```

---

## 2. Categories

```sql
-- CATEGORIES: translate name

UPDATE categories SET name = '男士' WHERE id = 'f1baf64d-cb4d-4c77-a0fb-737b72866086';
UPDATE categories SET name = '干草药' WHERE id = '29c27d18-9c41-4632-8bce-a97699728375';
UPDATE categories SET name = '草本茶' WHERE id = '8dc8b60c-8ac1-4130-a93c-925c751c6c50';
UPDATE categories SET name = '酊剂与提取物' WHERE id = '3478da6d-efad-4de5-8099-bb77fed699d6';
UPDATE categories SET name = '胶囊与片剂' WHERE id = 'f776ee43-329b-46fe-b812-85abce118afb';
UPDATE categories SET name = '粉末' WHERE id = 'd026eeeb-32e7-4a7c-87d2-a91af260aca6';
UPDATE categories SET name = '精油' WHERE id = 'ed249967-bdb1-4522-b2c8-faa314b3c0c7';
UPDATE categories SET name = '外用产品' WHERE id = '1a5c3ed0-220f-4dea-9241-5e4536c045fe';
```

---

## 3. Departments

```sql
-- DEPARTMENTS: translate name

UPDATE departments SET name = '男士' WHERE id = 'a1508ede-1ab9-4de5-877d-4a852b7d6524';
UPDATE departments SET name = '草本医学' WHERE id = 'd5a053cc-cc9b-449e-9ca4-a53d5e3f52bf';
UPDATE departments SET name = '健康与预防' WHERE id = '4e81c815-a81c-4b3b-aa6e-a274dd5537ff';
UPDATE departments SET name = '治疗性草本' WHERE id = 'dc30f462-f90c-4880-8cc7-dd666b8ef20d';
```

---

## 4. Ranges

```sql
-- RANGES: translate name

UPDATE ranges SET name = '免疫增强' WHERE id = '6298ea66-4bc7-4d93-a014-b87f9f661e39';
UPDATE ranges SET name = '消化健康' WHERE id = 'cbf134d2-d139-4717-a4d8-870ea873f4ba';
UPDATE ranges SET name = '压力与睡眠' WHERE id = '46105533-a728-469f-97f4-6a38ab4ce631';
UPDATE ranges SET name = '疼痛缓解' WHERE id = '054d9d06-41b3-4a83-8b06-7ff7ca3f189c';
UPDATE ranges SET name = '认知支持' WHERE id = '1693a619-72df-4cc7-b28e-944d810ea213';
UPDATE ranges SET name = '能量与活力' WHERE id = 'ab898881-2dd3-4ed5-bf88-f28ed4f75419';
```

---

## 5. Brand

```sql
-- BRAND: translate name

UPDATE brand SET name = '自然药房' WHERE id = 'f877052b-8587-47cc-b517-fcf66668531a';
UPDATE brand SET name = '传统草本公司' WHERE id = '16338fd0-4b05-4de7-a1e1-6b9cf5c04d05';
UPDATE brand SET name = '绿地植物' WHERE id = 'd4242977-3d6e-4fc3-b099-095c2843030c';
UPDATE brand SET name = '古方本草' WHERE id = '65c3aa90-f9c2-4aae-ae82-f85d9eb11b2b';
UPDATE brand SET name = '纯草本健康' WHERE id = 'dda49847-45f4-4490-a771-f2128a95db55';
UPDATE brand SET name = '山谷草药' WHERE id = '8d6feba0-be45-4c83-a7e0-b0d79c82319c';
```

---

## 6. Posts

> Note: Row `f4a26e7c` is already in Chinese — skipped.

```sql
-- POSTS: translate name, caption, cta_text

UPDATE posts SET
  name = '姜黄的黄金力量',
  caption = '探索姜黄古老的疗愈功效！',
  cta_text = '立即选购姜黄'
WHERE id = 'ea235e84-2dfb-437b-8faf-ee727cd9d531';

UPDATE posts SET
  name = '生姜——天然消化助手',
  caption = '自然舒缓您的肠胃！',
  cta_text = '探索生姜产品'
WHERE id = '6ed25b29-95c3-4104-b941-a9858d22d851';

UPDATE posts SET
  name = '洋甘菊——您的舒缓伴侣',
  caption = '以天然镇静剂放松身心！',
  cta_text = '选购洋甘菊茶'
WHERE id = '8b15c2f2-4bd1-4cba-9fdd-e1979ba0622b';

UPDATE posts SET
  name = '水飞蓟——肝脏的最佳伴侣',
  caption = '自然呵护您的肝脏！',
  cta_text = '选购水飞蓟'
WHERE id = 'caada4ce-5800-40e2-bb7c-d2865bbd4853';

UPDATE posts SET
  name = '薰衣草——放松必备',
  caption = '吸入宁静的气息！',
  cta_text = '选购薰衣草精油'
WHERE id = '8704cc68-a213-4c29-800d-1b1e7eb3f7e8';
```
