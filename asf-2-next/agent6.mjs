import fs from 'fs';
import path from 'path';

const SRC_DIR = 'e:/Dev/GitHub/asf-2/src';
const DEST_DIR = 'e:/Dev/GitHub/asf-2-next/src/app';

const pages = [
  { src: 'pages/orders/list.tsx', dest: 'orders/page.tsx', wrapper: 'OrderContextBundle' },
  { src: 'pages/orders/detail.tsx', dest: 'orders/[orderId]/page.tsx', wrapper: 'OrderContextBundle' },
  { src: 'pages/payments/list.tsx', dest: 'payments/page.tsx', wrapper: 'OrderContextBundle' },
  { src: 'pages/payments/detail.tsx', dest: 'payments/[paymentId]/page.tsx', wrapper: 'OrderContextBundle' },
  { src: 'pages/analytics/users.tsx', dest: 'analytics/users/page.tsx', wrapper: 'AnalyticsContextBundle' },
  { src: 'pages/analytics/products.tsx', dest: 'analytics/products/page.tsx', wrapper: 'AnalyticsContextBundle' },
  { src: 'pages/analytics/products-inner.tsx', dest: 'analytics/products-inner/[productId]/page.tsx', wrapper: 'AnalyticsContextBundle' },
  { src: 'pages/analytics/categories.tsx', dest: 'analytics/categories/page.tsx', wrapper: 'AnalyticsContextBundle' },
  { src: 'pages/analytics/categories-inner.tsx', dest: 'analytics/categories-inner/[categoryId]/page.tsx', wrapper: 'AnalyticsContextBundle' },
  { src: 'pages/analytics/support.tsx', dest: 'analytics/support/page.tsx', wrapper: 'AnalyticsContextBundle' },
  { src: 'pages/users/list.tsx', dest: 'users/list/page.tsx', wrapper: 'UserProvider' },
  { src: 'pages/users/settings.tsx', dest: 'users/settings/page.tsx', wrapper: 'UserProvider' },
  { src: 'pages/support/index.tsx', dest: 'support/page.tsx', wrapper: 'CommunityContextBundle' },
  { src: 'pages/internal-chat/index.tsx', dest: 'internal-chat/page.tsx', wrapper: 'CommunityContextBundle' },
  { src: 'pages/home-page-builder/index.tsx', dest: 'home-page-builder/page.tsx', wrapper: 'HomePageElementProvider' },
  { src: 'pages/pages/404.tsx', dest: 'not-found.tsx', wrapper: null },
  { src: 'pages/pages/500.tsx', dest: 'error.tsx', wrapper: null },
  { src: 'pages/pages/maintenance.tsx', dest: 'maintenance/page.tsx', wrapper: null },
  { src: 'pages/pages/loading.tsx', dest: 'loading.tsx', wrapper: null }
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
        // match something like const { orderId } = useParams();
        const paramMatch = newContent.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*useParams[^;]*;/);
        if (paramMatch) {
          const paramName = paramMatch[1].replace(/:\s*string/, '').trim();
          newContent = newContent.replace(compMatch[0], `const ${compNameBase} = ({ params }: { params: any }) => {`);
          newContent = newContent.replace(paramMatch[0], `const { ${paramName} } = params;`);
        }
      }
    }
  }

  // Some components read search params using query/URLSearchParams. Next.js App Router we should use useSearchParams
  // Not strictly required for the migration script as we swapped `useLocation` with `useSearchParams` but CRA `useLocation().search` requires `.get()` in Next?
  // They are roughly source-compatible if they did `new URLSearchParams(location.search)` but Next.js useSearchParams returns URLSearchParams directly.
  // I will just let TypeScript complain if it breaks since fixing it with pure regex might be tricky.

  // Remove ProtectedRoute
  newContent = newContent.replace(/import\s+ProtectedRoute\s+from\s+[^;]+;?/g, '');
  newContent = newContent.replace(/<ProtectedRoute[^>]*>/g, '<>');
  newContent = newContent.replace(/<\/ProtectedRoute>/g, '</>');

  // Fix relative imports
  const sourceLevel = page.src.split('/').length - 1;
  const destLevel = page.dest.split('/').length - 1;
  const diff = destLevel - sourceLevel + 1;
  
  if (diff > 0) {
    const prependStr = '../'.repeat(diff);
    newContent = newContent.replace(/(from\s+['"])(\.\.\/)+/g, (match, p1, p2) => {
      return p1 + prependStr + match.substring(p1.length);
    });
    newContent = newContent.replace(/(import\s+[^'"]+['"])(\.\.\/)+/g, (match, p1, p2) => {
      return p1 + prependStr + match.substring(p1.length);
    });
  } else if (diff < 0) {
     // If destination is closer to root! e.g pages/pages/500.tsx -> app/error.tsx
     const prependStr = '../'.repeat(destLevel + 1);
     newContent = newContent.replace(/(from\s+['"])(\.\.\/)+/g, (match, p1, p2) => {
       return p1 + prependStr; // simplistic replacement
     });
     newContent = newContent.replace(/(import\s+[^'"]+['"])(\.\.\/)+/g, (match, p1, p2) => {
       return p1 + prependStr;
     });
  }

  // Handle Provider wrapper
  if (page.wrapper && compNameBase) {
    let importPath = `${'../'.repeat(destLevel + 1)}context/RouteContextBundles`;
    if (page.wrapper === 'UserProvider') {
       importPath = `${'../'.repeat(destLevel + 1)}context/UserContext`;
    } else if (page.wrapper === 'HomePageElementProvider') {
       importPath = `${'../'.repeat(destLevel + 1)}context/HomePageElementContext`;
    }
    
    const bundleImport = `import { ${page.wrapper} } from "${importPath}";`;
    newContent = newContent.replace(/"use client";/g, `"use client";\n${bundleImport}\n`);
    
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

  // Error.tsx in Next.js requires properties: { error: Error & { digest?: string }, reset: () => void }
  // but we can just leave it for now or tweak specifically.
  if (page.dest === 'error.tsx') {
    if (compNameBase) {
      newContent = newContent.replace(`const ${compNameBase} = () => {`, `const ${compNameBase} = ({ error, reset }: any) => {`);
    }
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
