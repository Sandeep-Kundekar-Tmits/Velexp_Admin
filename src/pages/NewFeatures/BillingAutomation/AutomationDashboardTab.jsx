// Tab 1 — the three one-click triggers + live progress panel.
import { useState } from "react"
import { Button, Card, CardBody, Col, Row, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Badge, Input, Label } from "@/components/ui"
import { MdSync, MdDescription, MdReceiptLong } from "react-icons/md"
import {
    BILLING_BATCH_SYNC_AUDIT,
    BILLING_BATCH_GENERATE_WORKING,
    BILLING_BATCH_DIRECT_INVOICE,
} from "../../../api"
import BatchProgressPanel from "./BatchProgressPanel"

// Button/Badge `color` prop values don't line up 1:1 with theme token names
// (there is no primary-500/info-500 token -- primary is brand, info is accent).
const COLOR_TOKEN = { primary: "brand", info: "accent", success: "success" }

const ACTIONS = [
    {
        key: "SYNC_AUDIT",
        url: BILLING_BATCH_SYNC_AUDIT,
        title: "Sync & Audit All",
        confirmMsg: "This will sync and audit all selected customers. Any existing audit data will be refreshed.",
        color: "primary",
        icon: MdSync,
    },
    {
        key: "GENERATE_WORKING",
        url: BILLING_BATCH_GENERATE_WORKING,
        title: "Generate Working All",
        confirmMsg: "This will generate working data files for all selected customers. Please review before invoicing.",
        color: "info",
        icon: MdDescription,
    },
    {
        key: "DIRECT_INVOICE",
        url: BILLING_BATCH_DIRECT_INVOICE,
        title: "Generate Invoices Directly",
        confirmMsg: "This will generate and push invoices directly to Vecom for all selected customers. This action cannot be undone.",
        color: "success",
        icon: MdReceiptLong,
    },
]

const todayIso = () => new Date().toISOString().split("T")[0]

const AutomationDashboardTab = ({ period, selectedCustomers = [], batchCtl }) => {
    const { batch, isPolling, isTriggering, startBatch, stopPolling } = batchCtl
    const [pendingAction, setPendingAction] = useState(null) // { url, title, confirmMsg, color }
    // Only DIRECT_INVOICE needs this -- it's the invoice_date stamped on
    // every invoice the batch generates, not a filter on which bookings to
    // include, so it defaults to today rather than the shared period range.
    const [invoiceDate, setInvoiceDate] = useState("")

    const handleTrigger = (action) => {
        setPendingAction(action)
        if (action.key === "DIRECT_INVOICE") setInvoiceDate(todayIso())
    }

    const handleConfirm = () => {
        if (!pendingAction) return
        const body = {}
        if (period?.startDate) body.start_date = period.startDate
        if (period?.endDate) body.end_date = period.endDate
        if (pendingAction.key === "DIRECT_INVOICE") body.invoice_date = invoiceDate
        body.customer_ids = selectedCustomers.map((c) => c.value)
        startBatch(pendingAction.url, body)
        setPendingAction(null)
    }

    const handleCancel = () => setPendingAction(null)

    const needsInvoiceDate = pendingAction?.key === "DIRECT_INVOICE"

    return (
        <div>
            <Row>
                {ACTIONS.map((a) => {
                    const Icon = a.icon
                    const running = isPolling && batch?.batch_type === a.key
                    return (
                        <Col md={4} key={a.key} className="mb-4 flex">
                            <Card className="shadow-sm border-0 w-full flex flex-col">
                                <CardBody className="flex flex-col flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon size={26} className={`text-${COLOR_TOKEN[a.color]}-500`} />
                                        <h5 className="mb-0 font-bold">{a.title}</h5>
                                    </div>
                                    <p className="text-ink-muted grow">{a.confirmMsg}</p>
                                    <Button
                                        color={a.color}
                                        className="w-full mt-auto font-bold py-2 px-2 whitespace-nowrap"
                                        onClick={() => handleTrigger(a)}
                                        disabled={isTriggering || isPolling}
                                    >
                                        {running || isTriggering ? <Spinner size="sm" /> : a.title}
                                    </Button>
                                </CardBody>
                            </Card>
                        </Col>
                    )
                })}
            </Row>

            <BatchProgressPanel batch={batch} isPolling={isPolling} onStop={stopPolling} />

            {/* Confirmation Modal */}
            <Modal isOpen={!!pendingAction} toggle={handleCancel} centered size="md">
                <ModalHeader toggle={handleCancel} className={`text-${COLOR_TOKEN[pendingAction?.color]}-500 border-bottom`}>
                    Confirm — {pendingAction?.title}
                </ModalHeader>
                <ModalBody>
                    <p className="text-ink-muted mb-4">{pendingAction?.confirmMsg}</p>

                    {needsInvoiceDate && (
                        <div className="mb-4">
                            <Label className="font-semibold text-xs">Invoice Date</Label>
                            <Input
                                type="date"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                                max={todayIso()}
                            />
                        </div>
                    )}

                    <div className="mb-2 font-semibold text-xs">
                        Selected Customers ({selectedCustomers.length}):
                    </div>
                    <div
                        className="border border-line rounded p-2 bg-canvas"
                        style={{ maxHeight: 220, overflowY: "auto" }}
                    >
                        {selectedCustomers.length === 0 ? (
                            <span className="text-ink-muted text-xs">No customers selected</span>
                        ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px" }}>
                                {selectedCustomers.map((c) => (
                                    <div
                                        key={c.value}
                                        className="border border-line rounded px-2 py-1 text-xs truncate bg-surface"
                                        style={{ fontSize: "0.8rem" }}
                                        title={c.label}
                                    >
                                        {c.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button
                        color={pendingAction?.color}
                        onClick={handleConfirm}
                        disabled={selectedCustomers.length === 0 || (needsInvoiceDate && !invoiceDate)}
                    >
                        Yes, Proceed
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default AutomationDashboardTab
