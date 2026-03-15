import fs from 'fs';
import path from 'path';

const filesToFix = [
  "src/app/(customer)/goal/page.tsx",
  "src/app/(customer)/order-details/[orderId]/page.tsx",
  "src/app/(customer)/page.tsx",
  "src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx",
  "src/app/(customer)/product-section/[[...categoryId]]/page.tsx",
  "src/app/authentication/sign-in/page.tsx",
  "src/app/internal-chat/page.tsx",
  "src/app/orders/[orderId]/page.tsx",
  "src/app/payments/[paymentId]/page.tsx",
  "src/app/posts/schedule/[[...postId]]/page.tsx",
  "src/app/products/schedule/[[...productId]]/page.tsx",
  "src/app/stocks/purchase-orders/[purchaseOrderId]/page.tsx",
  "src/app/stocks/purchase-orders/create/[[...slugs]]/page.tsx",
  "src/app/stocks/report/[reportId]/page.tsx",
  "src/app/stocks/report/create/[[...slugs]]/page.tsx",
];

filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('import { useParams }') && !content.includes('import {useParams}')) {
      content = 'import { useParams } from "next/navigation";\n' + content;
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log("Fixed " + file);
    }
  }
});
