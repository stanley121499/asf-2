import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Fix relative image paths like ../../images/ or ../images/ → /images/
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith(".tsx") || full.endsWith(".ts") || full.endsWith(".css")) {
      let c = readFileSync(full, "utf8");
      let n = c;
      // Fix relative image paths in src= attributes and url() in CSS
      n = n.replace(/src="\.\.\/+images\//g, 'src="/images/');
      n = n.replace(/src='\.\.\/+images\//g, "src='/images/");
      n = n.replace(/href="\.\.\/+images\//g, 'href="/images/');
      n = n.replace(/url\(\.\.\/+images\//g, 'url(/images/');
      // Fix relative video/media paths too
      n = n.replace(/src="\.\.\/+videos\//g, 'src="/videos/');
      n = n.replace(/src="\.\.\/+fonts\//g, 'src="/fonts/');
      if (n !== c) {
        writeFileSync(full, n, "utf8");
        console.log("fixed:", full);
      }
    }
  }
}

walk("src");
console.log("Done.");
