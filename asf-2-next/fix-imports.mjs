import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const appDir = "./src/app";

// Regex: match any relative import starting with 2+ "../" that points to these src-level dirs/files
const badImportRe = /from\s+"((?:\.\.\/){2,})(context\/|components\/|layouts(?:\/|")|utils\/|hooks\/|helpers\/|database\.types|flowbite-theme|types\/|pages\/loading)/g;

function fixFile(filePath) {
  const original = readFileSync(filePath, "utf8");
  const fixed = original.replace(badImportRe, (_, _prefix, target) => {
    // Normalise: layouts" (no slash) → layouts/
    const normalTarget = target.replace(/^layouts"$/, "layouts/");
    return `from "@/${normalTarget}`;
  });
  // Also fix: from "../../../../layouts" (no trailing slash)
  const fixed2 = fixed.replace(
    /from\s+"((?:\.\.\/){2,})layouts"/g,
    'from "@/layouts"'
  );
  if (fixed2 !== original) {
    writeFileSync(filePath, fixed2, "utf8");
    console.log("patched:", filePath);
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      fixFile(full);
    }
  }
}

walk(appDir);
console.log("Done.");
