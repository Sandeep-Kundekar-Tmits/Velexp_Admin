// Read-only check: fetches the live menu tree and reports duplicates --
// either the same link_url appearing more than once (the same screen
// reachable from two different menu entries) or the same link_name appearing
// more than once (confusing labels, even if the urls differ).
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/checkDuplicateMenus.js
//
// Optional: override the target server (defaults to what's currently set
// in src/api/index.js):
//   BASE_URL=https://velexp.com VELEXP_USER=... VELEXP_PASS=... node scripts/checkDuplicateMenus.js

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
    if (!res.ok || !data.access) {
        throw new Error(`Login failed: ${JSON.stringify(data)}`);
    }
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

// Walks the tree, recording every node with the path of parent names above it
// (for readable reporting) alongside its own id/name/url.
function flatten(nodes, parents = [], out = []) {
    for (const node of nodes) {
        out.push({
            id: node.menu_id,
            name: node.menu_name,
            url: node.menu_url,
            path: [...parents, node.menu_name].join(" > "),
        });
        flatten(node.children || [], [...parents, node.menu_name], out);
    }
    return out;
}

function reportGroups(title, groups) {
    const dupes = [...groups.entries()].filter(([, items]) => items.length > 1);
    console.log(`\n— ${title} (${dupes.length}) —`);
    if (!dupes.length) {
        console.log("  none found");
        return;
    }
    for (const [key, items] of dupes) {
        console.log(`  "${key}" appears ${items.length} times:`);
        items.forEach((it) => console.log(`    id=${it.id}  ${it.path}`));
    }
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    const token = await login();
    console.log("Logged in.\n");

    const tree = await getTree(token);
    const flat = flatten(tree);
    console.log(`Total menu nodes: ${flat.length}`);

    const byUrl = new Map();
    const byName = new Map();
    for (const item of flat) {
        if (item.url && item.url !== "#") {
            if (!byUrl.has(item.url)) byUrl.set(item.url, []);
            byUrl.get(item.url).push(item);
        }
        if (!byName.has(item.name)) byName.set(item.name, []);
        byName.get(item.name).push(item);
    }

    reportGroups("duplicate link_url (same screen reachable from >1 menu entry)", byUrl);
    reportGroups("duplicate link_name (same label used more than once)", byName);
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
