// Billing Status — one page, two tabs (Unbilled, Billed) with the same form; only the report differs.
import React, { useEffect, useState } from "react"
import { Nav, NavItem, NavLink, TabContent, TabPane } from "@/components/ui"
import MainHeaderComp from "../../../components/MainHeaderCom"
import ExcelReportForm from "./ExcelReportForm"
import { BILLED_SHIPMENTS_EXCEL, UNBILLED_SHIPMENTS_EXCEL } from "../../../api"

const TABS = [
    { id: "unbilled", label: "Unbilled", endpoint: UNBILLED_SHIPMENTS_EXCEL, filePrefix: "unbilled_shipments", reportName: "Unbilled shipments" },
    { id: "billed", label: "Billed", endpoint: BILLED_SHIPMENTS_EXCEL, filePrefix: "billed_shipments", reportName: "Billed shipments" },
]

const BillingStatus = () => {
    useEffect(() => { document.title = "Billing Status" }, [])
    const [activeTab, setActiveTab] = useState(TABS[0].id)

    return (
        <React.Fragment>
            <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
                <MainHeaderComp title="Billing Status" subTitle="Download the unbilled or billed shipments Excel for a date range." />

                <div className="container-fluid page-fit-body px-2 pt-2">
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
                        {TABS.map((t) => (
                            <TabPane key={t.id} tabId={t.id}>
                                {activeTab === t.id && <ExcelReportForm endpoint={t.endpoint} filePrefix={t.filePrefix} reportName={t.reportName} />}
                            </TabPane>
                        ))}
                    </TabContent>
                </div>
            </div>
        </React.Fragment>
    )
}

export default BillingStatus
