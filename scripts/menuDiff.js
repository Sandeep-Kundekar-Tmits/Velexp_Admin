/**
 * Reconciles the sidebar menu tree against the app's registered routes.
 *
 * Run this BEFORE replacing the hardcoded sidebar with a data-driven one.
 * A data-driven sidebar can only render links the tree knows about, so any
 * url the tree is missing becomes an invisible screen, and any url the tree
 * has but the router does not becomes a dead link.
 *
 * Two sources:
 *   --seed  (default) the menu map in scripts/seedAdminMenus.js, i.e. what the
 *           tree SHOULD contain, since that file was generated from the old
 *           hardcoded sidebar.
 *   --live  a privileges tree dumped from a real session:
 *             copy(JSON.parse(localStorage.authUser).privileges)
 *           then save it and pass the path.
 *
 * Usage:
 *   node scripts/menuDiff.js
 *   node scripts/menuDiff.js --live path/to/privileges.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Pull every link_url literal out of the seed map. */
function seedUrls() {
  const src = fs.readFileSync(path.join(root, "scripts/seedAdminMenus.js"), "utf8");
  const urls = new Set();
  for (const m of src.matchAll(/link_url:\s*"([^"]+)"/g)) {
    if (m[1] !== "#") urls.add(m[1]);
  }
  return urls;
}

/** Walk a live privileges tree, collecting navigable urls. */
function liveUrls(file) {
  const tree = JSON.parse(fs.readFileSync(file, "utf8"));
  const urls = new Set();
  const walk = (nodes) =>
    (nodes || []).forEach((n) => {
      const url = n.link_url ?? n.menu_url;
      if (url && url !== "#") urls.add(url);
      walk(n.children);
    });
  walk(Array.isArray(tree) ? tree : tree.privileges ?? tree.menus ?? []);
  return urls;
}

/** Every path registered in the router, params excluded. */
function routeUrls() {
  const src = fs.readFileSync(path.join(root, "src/routes/index.jsx"), "utf8");
  const urls = new Set();
  for (const m of src.matchAll(/^\s*\{\s*path:\s*"([^"]+)"/gm)) {
    const p = m[1];
    if (!p.includes(":") && p !== "/" && p !== "*") urls.add(p);
  }
  return urls;
}

const liveFlagIndex = process.argv.indexOf("--live");
const usingLive = liveFlagIndex !== -1;
const menu = usingLive ? liveUrls(process.argv[liveFlagIndex + 1]) : seedUrls();
const routes = routeUrls();

const missingFromMenu = [...routes].filter((u) => !menu.has(u)).sort();
const deadInMenu = [...menu].filter((u) => !routes.has(u)).sort();

console.log(`source: ${usingLive ? "live privileges tree" : "scripts/seedAdminMenus.js"}`);
console.log(`menu urls:   ${menu.size}`);
console.log(`route paths: ${routes.size}\n`);

console.log(`— routes with NO menu entry (${missingFromMenu.length}) —`);
console.log("  a data-driven sidebar cannot link to these; reachable only by URL");
missingFromMenu.forEach((u) => console.log(`  ${u}`));

console.log(`\n— menu entries with NO route (${deadInMenu.length}) —`);
console.log("  these would render as links that 404");
deadInMenu.forEach((u) => console.log(`  ${u}`));

if (deadInMenu.length) process.exitCode = 1;
