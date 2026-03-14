import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Fix remaining issues:
// - ../pages/loading  (badly patched by fix-imports2)
// - ../support/chat-window  
// - ../support/UserPicker

function walk(dir) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      let c = readFileSync(full, "utf8");
      let n = c;
      n = n.replace(/from "\.\.\/pages\/loading"/g, 'from "@/app/loading"');
      n = n.replace(/from "\.\.\/support\/chat-window"/g, 'from "@/components/ChatWindow"');
      n = n.replace(/from "\.\.\/support\/UserPicker"/g, 'from "@/components/UserPicker"');
      n = n.replace(/from "\.\.\/support\/ChatWindow"/g, 'from "@/components/ChatWindow"');
      n = n.replace(/import LoadingPage from "(\.\.\/)+pages\/loading"/g, 'import LoadingPage from "@/app/loading"');
      if (n !== c) {
        writeFileSync(full, n, "utf8");
        console.log("fixed:", full);
      }
    }
  }
}

walk("src");
console.log("Done.");
