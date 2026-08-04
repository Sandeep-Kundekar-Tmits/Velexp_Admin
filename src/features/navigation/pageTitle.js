/**
 * What to call the screen at a given route.
 *
 * The sidebar already knows: menuTree.js carries a label for each of its 67
 * URLs plus the group path above it. Flattening that map means the header and
 * the menu entry can never disagree, and renaming a menu item renames its
 * screen too -- there is no second list to keep in sync.
 *
 * This replaces the ROUTE_TITLES map that used to live in VerticalLayout/
 * Header.jsx, which was hand-maintained, covered 61 routes, and was only ever
 * read on mobile.
 */
import { MENU } from "./menuTree";

/** Every leaf in the sidebar, flattened to url -> { title, section }. */
const MENU_TITLES = (() => {
  const out = {};
  const walk = (nodes, trail) => {
    for (const node of nodes) {
      if (node.children) walk(node.children, [...trail, node.label]);
      else if (node.url) {
        out[node.url] = { title: node.label, section: trail.join(" · ") || null };
      }
    }
  };
  walk(MENU, []);
  return out;
})();

/*
 * Routes with no menu entry -- reached by link, by button, or deliberately
 * unlisted. `section` is left null wherever the route does not clearly belong
 * to one of the menu's own groups, since an invented breadcrumb is worse than
 * none.
 */
const EXTRA_TITLES = {
  "/admin-booking-download": { title: "Admin Booking Download", section: "Reports" },
  "/customer-service": { title: "Customer Service", section: "Reports" },
  "/customer-service-employee": { title: "Customer Service — Employee", section: "Reports" },
  "/revenue-daily-report": { title: "Revenue Report", section: "Reports" },
  "/operation-performance": { title: "Operation Performance", section: "Reports" },
  "/ofd-operations-performance": { title: "OFD Operations Performance", section: "Reports" },
  "/operation-attempt-wise-pickup-performance": { title: "Attempt-wise Pickup Performance", section: "Reports" },
  "/ofd-customer-operations-performance": { title: "OFD Customer Performance", section: "Reports" },
  "/customer-attempt-wise-pickup-performance": { title: "Attempt-wise Customer Pickup", section: "Reports" },
  "/add-franchisee": { title: "Add Franchisee", section: null },
  "/add-user": { title: "Add User", section: null },
  "/int-rate-data": { title: "International Rate Data", section: null },
  "/corporate-pincode-upload": { title: "Corporate Pincode Upload", section: null },
  "/corporate-rate-upload": { title: "Corporate Rate Upload", section: null },
  "/customer-product-config": { title: "Customer Product Config", section: null },
  "/vas-config": { title: "VAS Config", section: null },
  "/corporate_invoice": { title: "Corporate Invoice", section: null },
  "/corporate-booking": { title: "Corporate Booking", section: null },
  "/sales-booking": { title: "Sales Booking", section: null },
  "/admin-privileges": { title: "Admin Privileges", section: null },
  "/no_role": { title: "No Role Assigned", section: null },
};

/*
 * Routes whose path carries an id, so they cannot be matched exactly. Checked
 * only after both exact maps, because "/ops-disputes/stale" and
 * "/ops-disputes/lost" are real screens that would otherwise be swallowed by
 * the "/ops-disputes/" prefix.
 */
const PREFIX_TITLES = [
  ["/edit-user/", { title: "Edit User", section: null }],
  ["/user/", { title: "Customer Details", section: null }],
  ["/track-awb/", { title: "Shipment Trace", section: null }],
  ["/ops-disputes/", { title: "Dispute Detail", section: null }],
];

const FALLBACK = { title: "Velexp", section: null };

/** @returns {{ title: string, section: string|null }} never null. */
export function pageTitleFor(pathname) {
  return (
    MENU_TITLES[pathname] ??
    EXTRA_TITLES[pathname] ??
    PREFIX_TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ??
    FALLBACK
  );
}
