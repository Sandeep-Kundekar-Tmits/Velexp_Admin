// Cleans up the fallout from addNewMenus.js's name-only parent lookup,
// which was ambiguous whenever two live nodes shared a name:
//
//   1. Re-parents SPD Remove/RTS Remove/Tracking Correction from the wrong
//      "Reports > Others > Status Update" (a leaf report page) to the
//      correct top-level "Status Update" group.
//   2. For any group still duplicated (e.g. "Customers" x2, "OPS Reports"
//      x2): moves every child off the higher-id copy onto the lower-id
//      (canonical) copy, matched by link_url so nothing gets duplicated in
//      the process, then deletes the now-empty higher-id copy.
//   3. Creates the 3 legacy top-level items that verifyMenuCompleteness.js
//      found missing entirely: AWB Admin Lookup, COD Reconciliation
//      (inactive), POP Reconciliation (inactive) -- matching
//      seedAdminMenus.js's original definitions.
//
// Read the console output carefully -- this makes real changes (PATCH to
// re-parent, POST to create, DELETE on the emptied duplicates). Re-run
// verifyMenuCompleteness.js afterward to confirm a clean match.
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/fixMenuAttachment.js
//
// Optional: override the target server:
//   BASE_URL=https://velexp.com VELEXP_USER=... VELEXP_PASS=... node scripts/fixMenuAttachment.js

const BASE_URL = process.env.BASE_URL || "https://velexp.com";
const USERNAME = process.env.VELEXP_USER;
const PASSWORD = process.env.VELEXP_PASS;

if (!USERNAME || !PASSWORD) {
    console.error("Set VELEXP_USER and VELEXP_PASS environment variables before running this script.");
    process.exit(1);
}

const STATUS_UPDATE_CHILDREN_TO_FIX = ["/spd-remove", "/rts-remove", "/tracking-correction"];

const MISSING_TOP_LEVEL = [
    { link_name: "AWB Admin Lookup", link_url: "/awb-admin-lookup", faicon: "bx bx-search-alt", is_active: true },
    { link_name: "COD Reconciliation", link_url: "/cod-reconciliation", faicon: "bx bx-money", is_active: false },
    { link_name: "POP Reconciliation", link_url: "/pop-reconcilation", faicon: "bx bx-shuffle", is_active: false },
];

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

async function patchMenu(token, id, body) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/menus/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`status ${res.status}: ${await res.text().catch(() => "")}`);
    return res.json();
}

async function deleteMenu(token, id) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/menus/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok && res.status !== 204) throw new Error(`status ${res.status}: ${await res.text().catch(() => "")}`);
}

async function createMenu(token, payload) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/menus/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
}

function flatten(nodes, parents = [], out = []) {
    for (const node of nodes) {
        out.push({
            id: node.menu_id,
            name: node.menu_name,
            url: node.menu_url,
            path: [...parents, node.menu_name].join(" > "),
            depth: parents.length,
            children: node.children || [],
        });
        flatten(node.children || [], [...parents, node.menu_name], out);
    }
    return out;
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    const token = await login();
    console.log("Logged in.\n");

    let tree = await getTree(token);
    let flat = flatten(tree);

    // --- Step 1: fix the Status Update misattachment ---
    console.log("Step 1: Status Update children");
    const correctParent = flat.find((n) => n.name === "Status Update" && n.url === "#" && n.depth === 0);
    if (!correctParent) {
        console.warn("  Could not find the top-level 'Status Update' group -- skipping step 1.");
    } else {
        for (const url of STATUS_UPDATE_CHILDREN_TO_FIX) {
            const node = flat.find((n) => n.url === url);
            if (!node) {
                console.warn(`  ${url} not found live -- skipping.`);
                continue;
            }
            if (node.path === `${correctParent.path} > ${node.name}`) {
                console.log(`  = ${node.name} already under the correct parent, skipping.`);
                continue;
            }
            await patchMenu(token, node.id, { parent: correctParent.id });
            console.log(`  ✓ Re-parented ${node.name} (id=${node.id}) -> "Status Update" (id=${correctParent.id})`);
        }
    }

    // --- Step 2: merge any group still duplicated ---
    console.log("\nStep 2: merging still-duplicated groups");
    const groups = new Map();
    for (const item of flat) {
        const key = `${item.path}::${item.url}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
    }
    const stillDuplicated = [...groups.values()].filter((g) => g.length > 1);
    if (!stillDuplicated.length) {
        console.log("  none found.");
    }
    for (const group of stillDuplicated) {
        const sorted = [...group].sort((a, b) => a.id - b.id);
        const [canonical, ...extras] = sorted;
        const canonicalChildUrls = new Set(canonical.children.map((c) => c.menu_url));
        console.log(`  "${canonical.path}" -- keeping id=${canonical.id}, merging ${extras.length} extra copy/copies`);
        for (const extra of extras) {
            for (const child of extra.children) {
                if (canonicalChildUrls.has(child.menu_url)) {
                    console.log(`    = child "${child.menu_name}" already exists under canonical, leaving id=${child.menu_id} for a later dedupe pass.`);
                    continue;
                }
                await patchMenu(token, child.menu_id, { parent: canonical.id });
                console.log(`    ✓ Moved child "${child.menu_name}" (id=${child.menu_id}) -> id=${canonical.id}`);
                canonicalChildUrls.add(child.menu_url);
            }
            // Re-check: only delete the extra copy if it has no remaining children.
            const stillHasChildren = extra.children.some((c) => canonicalChildUrls.has(c.menu_url) === false);
            const refreshed = flatten(await getTree(token)).find((n) => n.id === extra.id);
            if (refreshed && refreshed.children.length > 0) {
                console.warn(`    ! id=${extra.id} still has ${refreshed.children.length} child(ren) left (likely also duplicates of canonical's children) -- leaving it for dedupeMenus.js to resolve, not deleting here.`);
                continue;
            }
            await deleteMenu(token, extra.id);
            console.log(`    ✓ Deleted now-empty duplicate id=${extra.id}`);
        }
    }

    // --- Step 3: create the missing legacy top-level items ---
    console.log("\nStep 3: missing top-level items");
    tree = await getTree(token);
    flat = flatten(tree);
    let order = flat.filter((n) => n.depth === 0).length + 1;
    for (const item of MISSING_TOP_LEVEL) {
        const existing = flat.find((n) => n.url === item.link_url);
        if (existing) {
            console.log(`  = "${item.link_name}" already exists (id=${existing.id}), skipping.`);
            continue;
        }
        const created = await createMenu(token, {
            link_name: item.link_name,
            link_url: item.link_url,
            parent: null,
            exc_ord: order++,
            is_active: item.is_active,
            show_panel: "side",
            faicon: item.faicon,
        });
        console.log(`  ✓ Created "${item.link_name}" (id=${created.id ?? created.menu_id})`);
    }

    console.log("\nDone. Re-run verifyMenuCompleteness.js to confirm a clean match, then syncMenuOrder.js to fix ordering.");
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
