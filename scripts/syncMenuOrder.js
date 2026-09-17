// Sets each live Menu record's exc_ord (display order) to match its
// position among siblings in menuTree.js -- the actual sidebar's order of
// truth. Run this AFTER dedupeMenus.js --apply, once there's exactly one
// live node per (path, url), so matching is unambiguous.
//
// Matches a menuTree.js node to its live counterpart by full name-path +
// url (same key as dedupeMenus.js/checkDuplicateMenus.js), then batches
// every {menu_id, exc_ord} pair into one call to the reorder endpoint.
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/syncMenuOrder.js
//
// Optional: override the target server:
//   BASE_URL=https://velexp.com VELEXP_USER=... VELEXP_PASS=... node scripts/syncMenuOrder.js

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

// Local (menuTree.js) side: every node keyed by path+url, with its intended
// exc_ord (1-based position among its own siblings).
function flattenLocal(nodes, parents = [], out = []) {
    nodes.forEach((node, index) => {
        const path = [...parents, node.label].join(" > ");
        const url = node.url || "#";
        out.push({ key: `${path}::${url}`, path, url, excOrd: index + 1 });
        if (node.children) flattenLocal(node.children, [...parents, node.label], out);
    });
    return out;
}

// Live side: every node keyed the same way, carrying its menu_id.
function flattenLive(nodes, parents = [], out = []) {
    for (const node of nodes) {
        const path = [...parents, node.menu_name].join(" > ");
        const url = node.menu_url;
        out.push({ key: `${path}::${url}`, id: node.menu_id });
        flattenLive(node.children || [], [...parents, node.menu_name], out);
    }
    return out;
}

async function reorder(token, items) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/menus/reorder/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`status ${res.status}: ${text}`);
    }
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    const token = await login();
    console.log("Logged in.\n");

    const tree = await getTree(token);
    const local = flattenLocal(MENU);
    const liveById = new Map(flattenLive(tree).map((n) => [n.key, n.id]));

    const items = [];
    const unmatched = [];
    for (const node of local) {
        const id = liveById.get(node.key);
        if (id == null) {
            unmatched.push(node);
            continue;
        }
        items.push({ menu_id: id, exc_ord: node.excOrd });
    }

    console.log(`Local menuTree.js nodes: ${local.length}`);
    console.log(`Matched to a live menu id: ${items.length}`);
    if (unmatched.length) {
        console.log(`\nUnmatched (no corresponding live menu found by path+url -- ${unmatched.length}):`);
        unmatched.forEach((n) => console.log(`  ${n.path}  (${n.url})`));
        console.log("These won't be reordered. Create them (addNewMenus.js) or run dedupeMenus.js first if duplicates are still splitting the match.");
    }

    if (!items.length) {
        console.log("\nNothing to reorder.");
        return;
    }

    await reorder(token, items);
    console.log(`\n✓ Reordered ${items.length} menu(s) to match menuTree.js sibling order.`);
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
