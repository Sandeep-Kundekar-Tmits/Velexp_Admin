import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import withRouter from "../Common/withRouter";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from "./Sidebar";
import Header from "./Header";

import { useUiStore } from "@/stores/uiStore";

const MOBILE_BREAKPOINT = 992;

const Layout = (props) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

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

        {/* Show Header only on mobile — it has the hamburger + page title */}
        {isMobile && (
          <Header onMobileToggle={openMobileSidebar} />
        )}

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

        <div
          className="main-content bg-white overflow-hidden p-0"
          style={{ height: "100vh" }}
        >
          <div className="overflow-auto h-full">
            {props.children}
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
