/**
 * fix-participant-types-v2.mjs
 * More specific: only fixes the untyped p in participants.some/find/filter callbacks
 * Reverts the too-broad changes from the previous version
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

  // REVERT the too-broad fix: change non-participant callbacks back
  // Pattern: .filter((p: { user_id: string }) => p.id  — p.id means it's not a participant
  n = n.replace(/\.filter\(\(p: \{ user_id: string \}\) => p\.id/g, ".filter((p) => p.id");
  n = n.replace(/\.sort\(\(p: \{ user_id: string \}\)/g, ".sort((p");

  // Keep only the participants.some/find with explicit type (these are correct)
  // The pattern .participants.some((p: { user_id: string }) is fine
  // But standalone .some((p: { user_id: string }) => p.id is wrong
  n = n.replace(/(?<!participants)\.some\(\(p: \{ user_id: string \}\) => p\.id/g, ".some((p) => p.id");
  n = n.replace(/(?<!participants)\.find\(\(p: \{ user_id: string \}\) => p\.id/g, ".find((p) => p.id");
  n = n.replace(/(?<!participants)\.filter\(\(p: \{ user_id: string \}\) => p\.id/g, ".filter((p) => p.id");

  if (n !== c) {
    writeFileSync(file, n, "utf8");
    console.log("reverted:", file);
    changed++;
  }
}

console.log(`\nDone. Reverted ${changed} files.`);
