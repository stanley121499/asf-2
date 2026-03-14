import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";

const SRC = "e:/Dev/GitHub/asf-2/src/pages";
const DST = "e:/Dev/GitHub/asf-2/asf-2-next/src/app";

// Map: [sourceRelPath, destRelPath]
const copies = [
  ["posts/post-editor.tsx",           "posts/create/[[...slugs]]/post-editor.tsx"],
  ["products/create-set-modal.tsx",   "products/categories/create-set-modal.tsx"],
  ["products/product-editor.tsx",     "products/create/[[...slugs]]/product-editor.tsx"],
  ["products/add-stock-modal.tsx",    "products/stock/[productId]/add-stock-modal.tsx"],
  ["products/add-return-modal.tsx",   "products/stock/[productId]/add-return-modal.tsx"],
  ["support/chat-window.tsx",         "support/chat-window.tsx"],
  ["users/add-user-modal.tsx",        "users/list/add-user-modal.tsx"],
  ["users/edit-user-modal.tsx",       "users/list/edit-user-modal.tsx"],
  ["customDatePickerWidth.css",       "posts/customDatePickerWidth.css"],
];

// Import path fixups: CRA relative → @/ aliases
function fixImports(src) {
  return src
    .replace(/from ["']\.\.\/\.\.\/context\//g, (m) => m.startsWith('"') ? 'from "@/context/' : "from '@/context/")
    .replace(/from ["']\.\.\/context\//g, (m) => m.startsWith('"') ? 'from "@/context/' : "from '@/context/")
    .replace(/from ["']\.\.\/\.\.\/utils\//g, (m) => m.startsWith('"') ? 'from "@/utils/' : "from '@/utils/")
    .replace(/from ["']\.\.\/utils\//g, (m) => m.startsWith('"') ? 'from "@/utils/' : "from '@/utils/")
    .replace(/from ["']\.\.\/\.\.\/components\//g, (m) => m.startsWith('"') ? 'from "@/components/' : "from '@/components/")
    .replace(/from ["']\.\.\/components\//g, (m) => m.startsWith('"') ? 'from "@/components/' : "from '@/components/")
    .replace(/from ["']\.\.\/\.\.\/types\//g, (m) => m.startsWith('"') ? 'from "@/types/' : "from '@/types/")
    .replace(/from ["']\.\.\/\.\.\/hooks\//g, (m) => m.startsWith('"') ? 'from "@/hooks/' : "from '@/hooks/");
}

function ensureClient(content) {
  if (content.trimStart().startsWith('"use client"') || content.trimStart().startsWith("'use client'")) return content;
  const needsClient = /use(State|Effect|Ref|Callback|Memo|Context|Router|Pathname|SearchParams)\s*\(/.test(content)
    || /onClick|onChange|onSubmit|window\.|document\./.test(content);
  return needsClient ? '"use client";\n' + content : content;
}

let ok = 0, skipped = 0;
for (const [from, to] of copies) {
  const srcPath = join(SRC, from).replace(/\//g, "\\");
  const dstPath = join(DST, to).replace(/\//g, "\\");

  if (!existsSync(srcPath)) {
    console.error("MISSING src:", srcPath);
    skipped++;
    continue;
  }
  if (existsSync(dstPath)) {
    console.log("EXISTS, skip:", to);
    skipped++;
    continue;
  }

  mkdirSync(dirname(dstPath), { recursive: true });

  if (from.endsWith(".css")) {
    copyFileSync(srcPath, dstPath);
  } else {
    let content = readFileSync(srcPath, "utf8");
    content = fixImports(content);
    content = ensureClient(content);
    writeFileSync(dstPath, content, "utf8");
  }
  console.log("COPIED:", to);
  ok++;
}

console.log(`\nDone: ${ok} copied, ${skipped} skipped.`);
