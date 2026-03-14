import fs from 'fs';
import path from 'path';

const SRC_DIR = 'e:/Dev/GitHub/asf-2/src';
const DEST_DIR = 'e:/Dev/GitHub/asf-2-next/src/app';

const pages = [
  { src: 'pages/landing/Cart.tsx', dest: '(customer)/cart/page.tsx' },
  { src: 'pages/landing/Checkout.tsx', dest: '(customer)/checkout/page.tsx' },
  { src: 'pages/landing/Wishlist.tsx', dest: '(customer)/wishlist/page.tsx' },
  { src: 'pages/landing/OrderDetail.tsx', dest: '(customer)/order-details/[orderId]/page.tsx' },
  { src: 'pages/landing/notifications.tsx', dest: '(customer)/notifications/page.tsx' },
  { src: 'pages/landing/Settings.tsx', dest: '(customer)/settings/page.tsx' },
  { src: 'pages/landing/Goal.tsx', dest: '(customer)/goal/page.tsx' },
  { src: 'pages/landing/Chat.tsx', dest: '(customer)/support-chat/page.tsx', wrapper: 'CommunityContextBundle' },
  { src: 'pages/authentication/sign-in.tsx', dest: 'authentication/sign-in/page.tsx' },
  { src: 'pages/legal/privacy.tsx', dest: 'legal/privacy/page.tsx' },
  { src: 'components/stripe/OrderSuccess.tsx', dest: 'order-success/page.tsx' },
  { src: 'components/stripe/OrderCancel.tsx', dest: 'order-cancel/page.tsx' }
];

function transform(content, page) {
  let isServerComponent = page.src.includes('privacy.tsx');
  let newContent = content;

  if (!isServerComponent) {
    if (!newContent.includes('"use client"')) {
      newContent = '"use client";\n' + newContent;
    }
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

  // Handle useParams
  // E.g. const { orderId } = useParams<{ orderId: string }>();
  // Change to read from props.
  if (newContent.includes('useParams')) {
    // Remove useParams from react-router-dom import
    newContent = newContent.replace(/useParams\s*,?/, '');
    
    // The component might be defined as: const OrderDetail: React.FC = () => {
    // We want to turn it into: export default function OrderDetailPage({ params }: { params: { orderId: string } }) {
    
    // Instead of complex AST, let's just do a hacky regex or inject params manually
    // Find component definition
    const compMatch = newContent.match(/const\s+([A-Za-z0-9_]+)\s*:\s*React\.FC\s*=\s*\(\)\s*=>\s*\{/);
    if (compMatch) {
      const compName = compMatch[1];
      const paramMatch = newContent.match(/const\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*=\s*useParams[^;]*;/);
      if (paramMatch) {
        const paramName = paramMatch[1];
        newContent = newContent.replace(compMatch[0], `const ${compName} = ({ params }: { params: { ${paramName}: string } }) => {`);
        newContent = newContent.replace(paramMatch[0], `const { ${paramName} } = params;`);
      }
    }
  }

  // Remove ProtectedRoute
  newContent = newContent.replace(/import\s+ProtectedRoute\s+from\s+[^;]+;?/g, '');
  newContent = newContent.replace(/<ProtectedRoute[^>]*>/g, '<>');
  newContent = newContent.replace(/<\/ProtectedRoute>/g, '</>');

  // Fix imports relative paths
  // If moving from pages/landing/Cart.tsx to src/app/(customer)/cart/page.tsx
  // the nesting level goes from 2 (../../) to 4 (../../../../)
  // Or we can just let tsc complain and fix it, but let's try to adjust
  // Simple hack: import ... from "../../components..." -> import ... from "../../../../components..."
  if (page.src.startsWith('pages/landing')) {
    newContent = newContent.replace(/from\s+['"]\.\.\/\.\.\//g, 'from "../../../../');
    newContent = newContent.replace(/from\s+['"]\.\.\//g, 'from "../../../');
  } else if (page.src.startsWith('components/stripe')) {
    newContent = newContent.replace(/from\s+['"]\.\.\/\.\.\//g, 'from "../../../');
  }

  if (page.wrapper === 'CommunityContextBundle') {
    newContent = newContent.replace(
      /import\s+CommunityContextBundle\s+from\s+[^;]+;/, 
      ''
    );
    newContent = 'import { CommunityContextBundle } from "../../../../context/RouteContextBundles";\n' + newContent;
    // Find return ( ... ); and wrap it.
    newContent = newContent.replace(/return\s*\(\s*(<[\s\S]*)\s*\);/, 'return (\n<CommunityContextBundle>\n$1\n</CommunityContextBundle>\n);');
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
