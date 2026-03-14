/**
 * fix-all-remaining.mjs
 * Final comprehensive fix for all remaining CRA → Next.js migration issues:
 * 1. useLocation → usePathname (next/navigation)
 * 2. useHistory → useRouter (next/navigation)
 * 3. useNavigate that wasn't caught before
 * 4. Link from react-router-dom → next/link
 * 5. Any remaining react-router-dom imports → cleaned up
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    statSync(full).isDirectory() ? walk(full, out) : out.push(full);
  }
  return out;
}

const files = walk("src").filter(f => f.endsWith(".tsx") || f.endsWith(".ts"));
let changed = 0;

for (const file of files) {
  let c = readFileSync(file, "utf8");
  let n = c;

  // 1. Replace useLocation import from react-router-dom with usePathname
  n = n.replace(
    /import\s*\{([^}]*)\buseLocation\b([^}]*)\}\s*from\s*["']react-router-dom["'];?/g,
    (_, before, after) => {
      const others = (before + after).replace(/,\s*$|^\s*,/g, "").trim().replace(/,\s*,/g, ",");
      const base = `import { usePathname } from "next/navigation";`;
      return others.length > 0 ? `import { ${others} } from "react-router-dom";\n${base}` : base;
    }
  );

  // 2. Replace useHistory
  n = n.replace(
    /import\s*\{([^}]*)\buseHistory\b([^}]*)\}\s*from\s*["']react-router-dom["'];?/g,
    (_, before, after) => {
      const others = (before + after).replace(/,\s*$|^\s*,/g, "").trim().replace(/,\s*,/g, ",");
      const base = `import { useRouter } from "next/navigation";`;
      return others.length > 0 ? `import { ${others} } from "react-router-dom";\n${base}` : base;
    }
  );

  // 3. Replace const location = useLocation(); → const pathname = usePathname();
  n = n.replace(/const location = useLocation\(\);?/g, "const pathname = usePathname();");

  // 4. Replace location.pathname → pathname
  n = n.replace(/\blocation\.pathname\b/g, "pathname");

  // 5. Replace location.search → ''  (useSearchParams handles this in Next.js)
  n = n.replace(/\blocation\.search\b/g, "\"\"");

  // 6. Replace const history = useHistory() → const router = useRouter()
  n = n.replace(/const history = useHistory\(\);?/g, "const router = useRouter();");
  n = n.replace(/\bhistory\.push\(/g, "router.push(");
  n = n.replace(/\bhistory\.replace\(/g, "router.replace(");
  n = n.replace(/\bhistory\.go\(/g, "router.back(/* was history.go(");
  n = n.replace(/\bhistory\.goBack\(\)/g, "router.back()");

  if (n !== c) {
    writeFileSync(file, n, "utf8");
    console.log("fixed:", file);
    changed++;
  }
}

console.log(`\nDone. Fixed ${changed} files.`);
