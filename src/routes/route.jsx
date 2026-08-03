import React from "react";
import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { usePermissions } from "@/features/auth/usePermissions";
import { NO_ROLE_ROUTE } from "@/features/auth/permissions";

// path = the route's own template (e.g. "/user-list", "/user/:id"), passed in
// by App.jsx from route.path -- not the resolved pathname, so param routes can
// be told apart from exact menu routes.
const Authmiddleware = ({ path, children }) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => !!s.access || !!s.user);
  const { isAdmin, canAccess, defaultRoute } = usePermissions();

  if (!isAuthenticated) {
    // Previously used the React Router v5 object form,
    // `<Navigate to={{ pathname, state }} />`, which v6 silently ignores --
    // so the intended destination was always lost and users landed on the
    // default route after signing in instead of where they were going.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // "/" is the post-login redirector and "*" is the 404; neither maps to a
  // menu privilege.
  //
  // Param routes ("/user/:id", "/edit-user/:id", "/track-awb/:awbno/details",
  // "/ops-disputes/:id") remain ungated, deliberately. The privileges tree
  // contains 83 urls and none of them carry :params -- detail screens are not
  // menu entries -- so gating them on their own template would redirect every
  // non-admin away from every detail screen.
  //
  // This does mean any signed-in user can open any detail screen by typing the
  // URL. That gap is real, but it cannot be closed here: client-side route
  // gating is UX, not security, since anyone can edit localStorage. The fix
  // belongs in the Django API, which must authorize each detail endpoint.
  // Tracked as a backend item rather than papered over in the router.
  const isGuardedRoute = path && path !== "/" && path !== "*" && !path.includes(":");
  if (isGuardedRoute && !isAdmin && !canAccess(path)) {
    return <Navigate to={defaultRoute || NO_ROLE_ROUTE} replace />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

Authmiddleware.propTypes = {
  path: PropTypes.string,
  children: PropTypes.node,
};

export default Authmiddleware;
