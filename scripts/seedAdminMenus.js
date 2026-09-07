// One-off seed script: recreates the existing sidebar (SidebarContent.jsx)
// as Menu records via POST /api/admin-privileges/menus/, three levels deep
// (top-level -> child -> grandchild under Reports).
//
// NOT idempotent -- re-running creates duplicates, since it doesn't check
// for existing menus by name first.
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/seedAdminMenus.js
//
// Optional: override the target server (defaults to what's currently set
// in src/api/index.js):
//   BASE_URL=http://192.168.1.151:8000 VELEXP_USER=... VELEXP_PASS=... node scripts/seedAdminMenus.js

const BASE_URL = process.env.BASE_URL || "http://velexp.com:8000";
const USERNAME =  "onkar";
const PASSWORD = "tmits@123";

if (!USERNAME || !PASSWORD) {
    console.error("Set VELEXP_USER and VELEXP_PASS environment variables before running this script.");
    process.exit(1);
}

const TOP_LEVEL = [
    { link_name: "Add POD", link_url: "/add-pod", faicon: "bx bx-upload" },
    { link_name: "Reports", link_url: "#", faicon: "bx bx-file" },
    { link_name: "OPS Reports", link_url: "#", faicon: "bx bx-desktop" },
    { link_name: "Customers", link_url: "#", faicon: "bx bx-user" },
    { link_name: "International Billing", link_url: "#", faicon: "bx bx-globe" },
    { link_name: "Booking", link_url: "#", faicon: "bx bx-book" },
    { link_name: "Invoices", link_url: "#", faicon: "bx bx-file" },
    { link_name: "Delhivery Warehouse", link_url: "/delhivery-warehouse", faicon: "bx bx-package" },
    { link_name: "Payment Details", link_url: "/payment-deatils", faicon: "bx bx-credit-card" },
    { link_name: "Revenue", link_url: "#", faicon: "bx bx-file" },
    { link_name: "International Report", link_url: "#", faicon: "bx bx-world" },
    { link_name: "Billing", link_url: "#", faicon: "bx bx-receipt" },
    { link_name: "Update Weight", link_url: "/update-weight", faicon: "bx bx-ruler" },
    { link_name: "Trip Management", link_url: "#", faicon: "bx bx-map-alt" },
    { link_name: "COD Reconciliation", link_url: "/cod-reconciliation", faicon: "bx bx-money", is_active: false },
    { link_name: "POP Reconciliation", link_url: "/pop-reconcilation", faicon: "bx bx-shuffle", is_active: false },
    { link_name: "Auto Reconciliation", link_url: "/auto-reconciliation", faicon: "bx bx-sync" },
    { link_name: "Cancel Shipments", link_url: "/cancel-shipments", faicon: "bx bx-x-circle" },
    { link_name: "Automated MIS", link_url: "/automated-mis", faicon: "bx bx-spreadsheet" },
    { link_name: "Raw MIS", link_url: "/raw-mis", faicon: "bx bx-table" },
    { link_name: "Ops Disputes", link_url: "#", faicon: "bx bx-error-circle" },
    { link_name: "AWB Label Print", link_url: "/awb-print", faicon: "bx bx-printer" },
    { link_name: "InScan Weight", link_url: "/inscan-weight", faicon: "bx bx-ruler" },
    { link_name: "RTO Approval", link_url: "/rto-approval", faicon: "bx bx-check-shield" },
    { link_name: "Track AWB", link_url: "/tracking", faicon: "bx bx-search-alt-2" },
    { link_name: "ITrack", link_url: "/itrack", faicon: "bx bx-barcode" },
    { link_name: "Privileges", link_url: "#", faicon: "bx bx-shield-quarter" },
];

