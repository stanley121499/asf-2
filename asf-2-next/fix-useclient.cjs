const fs = require('fs');
const path = require('path');

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
    const lines = content.split('\n');
    let useClientIdx = -1;
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        if (lines[i].includes('"use client"')) {
            useClientIdx = i;
            break;
        }
    }
    
    if (useClientIdx > 0) {
        // Remove the use client line
        const useClientLine = lines.splice(useClientIdx, 1)[0];
        // Insert it at the top
        lines.unshift(useClientLine);
        fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
        console.log("Fixed " + file);
    }
  }
});
