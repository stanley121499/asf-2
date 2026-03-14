import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Replace all remaining react-router-dom usages in src/ with Next.js equivalents
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      let c = readFileSync(full, "utf8");
      let n = c;

      // Remove empty react-router-dom imports
      n = n.replace(/^import \{ *\} from "react-router-dom";\n/gm, "");

      // Replace useNavigate import + usage
      if (n.includes('useNavigate') && n.includes('react-router-dom')) {
        n = n.replace(/import \{([^}]*)\buseNavigate\b([^}]*)\} from "react-router-dom";/g, (_, before, after) => {
          const others = (before + after).replace(/,\s*,/g, ',').replace(/^\s*,|,\s*$/g, '').trim();
          const navigateImport = `import { useRouter } from "next/navigation";`;
          return others.length > 0
            ? `import { ${others} } from "react-router-dom"; // TODO: migrate remaining\n${navigateImport}`
            : navigateImport;
        });
        n = n.replace(/const navigate = useNavigate\(\);?/g, "const router = useRouter();");
        n = n.replace(/\bnavigate\(/g, "router.push(");
      }

      // Replace useLocation
      if (n.includes('useLocation') && n.includes('react-router-dom')) {
        n = n.replace(/import \{([^}]*)\buseLocation\b([^}]*)\} from "react-router-dom";/g, (_, before, after) => {
          const others = (before + after).replace(/,\s*,/g, ',').replace(/^\s*,|,\s*$/g, '').trim();
          const locationImport = `import { usePathname } from "next/navigation";`;
          return others.length > 0
            ? `import { ${others} } from "react-router-dom"; // TODO: migrate remaining\n${locationImport}`
            : locationImport;
        });
        n = n.replace(/const location = useLocation\(\);?/g, "const pathname = usePathname();");
        n = n.replace(/\blocation\.pathname\b/g, "pathname");
      }

      if (n !== c) {
        writeFileSync(full, n, "utf8");
        console.log("fixed:", full);
      }
    }
  }
}

walk("src");
console.log("Done.");
