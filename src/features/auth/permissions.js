/**
 * Pure RBAC resolution over the privileges tree.
 *
 * Extracted from helpers/checkMenuAccess.js so it can be memoized and
 * unit-tested. The old version ran inside render: SidebarContent alone
 * called canAccess/canAccessAny ~95 times per render, each rebuilding the
 * Set from scratch after re-parsing JSON.
 *
 * Bypass rules, by design (not derived from the privileges tree):
 *   - ALWAYS_ACCESSIBLE_URLS below -> reachable by every signed-in user,
 *                      checked before every other rule, no grant needed and
 *                      nothing can hide it -- currently just AWB tracking.
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
 *                      no bypass at all, plus collectGapFillGrants' narrow
 *                      backfill for a granted-but-empty branch (see there).
 */

import { MENU } from "@/features/navigation/menuTree";

/** Menu nodes use "#" for non-navigable grouping entries. */
const GROUP_URL = "#";

/** Privileges-management screens, hidden from admins who aren't also superusers,
 *  unless explicitly granted to that admin (see canAccess below). */
const ADMIN_EXCLUDED_URLS = ["/privileges", "/admin-privileges"];

/** Reachable by every signed-in user regardless of role or privileges tree --
 *  no grant needed, and nothing (not even ADMIN_EXCLUDED_URLS) can hide it.
 *  AWB tracking is a basic lookup every role needs, not a privileged action. */
const ALWAYS_ACCESSIBLE_URLS = ["/tracking"];

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

/** menuTree.js's own children for the group whose label matches this
 *  privileges node -- a group's link_url is always "#", so label is the
 *  only reliable key to line the two trees up by. */
function findMenuChildren(menuNodes, label) {
  return (menuNodes || []).find((n) => n.label === label)?.children || null;
}

/** Every real (non-"#") url anywhere under a menuTree.js subtree. */
function collectMenuLeafUrls(menuNodes, out = []) {
  (menuNodes || []).forEach((node) => {
    if (node.children) collectMenuLeafUrls(node.children, out);
    else if (node.url && node.url !== GROUP_URL) out.push(node.url);
  });
  return out;
}

/**
 * Gap-filler, not the primary grant mechanism -- flattenPrivilegeUrls above
 * is that, and this only ever adds to what it already found.
 *
 * A role is sometimes granted a mid-level group (has_fullacess/can_view true
 * on it) but the backend's own `children` for that node comes back empty --
 * the real pages underneath were never individually granted. Left alone,
 * flattenPrivilegeUrls finds no leaf url in that branch at all, so the whole
 * group silently disappears from the sidebar with nothing reachable under
 * it (see e.g. "Reports > Customer Performance" granted with children: []).
 * Rather than requiring every such gap to be fixed by hand in Admin
 * Privileges before the group shows at all, this walks the matching branch
 * in menuTree.js's own static structure -- the app's own definition of what
 * belongs there -- and grants every real url it finds, wherever the
 * privileges tree runs out early.
 */
function collectGapFillGrants(privilegeNodes, menuNodes, urls = new Set()) {
  (privilegeNodes || []).forEach((privNode) => {
    const menuChildren = findMenuChildren(menuNodes, privNode?.link_name);
    if (!menuChildren) return; // no matching branch in menuTree.js at all

    const granted = !!(privNode.has_fullacess || privNode.can_view);
    const backendChildren = privNode.children || [];

    if (granted && !backendChildren.length && menuChildren.length) {
      collectMenuLeafUrls(menuChildren).forEach((url) => urls.add(url));
    } else if (backendChildren.length) {
      collectGapFillGrants(backendChildren, menuChildren, urls);
    }
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
  collectGapFillGrants(privileges, MENU).forEach((url) => accessibleUrls.add(url));

  const canAccess = (url) => {
    if (ALWAYS_ACCESSIBLE_URLS.includes(url)) return true;
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
