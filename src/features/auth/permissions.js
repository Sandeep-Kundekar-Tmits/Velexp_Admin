/**
 * Pure RBAC resolution over the privileges tree.
 *
 * Semantics are unchanged from helpers/checkMenuAccess.js — this is the same
 * logic, extracted so it can be memoized and unit-tested. The old version ran
 * inside render: SidebarContent alone called canAccess/canAccessAny ~95 times
 * per render, each rebuilding the Set from scratch after re-parsing JSON.
 */

/** Menu nodes use "#" for non-navigable grouping entries. */
const GROUP_URL = "#";

/**
 * A node grants access to its link_url when either has_fullacess or can_view
 * is set. can_save/can_update/can_delete are stored and editable in Admin
 * Privileges but have never been enforced client-side.
 */
export function flattenPrivilegeUrls(nodes, urls = new Set()) {
  (nodes || []).forEach((node) => {
    const url = node?.link_url;
    if (url && url !== GROUP_URL && (node.has_fullacess || node.can_view)) {
      urls.add(url);
    }
    if (node?.children?.length) flattenPrivilegeUrls(node.children, urls);
  });
  return urls;
}

/** Preferred landing pages after login, in priority order. */
export const LANDING_PRIORITY = [
  "/user-list",
  "/add-pod",
  "/last-mile-customer-performance",
  "/franchise_invoice",
  "/corporate-booking",
  "/pending-report",
  "/tracking",
  "/itrack",
  "/privileges",
];

export const NO_ROLE_ROUTE = "/no_role";

/**
 * @param {object|null} user       the `user` object from the login response
 * @param {Array|null}  privileges the recursive privileges tree
 */
export function resolvePermissions(user, privileges) {
  const isAdmin = !!user?.is_admin;
  const isStaff = !!user?.is_staff;
  const accessibleUrls = flattenPrivilegeUrls(privileges);

  const canAccess = (url) => isAdmin || accessibleUrls.has(url);
  const canAccessAny = (urlList) =>
    isAdmin || (urlList || []).some((url) => accessibleUrls.has(url));

  const defaultRoute = isAdmin
    ? "/user-list"
    : LANDING_PRIORITY.find((url) => accessibleUrls.has(url)) ||
      accessibleUrls.values().next().value ||
      NO_ROLE_ROUTE;

  return { isAdmin, isStaff, accessibleUrls, canAccess, canAccessAny, defaultRoute };
}
