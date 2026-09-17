/**
 * Pure RBAC resolution over the privileges tree.
 *
 * Extracted from helpers/checkMenuAccess.js so it can be memoized and
 * unit-tested. The old version ran inside render: SidebarContent alone
 * called canAccess/canAccessAny ~95 times per render, each rebuilding the
 * Set from scratch after re-parsing JSON.
 *
 * Bypass rules, by design (not derived from the privileges tree):
 *   - is_superuser  -> full bypass, every url, no exceptions.
 *   - is_admin      -> bypass every url EXCEPT the Privileges screens
 *                      (ADMIN_EXCLUDED_URLS below), so an admin can't grant
 *                      themselves more access by editing Admin Privileges
 *                      unless they are also flagged is_superuser -- UNLESS
 *                      a superuser has explicitly granted that specific
 *                      admin one of those screens via a role/user override,
 *                      in which case the explicit grant wins. The default
 *                      stays hidden; an actual grant in the tree overrides it.
 *   - everyone else -> exactly what their resolved privileges tree grants,
 *                      no bypass at all.
 */

/** Menu nodes use "#" for non-navigable grouping entries. */
const GROUP_URL = "#";

/** Privileges-management screens, hidden from admins who aren't also superusers,
 *  unless explicitly granted to that admin (see canAccess below). */
const ADMIN_EXCLUDED_URLS = ["/privileges", "/admin-privileges"];

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
  const isSuperUser = !!user?.is_superuser;
  const isStaff = !!user?.is_staff;
  const accessibleUrls = flattenPrivilegeUrls(privileges);

  const canAccess = (url) => {
    if (isSuperUser) return true;
    if (isAdmin) return !ADMIN_EXCLUDED_URLS.includes(url) || accessibleUrls.has(url);
    return accessibleUrls.has(url);
  };
  const canAccessAny = (urlList) => (urlList || []).some((url) => canAccess(url));

  // The fallback below must be a url this same user's own canAccess allows.
  // It used to fall straight back to "the first url in accessibleUrls",
  // full stop -- but an admin's tree can (and, per one real report, did)
  // grant only the Privileges screens, which canAccess excludes for every
  // admin who isn't also a superuser. That sent them straight to a route
  // the very next guard check then also rejected, bouncing back to the same
  // defaultRoute forever: an infinite redirect loop that renders nothing.
  const grantedAndAllowed = Array.from(accessibleUrls).filter(canAccess);

  // Only is_superuser gets the hardcoded landing page -- it's a real bypass,
  // so "/user-list" is always reachable regardless of the tree. is_admin is
  // NOT hardcoded here first, even though canAccess bypasses most urls for
  // it too: the default route should still reflect what's actually present
  // in the tree when that's usable, so an admin whose tree grants something
  // real lands there, not on a route chosen for them. Only once the tree
  // has nothing left that canAccess would actually allow does an admin also
  // fall back to "/user-list" -- unlike plain staff, who have no bypass and
  // genuinely have nowhere else to go.
  const defaultRoute = isSuperUser
    ? "/user-list"
    : LANDING_PRIORITY.find((url) => grantedAndAllowed.includes(url)) ||
      grantedAndAllowed[0] ||
      (isAdmin ? "/user-list" : NO_ROLE_ROUTE);

  return { isAdmin, isSuperUser, isStaff, accessibleUrls, canAccess, canAccessAny, defaultRoute };
}
