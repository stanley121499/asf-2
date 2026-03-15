const fs = require('fs');
const files = [
  '../asf-2-next/src/app/(customer)/_components/HomePageClient.tsx',
  '../asf-2-next/src/app/(customer)/highlights/_components/HighlightsClient.tsx',
  '../asf-2-next/src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx',
  '../asf-2-next/src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let text = fs.readFileSync(f, 'utf8');
    text = text.replace(/\\`/g, '`');
    text = text.replace(/\\\$/g, '$');
    fs.writeFileSync(f, text);
    console.log("Fixed", f);
  }
});

const supportChat = '../asf-2-next/src/app/(customer)/support-chat/page.tsx';
if (fs.existsSync(supportChat)) {
  let text = fs.readFileSync(supportChat, 'utf8');
  // Revert the naive CommunityContextBundle wrapper that broke everything.
  text = text.replace(/return \(\n<CommunityContextBundle>\n([\s\S]*?)<\/CommunityContextBundle>\n\);/g, 'return ( $1 );');
  // We can just wrap the default export like we did in Agent 5/6.
  const exportMatch = text.match(/export default (function |const )([A-Za-z0-9_]+)/);
  if (exportMatch) {
    // Actually support-chat was migrated in Agent 4 which didn't use the good wrapper approach. Let's just manually replace the last export.
    const compName = exportMatch[2];
    text = text.replace(new RegExp(`export default ${compName};`), `
export default function WrappedChat() {
  return (
    <CommunityContextBundle>
      <${compName} />
    </CommunityContextBundle>
  );
}`);
  }
  fs.writeFileSync(supportChat, text);
  console.log("Fixed support-chat");
}
