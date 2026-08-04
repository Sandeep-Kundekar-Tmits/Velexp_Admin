import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

export const PAGE_HEADER_ACTIONS_ID = "page-header-actions";

/**
 * Puts a screen's primary action into the shared page header.
 *
 * The header is rendered once by the layout, so a page cannot pass children to
 * it -- they are siblings in the tree, not parent and child. A portal is the
 * way across: the layout always renders the empty host div, and whichever
 * screen is mounted fills it.
 *
 * The host is looked up in an effect rather than during render because the
 * layout and the page commit together; the node does not exist until after
 * that first commit. One extra render on mount, and nothing renders into a
 * host that is not there.
 *
 *   <PageHeaderActions>
 *     <button onClick={handleAddUser}>Add User</button>
 *   </PageHeaderActions>
 */
const PageHeaderActions = ({ children }) => {
  // undefined = not looked up yet, null = looked up and absent. The three
  // states matter: rendering inline on the first paint and then teleporting
  // would flash the buttons in the wrong place.
  const [host, setHost] = useState(undefined);

  useEffect(() => {
    setHost(document.getElementById(PAGE_HEADER_ACTIONS_ID));
  }, []);

  if (host === undefined) return null;
  // No header on screen -- a print view, or anything rendered outside the
  // layout. Falling back to rendering in place keeps the buttons reachable
  // instead of silently dropping them.
  if (host === null) return children;
  return createPortal(children, host);
};

PageHeaderActions.propTypes = {
  children: PropTypes.node,
};

export default PageHeaderActions;
