import { createContext, useContext, useEffect } from "react";

/**
 * Lets the mounted screen name itself in the shared page header.
 *
 * PageHeader derives a title from the route, which is right for the ~20 screens
 * that never said what they were called. The other ~69 render MainHeaderCom
 * with a title (and often a subtitle) of their own, and that copy is better
 * than anything a route table can infer -- so it wins when it is offered.
 *
 * The value is the layout's setState, so identity is stable and the effect
 * below does not re-fire on every render of the page using it.
 */
export const PageHeaderContext = createContext(() => {});

/**
 * Publish this screen's title to the header for as long as it is mounted.
 *
 * Cleanup resets to null so the next route falls back to its route-derived
 * title rather than inheriting the last screen's. React runs the outgoing
 * screen's cleanup before the incoming screen's effect, so a navigation cannot
 * leave the header blank.
 */
export function usePageHeaderTitle(title, subTitle) {
  const setPageHeader = useContext(PageHeaderContext);

  useEffect(() => {
    if (!title) return undefined;
    setPageHeader({ title, subTitle });
    return () => setPageHeader(null);
  }, [setPageHeader, title, subTitle]);
}
