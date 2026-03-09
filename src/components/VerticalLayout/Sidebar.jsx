import PropTypes from "prop-types";
import React, { useState } from "react";
import { connect } from "react-redux";
import withRouter from "../Common/withRouter";

//i18n
import { withTranslation } from "react-i18next";
import SidebarContent from "./SidebarContent";

import { Link } from "react-router-dom";

import logoLightPng from "../../assets/images/vellocity-express-white-bg.png";
import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu";

const Sidebar = (props) => {
  const [showLogo, setShowlogo] = useState(true)
  function tToggle() {
    setShowlogo(!showLogo)
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
      <div className="vertical-menu " style={{ height: "100vh" }}>
        <div className="d-flex align-items-center justify-content-center mt-4" style={{ height: "40px" }}>
          {
            showLogo && <Link to="/" className="" style={{ width: "85%" }}>
              <img src={logoLightPng}
                alt="Main Logo"
                className="img-fluid"
                style={{ height: "100%", width: "100%", objectFit: "contain", zIndex: 9999, position: "relative" }}
              />
            </Link>
          }
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              tToggle();
            }}
            className="btn px-1 font-size-16 "
            style={{ zIndex: 9999, position: "relative" }}
          // style={{width:"30px"}}
          >
            <i className="fa fa-fw fa-bars" />
          </button>
        </div>
        <div data-simplebar className="mt-3" style={{ height: "75vh" }} >
          {props.type !== "condensed" ? <SidebarContent /> : <SidebarContent />}
        </div>

        <ProfileMenu showLogo={showLogo} />

      </div>
    </React.Fragment>
  );
};

Sidebar.propTypes = {
  type: PropTypes.string,
};

const mapStatetoProps = (state) => {
  return {
    layout: state.Layout,
  };
};
export default connect(
  mapStatetoProps,
  {}
)(withRouter(withTranslation()(Sidebar)));
