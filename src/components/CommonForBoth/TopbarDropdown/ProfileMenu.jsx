import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { MdOutlineManageAccounts } from "react-icons/md";
import { TbLockPassword } from "react-icons/tb";


//i18n
import { withTranslation } from "react-i18next";
import { IoMdPerson } from "react-icons/io";
import { RiLogoutBoxRLine } from "react-icons/ri";

// Redux
import { connect } from "react-redux";
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
      if (isAdmin) return <FaCrown className="text-warning" />;
      if (userType === 'sales') return <FaUserTie style={{ height: "30px", width: "30px" }} className="text-info" />;
      if (userType === 'pod') return <FaBox className="text-primary" />;
      if (userType === "accounts") return <MdOutlineManageAccounts className="text-primary" />
      if (userType === "Retail-Franchise")
        return <FaUser className="text-secondary" />;
      if(userType==="operations")
        return <FaUser className="text-secondary" />
    };

    // Format display text
    const displayText = isAdmin ? 'ADMIN' : (userType || 'USER').toUpperCase();

    return (
      <div className="user-badge  d-flex align-items-center justify-content-center  gap-1 p-2 border-0 " style={{ width: "100%" }}>
        <div className="icon-wrapper fs-4">
          {getUserIcon()}
        </div>
        {
          props?.showLogo && <div className="user-info">
            <div className="fw-bold text-white ">{displayText}</div>
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
        }

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
        direction="top"
        style={{ zIndex: 9999, position: "relative", outline: "none" }}
        className="border-0"
      >
        <DropdownToggle
          className="w-100 bg-transparent border-0 btn-outline-info" style={{ cursor: "pointer", outline: "none" }}
        >
          <UserBadge userType={customerType} isAdmin={isAdmin} />
        </DropdownToggle>
        <DropdownMenu className=" gy-2 shadow-lg border-2">
          {/* <Link to="#" className="dropdown-item">
            <IoMdPerson style={{ width: "18px", height: "18px" }} className="bx bx-power-off  align-middle me-1 text-danger" />
            <span>{props.t("Profile")}</span>
          </Link> */}

          {/* logout link */}
          <Link to="/logout" className="dropdown-item">
            <RiLogoutBoxRLine style={{ width: "18px", height: "18px" }} className="bx bx-power-off align-middle me-1 text-danger" />
            <span>{props.t("Logout")}</span>
          </Link>

          {/* forgot password link */}
          {/* <Link to="/forgot-password" className="dropdown-item">
            <TbLockPassword style={{ width: "18px", height: "18px" }} className="bx bx-power-off align-middle me-1 text-danger" />
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

const mapStatetoProps = (state) => {
  const { error, success } = state.Profile;
  return { error, success };
};

export default withRouter(
  connect(mapStatetoProps, {})(withTranslation()(ProfileMenu))
);
