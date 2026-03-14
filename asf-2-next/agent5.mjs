import fs from 'fs';
import path from 'path';

const SRC_DIR = 'e:/Dev/GitHub/asf-2/src';
const DEST_DIR = 'e:/Dev/GitHub/asf-2-next/src/app';

const pages = [
  { src: 'pages/index.tsx', dest: 'dashboard/page.tsx', wrapper: null },
  { src: 'pages/products/list.tsx', dest: 'products/list/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/products/create-product-page.tsx', dest: 'products/create/[[...slugs]]/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/products/category-page.tsx', dest: 'products/categories/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/products/deleted-products.tsx', dest: 'products/deleted/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/products/schedule-product-page.tsx', dest: 'products/schedule/[[...productId]]/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/products/stock.tsx', dest: 'products/stock/[productId]/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/posts/list.tsx', dest: 'posts/list/page.tsx', wrapper: 'PostContextBundle' },
  { src: 'pages/posts/create-post-page.tsx', dest: 'posts/create/[[...slugs]]/page.tsx', wrapper: 'PostContextBundle' },
  { src: 'pages/posts/schedule-post-page.tsx', dest: 'posts/schedule/[[...postId]]/page.tsx', wrapper: 'PostContextBundle' },
  { src: 'pages/stocks/overview.tsx', dest: 'stocks/overview/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/stocks/list.tsx', dest: 'stocks/all/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/stocks/event-list.tsx', dest: 'stocks/events/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/stocks/report.tsx', dest: 'stocks/reports/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/stocks/good-stocks.tsx', dest: 'stocks/good/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/stocks/create-report.tsx', dest: 'stocks/report/create/[[...slugs]]/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/stocks/view-report.tsx', dest: 'stocks/report/[reportId]/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/stocks/create-purchase-order.tsx', dest: 'stocks/purchase-orders/create/[[...slugs]]/page.tsx', wrapper: 'ProductContextBundle' },
  { src: 'pages/stocks/view-purchase-order.tsx', dest: 'stocks/purchase-orders/[purchaseOrderId]/page.tsx', wrapper: 'ProductContextBundle' }
];

