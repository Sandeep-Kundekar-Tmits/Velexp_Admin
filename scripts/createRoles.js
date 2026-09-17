// One-off, re-runnable setup for the standard role set carried over from the
// legacy Velexp_Admin app (its cust_type.type_of_cust values): sales,
// Customer Service, Analyzer, pod, accounting, Retail-Franchise, operations.
// Creates each role if it doesn't already exist (matched by name), skipping
// any that do -- safe to run more than once. Does NOT grant any menus; that's
// a separate step via Admin Privileges -> Role Privileges for each role.
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/createRoles.js
//
// Optional: override the target server (defaults to what's currently set
// in src/api/index.js):
//   BASE_URL=https://velexp.com VELEXP_USER=... VELEXP_PASS=... node scripts/createRoles.js

const BASE_URL = process.env.BASE_URL || "https://velexp.com";
const USERNAME = process.env.VELEXP_USER;
const PASSWORD = process.env.VELEXP_PASS;

if (!USERNAME || !PASSWORD) {
    console.error("Set VELEXP_USER and VELEXP_PASS environment variables before running this script.");
    process.exit(1);
}

const ROLE_NAMES = [
    "sales",
    "Customer Service",
    "Analyzer",
    "pod",
    "accounting",
    "Retail-Franchise",
    "operations",
];

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

async function createRole(token, name) {
    const res = await fetch(`${BASE_URL}/api/admin-privileges/roles/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description: "", is_active: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    const token = await login();
    console.log("Logged in.\n");

    const existingRoles = await getRoles(token);
    for (const name of ROLE_NAMES) {
        const existing = existingRoles.find((r) => r.name === name);
        if (existing) {
            console.log(`= "${name}" already exists (id=${existing.id}), skipping.`);
            continue;
        }
        const created = await createRole(token, name);
        console.log(`✓ Created "${name}" (id=${created.id})`);
    }

    console.log("\nDone. Menus are not granted yet -- use Admin Privileges > Role Privileges to assign each role's menus.");
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
