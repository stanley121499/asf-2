/**
 * copy-page-components.mjs
 * Reads all Next.js page files, finds local relative imports that don't exist yet,
 * then copies the matching files from the CRA source (../../asf-2/src/pages/) tree.
 * Also rewrites relative imports (../../context/, ../../utils/) to @/ aliases.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, resolve, dirname, basename, extname } from "path";

const CRA_PAGES = resolve("../asf-2/src/pages");
const NEXT_APP  = resolve("src/app");

/** Walk a directory and return all files */
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    statSync(full).isDirectory() ? walk(full, out) : out.push(full);
  }
  return out;
}

/** Fix CRA-style relative imports → @/ aliases */
function fixImports(content) {
  return content
    .replace(/from "\.\.\/\.\.\/context\//g, 'from "@/context/')
    .replace(/from '\.\.\/\.\.\/context\//g, "from '@/context/")
    .replace(/from "\.\.\/context\//g, 'from "@/context/')
    .replace(/from '\.\.\/context\//g, "from '@/context/")
    .replace(/from "\.\.\/\.\.\/utils\//g, 'from "@/utils/')
    .replace(/from '\.\.\/\.\.\/utils\//g, "from '@/utils/")
    .replace(/from "\.\.\/utils\//g, 'from "@/utils/')
    .replace(/from '\.\.\/utils\//g, "from '@/utils/")
    .replace(/from "\.\.\/\.\.\/components\//g, 'from "@/components/')
    .replace(/from '\.\.\/\.\.\/components\//g, "from '@/components/")
    .replace(/from "\.\.\/components\//g, 'from "@/components/')
    .replace(/from '\.\.\/components\//g, "from '@/components/")
    .replace(/from "\.\.\/\.\.\/types\//g, 'from "@/types/')
    .replace(/from '\.\.\/\.\.\/types\//g, "from '@/types/")
    .replace(/from "\.\.\/\.\.\/hooks\//g, 'from "@/hooks/')
    .replace(/from '\.\.\/\.\.\/hooks\//g, "from '@/hooks/")
    // Add "use client" if it has React hooks / browser APIs but not already marked
    ;
}

/** Add "use client" if not present and file has hooks */
function ensureUseClient(content, filePath) {
  if (content.startsWith('"use client"') || content.startsWith("'use client'")) return content;
  const needsClient = /use(State|Effect|Ref|Callback|Memo|Context|Router|Pathname|SearchParams|Navigate)\s*\(/.test(content)
    || /onClick|onChange|onSubmit|window\.|document\./.test(content);
  if (needsClient) return '"use client";\n' + content;
  return content;
}

// 1. Find all files already in the Next.js app (tsx/ts)
const nextFiles = walk(NEXT_APP).filter(f => f.endsWith(".tsx") || f.endsWith(".ts"));

let copied = 0;

for (const nextFile of nextFiles) {
  const content = readFileSync(nextFile, "utf8");
  const fileDir  = dirname(nextFile);

  // Find local relative imports: ./something or ../something (not @/)
  const importRe = /from ['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importRe.exec(content)) !== null) {
    const importPath = match[1];
    // Skip non-local or already-resolved
    if (!importPath.startsWith(".")) continue;

    const candidates = [".tsx",".ts",".css",""].flatMap(ext => [
      resolve(fileDir, importPath + ext),
      resolve(fileDir, importPath + "/index" + ext),
    ]);

    const alreadyExists = candidates.some(existsSync);
    if (alreadyExists) continue;

    // Try to find a matching file in CRA pages
    const leafName = basename(importPath);

    // Compute the relative sub-path from NEXT_APP to fileDir
    const relFromApp  = fileDir.replace(NEXT_APP, "").replace(/\\/g, "/").replace(/^\//, "");
    // Try matching in CRA pages sub-path
    const craSubPath = join(CRA_PAGES, relFromApp);

    // Try extensions
    const exts = [".tsx", ".ts", ".css", ".scss", ""];
    let found = null;
    for (const ext of exts) {
      const candidate = join(fileDir.replace(NEXT_APP, CRA_PAGES), leafName + ext);
      if (existsSync(candidate)) { found = candidate; break; }
      const candidate2 = join(craSubPath, leafName + ext);
      if (existsSync(candidate2)) { found = candidate2; break; }
    }

    if (!found) {
      console.warn(`  [SKIP] No CRA source for: ${importPath} (in ${nextFile.replace(process.cwd(),".")})`);
      continue;
    }

    // Determine destination path
    const destExt  = extname(found);
    const destPath = resolve(fileDir, leafName + destExt);

    if (existsSync(destPath)) continue; // already there

    let src = readFileSync(found, "utf8");
    if (destExt !== ".css") {
      src = fixImports(src);
      src = ensureUseClient(src, destPath);
    }
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, src, "utf8");
    console.log(`  [COPY] ${found.replace(process.cwd(),"")} → ${destPath.replace(process.cwd(),"")}`);
    copied++;
  }
}

console.log(`\nDone. Copied ${copied} files.`);
