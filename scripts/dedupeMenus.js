// Consolidates duplicate Menu records on the live backend (see
// checkDuplicateMenus.js). For every group of nodes that share the same
// name-path and url, keeps the one with the lowest id (oldest / first
// created) and deletes the rest via DELETE /api/admin-privileges/menus/:id/.
//
// SAFETY:
//   - Dry run by default. Nothing is deleted unless you pass --apply.
//   - A "loser" (non-canonical) node is only deleted if every one of its
//     descendants is ALSO a loser in its own group -- otherwise it would
//     orphan a child that has no duplicate to fall back to, so it's skipped
//     and reported instead of guessed at.
//   - A loser already referenced by any role's privileges (from the
//     role-privileges overview) is skipped and reported, not deleted --
//     silently deleting a menu a role was actually granted would change
//     that role's real access.
//   - Deletes bottom-up (deepest nodes first) so a parent is never removed
//     while a to-be-deleted child still points at it.
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/dedupeMenus.js            (dry run)
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/dedupeMenus.js --apply    (actually deletes)
//
// Optional: override the target server:
//   BASE_URL=https://velexp.com VELEXP_USER=... VELEXP_PASS=... node scripts/dedupeMenus.js

const BASE_URL = process.env.BASE_URL || "https://velexp.com";
const USERNAME = process.env.VELEXP_USER;
const PASSWORD = process.env.VELEXP_PASS;
const APPLY = process.argv.includes("--apply");

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

// Best-effort: the role-privileges overview lists every role with its
// granted menus. If this endpoint's shape differs or the call fails, we
// fail OPEN on caution -- treat every id as "possibly granted" so nothing
// gets deleted blindly, rather than fail closed and delete things we
// couldn't actually check.
async function getGrantedMenuIds(token) {
    const granted = new Set();
    try {
        const res = await fetch(`${BASE_URL}/api/admin-privileges/role-privileges/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        const roles = Array.isArray(data) ? data : data.results || [];
        const walk = (nodes) => (nodes || []).forEach((n) => {
            const id = n.menu_id ?? n.id;
            if (id != null && (n.is_assigned || n.has_fullacess || n.can_view)) granted.add(id);
            walk(n.children);
        });
        roles.forEach((role) => walk(role.menus || role.children));
        return { granted, checked: true };
    } catch (err) {
        console.warn(`Could not verify role-privilege grants (${err.message}) -- treating every id as possibly granted, so nothing will be auto-deleted this run.`);
        return { granted, checked: false };
    }
}

async function deleteMenu(token, id) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/menus/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok && res.status !== 204) {
        const text = await res.text().catch(() => "");
        throw new Error(`status ${res.status}: ${text}`);
    }
}

function flatten(nodes, parents = [], out = []) {
    for (const node of nodes) {
        const path = [...parents, node.menu_name].join(" > ");
        out.push({
            id: node.menu_id,
            name: node.menu_name,
            url: node.menu_url,
            path,
            depth: parents.length,
            childIds: (node.children || []).map((c) => c.menu_id),
        });
        flatten(node.children || [], [...parents, node.menu_name], out);
    }
    return out;
}

async function run() {
    console.log(`Target: ${BASE_URL}${APPLY ? "  [APPLY -- will delete]" : "  [dry run -- nothing will be deleted]"}`);
    const token = await login();
    console.log("Logged in.\n");

    const tree = await getTree(token);
    const flat = flatten(tree);
    console.log(`Total menu nodes: ${flat.length}`);

    const { granted, checked } = await getGrantedMenuIds(token);
    console.log(checked ? `Role-privilege grants loaded (${granted.size} menu ids referenced by at least one role).\n` : "");

    const groups = new Map();
    for (const item of flat) {
        const key = `${item.path}::${item.url}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
    }

    const losers = new Set();
    const canonicalByKey = new Map();
    for (const [key, items] of groups) {
        if (items.length < 2) continue;
        const sorted = [...items].sort((a, b) => a.id - b.id);
        const [canonical, ...rest] = sorted;
        canonicalByKey.set(key, canonical.id);
        rest.forEach((it) => losers.add(it.id));
    }

    console.log(`Duplicate groups: ${[...groups.values()].filter((g) => g.length > 1).length}`);
    console.log(`Candidate duplicate nodes to remove: ${losers.size}\n`);

    const byId = new Map(flat.map((it) => [it.id, it]));
    const toDelete = [];
    const skippedChildren = [];
    const skippedGranted = [];

    for (const id of losers) {
        const item = byId.get(id);
        const nonLoserChildren = item.childIds.filter((cid) => !losers.has(cid));
        if (nonLoserChildren.length > 0) {
            skippedChildren.push({ item, nonLoserChildren });
            continue;
        }
        if (!checked || granted.has(id)) {
            skippedGranted.push(item);
            continue;
        }
        toDelete.push(item);
    }

    // Deepest first, so a child is deleted before its parent.
    toDelete.sort((a, b) => b.depth - a.depth);

    console.log(`Safe to delete: ${toDelete.length}`);
    if (skippedChildren.length) {
        console.log(`\nSkipped (has a non-duplicate child, would orphan it) -- ${skippedChildren.length}:`);
        skippedChildren.forEach(({ item, nonLoserChildren }) =>
            console.log(`  id=${item.id}  ${item.path}  -- unresolved child ids: ${nonLoserChildren.join(", ")}`));
    }
    if (skippedGranted.length) {
        console.log(`\nSkipped (already granted to a role, or grants couldn't be verified) -- ${skippedGranted.length}:`);
        skippedGranted.forEach((item) => console.log(`  id=${item.id}  ${item.path}`));
    }

    console.log(`\n${APPLY ? "Deleting" : "Would delete"} (keeping the lowest id per group):`);
    toDelete.forEach((item) => console.log(`  id=${item.id}  ${item.path}  (${item.url})`));

    if (!APPLY) {
        console.log("\nDry run only -- re-run with --apply to actually delete the list above.");
        return;
    }

    let failures = 0;
    for (const item of toDelete) {
        try {
            await deleteMenu(token, item.id);
            console.log(`✓ Deleted id=${item.id}  ${item.path}`);
        } catch (err) {
            failures++;
            console.error(`✗ Failed to delete id=${item.id}  ${item.path}: ${err.message}`);
        }
    }
    console.log(`\nDone. ${toDelete.length - failures} deleted, ${failures} failed.`);
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
