import PropTypes from "prop-types";
import React, { useCallback, useRef, useState } from "react";
import withRouter from "../Common/withRouter";

import { withTranslation } from "react-i18next";
import SidebarNav from "./SidebarNav";
import { Link } from "react-router-dom";

import logoLightPng from "../../assets/images/vellocity-express-white-bg.png";
import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const Sidebar = (props) => {
  const { isMobile, mobileSidebarOpen, onMobileClose } = props;
  const [showLogo, setShowlogo] = useState(true);
  const menuScrollRef = useRef(null);

  /**
   * Bring the current page's menu entry into view.
   *
   * Collapsed, the rail shows icons only and sub-menus are hidden, so the
   * active row can sit far outside the visible scroll window. When hover
   * expands the rail those rows reappear -- and without this the user is
   * looking at whatever part of the tree happened to be scrolled to.
   *
   * Measured with getBoundingClientRect rather than offsetTop because the
   * anchor's offsetParent is its own <li>, not the scroll box. Scrolling the
   * container directly (instead of scrollIntoView) keeps the page itself from
   * moving.
   */
  const revealActiveMenu = useCallback(() => {
    const container = menuScrollRef.current;
    if (!container) return;

    // Expanding changes row heights, so measure after the browser has laid out.
    requestAnimationFrame(() => {
      const active = container.querySelector(".metismenu a.active");
      if (!active) return;

      const containerBox = container.getBoundingClientRect();
      const activeBox = active.getBoundingClientRect();
      const offsetInView = activeBox.top - containerBox.top;
      const centred = offsetInView - containerBox.height / 2 + activeBox.height / 2;

      container.scrollTo({
        top: Math.max(0, container.scrollTop + centred),
        behavior: "smooth",
      });
    });
  }, []);

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
        // Only while collapsed: expanded, the rail is already showing the tree
        // and yanking it around under the cursor would be hostile.
        onMouseEnter={showLogo ? undefined : revealActiveMenu}
        style={{
          // height/top are left to the stylesheet: the rail is inset from all
          // three edges via top/bottom, and an explicit height here would
          // override `bottom` and run the panel past the viewport.
          zIndex: isMobile ? 1100 : undefined,
        }}
      >
        <div className="sidebar-header">
          {showLogo && (
            <Link to="/" className="sidebar-brand">
              <img
                src={logoLightPng}
                alt="Main Logo"
                className="img-fluid"
                style={{ height: "100%", width: "100%", objectFit: "contain" }}
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
            className="sidebar-toggle"
            aria-label={
              isMobile && mobileSidebarOpen
                ? "Close menu"
                : showLogo
                  ? "Collapse sidebar"
                  : "Expand sidebar"
            }
            aria-expanded={showLogo}
          >
            {isMobile && mobileSidebarOpen ? (
              <X aria-hidden="true" size={16} />
            ) : showLogo ? (
              <ChevronLeft aria-hidden="true" size={16} />
            ) : (
              <ChevronRight aria-hidden="true" size={16} />
            )}
          </button>
        </div>

        <div data-simplebar ref={menuScrollRef} className="mt-4" style={{ height: "75vh" }}>
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
