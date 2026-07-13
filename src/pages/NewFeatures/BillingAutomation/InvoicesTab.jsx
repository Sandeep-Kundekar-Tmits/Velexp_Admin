// Invoices — generated invoice list with view (preview/PDF) and edit.
import { useEffect, useMemo, useState } from "react"
import {
    Button, Card, CardBody, Col, Container, FormGroup, Input, Label,
    Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner, Table,
} from "reactstrap"
import { MdDelete, MdEdit, MdRefresh, MdRemoveRedEye, MdSave } from "react-icons/md"
import axios from "axios"
import TableContainer from "../../../components/Table/TableContainer"
import usePostApiCall from "../../../hooks/usePostApiCall"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import ToasterProvider from "../../../helpers/ToasterProvider"
import ViewInvoice from "../../../components/Invoices/ViewInvoice"
import { CORPORATE_INVOICES_LIST, CORPORATE_INVOICE_BASE } from "../../../api"

const InvoicesTab = () => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()
    const { apifunc: fetchInvoices, loading: invoicesLoading } = usePostApiCall()
    const { apifunc: apiGet } = useGetApiCall()

    const [invoices, setInvoices] = useState([])

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [currentInvoice, setCurrentInvoice] = useState(null)
    const [editLoading, setEditLoading] = useState(false)

    // View/preview modal state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [viewInvoiceData, setViewInvoiceData] = useState(null)
    const [viewBusyId, setViewBusyId] = useState(null)

    const normalizeList = (res) =>
        res?.result || res?.results || (Array.isArray(res) ? res : [])

    const loadInvoices = async () => {
        const res = await fetchInvoices(CORPORATE_INVOICES_LIST, {})
        setInvoices(normalizeList(res))
    }

    useEffect(() => {
        loadInvoices()
    }, [])

    // ── Edit handlers (mirrored from InvoiceFlow) ─────────────────
    const handleEditInvoice = async (invoice) => {
        setEditLoading(true)
        const result = await apiGet(`${CORPORATE_INVOICE_BASE}${invoice.id}/`)
        if (result) {
            setCurrentInvoice(result)
            setIsEditModalOpen(true)
        }
        setEditLoading(false)
    }

    const handleViewInvoice = async (invoice) => {
        setViewBusyId(invoice.id)
        const result = await apiGet(`${CORPORATE_INVOICE_BASE}${invoice.id}/`)
        if (result) {
            setViewInvoiceData(result)
            setIsViewModalOpen(true)
        }
        setViewBusyId(null)
    }

    const handleUpdateInvoice = async () => {
        if (!currentInvoice) return
        try {
            const result = await axios.patch(
                `${CORPORATE_INVOICE_BASE}${currentInvoice.id}/update/`,
                currentInvoice,
                { withCredentials: true }
            )
            if (result.data) {
                SuccessToaster("Invoice updated")
                setIsEditModalOpen(false)
                loadInvoices()
            }
        } catch (err) {
            ErrorToaster(err.response?.data?.message || "Update failed")
        }
    }

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm("Delete this item?")) return
        try {
            const result = await axios.delete(
                `${CORPORATE_INVOICE_BASE}${currentInvoice.id}/delete-item/${itemId}/`,
                { withCredentials: true }
            )
            if (result.status === 204 || result.data) {
                SuccessToaster("Item removed")
                const updated = await apiGet(`${CORPORATE_INVOICE_BASE}${currentInvoice.id}/`)
                setCurrentInvoice(updated)
                loadInvoices()
            }
        } catch (err) {
            ErrorToaster(err.response?.data?.message || "Delete failed")
        }
    }

    const invoiceColumns = useMemo(() => [
        { header: "Invoice No", accessorKey: "invoice_no", cell: (c) => c.getValue() || "—" },
        {
            header: "Invoice Date",
            accessorKey: "invoice_date",
            cell: (c) => {
                const v = c.getValue()
                if (!v) return "—"
                return (
                    <div>
                        <div>{v.slice(0, 10).split("-").reverse().join("-")}</div>
                        <div className="text-muted small">{v.slice(11, 16)}</div>
                    </div>
                )
            },
        },
        { header: "Customer", accessorKey: "customer_name", cell: (c) => c.getValue() || "—" },
        { header: "Amount", accessorKey: "total_amount", cell: (c) => c.getValue() ?? "—" },
        {
            header: "Actions",
            id: "actions",
            cell: (cell) => {
                const inv = cell.row.original
                const viewBusy = viewBusyId === inv.id
                return (
                    <div className="d-flex gap-2 justify-content-center">
                        <Button color="secondary" size="sm" outline title="View Invoice" disabled={viewBusy} onClick={() => handleViewInvoice(inv)}>
                            {viewBusy ? <Spinner size="sm" /> : <MdRemoveRedEye size={16} />}
                        </Button>
                        <Button color="info" size="sm" outline title="Edit Invoice" disabled={editLoading} onClick={() => handleEditInvoice(inv)}>
                            {editLoading ? <Spinner size="sm" /> : <MdEdit size={16} />}
                        </Button>
                    </div>
                )
            },
        },
    ], [editLoading, viewBusyId])

    return (
        <div>
            <Card className="shadow-sm border-0">
                <CardBody className="p-0">
                    <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">Invoices</h5>
                        <Button color="secondary" size="sm" onClick={loadInvoices} disabled={invoicesLoading}>
                            {invoicesLoading ? <Spinner size="sm" /> : <><MdRefresh size={16} /> Refresh</>}
                        </Button>
                    </div>
                    <TableContainer
                        columns={invoiceColumns}
                        data={invoices}
                        isGlobalFilter={true}
                        isPagination={true}
                        SearchPlaceholder="Search invoices..."
                        pagination="pagination pagination-rounded justify-content-end mb-2"
                        paginationWrapper="dataTables_paginate paging_simple_numbers"
                        tableClass="table-hover mb-0"
                    />
                </CardBody>
            </Card>

            {/* ── Edit Invoice Modal (same as InvoiceFlow) ── */}
            <Modal isOpen={isEditModalOpen} toggle={() => setIsEditModalOpen(false)} size="xl" centered>
                <ModalHeader toggle={() => setIsEditModalOpen(false)}>
                    Invoice Details — {currentInvoice?.invoice_no || currentInvoice?.invoice_number}
                </ModalHeader>
                <ModalBody>
                    {currentInvoice && (
                        <Container fluid>
                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-primary">Invoice Metadata</h6>
                            <Row className="mb-3">
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Invoice No</Label>
                                        <Input type="text" value={currentInvoice.invoice_no || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, invoice_no: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Invoice Date</Label>
                                        <Input type="date" value={currentInvoice.invoice_date?.split("T")[0] || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, invoice_date: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From Date</Label>
                                        <Input type="date" value={currentInvoice.from_date?.split("T")[0] || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, from_date: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To Date</Label>
                                        <Input type="date" value={currentInvoice.to_date?.split("T")[0] || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, to_date: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Status</Label>
                                        <Input type="select" value={currentInvoice.status || "PENDING"} onChange={(e) => setCurrentInvoice({ ...currentInvoice, status: e.target.value })}>
                                            <option value="PENDING">PENDING</option>
                                            <option value="PAID">PAID</option>
                                            <option value="CANCELLED">CANCELLED</option>
                                        </Input>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-primary mt-4">Sender Details (From)</h6>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From Name</Label>
                                        <Input type="text" value={currentInvoice.from_name || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, from_name: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From Address</Label>
                                        <Input type="textarea" rows={1} value={currentInvoice.from_address || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, from_address: e.target.value })} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From City</Label>
                                        <Input type="text" value={currentInvoice.from_city || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, from_city: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From State</Label>
                                        <Input type="text" value={currentInvoice.from_state || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, from_state: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From PIN</Label>
                                        <Input type="text" value={currentInvoice.from_pincode || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, from_pincode: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From State-Code</Label>
                                        <Input type="text" value={currentInvoice.from_state_code || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, from_state_code: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Batch ID</Label>
                                        <Input type="text" value={currentInvoice.batch_id || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, batch_id: e.target.value })} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From GST No</Label>
                                        <Input type="text" value={currentInvoice.from_gst_no || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, from_gst_no: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From PAN No</Label>
                                        <Input type="text" value={currentInvoice.from_pan_no || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, from_pan_no: e.target.value })} />
                                    </FormGroup>
                                </Col>
                            </Row>

                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-primary mt-4">Recipient Details (To)</h6>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To Name</Label>
                                        <Input type="text" value={currentInvoice.to_name || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, to_name: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To Address</Label>
                                        <Input type="textarea" rows={1} value={currentInvoice.to_address || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, to_address: e.target.value })} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To City</Label>
                                        <Input type="text" value={currentInvoice.to_city || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, to_city: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To State</Label>
                                        <Input type="text" value={currentInvoice.to_state || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, to_state: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To PINCODE</Label>
                                        <Input type="text" value={currentInvoice.to_pincode || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, to_pincode: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To State-Code</Label>
                                        <Input type="text" value={currentInvoice.to_state_code || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, to_state_code: e.target.value })} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To GST No</Label>
                                        <Input type="text" value={currentInvoice.to_gst_no || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, to_gst_no: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To PAN No</Label>
                                        <Input type="text" value={currentInvoice.to_pan_no || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, to_pan_no: e.target.value })} />
                                    </FormGroup>
                                </Col>
                            </Row>

                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-primary mt-4">Financial Summary</h6>
                            <Row className="mb-3">
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Total Qty</Label>
                                        <Input type="number" value={currentInvoice.total_quantity || 0} onChange={(e) => setCurrentInvoice({ ...currentInvoice, total_quantity: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Total Freight</Label>
                                        <Input type="number" value={currentInvoice.total_freight || 0} onChange={(e) => setCurrentInvoice({ ...currentInvoice, total_freight: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">CGST</Label>
                                        <Input type="number" value={currentInvoice.total_cgst || 0} onChange={(e) => setCurrentInvoice({ ...currentInvoice, total_cgst: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">SGST</Label>
                                        <Input type="number" value={currentInvoice.total_sgst || 0} onChange={(e) => setCurrentInvoice({ ...currentInvoice, total_sgst: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">IGST</Label>
                                        <Input type="number" value={currentInvoice.total_igst || 0} onChange={(e) => setCurrentInvoice({ ...currentInvoice, total_igst: e.target.value })} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Grand Total</Label>
                                        <Input type="number" value={currentInvoice.total_amount || 0} onChange={(e) => setCurrentInvoice({ ...currentInvoice, total_amount: e.target.value })} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row className="mb-4">
                                <Col md={12}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Amount In Words</Label>
                                        <Input type="text" value={currentInvoice.amount_in_words || ""} onChange={(e) => setCurrentInvoice({ ...currentInvoice, amount_in_words: e.target.value })} />
                                    </FormGroup>
                                </Col>
                            </Row>

                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-primary mt-4">Invoice Origins / Items</h6>
                            <div className="table-responsive" style={{ maxHeight: "400px" }}>
                                <Table striped bordered hover size="sm">
                                    <thead className="table-light sticky-top text-center">
                                        <tr>
                                            <th>Origin</th>
                                            <th>Shipments</th>
                                            <th>Freight</th>
                                            <th>CGST</th>
                                            <th>SGST</th>
                                            <th>IGST</th>
                                            <th>Total</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentInvoice.items?.map((item, idx) => (
                                            <tr key={item.id || idx}>
                                                <td><Input type="text" bsSize="sm" className="text-center" value={item.origin || ""} onChange={(e) => { const ni = [...currentInvoice.items]; ni[idx].origin = e.target.value; setCurrentInvoice({ ...currentInvoice, items: ni }) }} /></td>
                                                <td><Input type="number" bsSize="sm" className="text-center" value={item.shipments || 0} onChange={(e) => { const ni = [...currentInvoice.items]; ni[idx].shipments = parseFloat(e.target.value) || 0; setCurrentInvoice({ ...currentInvoice, items: ni }) }} /></td>
                                                <td><Input type="number" bsSize="sm" className="text-center" value={item.freight || 0} onChange={(e) => { const ni = [...currentInvoice.items]; ni[idx].freight = parseFloat(e.target.value) || 0; ni[idx].total = (parseFloat(e.target.value) || 0) + (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0); setCurrentInvoice({ ...currentInvoice, items: ni }) }} /></td>
                                                <td><Input type="number" bsSize="sm" className="text-center text-info" value={item.cgst || 0} onChange={(e) => { const ni = [...currentInvoice.items]; ni[idx].cgst = parseFloat(e.target.value) || 0; ni[idx].total = (item.freight || 0) + (parseFloat(e.target.value) || 0) + (item.sgst || 0) + (item.igst || 0); setCurrentInvoice({ ...currentInvoice, items: ni }) }} /></td>
                                                <td><Input type="number" bsSize="sm" className="text-center text-info" value={item.sgst || 0} onChange={(e) => { const ni = [...currentInvoice.items]; ni[idx].sgst = parseFloat(e.target.value) || 0; ni[idx].total = (item.freight || 0) + (item.cgst || 0) + (parseFloat(e.target.value) || 0) + (item.igst || 0); setCurrentInvoice({ ...currentInvoice, items: ni }) }} /></td>
                                                <td><Input type="number" bsSize="sm" className="text-center text-info" value={item.igst || 0} onChange={(e) => { const ni = [...currentInvoice.items]; ni[idx].igst = parseFloat(e.target.value) || 0; ni[idx].total = (item.freight || 0) + (item.cgst || 0) + (item.sgst || 0) + (parseFloat(e.target.value) || 0); setCurrentInvoice({ ...currentInvoice, items: ni }) }} /></td>
                                                <td><Input type="number" bsSize="sm" className="text-center fw-bold text-primary" value={item.total || 0} onChange={(e) => { const ni = [...currentInvoice.items]; ni[idx].total = parseFloat(e.target.value) || 0; setCurrentInvoice({ ...currentInvoice, items: ni }) }} /></td>
                                                <td className="text-center"><Button color="danger" size="sm" outline onClick={() => handleDeleteItem(item.id)}><MdDelete size={16} /></Button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Container>
                    )}
                </ModalBody>
                <ModalFooter>
                    <span className="me-auto text-muted small">* Row totals recalculate when freight/GST changes.</span>
                    <Button color="secondary" onClick={() => setIsEditModalOpen(false)}>Close</Button>
                    <Button color="primary" onClick={handleUpdateInvoice}>
                        <MdSave size={18} className="me-2" /> Save Changes
                    </Button>
                </ModalFooter>
            </Modal>

            {/* ── View Invoice Preview Modal (same as EditInvoice) — client-rendered download, no download-pdf API call ── */}
            <ViewInvoice
                isOpen={isViewModalOpen}
                toggle={() => setIsViewModalOpen(false)}
                invoiceData={viewInvoiceData}
            />
        </div>
    )
}

export default InvoicesTab
