/**
 * Compatibility shim.
 *
 * The RBAC logic now lives in src/features/auth/permissions.js so it can be
 * memoized (see usePermissions) and unit-tested. This file stays because
 * several legacy call sites import it — routes/route.jsx, routes/index.jsx,
 * SidebarContent.jsx, pages/Authentication/Login.jsx — and it delegates so
 * the two can never diverge.
 *
 * Prefer usePermissions() in components; checkMenuAccess() re-reads and
 * re-flattens on every call.
 */
import { getAuthSnapshot } from "@/stores/authStore";
import { resolvePermissions } from "@/features/auth/permissions";

/** Resolve directly from a user + privileges pair (e.g. a login response). */
function resolveMenuAccess(user, privileges) {
  return resolvePermissions(user, privileges);
}

/** Resolve for the currently stored session. */
function checkMenuAccess() {
  const { user, privileges } = getAuthSnapshot();
  return resolvePermissions(user, privileges);
}

export { checkMenuAccess, resolveMenuAccess };
