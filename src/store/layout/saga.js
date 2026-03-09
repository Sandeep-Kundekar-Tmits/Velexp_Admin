// @flow
import { all, call, fork, takeEvery, put } from "redux-saga/effects"

import {
  CHANGE_SIDEBAR_THEME,
  CHANGE_SIDEBAR_THEME_IMAGE,
} from "./actionTypes"


/**
 * Changes the body attribute
 */
function changeBodyAttribute(attribute, value) {
  if (document.body) document.body.setAttribute(attribute, value)
  return true
}

const changeHtmlAttribute = (attribute, value) => {
  if (document.documentElement) document.documentElement.setAttribute(attribute, value)
  return true;
}

/**
 * Toggle the class on body
 * @param {*} cssClass
 */
function manageBodyClass(cssClass, action = "toggle") {
  switch (action) {
    case "add":
      if (document.body) document.body.classList.add(cssClass)
      break
    case "remove":
      if (document.body) document.body.classList.remove(cssClass)
      break
    default:
      if (document.body) document.body.classList.toggle(cssClass)
      break
  }

  return true
}

/**
 * Changes the left sidebar theme
 * @param {*} param0
 */
function* changeLeftSidebarTheme({ payload: theme }) {
  try {
    yield call(changeBodyAttribute, "data-sidebar", theme)
  } catch (error) { }
}

/**
 * Changes the left sidebar theme Image
 * @param {*} param0
 */
function* changeLeftSidebarThemeImage({ payload: theme }) {
  try {
    yield call(changeBodyAttribute, "data-sidebar-image", theme)
  } catch (error) { }
}





export function* watchChangeLeftSidebarTheme() {
  yield takeEvery(CHANGE_SIDEBAR_THEME, changeLeftSidebarTheme)
}

export function* watchChangeLeftSidebarThemeImage() {
  yield takeEvery(CHANGE_SIDEBAR_THEME_IMAGE, changeLeftSidebarThemeImage)
}

function* LayoutSaga() {
  yield all([
    fork(watchChangeLeftSidebarTheme),
    fork(watchChangeLeftSidebarThemeImage),
  ])
}

export default LayoutSaga
