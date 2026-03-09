import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    Nav,
    NavItem,
    TabContent,
    TabPane,
} from "reactstrap";
import AsusDataRate from "../../components/CustomerRateData/AsusDataRate/AsusDataRate";
import CorporateDataRate from "../../components/CustomerRateData/CorporateDataRate/CorporateDataRate";
import FranchiseRateData from "../../components/CustomerRateData/FranchiseRateData/FranchiseRateData";
import RetailDataRate from "../../components/CustomerRateData/RetailDataRate/RetailDataRate";

const CustomerRateData = () => {
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
                        className={`nav-link py-3 ${activeTab === 1 ? 'active bg-light' : ''}`}
                        onClick={() => toggleTab(1)}
                        role="tab"
                        aria-selected={activeTab === 1}
                    >
                        <div className="d-flex align-items-center justify-content-center">
                            <span>Asus Rates</span>
                        </div>
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={`nav-link py-3 ${activeTab === 2 ? 'active bg-light' : ''}`}
                        onClick={() => toggleTab(2)}
                        role="tab"
                        aria-selected={activeTab === 2}
                    >
                        <div className="d-flex align-items-center justify-content-center">
                            <span>Corporate Rates</span>
                        </div>
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={`nav-link py-3 ${activeTab === 3 ? 'active bg-light' : ''}`}
                        onClick={() => toggleTab(3)}
                        role="tab"
                        aria-selected={activeTab === 3}
                    >
                        <div className="d-flex align-items-center justify-content-center">
                            <span>Franchise Rates</span>
                        </div>
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={`nav-link py-3 ${activeTab === 4 ? 'active bg-light' : ''}`}
                        onClick={() => toggleTab(4)}
                        role="tab"
                        aria-selected={activeTab === 4}
                    >
                        <div className="d-flex align-items-center justify-content-center">
                            <span>retail Rates</span>
                        </div>
                    </NavLink>
                </NavItem>
            </Nav>

            <TabContent activeTab={activeTab} className="p-2">
                <TabPane tabId={1}>
                    {/* Your content for tab 1 */}
                    <AsusDataRate />
                </TabPane>

                <TabPane tabId={2}>
                    {/* Your content for tab 2 */}
                    <CorporateDataRate />
                </TabPane>

                <TabPane tabId={3}>
                    {/* Your content for tab 3 */}
                    <FranchiseRateData />
                </TabPane>

                <TabPane tabId={4}>
                    {/* Your content for tab 4 */}
                    <RetailDataRate />
                </TabPane>
            </TabContent>
        </div>
    );
};

export default CustomerRateData;