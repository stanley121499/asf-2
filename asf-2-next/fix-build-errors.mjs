/**
 * fix-build-errors.mjs — fixes the 2 remaining import path errors:
 * 1. posts/schedule page imports ../customDatePickerWidth.css → needs to also copy CSS there
 * 2. support/chat-window imports ../pages/loading → replace with @/app/loading
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";

// Fix 1: Copy CSS to the schedule page's parent directory too
const CSS_SRC = "src/app/posts/customDatePickerWidth.css";
const CSS_DST = "src/app/customDatePickerWidth.css"; // ../customDatePickerWidth.css from posts/schedule/...
if (existsSync(CSS_SRC) && !existsSync(CSS_DST)) {
  copyFileSync(CSS_SRC, CSS_DST);
  console.log("Copied CSS to app root");
}

// Also copy to the exact location the schedule page expects (one level up from posts/)
// The schedule page is at posts/schedule/[[...postId]]/page.tsx, importing ../customDatePickerWidth.css
// which resolves to posts/schedule/customDatePickerWidth.css — no, wait:
// ../customDatePickerWidth.css from posts/schedule/[[...postId]]/ goes to posts/customDatePickerWidth.css (already there)
// but the error says "posts/schedule/[[...postId]]/page.tsx can't resolve ../customDatePickerWidth.css"
// from that directory, ../ goes to posts/schedule/ — so we need it there too!
const CSS_DST2 = "src/app/posts/schedule/customDatePickerWidth.css";
if (existsSync(CSS_SRC) && !existsSync(CSS_DST2)) {
  copyFileSync(CSS_SRC, CSS_DST2);
  console.log("Copied CSS to posts/schedule/");
}

// Fix 2: Replace ../pages/loading in support/chat-window.tsx with @/app/loading
const CHAT_PATH = "src/app/support/chat-window.tsx";
if (existsSync(CHAT_PATH)) {
  let c = readFileSync(CHAT_PATH, "utf8");
  const n = c
    .replace(/from "\.\.\/pages\/loading"/g, 'from "@/app/loading"')
    .replace(/from '\.\.\/pages\/loading'/g, 'from "@/app/loading"')
    .replace(/from "\.\.\/\.\.\/pages\/loading"/g, 'from "@/app/loading"')
    .replace(/from '\.\.\/\.\.\/pages\/loading'/g, 'from "@/app/loading"');
  if (n !== c) {
    writeFileSync(CHAT_PATH, n, "utf8");
    console.log("Fixed loading import in chat-window.tsx");
  }
}

console.log("Done.");
