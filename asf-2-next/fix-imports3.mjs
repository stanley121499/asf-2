import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Fix remaining issues:
// 1. Link to= → Link href=  (react-router style still lingering in some pages)
// 2. Remove any stray react-router-dom imports that slipped through

function walk(dir) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      let c = readFileSync(full, "utf8");
      // Fix Link to= → Link href=
      let n = c.replace(/<Link\s+to=/g, "<Link href=");
      // Fix any remaining `navigate(` from useNavigate
      n = n.replace(/\bnavigate\(/g, "router.push(");
      // Ensure "use client" is always first before any import
      if (n.includes('"use client"') && !n.startsWith('"use client"')) {
        n = n.replace(/^([\s\S]*?)("use client";)/m, (_, before, directive) => {
          return directive + "\n" + before.replace(directive, "");
        });
      }
      if (n !== c) {
        writeFileSync(full, n, "utf8");
        console.log("fixed:", full);
      }
    }
  }
}

walk("src/app");
console.log("Done.");
