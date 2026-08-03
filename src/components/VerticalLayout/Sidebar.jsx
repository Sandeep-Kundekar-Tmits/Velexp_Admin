import PropTypes from "prop-types";
import React, { useState } from "react";
import withRouter from "../Common/withRouter";

import { withTranslation } from "react-i18next";
import SidebarNav from "./SidebarNav";
import { Link } from "react-router-dom";

import logoLightPng from "../../assets/images/vellocity-express-white-bg.png";
import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu";

const Sidebar = (props) => {
  const { isMobile, mobileSidebarOpen, onMobileClose } = props;
  const [showLogo, setShowlogo] = useState(true);

  function tToggle() {
    setShowlogo(!showLogo);
    var body = document.body;
    if (window.screen.width <= 998) {
      body.classList.toggle("sidebar-enable");
    } else {
      body.classList.toggle("vertical-collpsed");
      body.classList.toggle("sidebar-enable");
    }
  }

  return (
    <React.Fragment>
      <div
        className="vertical-menu"
        style={{
          height: "100vh",
          zIndex: isMobile ? 1100 : undefined,
          top: isMobile ? 0 : undefined,
        }}
      >
        <div className="flex items-center justify-center mt-6" style={{ height: "40px" }}>
          {showLogo && (
            <Link to="/" style={{ width: "85%" }}>
              <img
                src={logoLightPng}
                alt="Main Logo"
                className="img-fluid"
                style={{ height: "100%", width: "100%", objectFit: "contain", zIndex: 9999, position: "relative" }}
              />
            </Link>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isMobile) {
                onMobileClose?.();
              } else {
                tToggle();
              }
            }}
            className="btn px-1 font-size-16"
            style={{ zIndex: 9999, position: "relative" }}
          >
            <i className={isMobile && mobileSidebarOpen ? "fa fa-fw fa-times" : "fa fa-fw fa-bars"} />
          </button>
        </div>

        <div data-simplebar className="mt-4" style={{ height: "75vh" }}>
          <SidebarNav
            onLinkClick={() => { if (isMobile) onMobileClose?.(); }}
          />
        </div>

        <ProfileMenu showLogo={showLogo} />
      </div>
    </React.Fragment>
  );
};

Sidebar.propTypes = {
  type: PropTypes.string,
  isMobile: PropTypes.bool,
  mobileSidebarOpen: PropTypes.bool,
  onMobileClose: PropTypes.func,
};

// Was connect()-ed purely to receive `layout: state.Layout`, which the
// component never read. Redux is gone; layout constants live in uiStore.
export default withRouter(withTranslation()(Sidebar));
