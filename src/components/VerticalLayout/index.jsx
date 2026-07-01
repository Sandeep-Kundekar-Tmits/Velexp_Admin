import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import withRouter from "../Common/withRouter";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  changeSidebarTheme,
  changeSidebarThemeImage,
} from "/src/store/actions";

import Sidebar from "./Sidebar";
import Header from "./Header";

import { useSelector, useDispatch } from "react-redux";
import { createSelector } from 'reselect';

const MOBILE_BREAKPOINT = 992;

const Layout = (props) => {
  const dispatch = useDispatch();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  const selectLayoutProperties = createSelector(
    (state) => state.Layout,
    (layout) => ({
      leftSideBarThemeImage: layout.leftSideBarThemeImage,
      leftSideBarType: layout.leftSideBarType,
      leftSideBarTheme: layout.leftSideBarTheme,
    }));

  const { leftSideBarThemeImage, leftSideBarType, leftSideBarTheme } =
    useSelector(selectLayoutProperties);

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
  }, []);

  useEffect(() => {
    if (leftSideBarTheme) dispatch(changeSidebarTheme(leftSideBarTheme));
  }, [leftSideBarTheme, dispatch]);

  useEffect(() => {
    if (leftSideBarThemeImage) dispatch(changeSidebarThemeImage(leftSideBarThemeImage));
  }, [leftSideBarThemeImage, dispatch]);

  const openMobileSidebar = () => {
    document.body.classList.add("sidebar-enable");
    setMobileSidebarOpen(true);
  };

  const closeMobileSidebar = () => {
    document.body.classList.remove("sidebar-enable");
    setMobileSidebarOpen(false);
  };

  return (
    <React.Fragment>
      <div id="layout-wrapper" className="bg-white" style={{ height: "100vh" }}>

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
          <div className="overflow-auto h-100">
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
