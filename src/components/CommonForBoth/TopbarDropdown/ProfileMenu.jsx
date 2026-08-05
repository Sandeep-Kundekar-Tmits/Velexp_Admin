import React from "react";
import PropTypes from "prop-types";
import { MdOutlineManageAccounts } from "react-icons/md";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { FaBox, FaCrown, FaUser, FaUserTie } from "react-icons/fa";
import { Link } from "react-router-dom";

//i18n
import { withTranslation } from "react-i18next";
import withRouter from "../../Common/withRouter";

/**
 * Sidebar footer: who you are signed in as, and the way out.
 *
 * Logout used to be the only live item in a drop-up menu behind the badge --
 * Profile and Change Password next to it are commented out, so the menu was a
 * one-item popup that also rendered a near-white hover (#f1f5f9) under light
 * text, which made the row vanish exactly when you pointed at it.
 *
 * It is a plain control in the footer now. One click instead of two, always
 * visible, and no popup to position against a 68px rail when the sidebar is
 * collapsed. If Profile and Change Password ever come back, they belong in a
 * menu again -- but not for a single item.
 */
const ProfileMenu = (props) => {
  const authUser = JSON.parse(localStorage.getItem("authUser"));
  const userType = authUser?.user?.cust_type?.type_of_cust;
  const isAdmin = authUser?.user?.is_admin;

  const getUserIcon = () => {
    if (isAdmin) return <FaCrown className="text-warning-500" />;
    if (userType === "sales") return <FaUserTie className="text-accent-500" />;
    if (userType === "pod") return <FaBox className="text-brand-500" />;
    if (userType === "accounts") return <MdOutlineManageAccounts className="text-brand-500" />;
    if (userType === "Retail-Franchise") return <FaUser className="text-ink-muted" />;
    if (userType === "operations") return <FaUser className="text-ink-muted" />;
    return <FaUser className="text-ink-muted" />;
  };

  const displayText = isAdmin ? "ADMIN" : (userType || "USER").toUpperCase();

  const roleLabel = isAdmin
    ? "Full Access"
    : userType === "sales"
      ? "Sales Team"
      : userType === "pod"
        ? "POD Manager"
        : userType === "accounting"
          ? "Accounts Team"
          : userType === "Retail-Franchise"
            ? "Retail-Franchise Team"
            : userType === "operations"
              ? "Operations"
              : "Standard User";

  return (
    <React.Fragment>
      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="icon-wrapper fs-4">{getUserIcon()}</div>
          {/* Always rendered, hidden by CSS while the rail is collapsed and
              unhovered -- gating it on a prop meant the label was absent from
              the DOM and hovering the widened rail showed a nameless icon. */}
          <div className="user-info">
            <div className="font-bold text-white">{displayText}</div>
            <small>{roleLabel}</small>
          </div>
        </div>

        {/* title as well as aria-label: collapsed, this is an unlabelled icon,
            and a sighted user needs the hint too. */}
        <Link
          to="/logout"
          className="sidebar-logout"
          aria-label={props.t("Logout")}
          title={props.t("Logout")}
        >
          <RiLogoutBoxRLine aria-hidden="true" size={16} />
        </Link>
      </div>
    </React.Fragment>
  );
};

ProfileMenu.propTypes = {
  t: PropTypes.any,
};

// Was connect()-ed to state.Profile for {error, success}, which the render
// never used. Redux is gone.
export default withRouter(withTranslation()(ProfileMenu));
