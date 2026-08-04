import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import withRouter from "../Common/withRouter";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from "./Sidebar";
import PageHeader from "./PageHeader";
import { PageHeaderContext } from "./PageHeaderContext";
import AmbientBackground from "../Common/AmbientBackground";

import { useUiStore } from "@/stores/uiStore";

const MOBILE_BREAKPOINT = 992;

const Layout = (props) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  // What the mounted screen calls itself, when it says. See PageHeaderContext.
  const [pageHeader, setPageHeader] = useState(null);

  // These were read from the Redux Layout slice, which VerticalLayout then
  // dispatched straight back unchanged. Nothing else ever wrote them, so the
  // two effects that did that round trip have been dropped along with Redux.
  const leftSideBarTheme = useUiStore((s) => s.leftSideBarTheme);
  const leftSideBarType = useUiStore((s) => s.leftSideBarType);
  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen);
  const openMobileSidebar = useUiStore((s) => s.openMobileSidebar);
  const closeMobileSidebar = useUiStore((s) => s.closeMobileSidebar);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) closeMobileSidebar();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [closeMobileSidebar]);

  return (
    <React.Fragment>
      {/* Canvas behind the floating rail. The gutter around the panel shows
          this, so it has to be the dark theme colour -- .main-content keeps its
          own light surface, so no content screen is affected. */}
      <div id="layout-wrapper" className="bg-[#050816]" style={{ height: "100vh" }}>

        {/* Backdrop when mobile sidebar is open */}
        {isMobile && mobileSidebarOpen && (
          <div
            onClick={closeMobileSidebar}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 1099,
            }}
          />
        )}

        <Sidebar
          theme={leftSideBarTheme}
          type={leftSideBarType}
          isMobile={isMobile}
          mobileSidebarOpen={mobileSidebarOpen}
          onMobileClose={closeMobileSidebar}
        />

        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        {/* bg-canvas, not bg-white: the content area is the page canvas, one
            step darker than the cards that sit on it. Leaving bg-white here
            would resolve to the card surface via the legacy bridge and flatten
            the two together. */}
        {/* flex column: the header takes its natural height and the scroll box
            below it absorbs the rest, so the header stays put while a report
            scrolls under it. */}
        <div
          className="main-content relative flex flex-col bg-canvas overflow-hidden p-0"
          style={{ height: "100vh" }}
        >
          {/* One backdrop for the whole app rather than one per screen. It
              sits outside the scroll box on purpose: the routes and hubs are
              a static backdrop, and having them slide up as you page through
              a report would make them the moving thing on screen. Spotlight
              off -- a cursor-tracking glow behind a data grid is a
              distraction rather than a flourish. */}
          <AmbientBackground showSpotlight={false} clearCentre={false} />

          {/* One header for every route. Screens no longer draw their own --
              MainHeaderCom forwards its title into this one through the
              provider below rather than rendering a second bar. */}
          <PageHeader
            isMobile={isMobile}
            onMobileToggle={openMobileSidebar}
            override={pageHeader}
          />

          <div className="scroll-slim relative z-10 min-h-0 flex-1 overflow-auto">
            <PageHeaderContext.Provider value={setPageHeader}>
              {props.children}
            </PageHeaderContext.Provider>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

Layout.propTypes = {
  changeSidebarThemeImage: PropTypes.func,
  layoutWidth: PropTypes.any,
  leftSideBarTheme: PropTypes.any,
  leftSideBarThemeImage: PropTypes.any,
  leftSideBarType: PropTypes.any,
  location: PropTypes.object,
  topbarTheme: PropTypes.any,
};

export default withRouter(Layout);
