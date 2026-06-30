// Tab 1 — the three one-click triggers + live progress panel.
import { useState } from "react"
import { Button, Card, CardBody, Col, Row, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Badge } from "reactstrap"
import { MdSync, MdDescription, MdReceiptLong } from "react-icons/md"
import {
    BILLING_BATCH_SYNC_AUDIT,
    BILLING_BATCH_GENERATE_WORKING,
    BILLING_BATCH_DIRECT_INVOICE,
} from "../../../api"
import BatchProgressPanel from "./BatchProgressPanel"

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

const AutomationDashboardTab = ({ period, selectedCustomers = [], batchCtl }) => {
    const { batch, isPolling, isTriggering, startBatch, stopPolling } = batchCtl
    const [pendingAction, setPendingAction] = useState(null) // { url, title, confirmMsg, color }

    const handleTrigger = (action) => {
        setPendingAction(action)
    }

    const handleConfirm = () => {
        if (!pendingAction) return
        const body = {}
        if (period?.startDate) body.start_date = period.startDate
        if (period?.endDate) body.end_date = period.endDate
        body.customer_ids = selectedCustomers.map((c) => c.value)
        startBatch(pendingAction.url, body)
        setPendingAction(null)
    }

    const handleCancel = () => setPendingAction(null)

    return (
        <div>
            <Row>
                {ACTIONS.map((a) => {
                    const Icon = a.icon
                    const running = isPolling && batch?.batch_type === a.key
                    return (
                        <Col md={4} key={a.key} className="mb-3">
                            <Card className="shadow-sm border-0 h-100">
                                <CardBody className="d-flex flex-column">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <Icon size={26} className={`text-${a.color}`} />
                                        <h5 className="mb-0 fw-bold">{a.title}</h5>
                                    </div>
                                    <p className="text-muted flex-grow-1">{a.confirmMsg}</p>
                                    <Button
                                        color={a.color}
                                        className="w-100 fw-bold py-2"
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
                <ModalHeader toggle={handleCancel} className={`text-${pendingAction?.color} border-bottom`}>
                    Confirm — {pendingAction?.title}
                </ModalHeader>
                <ModalBody>
                    <p className="text-muted mb-3">{pendingAction?.confirmMsg}</p>

                    <div className="mb-2 fw-semibold small">
                        Selected Customers ({selectedCustomers.length}):
                    </div>
                    <div
                        className="border rounded p-2"
                        style={{ maxHeight: 220, overflowY: "auto", backgroundColor: "#f8f9fa" }}
                    >
                        {selectedCustomers.length === 0 ? (
                            <span className="text-muted small">No customers selected</span>
                        ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px" }}>
                                {selectedCustomers.map((c) => (
                                    <div
                                        key={c.value}
                                        className="border rounded px-2 py-1 small text-truncate"
                                        style={{ backgroundColor: "#fff", fontSize: "0.8rem" }}
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
                        disabled={selectedCustomers.length === 0}
                    >
                        Yes, Proceed
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default AutomationDashboardTab
