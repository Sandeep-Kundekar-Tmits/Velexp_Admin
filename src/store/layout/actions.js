import {
  CHANGE_SIDEBAR_THEME,
  CHANGE_SIDEBAR_THEME_IMAGE,
  SHOW_SIDEBAR,
  TOGGLE_LEFTMENU,
} from "./actionTypes"

export const changeSidebarTheme = theme => ({
  type: CHANGE_SIDEBAR_THEME,
  payload: theme,
})

export const changeSidebarThemeImage = themeimage => ({
  type: CHANGE_SIDEBAR_THEME_IMAGE,
  payload: themeimage,
})
export const showSidebar = isopen => ({
  type: SHOW_SIDEBAR,
  payload: isopen,
})

export const toggleLeftmenu = isopen => ({
  type: TOGGLE_LEFTMENU,
  payload: isopen,
})
