import PropTypes from 'prop-types';
import React, { useState } from "react";

import { connect } from "react-redux";
import { Link } from "react-router-dom";

// Import menuDropdown

import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu";
// import image
import logoLightSvg from "../../assets/images/vellocity-express-single-logo.png";

//i18n
import { withTranslation } from "react-i18next";



const Header = props => {

  function toggleFullscreen() {
    if (
      !document.fullscreenElement &&
      /* alternative standard method */ !document.mozFullScreenElement &&
      !document.webkitFullscreenElement
    ) {
      // current working methods
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen(
          Element.ALLOW_KEYBOARD_INPUT
        );
      }
    } else {
      if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
    }
  }

  function tToggle() {
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
      <header id="page-topbar">
        <div className="navbar-header">
          <div className="d-flex">

            <div className="navbar-brand-box d-lg-none d-md-block">
              <Link to="/" className="logo logo-dark">
                <span className="logo-sm">
                  <img src={logoLightSvg} alt="" height="22" />
                </span>
              </Link>

              <Link to="/" className="logo logo-light">
                <span className="logo-sm">
                  <img src={logoLightSvg} alt="" height="22" />
                </span>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => {
                tToggle();
              }}
              className="btn btn-sm px-3 font-size-16 header-item "
              id="vertical-menu-btn"
            >
              <i className="fa fa-fw fa-bars" />
            </button>
          </div>
          {/* <ProfileMenu /> */}


        </div>
      </header>
    </React.Fragment>
  );
};

Header.propTypes = {
  leftMenu: PropTypes.any,
  leftSideBarType: PropTypes.any,
  t: PropTypes.any,
  toggleLeftmenu: PropTypes.func
};

const mapStatetoProps = state => {
  const {
    layoutType,
    leftMenu,
    leftSideBarType,
  } = state.Layout;
  return { layoutType, leftMenu, leftSideBarType };
};

export default connect(mapStatetoProps, {
})(withTranslation()(Header));
