// Billing Automation — one page, 4 tabs (Dashboard, Audit, Working & Invoices, History).
// A shared period picker feeds the three one-click batch triggers.
import React, { useState, useEffect, useCallback } from "react"
import { Card, CardBody, Col, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane, Spinner } from "reactstrap"
import classnames from "classnames"
import Select from "react-select"
import { toast } from "react-toastify"
import MainHeaderComp from "../../../components/MainHeaderCom"
import { BILLING_CONFIGURED_CUSTOMERS } from "../../../api"
import useBatchPolling from "./useBatchPolling"
import AutomationDashboardTab from "./AutomationDashboardTab"
import AuditTab from "./AuditTab"
import WorkingInvoicesTab from "./WorkingInvoicesTab"
import HistoryTab from "./HistoryTab"

const TABS = [
    { id: "dashboard", label: "Automation Dashboard" },
    { id: "audit", label: "Audit" },
    { id: "working", label: "Working & Invoices" },
    { id: "history", label: "History" },
]

const makeCustomOption = (isAllSelected) => (props) => {
    const { data, isSelected, innerRef, innerProps } = props
    const checked = data.value === "all" ? isAllSelected : isSelected
    return (
        <div
            ref={innerRef}
            {...innerProps}
            className="d-flex align-items-center gap-2 px-3 py-2"
            style={{ cursor: "pointer", backgroundColor: checked ? "#e7f1ff" : "transparent" }}
        >
            <input type="checkbox" checked={checked} onChange={() => {}} style={{ cursor: "pointer" }} />
            <span>{data.label}</span>
        </div>
    )
}

const CustomMultiValue = (props) => {
    const { data, innerRef, innerProps } = props
    return (
        <div
            ref={innerRef}
            {...innerProps}
            className="d-inline-flex align-items-center gap-2 rounded px-2 py-1 me-2"
            style={{ backgroundColor: "#e7f1ff", marginTop: "4px", marginBottom: "4px" }}
        >
            <input type="checkbox" checked={true} onChange={() => {}} style={{ cursor: "pointer" }} readOnly />
            <span style={{ fontSize: "0.875rem", color: "#0c63e4" }}>{data.label}</span>
        </div>
    )
}

