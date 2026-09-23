// Targeted, re-runnable addition of every menu record present in menuTree.js but missing
// from the live privileges backend. Checks the live menu tree first and only creates
// what's actually missing (matched by link_url for children/grandchildren, by name+url
// for new top-level nodes), so it's safe to run more than once -- re-run it after adding
// new screens to menuTree.js, updating the lists below to match, and it will pick up
// whatever is new while skipping anything already created.
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/addNewMenus.js
//
// Optional: override the target server (defaults to what's currently set
// in src/api/index.js):
//   BASE_URL=http://192.168.1.151:8000 VELEXP_USER=... VELEXP_PASS=... node scripts/addNewMenus.js

const BASE_URL = process.env.BASE_URL || "http://velexp.com:8000";
const USERNAME = process.env.VELEXP_USER;
const PASSWORD = process.env.VELEXP_PASS;

if (!USERNAME || !PASSWORD) {
    console.error("Set VELEXP_USER and VELEXP_PASS environment variables before running this script.");
    process.exit(1);
}

// Brand-new top-level menus to ensure exist (matched by name + url, since a group's
// url is always "#" and names alone can collide with an unrelated existing entry --
// e.g. "Status Update" already exists elsewhere as a grandchild with a real url).
const NEW_TOP_LEVEL = [
    { link_name: "International Password Reset", link_url: "/international-password-reset", faicon: "bx bx-key" },
    { link_name: "Status Update", link_url: "#", faicon: "bx bx-trash" },
    { link_name: "Ops Master", link_url: "#", faicon: "bx bx-buildings" },
];

// Children to ensure exist under a parent, matched by link_url. The parent is looked
// up by name anywhere in the live tree (not just top-level), so this also covers
// nested parents like "Operation Performance" (itself a child of "Reports").
const CHILDREN_OF = {
    "Status Update": [
        { link_name: "SPD Remove", link_url: "/spd-remove" },
        { link_name: "RTS Remove", link_url: "/rts-remove" },
        { link_name: "Tracking Correction", link_url: "/tracking-correction" },
    ],
    "Revenue": [
        { link_name: "Revenue Report", link_url: "/revenue-daily-report" },
    ],
    "OPS Reports": [
        { link_name: "Admin Booking", link_url: "/admin-booking-download" },
        { link_name: "Customer Service", link_url: "/customer-service" },
        { link_name: "Customer Service Employee", link_url: "/customer-service-employee" },
        { link_name: "Pickup Pending Report", link_url: "/pickup-pending-report" },
    ],
    "Customers": [
        { link_name: "Corporate Pincode Upload", link_url: "/corporate-pincode-upload" },
        { link_name: "Corporate Rate Upload", link_url: "/corporate-rate-upload" },
        { link_name: "International Rate Data", link_url: "/int-rate-data" },
        { link_name: "Customer Product Config", link_url: "/customer-product-config" },
        { link_name: "VAS Configuration", link_url: "/vas-config" },
        { link_name: "Add User", link_url: "/add-user" },
        { link_name: "Add Franchisee", link_url: "/add-franchisee" },
    ],
    // "Ops Master" itself is a new top-level entry (see NEW_TOP_LEVEL above), so
    // none of its children exist live yet either. Neither "Add Service Centre"
    // nor "Add Employee" is listed here -- both stay reachable via their own
    // list page's "+ Add" button (ServiceCentreList.jsx / EmployeeList.jsx)
    // rather than a separate menu.
    "Ops Master": [
        { link_name: "Service Centres", link_url: "/service-centres" },
        { link_name: "Employee", link_url: "/employees" },
    ],
    "Booking": [
        { link_name: "Corporate Booking", link_url: "/corporate-booking" },
        { link_name: "Sales Booking", link_url: "/sales-booking" },
    ],
    "Invoices": [
        { link_name: "Corporate Invoice", link_url: "/corporate_invoice" },
    ],
    // Nested under Reports -> Operation Performance / Reports -> Customer Performance.
    "Operation Performance": [
        { link_name: "Operation Performance Report", link_url: "/operation-performance" },
        { link_name: "OFD Performance (FASR)", link_url: "/ofd-operations-performance" },
        { link_name: "Attempt Wise Pickup Performance", link_url: "/operation-attempt-wise-pickup-performance" },
    ],
    "Customer Performance": [
        { link_name: "OFD Performance (FASR)", link_url: "/ofd-customer-operations-performance" },
        { link_name: "Attempt Wise Pickup Performance", link_url: "/customer-attempt-wise-pickup-performance" },
    ],
};

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

// Depth-first search by name, anywhere in the tree -- covers both top-level
// parents (e.g. "Customers") and nested ones (e.g. "Operation Performance",
// which lives under "Reports").
function findNodeByName(nodes, name) {
    for (const node of nodes) {
        if (node.menu_name === name) return node;
        const found = findNodeByName(node.children || [], name);
        if (found) return found;
    }
    return null;
}

async function ensureChildren(token, tree, parentName, children) {
    const parentNode = findNodeByName(tree, parentName);
    if (!parentNode) {
        console.warn(`Skipping children of "${parentName}" -- parent not found in the live tree.`);
        return;
    }
    const existingChildren = parentNode.children || [];
    let order = existingChildren.length + 1;
    for (const item of children) {
        const existing = existingChildren.find((c) => c.menu_url === item.link_url);
        if (existing) {
            console.log(`  = "${item.link_name}" already exists under ${parentName} (id=${existing.menu_id}), skipping.`);
            continue;
        }
        const created = await createMenu(token, {
            link_name: item.link_name,
            link_url: item.link_url,
            parent: parentNode.menu_id,
            exc_ord: order++,
            is_active: true,
            show_panel: "side",
            faicon: item.faicon || "",
        });
        console.log(`  ✓ Created "${item.link_name}" (id=${created.id ?? created.menu_id}) [${parentName}]`);
        parentNode.children = parentNode.children || [];
        parentNode.children.push({ menu_id: created.id ?? created.menu_id, menu_name: item.link_name, menu_url: item.link_url, children: [] });
    }
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    const token = await login();
    console.log("Logged in.\n");

    const tree = await getTree(token);
    let order = tree.length + 1;

    for (const item of NEW_TOP_LEVEL) {
        const existing = tree.find((n) => n.menu_name === item.link_name && n.menu_url === item.link_url);
        if (existing) {
            console.log(`= "${item.link_name}" already exists (id=${existing.menu_id}), skipping.`);
            continue;
        }
        const created = await createMenu(token, {
            link_name: item.link_name,
            link_url: item.link_url,
            parent: null,
            exc_ord: order++,
            is_active: true,
            show_panel: "side",
            faicon: item.faicon || "",
        });
        const id = created.id ?? created.menu_id;
        console.log(`✓ Created "${item.link_name}" (id=${id})`);
        // Keep the in-memory tree consistent so ensureChildren (below) can find
        // a parent created earlier in this same run.
        tree.push({ menu_id: id, menu_name: item.link_name, menu_url: item.link_url, children: [] });
    }

    for (const [parentName, children] of Object.entries(CHILDREN_OF)) {
        await ensureChildren(token, tree, parentName, children);
    }

    console.log("\nDone.");
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
