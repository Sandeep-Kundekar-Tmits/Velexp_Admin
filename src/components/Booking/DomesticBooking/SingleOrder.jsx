import React, { memo, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Nav, NavItem, TabContent, TabPane } from "reactstrap";
import ShipperDetails from "./SingleOrder/ShipperDetails";
import ConsigneeDetails from "./SingleOrder/ConsigneeDetails";
import SingleOrderContentDetails from "./SingleOrder/SingleOrderContentDetails";
const Estimate = React.lazy(() => import("./SingleOrder/Estimate"))
const SingleOrder = () => {
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
                title: "Get Estimate",
                Component: <Estimate />
            },
            {
                id: 2,
                title: "Shipper Detail",
                Component: <ShipperDetails />
            },
            {
                id: 3,
                title: "Consignee Details",
                Component: <ConsigneeDetails />
            },
            {
                id: 4,
                title: "Content Details",
                Component: <SingleOrderContentDetails />
            },
            {
                id: 5,
                title: "Payment",
                Component: <>tab5</>
            },
        ]
    }, [])

    return (

        <div className=" container-fluid p-0 m-0">
            <Nav tabs className=" gap-4 mb-2 mt-2  pt-2">
                {Tabs.map((ele) => (
                    <NavItem key={ele.id}>
                        <NavLink
                            style={{ border: "solid gray 1px" }}
                            className={` 
                               ${activeTab === ele.id ? 'active text-primary bg-primary text-white rounded-3' : 'text-muted rounded-3'} px-2 p-1`}
                            onClick={() => toggleTab(ele.id)}
                        >
                            <span>{ele?.id}.{" "}{ele.title}</span>
                        </NavLink>
                    </NavItem>
                ))}
            </Nav>

            <TabContent
                activeTab={activeTab}
                className="p-4 rounded shadow-sm bg-white"
                style={{
                    borderTop: activeTab ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.3s ease'
                }}
            >
                {Tabs.map((ele) => (
                    <TabPane key={ele.id} tabId={ele.id} className="p-0">

                        {ele.Component}
                    </TabPane>
                ))}
            </TabContent>
        </div>
    )
}
export default memo(SingleOrder)