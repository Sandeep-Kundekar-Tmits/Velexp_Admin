// Billing Automation — one page, 4 tabs (Dashboard, Audit, Working & Invoices, History).
// A shared period picker feeds the three one-click batch triggers.
import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardBody, Col, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane, Spinner } from "@/components/ui"
import { Check } from "lucide-react"
import Select from "react-select"
import { toast } from "react-toastify"
import { cn } from "@/lib/cn"
import MainHeaderComp from "../../../components/MainHeaderCom"
import DateRangeInput from "../../../components/Common/DateRangeInput"
import { customStyles } from "../../../helpers/CustomStyle"
import YMD_DateFormate from "../../../helpers/YMD_DateFormate"
import { BILLING_CONFIGURED_CUSTOMERS } from "../../../api"
import useBatchPolling from "./useBatchPolling"
import AutomationDashboardTab from "./AutomationDashboardTab"
import AuditTab from "./AuditTab"
import WorkingTab from "./WorkingTab"
import InvoicesTab from "./InvoicesTab"
import HistoryTab from "./HistoryTab"

import { authFetch } from "@/lib/http";
const TABS = [
    { id: "dashboard", label: "Automation Dashboard" },
    { id: "audit", label: "Audit" },
    { id: "working", label: "Working" },
    { id: "invoices", label: "Invoices" },
    { id: "history", label: "History" },
]

const makeCustomOption = (isAllSelected) => (props) => {
    const { data, isSelected, innerRef, innerProps } = props
    const checked = data.value === "all" ? isAllSelected : isSelected
    return (
        <div
            ref={innerRef}
            {...innerProps}
            className="flex cursor-pointer items-center gap-2 px-4 py-2"
            style={{ backgroundColor: checked ? "color-mix(in srgb, var(--color-brand-500) 18%, transparent)" : "transparent" }}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                    checked ? "border-white bg-white" : "border-current/40"
                )}
            >
                {checked && <Check className="size-3" strokeWidth={3} style={{ color: "var(--color-brand-500)" }} />}
            </span>
            <span className="text-ink">{data.label}</span>
        </div>
    )
}

const CustomMultiValue = (props) => {
    const { data, innerRef, innerProps } = props
    return (
        <div
            ref={innerRef}
            {...innerProps}
            className="inline-flex items-center gap-2 rounded px-2 py-1 mr-2"
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
                <span className="text-ink" style={{ padding: "2px 8px", fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayText}
                </span>
                {children[1]}
            </div>
        )
    }
}

const BillingAutomation = () => {
    const [activeTab, setActiveTab] = useState("dashboard")
    // Left unset, dates stay out of the batch body entirely and the backend
    // defaults to the last calendar month -- so an empty picker must not turn
    // into today's date here.
    const [selectedRange, setSelectedRange] = useState({ startDate: null, endDate: null })
    const { from_date, to_date } = selectedRange.startDate && selectedRange.endDate
        ? YMD_DateFormate(selectedRange)
        : { from_date: "", to_date: "" }
    const period = { startDate: from_date, endDate: to_date }
    const [customers, setCustomers] = useState([])
    const [selectedCustomers, setSelectedCustomers] = useState([])
    const [loadingCustomers, setLoadingCustomers] = useState(false)
    const [customerMenuOpen, setCustomerMenuOpen] = useState(false)
    const customerSelectRef = useRef(null)
    const batchCtl = useBatchPolling()

    useEffect(() => {
        const handler = (e) => {
            if (customerSelectRef.current && !customerSelectRef.current.contains(e.target)) {
                setCustomerMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const fetchCustomers = useCallback(async () => {
        setLoadingCustomers(true)
        try {
            const res = await authFetch(BILLING_CONFIGURED_CUSTOMERS, { credentials: "include" })
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
                {/* No sticky wrapper: MainHeaderComp draws nothing inline, it hands
                    the title to the layout's PageHeader. */}
                <MainHeaderComp title="Billing Automation" />

                <div className="container-fluid px-4 py-4">
                    {/* Shared period picker & customer selector */}
                    <Card className="shadow-sm border-0 mb-4">
                        <CardBody>
                            <Row className="items-end">
                                <Col md={4} className="mb-2 mb-md-0">
                                    <Label className="font-bold">Date Range</Label>
                                    <DateRangeInput
                                        value={selectedRange}
                                        onChange={setSelectedRange}
                                        isBorder={true}
                                    />
                                </Col>
                                <Col md={8}>
                                    <Label className="font-bold">Customers</Label>
                                    {loadingCustomers ? (
                                        <div className="flex items-center gap-2">
                                            <Spinner size="sm" />
                                            <span className="text-ink-muted text-xs">Loading customers...</span>
                                        </div>
                                    ) : (
                                        <div ref={customerSelectRef}>
                                            <Select
                                                isMulti
                                                options={optionsWithSelectAll}
                                                value={selectedCustomers}
                                                onChange={handleCustomerChange}
                                                placeholder="Select customers..."
                                                classNamePrefix="react-select"
                                                closeMenuOnSelect={false}
                                                hideSelectedOptions={false}
                                                menuIsOpen={customerMenuOpen}
                                                onMenuOpen={() => setCustomerMenuOpen(true)}
                                                onMenuClose={() => setCustomerMenuOpen(false)}
                                                menuPortalTarget={document.body}
                                                menuPosition="fixed"
                                                components={{
                                                    Option: makeCustomOption(isAllSelected),
                                                    MultiValue: CustomMultiValue,
                                                    ValueContainer: makeCustomValueContainer(customerOptions.length),
                                                }}
                                                styles={{
                                                    ...customStyles,
                                                    multiValue: () => ({ display: "none" }),
                                                    valueContainer: (base) => ({
                                                        ...base,
                                                        flexWrap: "nowrap",
                                                        overflow: "hidden",
                                                    }),
                                                }}
                                            />
                                        </div>
                                    )}
                                </Col>
                            </Row>
                            <Row className="mt-2">
                                <Col>
                                    <small className="text-ink-muted">
                                        Leave dates blank to default to the last calendar month. Selected: {selectedCustomers.length === customerOptions.length ? "All customers" : `${selectedCustomers.length} customer${selectedCustomers.length !== 1 ? "s" : ""}`}
                                    </small>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* Tabs */}
                    <Nav tabs className="mb-4">
                        {TABS.map((t) => (
                            <NavItem key={t.id}>
                                <NavLink
                                    active={activeTab === t.id}
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
                            {activeTab === "working" && <WorkingTab />}
                        </TabPane>
                        <TabPane tabId="invoices">
                            {activeTab === "invoices" && <InvoicesTab />}
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
