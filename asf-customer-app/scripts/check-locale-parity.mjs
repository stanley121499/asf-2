#!/usr/bin/env node
/**
 * Fails when zh-CN, en, and ms locale JSON key trees differ.
 * Usage: node scripts/check-locale-parity.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "..", "i18n", "locales");

const LOCALE_FILES = ["zh-CN.json", "en.json", "ms.json"];

/**
 * Collect leaf string key paths from a nested message object.
 * @param {Record<string, unknown>} obj
 * @param {string} [prefix]
 * @returns {string[]}
 */
function collectKeys(obj, prefix = "") {
  /** @type {string[]} */
  const keys = [];
  for (const key of Object.keys(obj).sort()) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...collectKeys(/** @type {Record<string, unknown>} */ (value), path));
    } else if (typeof value === "string") {
      keys.push(path);
    } else {
      throw new Error(`Unexpected value type at "${path}": ${typeof value}`);
    }
  }
  return keys;
}

/**
 * @param {string} filename
 * @returns {{ name: string, keys: string[] }}
 */
function loadLocaleKeys(filename) {
  const raw = readFileSync(join(localesDir, filename), "utf8");
  const data = JSON.parse(raw);
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${filename}: root must be a plain object`);
  }
  return {
    name: filename.replace(/\.json$/, ""),
    keys: collectKeys(/** @type {Record<string, unknown>} */ (data)),
  };
}

/**
 * @param {string[]} a
 * @param {string[]} b
 * @returns {{ onlyInA: string[], onlyInB: string[] }}
 */
function diffKeys(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  return {
    onlyInA: a.filter((k) => !setB.has(k)),
    onlyInB: b.filter((k) => !setA.has(k)),
  };
}

const locales = LOCALE_FILES.map(loadLocaleKeys);
const baseline = locales[0];
let failed = false;

console.log("Locale key parity check");
console.log("-----------------------");

for (const locale of locales) {
  console.log(`${locale.name}: ${locale.keys.length} leaf keys`);
}

for (let i = 1; i < locales.length; i += 1) {
  const other = locales[i];
  const { onlyInA, onlyInB } = diffKeys(baseline.keys, other.keys);
  if (onlyInA.length === 0 && onlyInB.length === 0) {
    console.log(`OK: ${baseline.name} ↔ ${other.name}`);
    continue;
  }
  failed = true;
  console.error(`MISMATCH: ${baseline.name} ↔ ${other.name}`);
  if (onlyInA.length > 0) {
    console.error(`  Only in ${baseline.name} (${onlyInA.length}):`);
    for (const key of onlyInA) {
      console.error(`    - ${key}`);
    }
  }
  if (onlyInB.length > 0) {
    console.error(`  Only in ${other.name} (${onlyInB.length}):`);
    for (const key of onlyInB) {
      console.error(`    - ${key}`);
    }
  }
}

// Also compare en ↔ ms directly in case zh-CN is the odd one out
const en = locales.find((l) => l.name === "en");
const ms = locales.find((l) => l.name === "ms");
if (en && ms) {
  const { onlyInA, onlyInB } = diffKeys(en.keys, ms.keys);
  if (onlyInA.length === 0 && onlyInB.length === 0) {
    console.log("OK: en ↔ ms");
  } else {
    failed = true;
    console.error("MISMATCH: en ↔ ms");
    if (onlyInA.length > 0) {
      console.error(`  Only in en (${onlyInA.length}):`);
      for (const key of onlyInA) {
        console.error(`    - ${key}`);
      }
    }
    if (onlyInB.length > 0) {
      console.error(`  Only in ms (${onlyInB.length}):`);
      for (const key of onlyInB) {
        console.error(`    - ${key}`);
      }
    }
  }
}

if (failed) {
  console.error("\nLocale key trees differ. Fix JSON catalogs before shipping.");
  process.exit(1);
}

console.log(`\nKey parity OK across ${locales.length} locales (${baseline.keys.length} keys each).`);
process.exit(0);
