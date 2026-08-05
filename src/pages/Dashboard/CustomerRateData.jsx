import { useState } from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "@/components/ui";
import { cn } from "@/lib/cn";
import AsusDataRate from "../../components/CustomerRateData/AsusDataRate/AsusDataRate";
import CorporateDataRate from "../../components/CustomerRateData/CorporateDataRate/CorporateDataRate";
import FranchiseRateData from "../../components/CustomerRateData/FranchiseRateData/FranchiseRateData";
import RetailDataRate from "../../components/CustomerRateData/RetailDataRate/RetailDataRate";
import MainHeaderComp from "../../components/MainHeaderCom";

const TABS = [
    { id: 1, label: "Asus Rates", component: <AsusDataRate /> },
    { id: 2, label: "Corporate Rates", component: <CorporateDataRate /> },
    { id: 3, label: "Franchise Rates", component: <FranchiseRateData /> },
    { id: 4, label: "Retail Rates", component: <RetailDataRate /> },
];

const CustomerRateData = () => {
    const [activeTab, setActiveTab] = useState(TABS[0].id);

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            {/* Was the only screen in the Customers group with no header at
                all -- every sibling (Rate Data, Pincode) renders one. */}
            <MainHeaderComp title="Customer Rate Data" subTitle="Rates by customer type -- Asus, Corporate, Franchise, Retail." />

            <div className="relative z-10 pb-4">
                {/* No card wrapping the bar + content: each tab's own table
                    already draws its own grid-shell panel, and boxing that in
                    a second bordered panel was a border around a border. The
                    tab bar keeps just its own bottom rule (Nav's `tabs` prop),
                    and the table below it runs the full content width.

                    The old markup (nav-tabs-custom, nav-justified, rounded-top
                    as literal class strings, and `active bg-light` shoved into
                    className) is why the selected tab never actually showed:
                    NavLink reads an `active` PROP, not a literal "active"
                    class, and Nav reads a `justified` prop the same way --
                    none of those strings did anything once the component
                    moved off raw Bootstrap markup. */}
                <Nav tabs justified className="mb-4">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <NavItem key={tab.id}>
                                {/* text-center, not justify-center: NavLink's
                                    own base class is `block`, so
                                    justify-content would have had nothing to
                                    apply to -- text-align is what actually
                                    centres a block element's content.

                                    NavLink's own active state (from the shared
                                    component) is just an underline + colour
                                    change -- kept, and layered with a filled
                                    background here so the current tab reads as
                                    a raised, selected chip rather than plain
                                    text with a line under it. Scoped to this
                                    page via className rather than changed on
                                    NavLink itself, since other Nav/tabs call
                                    sites in the app may not want a fill. */}
                                <NavLink
                                    active={isActive}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "rounded-t-lg text-center text-[15px] font-bold",
                                        isActive && "bg-[#3B82F6]/12"
                                    )}
                                >
                                    {tab.label}
                                </NavLink>
                            </NavItem>
                        );
                    })}
                </Nav>

                <TabContent activeTab={activeTab}>
                    {TABS.map((tab) => (
                        <TabPane key={tab.id} tabId={tab.id}>
                            {tab.component}
                        </TabPane>
                    ))}
                </TabContent>
            </div>
        </div>
    );
};

export default CustomerRateData;
