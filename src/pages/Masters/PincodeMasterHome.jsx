import { useEffect, useState } from "react"
import { Nav, NavItem, NavLink, TabContent, TabPane } from "@/components/ui"
import MainHeaderComp from "../../components/MainHeaderCom"
import PincodeMasterPincodesTab from "./PincodeMasterPincodesTab"
import PincodeMasterStatesTab from "./PincodeMasterStatesTab"
import PincodeMasterCitiesTab from "./PincodeMasterCitiesTab"
import PincodeMasterAliasesTab from "./PincodeMasterAliasesTab"

const TABS = [
    { key: "pincodes", label: "Pincodes", Component: PincodeMasterPincodesTab },
    { key: "states", label: "States", Component: PincodeMasterStatesTab },
    { key: "cities", label: "Cities", Component: PincodeMasterCitiesTab },
    { key: "aliases", label: "Aliases", Component: PincodeMasterAliasesTab },
]

const PincodeMasterHome = () => {
    useEffect(() => { document.title = "Pincode Master" }, [])
    const [activeTab, setActiveTab] = useState(TABS[0].key)

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Pincode Master"
                subTitle="Canonical pincode / state / city reference data — single-row CRUD, bulk upload, and alias management."
            />

            <div className="page-fit-body relative z-10 pb-4">
                <Nav tabs className="nav-tabs-custom nav-justified">
                    {TABS.map((tab) => (
                        <NavItem key={tab.key}>
                            <NavLink
                                active={activeTab === tab.key}
                                style={{ cursor: "pointer" }}
                                onClick={() => setActiveTab(tab.key)}
                                className={activeTab === tab.key ? "bg-[#3B82F6]/12 text-[15px] font-bold" : "text-[15px] font-bold"}
                            >
                                {tab.label}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>

                <TabContent activeTab={activeTab} className="page-fit-body mt-3">
                    {TABS.map(({ key, Component }) => (
                        <TabPane key={key} tabId={key} className="page-fit-body">
                            {activeTab === key && <Component />}
                        </TabPane>
                    ))}
                </TabContent>
            </div>
        </div>
    )
}

export default PincodeMasterHome
