// One-off, re-runnable setup for the "Sales" role: creates the role if it
// doesn't exist yet, then grants full access (has_fullacess/can_view/can_save/
// can_update/can_delete = true) to every menu EXCEPT the "Privileges" group
// and everything nested under it (Admin Privileges / legacy Privileges
// screens stay admin-only). Re-running it is safe -- it looks the role up by
// name instead of creating a duplicate, and simply re-saves the full grant.
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/createSalesRole.js
//
// Optional: override the target server (defaults to what's currently set
// in src/api/index.js):
//   BASE_URL=http://192.168.1.151:8000 VELEXP_USER=... VELEXP_PASS=... node scripts/createSalesRole.js

const BASE_URL = process.env.BASE_URL || "http://velexp.com:8000";
const USERNAME = process.env.VELEXP_USER;
const PASSWORD = process.env.VELEXP_PASS;
const ROLE_NAME = "Sales";
const EXCLUDED_TOP_LEVEL_NAMES = ["Privileges"];

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

async function getRoles(token) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/roles/?search=&is_active=true`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to load roles: ${JSON.stringify(data)}`);
    return Array.isArray(data) ? data : data.results || [];
}

async function createRole(token) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/roles/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: ROLE_NAME, description: "Sales team", is_active: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to create role: ${JSON.stringify(data)}`);
    return data;
}

async function getTree(token) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/menus/tree/`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to load menu tree: ${JSON.stringify(data)}`);
    return Array.isArray(data) ? data : data.results || [];
}

// Recursively grants full access to every node except excluded top-level
// branches (matched by name at the root level only, so a nested menu that
// happens to share a name elsewhere is unaffected).
function buildFullAccessPayload(nodes, isRoot = true) {
    return nodes
        .filter((node) => !(isRoot && EXCLUDED_TOP_LEVEL_NAMES.includes(node.menu_name)))
        .map((node) => ({
            menu_id: node.menu_id,
            has_fullacess: true,
            can_view: true,
            can_save: true,
            can_update: true,
            can_delete: true,
            children: buildFullAccessPayload(node.children || [], false),
        }));
}

async function saveRolePrivileges(token, roleId, menus) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/role-privileges/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role_id: roleId, menus }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to save role privileges: ${JSON.stringify(data)}`);
    return data;
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    const token = await login();
    console.log("Logged in.\n");

    const roles = await getRoles(token);
    let role = roles.find((r) => r.name === ROLE_NAME);
    if (role) {
        console.log(`= Role "${ROLE_NAME}" already exists (id=${role.id}), reusing it.`);
    } else {
        role = await createRole(token);
        console.log(`✓ Created role "${ROLE_NAME}" (id=${role.id}).`);
    }

    const tree = await getTree(token);
    const excludedNames = tree
        .filter((n) => EXCLUDED_TOP_LEVEL_NAMES.includes(n.menu_name))
        .map((n) => n.menu_name);
    console.log(`\nGranting full access to all menus except: ${excludedNames.join(", ") || "(none found)"}.`);

    const menus = buildFullAccessPayload(tree);
    await saveRolePrivileges(token, role.id, menus);
    console.log(`\n✓ Saved privileges for "${ROLE_NAME}" -- ${menus.length} top-level menu(s) granted.`);
    console.log("\nDone.");
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
