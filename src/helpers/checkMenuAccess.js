// Menu visibility based on the `privileges` tree returned in the login
// response (localStorage "authUser"), NOT customer type. Every recursive
// node carries has_fullacess/can_view flags per link_url -- a url is
// accessible if either is true anywhere in the tree.
function flattenPrivilegeUrls(nodes, urls = new Set()) {
  (nodes || []).forEach((node) => {
    const url = node?.link_url;
    if (url && url !== "#" && (node.has_fullacess || node.can_view)) {
      urls.add(url);
    }
    if (node?.children?.length) {
      flattenPrivilegeUrls(node.children, urls);
    }
  });
  return urls;
}

// Preferred landing pages, in priority order, for staff users -- used to
// pick the first screen to open after login. Falls through to whichever
// privilege the user has if none of these match.
const LANDING_PRIORITY = [
  "/user-list", "/add-pod", "/last-mile-customer-performance",
  "/franchise_invoice", "/corporate-booking", "/pending-report",
  "/tracking", "/itrack", "/privileges",
];

// Core resolver, given the user object + privileges tree directly (e.g.
// straight off the login response, before/without touching localStorage).
function resolveMenuAccess(user, privileges) {
  const isAdmin = !!user?.is_admin;
  const isStaff = !!user?.is_staff;
  const accessibleUrls = flattenPrivilegeUrls(privileges);

  // Admin: full access, always. Staff (non-admin): only what's in privileges.
  const canAccess = (url) => isAdmin || accessibleUrls.has(url);
  const canAccessAny = (urlList) => isAdmin || urlList.some((url) => accessibleUrls.has(url));

  const defaultRoute = isAdmin
    ? "/user-list"
    : LANDING_PRIORITY.find((url) => accessibleUrls.has(url))
      || accessibleUrls.values().next().value
      || "/no_role";

  return { isAdmin, isStaff, canAccess, canAccessAny, accessibleUrls, defaultRoute };
}

// Convenience wrapper for components -- reads the logged-in user from
// localStorage (set at login).
function checkMenuAccess() {
  const authUser = JSON.parse(localStorage.getItem("authUser"));
  return resolveMenuAccess(authUser?.user, authUser?.privileges);
}

export { checkMenuAccess, resolveMenuAccess };
