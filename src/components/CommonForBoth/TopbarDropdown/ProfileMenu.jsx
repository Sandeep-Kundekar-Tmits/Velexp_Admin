import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "@/components/ui";
import { MdOutlineManageAccounts } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";


//i18n
import { withTranslation } from "react-i18next";
import { IoMdPerson } from "react-icons/io";
import { RiLogoutBoxRLine } from "react-icons/ri";

// Redux
import { Link } from "react-router-dom";
import withRouter from "../../Common/withRouter";

// users
import { FaBox, FaCrown, FaUser, FaUserTie } from "react-icons/fa";

const ProfileMenu = (props) => {
  // Declare a new state variable, which we'll call "menu"
  const [menu, setMenu] = useState(false);

  const [username, setusername] = useState("Admin");

  useEffect(() => {
    if (localStorage.getItem("authUser")) {
      if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
        const obj = JSON.parse(localStorage.getItem("authUser"));
        setusername(obj.email);
      } else if (
        import.meta.env.VITE_APP_DEFAULTAUTH === "fake" ||
        import.meta.env.VITE_APP_DEFAULTAUTH === "jwt"
      ) {
        const obj = JSON.parse(localStorage.getItem("authUser"));
        setusername(obj.username);
      }
    }
  }, [props.success]);
  // Get user data from localStorage
  // Get user data from localStorage
  const authUser = JSON.parse(localStorage.getItem("authUser"));
  const customerType = authUser?.user?.cust_type?.type_of_cust;
  const isAdmin = authUser?.user?.is_admin;
  const UserBadge = ({ userType = "USER", isAdmin }) => {
    // Determine icon based on user type
    const getUserIcon = () => {
      if (isAdmin) return <FaCrown className="text-warning-500" />;
      if (userType === 'sales') return <FaUserTie style={{ height: "30px", width: "30px" }} className="text-accent-500" />;
      if (userType === 'pod') return <FaBox className="text-brand-500" />;
      if (userType === "accounts") return <MdOutlineManageAccounts className="text-brand-500" />
      if (userType === "Retail-Franchise")
        return <FaUser className="text-ink-muted" />;
      if(userType==="operations")
        return <FaUser className="text-ink-muted" />
    };

    // Format display text
    const displayText = isAdmin ? 'ADMIN' : (userType || 'USER').toUpperCase();

    return (
      <div className="user-badge  flex items-center justify-center  gap-1 p-2 border-0 " style={{ width: "100%" }}>
        <div className="icon-wrapper fs-4">
          {getUserIcon()}
        </div>
        {/* Always rendered, hidden by CSS while the rail is collapsed and
            unhovered. This used to be gated on a `showLogo` prop, so the label
            was absent from the DOM the moment the rail collapsed and hovering
            the widened rail showed a nameless icon. */}
        <div className="user-info">
          <div className="font-bold text-white ">{displayText}</div>
          <small className="">
            {
              isAdmin ? 'Full Access' :
                userType === 'sales' ? 'Sales Team' :
                  userType === 'pod' ? 'POD Manager' :
                    userType === 'accounting' ? 'Accounts Team' :
                      userType === "Retail-Franchise" ? "Retail-Franchise Team" :
                        userType === "operations" ? "Operations" : 'Standard User'
            }
          </small>
        </div>

      </div>
    );
  };
  return (
    <React.Fragment>
      <Dropdown
        isOpen={menu}
        toggle={() => {
          setMenu(prev => !prev)
        }}
        direction="up"
        style={{ zIndex: 9999, position: "relative", outline: "none" }}
        // sidebar-footer: this Dropdown is a direct flex child of
        // .vertical-menu and acts as its footer, so it needs to be a
        // full-width block pinned to the bottom rather than an inline-block.
        className="sidebar-footer border-0"
      >
        <DropdownToggle
          className="w-full bg-transparent border-0 btn-outline-info" style={{ cursor: "pointer", outline: "none" }}
        >
          <UserBadge userType={customerType} isAdmin={isAdmin} />
        </DropdownToggle>
        <DropdownMenu className=" gy-2 shadow-lg border-2">
          {/* <Link to="#" className="dropdown-item">
            <IoMdPerson style={{ width: "18px", height: "18px" }} className="bx bx-power-off  align-middle mr-1 text-danger-500" />
            <span>{props.t("Profile")}</span>
          </Link> */}

          {/* logout link */}
          <Link to="/logout" className="dropdown-item">
            <RiLogoutBoxRLine style={{ width: "18px", height: "18px" }} className="bx bx-power-off align-middle mr-1 text-danger-500" />
            <span>{props.t("Logout")}</span>
          </Link>

          {/* forgot password link */}
          {/* <Link to="/forgot-password" className="dropdown-item">
            <TbLockPassword style={{ width: "18px", height: "18px" }} className="bx bx-power-off align-middle mr-1 text-danger-500" />
            <span>{props.t("Change Password")}</span>
          </Link> */}

        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  );
};

ProfileMenu.propTypes = {
  success: PropTypes.any,
  t: PropTypes.any,
};

// Was connect()-ed to state.Profile for {error, success}, which the render
// never used. Redux is gone.
export default withRouter(withTranslation()(ProfileMenu));
