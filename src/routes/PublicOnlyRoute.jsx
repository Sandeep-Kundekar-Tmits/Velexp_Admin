import React from "react";
import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { usePermissions } from "@/features/auth/usePermissions";

/**
 * Wraps routes that only make sense when signed out (currently /login and
 * /forgot-password). Previously an authenticated user could open /login and
 * see the sign-in form again, with no indication they already had a session.
 *
 * /logout, /no_role and /password-reset-confirm are deliberately NOT wrapped:
 * the first two must stay reachable while authenticated, and the reset-confirm
 * link arrives by email and clears the session itself.
 */
const PublicOnlyRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => !!s.access || !!s.user);
  const { defaultRoute } = usePermissions();

  if (isAuthenticated) {
    // Honour the destination the guard stashed before bouncing to /login.
    const intended = location.state?.from?.pathname;
    return <Navigate to={intended || defaultRoute} replace />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

PublicOnlyRoute.propTypes = { children: PropTypes.node };

export default PublicOnlyRoute;
