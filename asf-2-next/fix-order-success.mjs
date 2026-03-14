import { readFileSync, writeFileSync } from "fs";

const file = "src/app/order-success/page.tsx";
let c = readFileSync(file, "utf8");

// Fix the broken window."" patterns — replace line by line
const lines = c.split(/\r?\n/);
let fixed = [];
let i = 0;
let inserted = false;

while (i < lines.length) {
  const line = lines[i];

  // Pattern: const [session, setSession] = useState<Session | null>(null);
  if (!inserted && line.includes("const [session, setSession]")) {
    fixed.push(line); // keep it
    // skip the broken sessionId and mode lines (they span ~4 lines)
    i++;
    // Skip until we find a line that is not part of the broken block
    while (i < lines.length &&
      (lines[i].includes("sessionId") || lines[i].includes("new URLSearchParams") || 
       lines[i].includes("window.") || lines[i].includes("session_id") ||
       (lines[i].trim() === ");" && fixed.length > 0 && (lines[i-1] || "").includes("get(")))) {
      i++;
    }
    // Insert the corrected block
    fixed.push('  const searchParams = useSearchParams();');
    fixed.push('  const sessionId = searchParams.get("session_id");');
    fixed.push('  const mode = searchParams.get("mode");');
    inserted = true;
    continue;
  }

  fixed.push(line);
  i++;
}

writeFileSync(file, fixed.join("\n"), "utf8");
console.log("Done. Fixed", file);
