import { useState } from "react";
import { Nav, NavItem, TabContent, TabPane } from "reactstrap";
import { NavLink } from "react-router-dom";

/**
 * tabs = [
 *   {
 *     id: 1,
 *     label: "Asus Rates",
 *     component: <AsusDataRate />
 *   }
 * ]
 */
const TabsProvider = ({
  tabs = [],
  defaultActiveTab,
  navClassName = "nav-tabs-custom nav-justified rounded-top bg-light",
  tabContentClassName = "pt-2",
}) => {
  const [activeTab, setActiveTab] = useState(
    defaultActiveTab ?? tabs?.[0]?.id
  );

  const toggleTab = (tabId) => {
    if (activeTab !== tabId) {
      setActiveTab(tabId);
    }
  };

  if (!tabs.length) return null;

  return (
    <>
      {/* ---------- TAB HEADERS ---------- */}
      <Nav tabs className={navClassName}>
        {tabs.map((tab) => (
          <NavItem key={tab.id}>
            <NavLink
              className={`nav-link py-3 ${activeTab === tab.id ? "active bg-light" : ""
                }`}
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

      {/* ---------- TAB CONTENT ---------- */}
      <TabContent activeTab={activeTab} className={tabContentClassName}>
        {tabs.map((tab) => (
          <TabPane key={tab.id} tabId={tab.id}>
            {tab.component}
          </TabPane>
        ))}
      </TabContent>
    </>
  );
};

export default TabsProvider;
