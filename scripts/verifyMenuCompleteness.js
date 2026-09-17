// Compares the live menu tree against menuTree.js (the sidebar's own source
// of truth) by full name-path + url, and reports:
//   - total node count on each side
//   - anything in menuTree.js missing from the live tree
//   - anything in the live tree not present in menuTree.js
// Read-only -- makes no changes. Run after dedupeMenus.js --apply to confirm
// the live backend has exactly one node per menuTree.js entry, no more, no
// less.
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/verifyMenuCompleteness.js
//
// Optional: override the target server:
//   BASE_URL=https://velexp.com VELEXP_USER=... VELEXP_PASS=... node scripts/verifyMenuCompleteness.js

import { MENU } from "../src/features/navigation/menuTree.js";

const BASE_URL = process.env.BASE_URL || "https://velexp.com";
const USERNAME = process.env.VELEXP_USER;
const PASSWORD = process.env.VELEXP_PASS;

if (!USERNAME || !PASSWORD) {
    console.error("Set VELEXP_USER and VELEXP_PASS environment variables before running this script.");
    process.exit(1);
}

async function login() {
    const res = await fetch(`${BASE_URL}/api_login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });
    const data = await res.json();
    if (!res.ok || !data.access) throw new Error(`Login failed: ${JSON.stringify(data)}`);
    return data.access;
}

async function getTree(token) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/menus/tree/`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to load menu tree: ${JSON.stringify(data)}`);
    return Array.isArray(data) ? data : data.results || [];
}

function flattenLocal(nodes, parents = [], out = new Map()) {
    for (const node of nodes) {
        const path = [...parents, node.label].join(" > ");
        const url = node.url || "#";
        const key = `${path}::${url}`;
        out.set(key, (out.get(key) || 0) + 1);
        if (node.children) flattenLocal(node.children, [...parents, node.label], out);
    }
    return out;
}

function flattenLive(nodes, parents = [], out = new Map()) {
    for (const node of nodes) {
        const path = [...parents, node.menu_name].join(" > ");
        const key = `${path}::${node.menu_url}`;
        out.set(key, (out.get(key) || 0) + 1);
        flattenLive(node.children || [], [...parents, node.menu_name], out);
    }
    return out;
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    const token = await login();
    console.log("Logged in.\n");

    const tree = await getTree(token);
    const local = flattenLocal(MENU);
    const live = flattenLive(tree);

    const localTotal = [...local.values()].reduce((a, b) => a + b, 0);
    const liveTotal = [...live.values()].reduce((a, b) => a + b, 0);

    console.log(`menuTree.js: ${local.size} distinct entries (${localTotal} nodes)`);
    console.log(`live tree:   ${live.size} distinct entries (${liveTotal} nodes)`);

    const missingFromLive = [...local.keys()].filter((k) => !live.has(k)).sort();
    const extraInLive = [...live.keys()].filter((k) => !local.has(k)).sort();
    const stillDuplicatedLive = [...live.entries()].filter(([, count]) => count > 1).sort();

    console.log(`\n— in menuTree.js but missing from the live backend (${missingFromLive.length}) —`);
    missingFromLive.forEach((k) => console.log(`  ${k.replace("::", "  ")}`));

    console.log(`\n— in the live backend but not in menuTree.js (${extraInLive.length}) —`);
    extraInLive.forEach((k) => console.log(`  ${k.replace("::", "  ")}`));

    console.log(`\n— still duplicated in the live backend (${stillDuplicatedLive.length}) —`);
    stillDuplicatedLive.forEach(([k, count]) => console.log(`  x${count}  ${k.replace("::", "  ")}`));

    const clean = !missingFromLive.length && !extraInLive.length && !stillDuplicatedLive.length;
    console.log(clean
        ? "\n✓ Live backend exactly matches menuTree.js -- one node per entry, nothing missing, nothing extra."
        : "\n✗ Not yet a clean match -- see the lists above.");
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
