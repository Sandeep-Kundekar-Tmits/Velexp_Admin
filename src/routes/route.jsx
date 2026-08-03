import React from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { checkMenuAccess } from "../helpers/checkMenuAccess";

// path = the route's own template (e.g. "/user-list", "/user/:id"), passed
// in by App.jsx from route.path -- not the resolved pathname, so param
// routes can be told apart from exact menu routes.
const Authmiddleware = ({ path, ...props }) => {
  if (!localStorage.getItem("authUser")) {
    return (
      <Navigate to={{ pathname: "/login", state: { from: props.location } }} />
    );
  }

  // Detail/param routes ("/user/:id") and the root redirector aren't
  // tracked as menu privileges -- only exact top-level/leaf screen routes
  // are gated here, mirroring what the sidebar shows.
  const isGuardedRoute = path && path !== "/" && path !== "*" && !path.includes(":");
  if (isGuardedRoute) {
    const { isAdmin, canAccess, defaultRoute } = checkMenuAccess();
    if (!isAdmin && !canAccess(path)) {
      return <Navigate to={defaultRoute} replace />;
    }
  }

  return <React.Fragment>{props.children}</React.Fragment>;
};

Authmiddleware.propTypes = {
  path: PropTypes.string,
  location: PropTypes.object,
  children: PropTypes.node,
};

export default Authmiddleware;
