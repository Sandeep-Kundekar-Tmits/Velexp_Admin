import React, { useMemo, useState } from "react";
import { NavLink } from "react-router-dom"
import { Nav, NavItem, TabContent, TabPane } from "reactstrap"
const SingleOrder=React.lazy(()=>import("../../../components/Booking/DomesticBooking/SingleOrder"))

const DomesticBooking = () => {
    const [activeTab, setActiveTab] = useState(1);

    const toggleTab = (tabId) => {
        if (activeTab !== tabId) {
            setActiveTab(tabId);
        }
    };

    const Tabs = useMemo(() => {
        return [
            {
                id: 1,
                title: "Single Order",
                Component: <SingleOrder />
            },
            {
                id: 2,
                title: "Bulk Order",
                Component: <>tab2</>
            },
            {
                id: 3,
                title: "Order With Errors",
                Component: <>tab3</>
            },
            {
                id: 4,
                title: "UnProcessed Order",
                Component: <>tab4</>
            },
        ]
    }, [])
    return (
        <div className="page-content">

            <Nav tabs className="nav-tabs-custom nav-justified rounded-top bg-light">
                {
                    Tabs.map((ele) => {
                        return (
                            <NavItem>
                                <NavLink
                                    className={`nav-link py-3 ${activeTab === ele?.id ? 'bg-light' : ''}`}
                                    onClick={() => toggleTab(ele.id)}
                                >
                                    <div className="d-flex align-items-center justify-content-center">
                                        <span>{ele.title}</span>
                                    </div>
                                </NavLink>
                            </NavItem>
                        )
                    })
                }
            </Nav>

            <TabContent activeTab={activeTab} className="p-0">
                {
                    Tabs.map((ele) => {
                        return (
                            <TabPane className="p-0" tabId={ele?.id}>
                                {ele.Component}
                            </TabPane>
                        )
                    })
                }
            </TabContent>
        </div>
    )
}
export default DomesticBooking