const makeCustomValueContainer = (totalCount) => {
    return (props) => {
        const { getValue, children } = props
        const selected = getValue()

        if (!selected || selected.length === 0) {
            return <div>{children[1]}</div>
        }

        // Always show collapsed view
        let displayText = ""
        if (selected.length === 1) {
            displayText = selected[0].label
        } else if (selected.length === totalCount) {
            displayText = `All ${totalCount} customers`
        } else {
            displayText = `${selected[0].label} + ${selected.length - 1} more`
        }

        return (
            <div style={{ display: "flex", alignItems: "center", flexWrap: "nowrap", overflow: "hidden", flex: 1 }}>
                <span style={{ padding: "2px 8px", fontSize: "0.875rem", color: "#0c63e4", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayText}
                </span>
                {children[1]}
            </div>
        )
    }
}

const BillingAutomation = () => {
    const [activeTab, setActiveTab] = useState("dashboard")
    const [period, setPeriod] = useState({ startDate: "", endDate: "" })
    const [customers, setCustomers] = useState([])
    const [selectedCustomers, setSelectedCustomers] = useState([])
    const [loadingCustomers, setLoadingCustomers] = useState(false)
    const batchCtl = useBatchPolling()

    const fetchCustomers = useCallback(async () => {
        setLoadingCustomers(true)
        try {
            const res = await fetch(BILLING_CONFIGURED_CUSTOMERS, { credentials: "include" })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.detail || `Error ${res.status}`)
            const custList = json.customers || []
            setCustomers(custList)
            // Default select all
            setSelectedCustomers(custList.map((c) => ({ value: c.id, label: c.customer_name })))
        } catch (err) {
            toast.error(err.message, { position: "bottom-right", autoClose: 5000 })
        } finally {
            setLoadingCustomers(false)
        }
    }, [])

    useEffect(() => {
        fetchCustomers()
    }, [fetchCustomers])

    const handleOpenBatch = (batchId) => {
        batchCtl.openBatch(batchId)
        setActiveTab("dashboard")
    }

    const selectAllOption = { value: "all", label: "Select All" }

    const customerOptions = customers.map((c) => ({
        value: c.id,
        label: c.customer_name,
    }))

    const optionsWithSelectAll = [selectAllOption, ...customerOptions]

    const isAllSelected = selectedCustomers.length === customerOptions.length && customerOptions.length > 0

    const handleCustomerChange = (selected) => {
        if (!selected) {
            setSelectedCustomers([])
            return
        }

        const wasSelectAllPicked = selected.some((s) => s.value === "all")
        const wasSelectAllAlreadyOn = isAllSelected

        if (wasSelectAllPicked) {
            // Toggle: if all were already selected → uncheck all; otherwise → check all
            setSelectedCustomers(wasSelectAllAlreadyOn ? [] : customerOptions)
        } else {
            setSelectedCustomers(selected.filter((s) => s.value !== "all"))
        }
    }

    return (
        <React.Fragment>
            <div className="page-content py-0 px-0">
                <div className="bg-white" style={{ position: "sticky", top: "0px", zIndex: 1001, width: "100%" }}>
                    <MainHeaderComp title="Billing Automation" />
                </div>

                <div className="container-fluid px-3 py-3">
                    {/* Shared period picker & customer selector */}
                    <Card className="shadow-sm border-0 mb-3">
                        <CardBody>
                            <Row className="align-items-end">
                                <Col md={3} className="mb-2 mb-md-0">
                                    <Label className="fw-bold">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={period.startDate}
                                        onChange={(e) => setPeriod((p) => ({ ...p, startDate: e.target.value }))}
                                    />
                                </Col>
                                <Col md={3} className="mb-2 mb-md-0">
                                    <Label className="fw-bold">End Date</Label>
                                    <Input
                                        type="date"
                                        value={period.endDate}
                                        onChange={(e) => setPeriod((p) => ({ ...p, endDate: e.target.value }))}
                                    />
                                </Col>
                                <Col md={6}>
                                    <Label className="fw-bold">Customers</Label>
                                    {loadingCustomers ? (
                                        <div className="d-flex align-items-center gap-2">
                                            <Spinner size="sm" />
                                            <span className="text-muted small">Loading customers...</span>
                                        </div>
                                    ) : (
                                        <Select
                                            isMulti
                                            options={optionsWithSelectAll}
                                            value={selectedCustomers}
                                            onChange={handleCustomerChange}
                                            placeholder="Select customers..."
                                            classNamePrefix="react-select"
                                            closeMenuOnSelect={false}
                                            hideSelectedOptions={false}
                                            components={{
                                                Option: makeCustomOption(isAllSelected),
                                                MultiValue: CustomMultiValue,
                                                ValueContainer: makeCustomValueContainer(customerOptions.length),
                                            }}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: "38px",
                                                    borderColor: "#ced4da",
                                                    "&:hover": { borderColor: "#80bdff" },
                                                }),
                                                multiValue: () => ({ display: "none" }),
                                                valueContainer: (base) => ({
                                                    ...base,
                                                    flexWrap: "nowrap",
                                                    overflow: "hidden",
                                                }),
                                            }}
                                        />
                                    )}
                                </Col>
                            </Row>
                            <Row className="mt-2">
                                <Col>
                                    <small className="text-muted">
                                        Leave dates blank to default to the last calendar month. Selected: {selectedCustomers.length === customerOptions.length ? "All customers" : `${selectedCustomers.length} customer${selectedCustomers.length !== 1 ? "s" : ""}`}
                                    </small>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* Tabs */}
                    <Nav tabs className="mb-3">
                        {TABS.map((t) => (
                            <NavItem key={t.id}>
                                <NavLink
                                    className={classnames({ active: activeTab === t.id })}
                                    onClick={() => setActiveTab(t.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {t.label}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>

                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="dashboard">
                            {activeTab === "dashboard" && (
                                <AutomationDashboardTab period={period} selectedCustomers={selectedCustomers} batchCtl={batchCtl} />
                            )}
                        </TabPane>
                        <TabPane tabId="audit">
                            {activeTab === "audit" && <AuditTab selectedCustomers={selectedCustomers} batchCtl={batchCtl} />}
                        </TabPane>
                        <TabPane tabId="working">
                            {activeTab === "working" && <WorkingInvoicesTab selectedCustomers={selectedCustomers} />}
                        </TabPane>
                        <TabPane tabId="history">
                            {activeTab === "history" && <HistoryTab selectedCustomers={selectedCustomers} onOpenBatch={handleOpenBatch} />}
                        </TabPane>
                    </TabContent>
                </div>
            </div>
        </React.Fragment>
    )
}

export default BillingAutomation
