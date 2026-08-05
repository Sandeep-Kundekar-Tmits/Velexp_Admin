import React, { useState } from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "@/components/ui";

/**
 * `tabContentClassName` / `tabPaneClassName` reach the two wrappers this draws
 * around each tab's component, which are otherwise unstyleable from outside.
 * A screen putting a fit-to-screen grid in a tab needs `page-fit-body` on both,
 * or the height chain stops at the pane and the grid falls back to its own
 * height -- taller than the pinned page, so its foot is clipped off the screen.
 */
const TabComponentProvider = ({
  tabs,
  defaultActive = 1,
  tabContentClassName = "p-0",
  tabPaneClassName = "",
}) => {
  const [activeTab, setActiveTab] = useState(defaultActive);

  const toggleTab = (tabId) => {
    if (activeTab !== tabId) {
      setActiveTab(tabId);
    }
  };

  return (
    <>
      <Nav tabs className="nav-tabs-custom nav-justified rounded-top bg-canvas">
        {tabs.map((tab) => (
          <NavItem key={tab.id}>
            <NavLink
              className={`nav-link py-3 ${activeTab === tab.id ? "active bg-light" : ""}`}
              onClick={() => toggleTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <div className="flex items-center justify-center">
                <span>{tab.label}</span>
              </div>
            </NavLink>
          </NavItem>
        ))}
      </Nav>

      <TabContent activeTab={activeTab} className={tabContentClassName}>
        {tabs.map((tab) => (
          <TabPane key={tab.id} tabId={tab.id} className={tabPaneClassName}>
            {tab.component}
          </TabPane>
        ))}
      </TabContent>
    </>
  );
};

export default TabComponentProvider;
