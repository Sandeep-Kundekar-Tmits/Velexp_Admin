import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import { MENU } from "@/features/navigation/menuTree";
import { usePermissions } from "@/features/auth/usePermissions";
import { checkCustomerPermissions } from "@/helpers/checkCustomerPermissions";
import { useUiStore } from "@/stores/uiStore";

/**
 * Data-driven sidebar.
 *
 * Replaces 1,013 lines of hardcoded JSX plus MetisMenu, which tracked the
 * active branch by walking up to five levels of parentElement and toggling
 * mm-active / mm-show classes by hand. Here the open branch is derived from
 * the current route, so it cannot drift out of sync with what is rendered.
 *
 * Menu STRUCTURE comes from menuTree.js; VISIBILITY comes from privileges
 * (see permissions.js: superuser bypasses fully, admin bypasses everything
 * except the Privileges group, everyone else follows their granted tree).
 */

/** Drop leaves the user cannot reach, then drop groups left empty. */
function filterMenu(nodes, canAccess, isSuperUser) {
  const out = [];
  for (const node of nodes) {
    // `hidden` preserves the old sidebar's hardcoded kill-switches. The route
    // still exists and stays reachable by URL — only the menu entry is gone.
    if (node.hidden) continue;
    // `superUserOnly` is a second, stricter gate on top of canAccess: a
    // handful of screens (bulk international password reset) must stay
    // invisible to anyone not flagged is_superuser, even if canAccess
    // already grants the url.
    if (node.superUserOnly && !isSuperUser) continue;
    if (node.children) {
      const children = filterMenu(node.children, canAccess, isSuperUser);
      // A group with no reachable children would be an expander that opens
      // onto nothing, so it is removed entirely.
      if (children.length) out.push({ ...node, children });
    } else if (canAccess(node.url)) {
      out.push(node);
    }
  }
  return out;
}

/** Stable key for a node — url for leaves, path-qualified label for groups. */
const keyOf = (node, path) => node.url ?? `${path}/${node.label}`;

/**
 * A leaf is "active" for its own url and any route nested under it, so a
 * detail/add/edit screen (e.g. /service-centres/add, /employees/edit/:id)
 * still highlights its list-page menu entry instead of leaving nothing
 * highlighted, or auto-collapsing the group it lives in, while there.
 */
const isActivePath = (nodeUrl, pathname) =>
  !!nodeUrl && nodeUrl !== "#" && (pathname === nodeUrl || pathname.startsWith(`${nodeUrl}/`));

/** Every group key on the branch containing `pathname`, so it can be opened. */
function branchFor(nodes, pathname, path = "") {
  for (const node of nodes) {
    const key = keyOf(node, path);
    if (node.children) {
      const inner = branchFor(node.children, pathname, key);
      if (inner) return [key, ...inner];
    } else if (isActivePath(node.url, pathname)) {
      return [];
    }
  }
  return null;
}

function MenuNode({ node, path, depth, onNavigate }) {
  const { pathname } = useLocation();
  const expanded = useUiStore((s) => s.expandedMenus);
  const toggleMenu = useUiStore((s) => s.toggleMenu);
  const key = keyOf(node, path);

  if (!node.children) {
    const active = isActivePath(node.url, pathname);
    return (
      <li>
        {/* aria-label carries the item name for screen readers when the rail is
            collapsed and the visible <span> is hidden. */}
        <Link
          to={node.url}
          className={active ? "active" : undefined}
          onClick={onNavigate}
          aria-label={node.label}
          aria-current={active ? "page" : undefined}
        >
          {node.icon && <i className={node.icon} aria-hidden="true" />}
          <span>{node.label}</span>
        </Link>
      </li>
    );
  }

  const isOpen = !!expanded[key];
  return (
    <li className={isOpen ? "mm-active" : undefined}>
      <a
        href="#"
        className="has-arrow"
        aria-expanded={isOpen}
        aria-label={node.label}
        onClick={(e) => {
          e.preventDefault();
          toggleMenu(key);
        }}
      >
        {node.icon && <i className={node.icon} aria-hidden="true" />}
        <span>{node.label}</span>
      </a>
      <ul className={`sub-menu${isOpen ? " mm-show" : ""}`}>
        {node.children.map((child) => (
          <MenuNode
            key={keyOf(child, key)}
            node={child}
            path={key}
            depth={depth + 1}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </li>
  );
}

MenuNode.propTypes = {
  node: PropTypes.object.isRequired,
  path: PropTypes.string,
  depth: PropTypes.number,
  onNavigate: PropTypes.func,
};

/**
 * `pinned` picks which half of the top-level menu this renders: the
 * scrollable tree (false, the default) or the handful of entries marked
 * `pinned: true` in menuTree.js (true), which Sidebar.jsx renders in its own
 * row below the scroll box instead of inside it. Only top-level nodes are
 * checked -- a pinned entry is meant to be a standalone leaf, not buried in
 * a group.
 */
const SidebarNav = ({ onLinkClick, pinned = false }) => {
  const { pathname } = useLocation();
  const { canAccess } = usePermissions();
  const { isSuperUser } = checkCustomerPermissions();
  const setMenuExpanded = useUiStore((s) => s.setMenuExpanded);

  const menu = useMemo(() => {
    const filtered = filterMenu(MENU, canAccess, isSuperUser);
    return filtered.filter((node) => !!node.pinned === pinned);
  }, [canAccess, isSuperUser, pinned]);

  // Open the branch containing the current route. Replaces MetisMenu's
  // activateParentDropdown, which did the same thing by mutating classNames
  // on ancestor nodes. Pinned entries are plain leaves, so there's no branch
  // to expand for them.
  useEffect(() => {
    if (pinned) return;
    const branch = branchFor(menu, pathname);
    branch?.forEach((key) => setMenuExpanded(key, true));
  }, [menu, pathname, setMenuExpanded, pinned]);

  return (
    <ul className="metismenu list-unstyled" id={pinned ? "side-menu-pinned" : "side-menu"}>
      {menu.map((node) => (
        <MenuNode key={keyOf(node, "")} node={node} path="" depth={0} onNavigate={onLinkClick} />
      ))}
    </ul>
  );
};

SidebarNav.propTypes = { onLinkClick: PropTypes.func, pinned: PropTypes.bool };

export default SidebarNav;
