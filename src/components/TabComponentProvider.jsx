import React, { useState } from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";

const TabComponentProvider = ({ tabs, defaultActive = 1 }) => {
  const [activeTab, setActiveTab] = useState(defaultActive);

  const toggleTab = (tabId) => {
    if (activeTab !== tabId) {
      setActiveTab(tabId);
    }
  };

  return (
    <>
      <Nav tabs className="nav-tabs-custom nav-justified rounded-top bg-light">
        {tabs.map((tab) => (
          <NavItem key={tab.id}>
            <NavLink
              className={`nav-link py-3 ${activeTab === tab.id ? "active bg-light" : ""}`}
              onClick={() => toggleTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <div className="d-flex align-items-center justify-content-center">
                <span>{tab.label}</span>
              </div>
            </NavLink>
          </NavItem>
        ))}
      </Nav>

      <TabContent activeTab={activeTab} className="p-4">
        {tabs.map((tab) => (
          <TabPane key={tab.id} tabId={tab.id}>
            {tab.component}
          </TabPane>
        ))}
      </TabContent>
    </>
  );
};

export default TabComponentProvider;
