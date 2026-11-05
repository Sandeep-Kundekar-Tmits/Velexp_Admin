// Shipment Transfer — move AWBs from one customer to another (admin-panel API). Three tabs:
// Transfer (typed AWBs), Upload (Excel / CSV) and Logs (audit trail). Preview is a dry run; Apply writes.
import React, { useCallback, useEffect, useState } from "react"
import { Nav, NavItem, NavLink, TabContent, TabPane } from "@/components/ui"
import MainHeaderComp from "../../../components/MainHeaderCom"
import TransferForm from "./TransferForm"
import UploadForm from "./UploadForm"
import LogsTab from "./LogsTab"

const TABS = [
    { id: "transfer", label: "Transfer" },
    { id: "upload", label: "Excel / CSV Upload" },
    { id: "logs", label: "Logs" },
]

const ShipmentTransfer = () => {
    useEffect(() => { document.title = "Shipment Transfer" }, [])
    const [activeTab, setActiveTab] = useState(TABS[0].id)
    // set by "View logs of this batch"; the Logs tab picks it up and clears it
    const [batchFilter, setBatchFilter] = useState("")

    const viewLogs = (batch) => {
        setBatchFilter(batch)
        setActiveTab("logs")
    }
    const clearBatchFilter = useCallback(() => setBatchFilter(""), [])

    return (
        <React.Fragment>
            <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
                <MainHeaderComp
                    title="Shipment Transfer"
                    subTitle="Move shipments from one customer to another."
                />

                <div className="container-fluid page-fit-body overflow-y-auto px-2 pb-3 pt-2">
                    <Nav tabs className="mb-3">
                        {TABS.map((t) => (
                            <NavItem key={t.id}>
                                <NavLink active={activeTab === t.id} onClick={() => setActiveTab(t.id)} style={{ cursor: "pointer" }}>
                                    {t.label}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>

                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="transfer">{activeTab === "transfer" && <TransferForm onViewLogs={viewLogs} />}</TabPane>
                        <TabPane tabId="upload">{activeTab === "upload" && <UploadForm onViewLogs={viewLogs} />}</TabPane>
                        <TabPane tabId="logs">
                            {activeTab === "logs" && <LogsTab batchFilter={batchFilter} onBatchFilterUsed={clearBatchFilter} />}
                        </TabPane>
                    </TabContent>
                </div>
            </div>
        </React.Fragment>
    )
}

export default ShipmentTransfer
