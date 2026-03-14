/**
 * fix-participant-types.mjs
 * Adds explicit type annotations to all untyped `p` parameters in participants.some/find/filter callbacks
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
  const n = c
    // Fix: .some((p) => p.user_id  → .some((p: { user_id: string }) => p.user_id
    .replace(/\.some\(\(p\)\s*=>/g, ".some((p: { user_id: string }) =>")
    .replace(/\.find\(\(p\)\s*=>/g, ".find((p: { user_id: string }) =>")
    .replace(/\.filter\(\(p\)\s*=>/g, ".filter((p: { user_id: string }) =>");
  
  if (n !== c) {
    writeFileSync(file, n, "utf8");
    console.log("fixed:", file);
    changed++;
  }
}

console.log(`\nDone. Fixed ${changed} files.`);