// keyed by parent's link_name (must be a name from TOP_LEVEL)
const CHILDREN = {
    "Reports": [
        { link_name: "Operation Performance", link_url: "#" },
        { link_name: "Customer Performance", link_url: "#" },
        { link_name: "Others", link_url: "#" },
        { link_name: "Status Update Audit", link_url: "/status-update-audit" },
        { link_name: "Productivity Report", link_url: "/productivity-report" },
    ],
    "OPS Reports": [
        { link_name: "Pending Report", link_url: "/pending-report" },
        { link_name: "MIS Run", link_url: "/mis-report" },
    ],
    "Customers": [
        { link_name: "Customer List", link_url: "/user-list" },
        { link_name: "Rate Data", link_url: "/customer-rate-data" },
        { link_name: "Retail Pincode", link_url: "/retail-pincode" },
        { link_name: "Franchise Pincode", link_url: "/franchise-pincode" },
        { link_name: "Corporate Pincode", link_url: "/corporate-pincode" },
        { link_name: "Corporate Rate Data", link_url: "/corporate-rate-data" },
        { link_name: "Retail Rate Data", link_url: "/retail-rate-data" },
        { link_name: "Franchise Rate Data", link_url: "/franchise-rate-data" },
        { link_name: "International Rates", link_url: "/intl-rate-data" },
        { link_name: "International Pincodes", link_url: "/intl-pincode" },
    ],
    "International Billing": [
        { link_name: "International Rates", link_url: "/intl-rate-data" },
        { link_name: "International Pincodes", link_url: "/intl-pincode" },
    ],
    "Booking": [
        { link_name: "Service Provider Booking", link_url: "/service-provider-booking" },
    ],
    "Invoices": [
        { link_name: "Franchise Billing", link_url: "/franchise_invoice" },
        { link_name: "Manual Billing", link_url: "/manual_invoice" },
        { link_name: "Corporate Bills", link_url: "/corporate-billing" },
        { link_name: "Download Invoices", link_url: "/edit_invoice" },
        { link_name: "Mark Invoice Number", link_url: "/mark-invoice-no" },
    ],
    "Revenue": [
        { link_name: "Old Revenue Report", link_url: "/revenue-report" },
        { link_name: "Daily Revenue", link_url: "/daily-revenue" },
        { link_name: "MIS Tally", link_url: "/mis-tally" },
        { link_name: "COD Report", link_url: "/cod-report" },
    ],
    "International Report": [
        { link_name: "MIS Report", link_url: "/international-mis-report" },
        { link_name: "Dimension Change Log", link_url: "/international-dimension-change-log" },
    ],
    "Billing": [
        { link_name: "Customer Billing", link_url: "/bill-master" },
        { link_name: "Shipment Billing", link_url: "/shipment-billing" },
        { link_name: "Billing Working", link_url: "/billing-working" },
        { link_name: "Billing Automation", link_url: "/billing-automation" },
        { link_name: "Invoice Flow", link_url: "/invoice-flow" },
        { link_name: "All Booking", link_url: "/all-booking" },
    ],
    "Trip Management": [
        { link_name: "Employee Trip Details", link_url: "/employee-attendance" },
        { link_name: "Ops Trip Management", link_url: "/trip-detail" },
    ],
    "Ops Disputes": [
        { link_name: "Stale Shipments", link_url: "/ops-disputes/stale" },
        { link_name: "Disputes", link_url: "/ops-disputes" },
        { link_name: "Lost Dashboard", link_url: "/ops-disputes/lost" },
    ],
    "Privileges": [
        { link_name: "OPS Privileges", link_url: "/privileges", faicon: "bx bx-shield-quarter" },
        { link_name: "Admin Privileges", link_url: "/admin-privileges", faicon: "bx bx-shield-quarter" },
    ],
};

// keyed by parent's link_name (must be one of the "#" sub-parents created under "Reports" above)
const GRANDCHILDREN = {
    "Operation Performance": [
        { link_name: "Delivery Strike Rate (FDSR)", link_url: "/last-mile-operation" },
        { link_name: "Pickup Strike Rate (FPSR)", link_url: "/first-mile-operation" },
        { link_name: "Attempt-wise Delivery Performance", link_url: "/attempt-wise-delivery-performance" },
    ],
    "Customer Performance": [
        { link_name: "Delivery Strike Rate (FDSR)", link_url: "/last-mile-customer-performance" },
        { link_name: "Pickup Strike Rate (FPSR)", link_url: "/first-mile-customer-performance" },
        { link_name: "Attempt-wise Delivery Performance", link_url: "/customer-attempt-wise-delivery-performance" },
    ],
    "Others": [
        { link_name: "Pickup Performance", link_url: "/pickup-performance" },
        { link_name: "Status Update", link_url: "/status-update" },
        { link_name: "CD Update", link_url: "/cd-update" },
        { link_name: "Customer Performance", link_url: "/customer-performance" },
        { link_name: "Performance Report", link_url: "/performance-report" },
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

async function createLevel(token, items, { parentId = null, parentLabel = "top-level", indent = "" } = {}) {
    const idByName = new Map();
    const failures = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
            const created = await createMenu(token, {
                link_name: item.link_name,
                link_url: item.link_url,
                parent: parentId,
                exc_ord: i + 1,
                is_active: item.is_active ?? true,
                show_panel: "side",
                faicon: item.faicon || "",
            });
            idByName.set(item.link_name, created.id ?? created.menu_id);
            console.log(`${indent}✓ ${item.link_name} (id=${created.id ?? created.menu_id}) [${parentLabel}]`);
        } catch (err) {
            failures.push({ item, error: err.message });
            console.error(`${indent}✗ ${item.link_name} [${parentLabel}]: ${err.message}`);
        }
    }
    return { idByName, failures };
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    const token = await login();
    console.log("Logged in.\n");

    const allFailures = [];

    const { idByName: topIds, failures: topFailures } = await createLevel(token, TOP_LEVEL);
    allFailures.push(...topFailures);

    const childIds = new Map();
    for (const [parentName, children] of Object.entries(CHILDREN)) {
        const parentId = topIds.get(parentName);
        if (!parentId) {
            console.warn(`Skipping children of "${parentName}" -- parent was not created.`);
            continue;
        }
        const { idByName, failures } = await createLevel(token, children, { parentId, parentLabel: parentName, indent: "  " });
        for (const [name, id] of idByName) if (!childIds.has(name)) childIds.set(name, id);
        allFailures.push(...failures);
    }

    for (const [parentName, grandchildren] of Object.entries(GRANDCHILDREN)) {
        const parentId = childIds.get(parentName);
        if (!parentId) {
            console.warn(`Skipping grandchildren of "${parentName}" -- parent was not created.`);
            continue;
        }
        const { failures } = await createLevel(token, grandchildren, { parentId, parentLabel: parentName, indent: "    " });
        allFailures.push(...failures);
    }

    console.log(`\nDone. ${allFailures.length} failure(s).`);
    if (allFailures.length) {
        console.log("Failed items:", allFailures.map((f) => f.item.link_name).join(", "));
        process.exitCode = 1;
    }
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
