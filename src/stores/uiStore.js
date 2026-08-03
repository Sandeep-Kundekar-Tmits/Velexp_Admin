/**
 * Layout / chrome state.
 *
 * Replaces the Redux `Layout` slice. That slice looked stateful but was not:
 * VerticalLayout read three values from it and dispatched actions that set
 * those same values straight back, and nothing else ever changed them. They
 * are effectively constants, so they live here as defaults.
 *
 * The genuinely dynamic bits — mobile sidebar open/closed, and which sidebar
 * groups are expanded — are real state and belong in a store rather than in
 * component-local useState, because the header toggle and the sidebar itself
 * need to agree.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  layoutModeTypes,
  layoutTypes,
  layoutWidthTypes,
  leftBarThemeImageTypes,
  leftSidebarTypes,
  leftSideBarThemeTypes,
  topBarThemeTypes,
} from "@/constants/layout";

export const useUiStore = create(
  persist(
    (set, get) => ({
      // --- layout constants, carried over from the Redux INIT_STATE ---
      layoutType: layoutTypes.VERTICAL,
      layoutModeType: layoutModeTypes.LIGHT,
      layoutWidth: layoutWidthTypes.FLUID,
      leftSideBarTheme: leftSideBarThemeTypes.DARK,
      leftSideBarThemeImage: leftBarThemeImageTypes.NONE,
      leftSideBarType: leftSidebarTypes.DEFAULT,
      topbarTheme: topBarThemeTypes.LIGHT,

      // --- real UI state ---
      mobileSidebarOpen: false,
      /** link_url (or menu id) -> expanded, for the sidebar accordion. */
      expandedMenus: {},

      openMobileSidebar: () => {
        document.body.classList.add("sidebar-enable");
        set({ mobileSidebarOpen: true });
      },
      closeMobileSidebar: () => {
        document.body.classList.remove("sidebar-enable");
        set({ mobileSidebarOpen: false });
      },

      toggleMenu: (key) =>
        set({ expandedMenus: { ...get().expandedMenus, [key]: !get().expandedMenus[key] } }),
      setMenuExpanded: (key, expanded) =>
        set({ expandedMenus: { ...get().expandedMenus, [key]: expanded } }),
    }),
    {
      name: "velexp-ui",
      // Only the accordion survives a reload; the mobile drawer should always
      // start closed.
      partialize: (state) => ({ expandedMenus: state.expandedMenus }),
    }
  )
);
