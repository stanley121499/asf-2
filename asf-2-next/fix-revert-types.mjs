/**
 * Targeted revert: fix any non-participants callback that incorrectly
 * got typed as { user_id: string }
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

  // Remove incorrect { user_id: string } from any callback where the
  // thing being iterated is NOT participants e.g:
  // products.find((p: { user_id: string }) => ...) -> products.find((p) => ...)
  // posts.filter((p: { user_id: string }) => ...) -> posts.filter((p) => ...)
  // But keep: .participants.some((p: { user_id: string }) => ...) ← correct

  // Strategy: remove the annotation when preceded by variableName.find/filter/some
  // and that variable is NOT "participants"
  n = n.replace(
    /(?<!\bparticipants|\bconversations)\.(find|filter|some|map|every)\(\(p: \{ user_id: string \}\)/g,
    (_, method) => `.${method}((p)`
  );

  if (n !== c) {
    writeFileSync(file, n, "utf8");
    console.log("fixed:", file);
    changed++;
  }
}

console.log(`\nDone. Fixed ${changed} files.`);
