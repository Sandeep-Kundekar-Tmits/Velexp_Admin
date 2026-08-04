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
        {/* The logo is always rendered now. It used to be gated on `showLogo`,
            which meant that once collapsed it was gone from the DOM -- so
            hovering the rail widened it back to 250px around an empty header.
            Visibility is CSS's job (see .sidebar-brand), because only CSS can
            tell "collapsed" from "collapsed and hovered". */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            {/* Sizing is entirely in .sidebar-brand img. The inline
                height/width/object-fit that used to be here fitted the PNG's
                mostly-empty canvas rather than the artwork inside it. */}
            <img src={logoLightPng} alt="Main Logo" />
          </Link>
          {/* Mobile keeps its dismiss control up here; the drawer covers the
              screen, so the X belongs at the top where a close button is
              expected. The desktop collapse arrow lives in the footer. */}
          {isMobile && mobileSidebarOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMobileClose?.();
              }}
              className="sidebar-toggle"
              aria-label="Close menu"
            >
              <X aria-hidden="true" size={16} />
            </button>
          )}
        </div>

        {/* mt-2, not mt-4: this gap sits directly under the logo and read as
            part of its bottom spacing once the header margin was trimmed. */}
        <div data-simplebar ref={menuScrollRef} className="mt-2" style={{ height: "75vh" }}>
          <SidebarNav
            onLinkClick={() => { if (isMobile) onMobileClose?.(); }}
          />
        </div>

        {/* Footer row: role badge and the collapse control side by side, so the
            arrow sits next to the label it acts on ("ADMIN"). The button is a
            sibling of ProfileMenu rather than a child, so a click on it counts
            as an outside click and dismisses an open logout menu. */}
        <div className="sidebar-foot">
          <ProfileMenu />
          {!isMobile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                tToggle();
              }}
              className="sidebar-toggle"
              aria-label={showLogo ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={showLogo}
            >
              {showLogo ? (
                <ChevronLeft aria-hidden="true" size={16} />
              ) : (
                <ChevronRight aria-hidden="true" size={16} />
              )}
            </button>
          )}
        </div>
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
