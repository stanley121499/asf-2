/**
 * fix-mixed-quotes.mjs
 * Fixes malformed imports where single open + double close quotes were mixed:
 *   from '@/something"  →  from "@/something"
 * Also does a general normalisation of from '...' to from "..."
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
let fixed = 0;

for (const file of files) {
  let c = readFileSync(file, "utf8");
  let n = c;

  // Fix mixed: from '...something"  or  } from '...something"
  // Pattern: single-quoted opening with double-quoted close
  n = n.replace(/from '(@\/[^"']+)"/g, 'from "$1"');
  n = n.replace(/from '(\.[^"']+)"/g, 'from "$1"');

  // Also normalise all single-quoted module imports to double-quoted
  // (only for from '...' patterns, not JSX strings)
  n = n.replace(/\bfrom '([^']+)'/g, 'from "$1"');

  if (n !== c) {
    writeFileSync(file, n, "utf8");
    console.log("fixed:", file);
    fixed++;
  }
}

console.log(`\nDone. Fixed ${fixed} files.`);
