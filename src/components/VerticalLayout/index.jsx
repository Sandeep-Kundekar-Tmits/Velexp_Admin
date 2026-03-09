import PropTypes from "prop-types";
import React, { useEffect } from "react";
import withRouter from "../Common/withRouter";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {

  changeSidebarTheme,
  changeSidebarThemeImage,
} from "/src/store/actions";

// Layout Related Components
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from 'reselect';

const Layout = (props) => {
  const dispatch = useDispatch();

  const selectLayoutProperties = createSelector(
    (state) => state.Layout,
    (layout) => ({
      isPreloader: layout.isPreloader,
      layoutModeType: layout.layoutModeType,
      leftSideBarThemeImage: layout.leftSideBarThemeImage,
      leftSideBarType: layout.leftSideBarType,
      layoutWidth: layout.layoutWidth,
      topbarTheme: layout.topbarTheme,
      leftSideBarTheme: layout.leftSideBarTheme,
    }));

  const {
    isPreloader,
    leftSideBarThemeImage,
    leftSideBarType,
    leftSideBarTheme,
  } = useSelector(selectLayoutProperties);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);



  /*
  layout  settings
  */



  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (leftSideBarTheme) {
      dispatch(changeSidebarTheme(leftSideBarTheme));
    }
  }, [leftSideBarTheme, dispatch]);


  useEffect(() => {
    if (leftSideBarThemeImage) {
      dispatch(changeSidebarThemeImage(leftSideBarThemeImage));
    }
  }, [leftSideBarThemeImage, dispatch]);


  return (
    <React.Fragment>
      {/* <div id="preloader">
        <div id="status">
          <div className="spinner-chase">
            <div className="chase-dot" />
            <div className="chase-dot" />
            <div className="chase-dot" />
            <div className="chase-dot" />
            <div className="chase-dot" />
            <div className="chase-dot" />
          </div>
        </div>
      </div> */}

      <div id="layout-wrapper " className="bg-white overflow-hidden" style={{height:"100vh"}}>
        {/* <Header /> */}
        <Sidebar
          theme={leftSideBarTheme}
          type={leftSideBarType}
          isMobile={isMobile}
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
        <div className="main-content bg-white overflow-hidden p-0" style={{ height: "100vh" }}>
          <div className="overflow-auto h-100">
            {props.children}
          </div>
        </div>
        {/* <Footer /> */}
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
