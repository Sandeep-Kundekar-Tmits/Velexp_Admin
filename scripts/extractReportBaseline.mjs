/**
 * Captures the CURRENT behaviour of every report screen as a baseline.
 *
 * The report engine (CP-5) replaces ~29 screens with declarative configs. The
 * risk is not that a screen fails to render -- that is obvious -- but that its
 * request payload or its Excel column list changes subtly, so the backend
 * returns different rows or a customer receives a spreadsheet with a column
 * missing. Neither shows up in a build or a unit test.
 *
 * So before migrating anything, this records for each screen:
 *   - the endpoint constant it POSTs to
 *   - every payload literal, with keys IN ORDER and their source expressions
 *   - the Excel filename and header list, IN ORDER
 *
 * tests/reportBaseline.test.js then asserts each migrated config reproduces
 * this exactly. A drifting payload fails the suite instead of quietly
 * returning the wrong rows.
 *
 * Usage:
 *   node scripts/extractReportBaseline.mjs            # write the baseline
 *   node scripts/extractReportBaseline.mjs --check    # fail if it changed
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "tests/baseline/reports.json");

/**
 * Screens already moved to the config-driven engine.
 *
 * The baseline is a FROZEN pre-migration record — it must not be regenerated as
 * screens migrate, because each config's test compares against its entry. Once
 * a screen is migrated its source no longer contains the payload/export
 * literals, so --check would report drift forever; listing it here excludes it
 * from the guard while leaving its recorded entry intact.
 *
 * Add a screen here in the same commit that migrates it.
 */
const MIGRATED = new Set([
  "src/pages/Dashboard/Reports/CODReport.jsx",
  "src/pages/Dashboard/Reports/PickupPeformance.jsx",
]);

const DIRS = [
  "src/pages/Dashboard/Reports",
  "src/pages/Dashboard/Reports/customer_Performance",
  "src/pages/OpsDisputes",
  "src/pages/NewFeatures",
];

/** Collapse whitespace so formatting changes don't register as drift. */
const norm = (s) => s.replace(/\s+/g, " ").trim();

/** Split an object literal body on top-level commas only. */
function splitTopLevel(body) {
  const out = [];
  let depth = 0, cur = "", inStr = null;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inStr) {
      cur += ch;
      if (ch === inStr && body[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; cur += ch; continue; }
    if ("{[(".includes(ch)) depth++;
    if ("}])".includes(ch)) depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/** Read a balanced {...} starting at `start` (which must be the '{'). */
function readObject(src, start) {
  let depth = 0, inStr = null;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === inStr && src[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(start + 1, i);
    }
  }
  return null;
}

/** key -> expression pairs, order preserved. */
function parsePairs(body) {
  return splitTopLevel(body)
    .map((part) => {
      const m = /^\s*(?:(["'])(.*?)\1|([A-Za-z_$][\w$]*))\s*:\s*([\s\S]+)$/.exec(part);
      if (!m) return null;
      return { key: m[2] ?? m[3], expr: norm(m[4]) };
    })
    .filter(Boolean);
}

function extract(file) {
  const src = fs.readFileSync(file, "utf8");
  const rec = { file: path.relative(root, file).replace(/\\/g, "/"), payloads: [], exports: [] };

  // payload objects: `let payload = {` / `const payload = {`
  for (const m of src.matchAll(/(?:let|const|var)\s+(\w*[Pp]ayload\w*)\s*=\s*\{/g)) {
    const body = readObject(src, m.index + m[0].length - 1);
    if (body) rec.payloads.push({ name: m[1], pairs: parsePairs(body) });
  }

  // endpoints POSTed to, in call order
  rec.endpoints = [
    ...new Set([...src.matchAll(/\b\w*[Aa]pifunc\w*\s*\(\s*([A-Z][A-Z0-9_]+)/g)].map((m) => m[1])),
  ];
  for (const m of src.matchAll(/\b(?:await\s+)?\w+\(\s*([A-Z][A-Z0-9_]{4,})\s*,/g)) {
    if (!rec.endpoints.includes(m[1])) rec.endpoints.push(m[1]);
  }

  // Excel exports: exportToExcel(data, "Name", (item) => ({ ... }))
  for (const m of src.matchAll(/exportToExcel\s*\(\s*[^,]+,\s*(["'])(.*?)\1\s*,\s*\([^)]*\)\s*=>\s*\(\s*\{/g)) {
    const body = readObject(src, m.index + m[0].length - 1);
    if (body) {
      const pairs = parsePairs(body);
      rec.exports.push({ fileName: m[2], headers: pairs.map((p) => p.key), fields: pairs.map((p) => p.expr) });
    }
  }
  return rec;
}

const files = DIRS.flatMap((d) => {
  const abs = path.join(root, d);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.endsWith(".jsx")).map((f) => path.join(abs, f));
});

const records = files
  .map(extract)
  .filter((r) => r.payloads.length || r.exports.length)
  .sort((a, b) => a.file.localeCompare(b.file));

const json = JSON.stringify(records, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const prev = JSON.parse(fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "[]");
  const cmp = (list) => JSON.stringify(list.filter((r) => !MIGRATED.has(r.file)));
  if (cmp(prev) !== cmp(records)) {
    console.error(
      "Report baseline CHANGED for a screen that has NOT been migrated.\n" +
        "Either an unmigrated screen's payload/export was edited, or a migrated\n" +
        "screen is missing from the MIGRATED list in this script."
    );
    process.exit(1);
  }
  const done = prev.filter((r) => MIGRATED.has(r.file)).length;
  console.log(`report baseline unchanged (${done} screen(s) migrated and excluded)`);
} else if (fs.existsSync(OUT) && !process.argv.includes("--force")) {
  console.error(
    "Baseline already exists and is a FROZEN pre-migration record.\n" +
      "Regenerating it would erase the reference each config test compares\n" +
      "against. Pass --force only if you genuinely mean to re-baseline."
  );
  process.exit(1);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, json);
  const payloads = records.reduce((n, r) => n + r.payloads.length, 0);
  const exports_ = records.reduce((n, r) => n + r.exports.length, 0);
  const headers = records.reduce((n, r) => n + r.exports.reduce((h, e) => h + e.headers.length, 0), 0);
  console.log(`captured ${records.length} screens: ${payloads} payload literals, ${exports_} exports, ${headers} Excel headers`);
}
