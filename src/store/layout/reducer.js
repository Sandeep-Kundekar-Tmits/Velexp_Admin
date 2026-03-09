// @flow
import {
  CHANGE_SIDEBAR_THEME_IMAGE,
  TOGGLE_LEFTMENU,
  SHOW_SIDEBAR,
} from "./actionTypes"

//constants
import {
  layoutTypes,
  layoutModeTypes,
  layoutWidthTypes,
  topBarThemeTypes,
  leftBarThemeImageTypes,
  leftSidebarTypes,
  leftSideBarThemeTypes,
} from "../../constants/layout";

const INIT_STATE = {
  layoutType: layoutTypes.VERTICAL,
  layoutModeType: layoutModeTypes.LIGHT,
  layoutWidth: layoutWidthTypes.FLUID,
  leftSideBarTheme: leftSideBarThemeTypes.DARK,
  leftSideBarThemeImage: leftBarThemeImageTypes.NONE,
  leftSideBarType: leftSidebarTypes.DEFAULT,
  topbarTheme: topBarThemeTypes.LIGHT,
  isPreloader: false,
  isMobile: false,
  showSidebar: true,
  leftMenu: false,
}

const Layout = (state = INIT_STATE, action) => {
  switch (action.type) {
    case CHANGE_SIDEBAR_THEME_IMAGE:
      return {
        ...state,
        leftSideBarThemeImage: action.payload,
      }

    case SHOW_SIDEBAR:
      return {
        ...state,
        showSidebar: action.payload,
      }
    case TOGGLE_LEFTMENU:
      return {
        ...state,
        leftMenu: action.payload,
      }

    default:
      return state
  }
}

export default Layout
