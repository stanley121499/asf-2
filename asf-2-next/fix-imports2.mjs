import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function walk(dir) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      let c = readFileSync(full, "utf8");
      // Fix @/pages/loading → @/app/loading
      let n = c.replace(/@\/pages\/loading/g, "@/app/loading");
      // Fix misplaced "use client" — ensure it's always the first line
      n = n.replace(/^(import[^;]+;\s*)\n("use client";)/m, '"use client";\n$1');
      // Fix empty react-router-dom imports
      n = n.replace(/^import \{ *\} from "react-router-dom";\n/gm, "");
      // Fix remaining react-router-dom Link imports
      n = n.replace(/import \{[\s]*Link[\s]*,[\s]*\} from "react-router-dom";/g, 'import Link from "next/link";');
      n = n.replace(/import \{[\s]*Link[\s]*\} from "react-router-dom";/g, 'import Link from "next/link";');
      // Fix router.push(-1) → router.back()
      n = n.replace(/router\.push\(-1\)/g, "router.back()");
      if (n !== c) {
        writeFileSync(full, n, "utf8");
        console.log("fixed:", full);
      }
    }
  }
}

walk("src");
console.log("Done.");
