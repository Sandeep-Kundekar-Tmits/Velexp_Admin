import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

import { pageTitleFor } from "@/features/navigation/pageTitle";
import { PAGE_HEADER_ACTIONS_ID } from "./PageHeaderActions";

/**
 * The one page header, rendered by the layout for every screen.
 *
 * Screens used to be on their own here: most had no header at all, a few had
 * an <h4> of their own invention, and one had an <h1> plus a hand-written
 * breadcrumb. Putting it in the layout means every route gets the same bar
 * without 80 files having to opt in, and a new screen inherits it for free.
 *
 * The eyebrow replaces the breadcrumbs it removed. It carries the same
 * information -- which section of the menu you are in -- in one line that does
 * not pretend its ancestors are clickable, which the old breadcrumb did while
 * rendering plain text.
 *
 * Also the mobile top bar: the hamburger lives here rather than in a separate
 * mobile-only Header, so there is one header component and one title lookup
 * instead of two that could drift apart.
 */
const PageHeader = ({ isMobile, onMobileToggle, override }) => {
  const { pathname } = useLocation();
  const fromRoute = pageTitleFor(pathname);

  // A screen that names itself (via MainHeaderCom) wins: its copy is written
  // for the screen, where the route table can only infer from the menu label.
  const title = override?.title || fromRoute.title;
  const subTitle = override?.subTitle;

  return (
    <header className="page-header">
      {isMobile && (
        <button
          type="button"
          onClick={onMobileToggle}
          className="page-header-menu"
          aria-label="Open menu"
        >
          <Menu aria-hidden="true" size={18} />
        </button>
      )}

      {/* Two lines at most, never three: a screen's own subtitle takes the
          second line if it has one, otherwise the menu section does. Both say
          "where am I", so showing both would be saying it twice. */}
      <div className="page-header-titles">
        {!subTitle && fromRoute.section && (
          <p className="page-header-eyebrow">{fromRoute.section}</p>
        )}
        <h1 className="page-header-title">{title}</h1>
        {subTitle && <p className="page-header-subtitle">{subTitle}</p>}
      </div>

      {/* Always rendered, even when empty: PageHeaderActions looks this up by
          id after mount, so the host has to exist whether or not the current
          screen has anything to put in it. */}
      <div id={PAGE_HEADER_ACTIONS_ID} className="page-header-actions" />
    </header>
  );
};

PageHeader.propTypes = {
  isMobile: PropTypes.bool,
  onMobileToggle: PropTypes.func,
  /** Set by the mounted screen through PageHeaderContext; null when it says nothing. */
  override: PropTypes.shape({
    title: PropTypes.string,
    subTitle: PropTypes.string,
  }),
};

export default PageHeader;
