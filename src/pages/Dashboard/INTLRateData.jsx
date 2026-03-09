import React from "react";
import { useState } from "react"
import { Input, Label, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap"
import INTCustomerRateDataComp from "../../components/INTRateData/INTCustomerRateData/INTCustomerRateDataComp";
import INTDefaultRateData from "../../components/INTRateData/INTDefaultRateData/INTDeafultRateData";
// const INTCustomerRateDataComp = React.lazy(() => import("../../components/INTRateData/INTCustomerRateData/INTCustomerRateDataComp"))
const INTLRateData = () => {
    const [activeTab, setActiveTab] = useState(1);

    const toggleTab = (tabId) => {
        if (activeTab !== tabId) {
            setActiveTab(tabId);
        }
    };

    return (
        <div className="page-content">
            <Nav tabs className="nav-tabs-custom nav-justified rounded-top bg-light">
                <NavItem>
                    <NavLink
                        className={`nav-link py-3 ${activeTab === 1 ? 'active bg-white' : ''}`}
                        onClick={() => toggleTab(1)}
                        role="tab"
                        aria-selected={activeTab === 1}
                    >
                        <div className="d-flex align-items-center justify-content-center">
                            <span>INT Customer Rates</span>
                        </div>
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={`nav-link py-3 ${activeTab === 2 ? 'active bg-white' : ''}`}
                        onClick={() => toggleTab(2)}
                        role="tab"
                        aria-selected={activeTab === 2}
                    >
                        <div className="d-flex align-items-center justify-content-center">
                            <span>INT Default Rates</span>
                        </div>
                    </NavLink>
                </NavItem>
                {/* <NavItem>
                    <NavLink
                        className={`nav-link py-3 ${activeTab === 3 ? 'active bg-white' : ''}`}
                        onClick={() => toggleTab(3)}
                        role="tab"
                        aria-selected={activeTab === 3}
                    >
                        <div className="d-flex align-items-center justify-content-center">
                            <span>INT Corporate Rates</span>
                        </div>
                    </NavLink>
                </NavItem> */}
            </Nav>

            <TabContent activeTab={activeTab} className="p-4 bg-white">
                <TabPane tabId={1}>
                    {/* Your content for tab 1 */}
                    <INTCustomerRateDataComp />
                </TabPane>
                <TabPane tabId={2}>
                    {/* Your content for tab 2 */}
                    <INTDefaultRateData />
                </TabPane>
                {/* <TabPane tabId={3}>
                    
                    <h1>Tab3</h1>
                </TabPane> */}
            </TabContent>
        </div>
    )
}
export default INTLRateData