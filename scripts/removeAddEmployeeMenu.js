// Removes the "Add Employee" menu (Ops Master > Add Employee,
// /employees/add) from the live backend. Same rationale as
// removeAddServiceCentreMenu.js: adding an employee stays reachable via the
// "+ Add Employee" button on the Employee list page instead of a standalone
// menu entry.
//
// Safety: refuses to delete if it has children (shouldn't, it's a leaf) or
// if it's already granted to any role (would silently change that role's
// access) -- same checks as dedupeMenus.js.
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/removeAddEmployeeMenu.js
//
// Optional: override the target server:
//   BASE_URL=https://velexp.com VELEXP_USER=... VELEXP_PASS=... node scripts/removeAddEmployeeMenu.js

const BASE_URL = process.env.BASE_URL || "https://velexp.com";
const USERNAME = process.env.VELEXP_USER;
const PASSWORD = process.env.VELEXP_PASS;

const TARGET_URL = "/employees/add";
const TARGET_PARENT_NAME = "Ops Master";

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
        console.warn(`Could not verify role-privilege grants (${err.message}) -- treating as possibly granted.`);
        return { granted, checked: false };
    }
}

async function deleteMenu(token, id) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/menus/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok && res.status !== 204) throw new Error(`status ${res.status}: ${await res.text().catch(() => "")}`);
}

function findChild(nodes, parentName, url) {
    for (const node of nodes) {
        if (node.menu_name === parentName) {
            return (node.children || []).find((c) => c.menu_url === url) || null;
        }
        const found = findChild(node.children || [], parentName, url);
        if (found) return found;
    }
    return null;
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    const token = await login();
    console.log("Logged in.\n");

    const tree = await getTree(token);
    const node = findChild(tree, TARGET_PARENT_NAME, TARGET_URL);

    if (!node) {
        console.log(`"${TARGET_PARENT_NAME} > Add Employee" (${TARGET_URL}) not found live -- nothing to do.`);
        return;
    }

    if ((node.children || []).length) {
        console.error(`Refusing to delete id=${node.menu_id} -- it has ${node.children.length} child(ren).`);
        process.exitCode = 1;
        return;
    }

    const { granted, checked } = await getGrantedMenuIds(token);
    if (!checked || granted.has(node.menu_id)) {
        console.error(`Refusing to delete id=${node.menu_id} -- ${checked ? "already granted to a role" : "could not verify role grants"}.`);
        console.error("Clear it from any role's privileges first (Admin Privileges > Role Privileges), then re-run.");
        process.exitCode = 1;
        return;
    }

    await deleteMenu(token, node.menu_id);
    console.log(`✓ Deleted "Add Employee" (id=${node.menu_id}).`);
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