function transform(content, page) {
  let newContent = content;

  if (!newContent.includes('"use client"')) {
    newContent = '"use client";\n' + newContent;
  }

  // Swap Link
  newContent = newContent.replace(/import\s*\{\s*Link\s*\}\s*from\s*['"]react-router-dom['"];?/g, 'import Link from "next/link";');

  // Swap useNavigate -> useRouter
  newContent = newContent.replace(/import\s*\{[^}]*useNavigate[^}]*\}\s*from\s*['"]react-router-dom['"];?/g, (match) => {
    let m = match.replace(/useNavigate\s*,?/, '');
    if (m.match(/\{\s*\}/)) return 'import { useRouter } from "next/navigation";';
    return m + '\nimport { useRouter } from "next/navigation";';
  });
  newContent = newContent.replace(/const\s+navigate\s*=\s*useNavigate\(\);?/g, 'const router = useRouter();');
  newContent = newContent.replace(/navigate\(/g, 'router.push(');

  // Swap useLocation -> usePathname, useSearchParams
  newContent = newContent.replace(/import\s*\{[^}]*useLocation[^}]*\}\s*from\s*['"]react-router-dom['"];?/g, (match) => {
    let m = match.replace(/useLocation\s*,?/, '');
    if (m.match(/\{\s*\}/)) return 'import { usePathname, useSearchParams } from "next/navigation";';
    return m + '\nimport { usePathname, useSearchParams } from "next/navigation";';
  });

  // Extract component name from export default
  let compNameBase = '';
  const exportDefaultMatch = newContent.match(/export\s+default\s+([A-Za-z0-9_]+)\s*;/);
  if (exportDefaultMatch) {
    compNameBase = exportDefaultMatch[1];
  } else {
    // maybe inline export default function Foo() ?
    const inlineMatch = newContent.match(/export\s+default\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/);
    if (inlineMatch) {
      compNameBase = inlineMatch[1];
      newContent = newContent.replace(inlineMatch[0], `function ${compNameBase}(`);
      newContent += `\nexport default ${compNameBase};\n`;
    }
  }

  let hasParams = false;
  if (newContent.includes('useParams')) {
    hasParams = true;
    newContent = newContent.replace(/useParams\s*,?/, '');
    
    // Find component definition
    if (compNameBase) {
      const compRegex = new RegExp(`const\\s+${compNameBase}\\s*:\\s*React\\.FC(?:<[^>]+>)?\\s*=\\s*\\(\\)\\s*=>\\s*\\{`);
      const compMatch = newContent.match(compRegex) || newContent.match(new RegExp(`const\\s+${compNameBase}\\s*=\\s*\\(\\)\\s*=>\\s*\\{`)) || newContent.match(new RegExp(`function\\s+${compNameBase}\\s*\\(\\)\\s*\\{`));
      
      if (compMatch) {
        const paramMatch = newContent.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*useParams[^;]*;/);
        if (paramMatch) {
          const paramName = paramMatch[1].replace(/:\s*string/, '').trim(); // handling { id: string } syntax
          newContent = newContent.replace(compMatch[0], `const ${compNameBase} = ({ params }: { params: any }) => {`);
          newContent = newContent.replace(paramMatch[0], `const { ${paramName} } = params;`);
        }
      }
    }
  }

  // Remove ProtectedRoute
  newContent = newContent.replace(/import\s+ProtectedRoute\s+from\s+[^;]+;?/g, '');
  newContent = newContent.replace(/<ProtectedRoute[^>]*>/g, '<>');
  newContent = newContent.replace(/<\/ProtectedRoute>/g, '</>');
  
  // Also remove SidebarLayout if wrapped? Next.js layouts should handle this, or we can leave it.
  // Wait, in CRA, "SidebarLayout" is used via react-router. Let's see if admin pages import it. Admin pages don't import SidebarLayout, it's done at app level.

  // Determine path level difference to inject imports correctly.
  // src/pages/products/list.tsx (2 levels up) -> src/app/products/list/page.tsx (3 levels up)
  const sourceLevel = page.src.split('/').length - 1; // e.g. pages/products/list.tsx -> 2
  const destLevel = page.dest.split('/').length - 1; // e.g. products/list/page.tsx -> 2
  // Let's assume most imports are relative.
  const diff = destLevel - sourceLevel + 1; // We need to add diff number of "../"
  
  if (diff > 0) {
    // Instead of complex AST, let's just do a hacky regex relative path replacer
    const prependStr = '../'.repeat(diff);
    newContent = newContent.replace(/(from\s+['"])(\.\.\/)+/g, (match, p1, p2) => {
      return p1 + prependStr + match.substring(p1.length);
    });
    newContent = newContent.replace(/(import\s+[^'"]+['"])(\.\.\/)+/g, (match, p1, p2) => {
      return p1 + prependStr + match.substring(p1.length);
    });
  }

  // Wrap with context.
  if (page.wrapper && compNameBase) {
    const bundleImport = `import { ${page.wrapper} } from "${'../'.repeat(destLevel + 1)}context/RouteContextBundles";`;
    newContent = newContent.replace(/"use client";/g, `"use client";\n${bundleImport}\n`);
    
    // Replace export default
    const exportRegex = new RegExp(`export\\s+default\\s+${compNameBase}\\s*;`);
    const wrapperFunction = `
export default function Wrapped${compNameBase}(props: any) {
  return (
    <${page.wrapper}>
      <${compNameBase} {...props} />
    </${page.wrapper}>
  );
}
`;
    newContent = newContent.replace(exportRegex, wrapperFunction);
  } else if (compNameBase) {
    // Directly export default if no wrapper
     const exportRegex = new RegExp(`export\\s+default\\s+${compNameBase}\\s*;`);
     const wrapperFunction = `
 export default function Wrapped${compNameBase}(props: any) {
   return (
     <${compNameBase} {...props} />
   );
 }
 `;
     newContent = newContent.replace(exportRegex, wrapperFunction);
  }

  return newContent;
}

for (const page of pages) {
  const srcPath = path.join(SRC_DIR, page.src);
  const destPath = path.join(DEST_DIR, page.dest);
  
  if (fs.existsSync(srcPath)) {
    const content = fs.readFileSync(srcPath, 'utf8');
    const newContent = transform(content, page);
    
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, newContent);
    console.log(`Migrated ${page.src} -> ${page.dest}`);
  } else {
    console.error(`Source not found: ${srcPath}`);
  }
}
