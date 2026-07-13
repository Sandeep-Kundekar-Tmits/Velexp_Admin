import React, { useEffect, useMemo, useState } from "react"
import {
    Button, Card, CardBody, Col, Container, Form, FormGroup, Input, Label, Row, Spinner, Badge,
    Nav, NavItem, NavLink, TabContent, TabPane, Table, Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap"
import classnames from "classnames"
import MainHeaderComp from "../../components/MainHeaderCom"
import SearchableDropdown from "../../components/Common/SearchableDropdown"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import usePostApiCall from "../../hooks/usePostApiCall"
import {
    CORPORATE_INVOICE_UPLOAD_PREVIEW,
    CORPORATE_INVOICE_GENERATE,
    CORPORATE_INVOICES_LIST,
    CORPORATE_INVOICE_BASE,
    CORPORATE_CUSTOMERS_LIST,
    GET_ADDRESS
} from "../../api"
import TableContainer from "../../components/Table/TableContainer"
import ToasterProvider from "../../helpers/ToasterProvider"
import { MdFileUpload, MdVisibility, MdFileDownload, MdEdit, MdDelete, MdSave } from "react-icons/md"
import axios from "axios"
import ViewInvoice from "../../components/Invoices/ViewInVoice"

const InvoiceFlow = () => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()
    const { apifunc: fetchCustomers, data: customerData, loading: customersLoading } = useGetApiCall()
    const { apifunc: fetchInvoices, data: invoicesData, loading: invoicesLoading } = usePostApiCall()
    const { apifunc: fetchAddresses, data: addressData } = useGetApiCall()
    const { apifunc: apiGet } = useGetApiCall()
    const { apifunc: apiPost } = usePostApiCall()

    const [activeTab, setActiveTab] = useState("1")
    const [customers, setCustomers] = useState([])
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    // Create mode states
    const [previewData, setPreviewData] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [generating, setGenerating] = useState(false)

    // History mode states
    const [invoices, setInvoices] = useState([])
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
    const [pdfData, setPdfData] = useState(null)
    const [currentInvoice, setCurrentInvoice] = useState(null)
    const [editLoading, setEditLoading] = useState(false)
    
    // Override states
    const [invoiceDate, setInvoiceDate] = useState("")
    const [toGstNo, setToGstNo] = useState("")
    const [fromGstNo, setFromGstNo] = useState("")
    const [toPanNo, setToPanNo] = useState("")
    const [fromPanNo, setFromPanNo] = useState("")
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
    const [companyAddresses, setCompanyAddresses] = useState([])

    useEffect(() => {
        fetchCustomers(CORPORATE_CUSTOMERS_LIST)
        fetchAddresses(GET_ADDRESS)
    }, [])

    useEffect(() => {
        if (customerData?.user) {
            const formatted = customerData.user
                .filter(ele => ele?.cust_type?.type_of_cust === "Corporate" || ele?.cust_type?.type_of_cust === "Franchise")
                .map(ele => ({
                    name: `${ele?.customer_name || ""} - ${ele?.username}`,
                    id: ele?.id,
                    customer_name: ele?.customer_name,
                    value: ele?.id
                }))
            setCustomers(formatted)
        }
    }, [customerData])

    useEffect(() => {
        if (addressData) {
            setCompanyAddresses(addressData)
        }
    }, [addressData])

    useEffect(() => {
        if (activeTab === "2") {
            if (selectedCustomer) {
                loadInvoices()
            } else {
                setInvoices([])
            }
        }
    }, [activeTab, selectedCustomer])

    const loadInvoices = async () => {
        const body = { 
            start_date: startDate,
            end_date: endDate
        }
        if (selectedCustomer) {
            body.customer_id = selectedCustomer.id
        }
        await fetchInvoices(CORPORATE_INVOICES_LIST, body)
    }

    useEffect(() => {
        if (invoicesData?.results) {
            setInvoices(invoicesData.results)
        } else if (Array.isArray(invoicesData)) {
            setInvoices(invoicesData)
        }
    }, [invoicesData])

    const formatPayloadDate = (dateStr) => {
        if (!dateStr) return ""
        const parts = dateStr.split("-")
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}` // YYYY-MM-DD -> DD-MM-YYYY
        }
        return dateStr
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append("upload_file", file)
        
        // Add optional overrides
        if (invoiceDate) formData.append("invoice_date", formatPayloadDate(invoiceDate))
        if (toGstNo) formData.append("to_gst_no", toGstNo)
        if (fromGstNo) formData.append("from_gst_no", fromGstNo)
        if (toPanNo) formData.append("to_pan_no", toPanNo)
        if (fromPanNo) formData.append("from_pan_no", fromPanNo)

        try {
            const response = await axios.post(CORPORATE_INVOICE_UPLOAD_PREVIEW, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            if (response.data) {
                setPreviewData(response.data)
                SuccessToaster("File parsed successfully")
            }
        } catch (error) {
            ErrorToaster(error.response?.data?.msg || error.response?.data?.message || "Error uploading file")
        } finally {
            setUploading(false)
        }
    }

    const handleGenerateInvoice = async () => {
        if (!previewData) return
        setGenerating(true)

        // Helper to ensure YYYY-MM-DD for backend
        const toIsoDate = (d) => {
            if (!d) return d
            if (d.includes("-")) {
                const parts = d.split('-')
                if (parts[0].length === 2) return `${parts[2]}-${parts[1]}-${parts[0]}` // DD-MM-YYYY -> YYYY-MM-DD
            }
            return d
        }

        const body = {
            bills: previewData.bills,
            customer_id: previewData.customer_id,
            invoice_no: previewData.invoice_no,
            invoice_date: invoiceDate ? formatPayloadDate(invoiceDate) : toIsoDate(previewData.invoice_date),
            start_date: toIsoDate(previewData.start_date),
            end_date: toIsoDate(previewData.end_date),
            to_gst_no: toGstNo || previewData.invoice_context?.to_gst_no,
            from_gst_no: fromGstNo || previewData.invoice_context?.from_gst_no,
            to_pan_no: toPanNo || previewData.invoice_context?.to_pan_no,
            from_pan_no: fromPanNo || previewData.invoice_context?.from_pan_no,
            summary: previewData.summary || {},
            invoice_context: previewData.invoice_context || {}
        }

        try {
            const result = await apiPost(CORPORATE_INVOICE_GENERATE, body)
            if (result) {
                if (result.status === "error") {
                    ErrorToaster(`Generation Error: ${result.msg || "Internal Server Error"}`)
                } else {
                    const invData = result.context?.pdf_invoice || result.results || result.pdf_invoice || result
                    if (result.status === "already_exists") {
                        SuccessToaster(result.msg || "Invoice already exists. Opening...")
                        setPdfData(invData)
                    } else {
                        SuccessToaster("Invoice generated successfully")
                        setPdfData(invData)
                    }
                    setIsPdfModalOpen(true)
                    setPreviewData(null)
                    setActiveTab("2")
                }
            }
        } catch (err) {
            ErrorToaster("Network Error: Failed to generate invoice")
        } finally {
            setGenerating(false)
        }
    }

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
        const result = await apiGet(`${CORPORATE_INVOICE_BASE}${invoice.id}/`)
        if (result) {
            setPdfData(result)
            setIsPdfModalOpen(true)
        }
    }

    const handleUpdateInvoice = async () => {
        if (!currentInvoice) return
        const result = await axios.patch(`${CORPORATE_INVOICE_BASE}${currentInvoice.id}/update/`, currentInvoice)
        if (result.data) {
            SuccessToaster("Invoice updated")
            setIsEditModalOpen(false)
            loadInvoices()
        }
    }

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return
        const result = await axios.delete(`${CORPORATE_INVOICE_BASE}${currentInvoice.id}/delete-item/${itemId}/`)
        if (result.status === 204 || result.data) {
            SuccessToaster("Item removed")
            // Refresh detail
            const updated = await apiGet(`${CORPORATE_INVOICE_BASE}${currentInvoice.id}/`)
            setCurrentInvoice(updated)
            loadInvoices()
        }
    }

    const handleDownloadPDF = (id) => {
        window.open(`${CORPORATE_INVOICE_BASE}${id}/download-pdf/`, '_blank')
    }

    const historyColumns = useMemo(() => [
        { header: "Invoice No", accessorKey: "invoice_no" },
        { header: "Customer", accessorKey: "to_name" },
        { 
            header: "Date", 
            accessorKey: "invoice_date", 
            cell: (c) => c.getValue() ? new Date(c.getValue()).toLocaleDateString() : "N/A" 
        },
        { header: "Total Amount", accessorKey: "total_amount", cell: (c) => `₹${c.getValue()?.toLocaleString() || 0}` },
        {
            header: "Period",
            cell: (cell) => {
                const inv = cell.row.original
                if (!inv.from_date || !inv.to_date) return "N/A"
                return `${formatDate(inv.from_date)} - ${formatDate(inv.to_date)}`
            }
        },
        {
            header: "Actions",
            cell: (cell) => {
                const inv = cell.row.original
                return (
                    <div className="d-flex gap-2 justify-content-center">
                        <Button color="info" size="sm" onClick={() => handleEditInvoice(inv)}>
                            <MdEdit size={18} />
                        </Button>
                        <Button color="primary" size="sm" onClick={() => handleViewInvoice(inv)}>
                            <MdVisibility size={18} />
                        </Button>
                        <Button color="success" size="sm" onClick={() => handleDownloadPDF(inv.id)}>
                            <MdFileDownload size={18} />
                        </Button>
                    </div>
                )
            }
        }
    ], [])

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A"
        if (dateStr.includes("-")) {
            const parts = dateStr.split('T')[0].split("-")
            if (parts.length === 3) {
                if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`
                return dateStr
            }
        }
        return dateStr
    }

    const previewColumns = useMemo(() => [
        { header: "AWB No", accessorKey: "awbno" },
        { header: "Date", accessorKey: "date", cell: (c) => formatDate(c.getValue()) },
        { header: "Product", accessorKey: "product" },
        { header: "Consignee", accessorKey: "Consignee" },
        { header: "From PIN", accessorKey: "from_pincode" },
        { header: "To PIN", accessorKey: "to_pincode" },
        { header: "Origin", accessorKey: "orgsc" },
        { header: "Weight", accessorKey: "weight" },
        { header: "Rate", accessorKey: "base_rate" },
        { header: "Freight", accessorKey: "freight_amount" },
        { header: "FSC", accessorKey: "fsc" },
        { header: "Taxes", cell: (c) => {
            const r = c.row.original
            return `C:${r.cgst || 0} S:${r.sgst || 0} I:${r.igst || 0}`
        }},
        { header: "Total", accessorKey: "total", cell: (c) => `₹${c.getValue()?.toFixed(2) || 0}` },
        { header: "Remarks", accessorKey: "remarks" },
    ], [])

    return (
        <React.Fragment>
            <div className='page-content py-0 px-0'>
                <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                    <MainHeaderComp title="Invoice Flow" />
                </div>
                <div className="container-fluid px-3 py-3">
                    <Nav tabs className="nav-tabs-custom nav-success mb-4">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => setActiveTab("1")}
                            >
                                <span className="d-none d-sm-block">Create Invoice</span>
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                            >
                                <span className="d-none d-sm-block">Invoice History</span>
                            </NavLink>
                        </NavItem>
                    </Nav>

                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            {!previewData ? (
                                <Card className="shadow-sm border-0 mb-4">
                                    <CardBody className="p-4">
                                        <h5 className="mb-4 fw-bold">1. Upload Working Excel</h5>

                                        <div className="text-center p-5 border-2 border-dashed rounded bg-soft-light">
                                            <div className="mb-4">
                                                <i className="mdi mdi-file-excel-outline text-success" style={{ fontSize: "5rem" }}></i>
                                            </div>
                                            <h4>Select File</h4>
                                            <p className="text-muted mb-4">Choose the Excel file from Billing Working.</p>
                                            <p className="text-muted small mb-4">
                                                <i className="mdi mdi-information-outline me-1"></i>
                                                You can optionally set Invoice Date, GST &amp; PAN overrides before selecting the file.
                                            </p>
                                            <div className="d-flex justify-content-center">
                                                {/* Hidden file input — triggered from the overrides modal */}
                                                <input
                                                    type="file"
                                                    accept=".xlsx, .xls"
                                                    style={{ display: "none" }}
                                                    id="invoice-upload"
                                                    onChange={handleFileUpload}
                                                    disabled={uploading}
                                                />
                                                <Button
                                                    color="success"
                                                    className="px-5 py-2"
                                                    disabled={uploading}
                                                    onClick={() => setIsOverrideModalOpen(true)}
                                                >
                                                    {uploading
                                                        ? <><Spinner size="sm" className="me-2" /> Uploading...</>
                                                        : <><MdFileUpload size={20} className="me-2" /> Choose Working File</>
                                                    }
                                                </Button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ) : (
                                <div className="animate-fade-in">
                                    <Card className="shadow-sm border-0 mb-4 bg-soft-success border-start border-4 border-success">
                                        <CardBody>
                                            <Row className="align-items-center">
                                                <Col md={8}>
                                                    <h5 className="mb-1 fw-bold text-success">Preview Prepared: {previewData.customer_name}</h5>
                                                    <p className="mb-0 text-muted">Period: {formatDate(previewData.start_date)} to {formatDate(previewData.end_date)} | Total Ships: {previewData.bills?.length || 0}</p>
                                                </Col>
                                                <Col md={4} className="text-md-end mt-3 mt-md-0">
                                                    <Button color="secondary" className="me-2" onClick={() => setPreviewData(null)}>Cancel</Button>
                                                    <Button color="primary" onClick={handleGenerateInvoice} disabled={generating}>
                                                        {generating ? <Spinner size="sm" /> : "Generate Final Invoice"}
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>

                                    <Row className="mb-4">
                                        <Col md={3}>
                                            <Card className="shadow-sm border-0">
                                                <CardBody className="text-center">
                                                    <h6 className="text-muted mb-1">Total Shipments</h6>
                                                    <h4 className="fw-bold">{previewData.summary?.total_shipments || 0}</h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="shadow-sm border-0">
                                                <CardBody className="text-center">
                                                    <h6 className="text-muted mb-1">Freight Amount</h6>
                                                    <h4 className="fw-bold">₹{previewData.summary?.total_freight?.toLocaleString() || 0}</h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="shadow-sm border-0">
                                                <CardBody className="text-center">
                                                    <h6 className="text-muted mb-1">GST Amount</h6>
                                                    <h4 className="fw-bold text-info">₹{previewData.summary?.total_gst?.toLocaleString() || 0}</h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="shadow-sm border-0">
                                                <CardBody className="text-center">
                                                    <h6 className="text-muted mb-1">Grand Total</h6>
                                                    <h4 className="fw-bold text-primary">₹{previewData.summary?.sum_total_amount?.toLocaleString() || 0}</h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>
                                    
                                    {previewData.booking && (
                                        <div className="mb-4">
                                            <h5 className="mb-3 fw-bold text-secondary">Zone-wise Booking Summary</h5>
                                            <Row>
                                                {Object.entries(previewData.booking).map(([zone, data]) => (
                                                    <Col md={3} key={zone} className="mb-3">
                                                        <Card className="border-0 shadow-sm h-100 bg-white">
                                                            <CardBody className="p-3">
                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                    <Badge color={zone === "UNMAPPED" || data.total_amount === 0 ? "danger" : "info"} className="px-2 py-1">
                                                                        {zone}
                                                                    </Badge>
                                                                    <span className="text-muted small fw-bold">{data.count} Ships</span>
                                                                </div>
                                                                <h5 className="mb-0 text-dark fw-bold">₹{data.total_amount?.toLocaleString() || 0}</h5>
                                                                <div className="mt-1 small text-muted">Freight: ₹{data.total_freight?.toLocaleString() || 0}</div>
                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    )}

                                    <Card className="shadow-sm border-0">
                                        <CardBody className="p-0">
                                            <TableContainer
                                                columns={previewColumns}
                                                data={previewData.bills || []}
                                                isGlobalFilter={true}
                                                isPagination={true}
                                                SearchPlaceholder="Filter preview rows..."
                                                pagination="pagination pagination-rounded justify-content-end mb-2"
                                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                                tableClass="table-hover mb-0"
                                            />
                                        </CardBody>
                                    </Card>
                                </div>
                            )}
                        </TabPane>

                        <TabPane tabId="2">
                            <Card className="shadow-sm border-0 mb-4">
                                <CardBody>
                                    <Row className="align-items-end">
                                        <Col md={4}>
                                            <Label className="fw-bold">Filter by Customer</Label>
                                            <SearchableDropdown
                                                onChange={(val) => setSelectedCustomer(val)}
                                                locations={customers}
                                                placeholder={customersLoading ? "Loading..." : "All Customers"}
                                                className="w-100"
                                                value={selectedCustomer ? selectedCustomer.name : "select"}
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Label className="fw-bold">Start Date</Label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                max={endDate || new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Label className="fw-bold">End Date</Label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                min={startDate}
                                                max={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Button color="primary" block onClick={loadInvoices} disabled={invoicesLoading}>
                                                {invoicesLoading ? <Spinner size="sm" /> : "Refresh"}
                                            </Button>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm border-0">
                                <CardBody className="p-0">
                                    <TableContainer
                                        columns={historyColumns}
                                        data={invoices || []}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        SearchPlaceholder="Search invoices..."
                                        pagination="pagination pagination-rounded justify-content-end mb-2"
                                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                                        tableClass="table-hover mb-0"
                                    />
                                </CardBody>
                            </Card>
                        </TabPane>
                    </TabContent>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} toggle={() => setIsEditModalOpen(false)} size="xl" centered>
                <ModalHeader toggle={() => setIsEditModalOpen(false)}>
                    Invoice Details - {currentInvoice?.invoice_no || currentInvoice?.invoice_number}
                </ModalHeader>
                <ModalBody>
                    {currentInvoice && (
                        <Container fluid>
                            {/* Invoice Meta Section */}
                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-primary">Invoice Metadata</h6>
                            <Row className="mb-3">
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Invoice No</Label>
                                        <Input 
                                            type="text" 
                                            value={currentInvoice.invoice_no || ""} 
                                            onChange={(e) => setCurrentInvoice({...currentInvoice, invoice_no: e.target.value})}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Invoice Date</Label>
                                        <Input 
                                            type="date" 
                                            value={currentInvoice.invoice_date?.split('T')[0] || ""} 
                                            onChange={(e) => setCurrentInvoice({...currentInvoice, invoice_date: e.target.value})}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From Date</Label>
                                        <Input 
                                            type="date" 
                                            value={currentInvoice.from_date?.split('T')[0] || ""} 
                                            onChange={(e) => setCurrentInvoice({...currentInvoice, from_date: e.target.value})}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To Date</Label>
                                        <Input 
                                            type="date" 
                                            value={currentInvoice.to_date?.split('T')[0] || ""} 
                                            onChange={(e) => setCurrentInvoice({...currentInvoice, to_date: e.target.value})}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Status</Label>
                                        <Input 
                                            type="select" 
                                            value={currentInvoice.status || "PENDING"} 
                                            onChange={(e) => setCurrentInvoice({...currentInvoice, status: e.target.value})}
                                        >
                                            <option value="PENDING">PENDING</option>
                                            <option value="PAID">PAID</option>
                                            <option value="CANCELLED">CANCELLED</option>
                                        </Input>
                                    </FormGroup>
                                </Col>
                            </Row>

                            {/* From Section */}
                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-primary mt-4">Sender Details (From)</h6>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From Name</Label>
                                        <Input 
                                            type="text" 
                                            value={currentInvoice.from_name || ""} 
                                            onChange={(e) => setCurrentInvoice({...currentInvoice, from_name: e.target.value})}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From Address</Label>
                                        <Input 
                                            type="textarea" 
                                            rows={1}
                                            value={currentInvoice.from_address || ""} 
                                            onChange={(e) => setCurrentInvoice({...currentInvoice, from_address: e.target.value})}
                                        />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From City</Label>
                                        <Input type="text" value={currentInvoice.from_city || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, from_city: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From State</Label>
                                        <Input type="text" value={currentInvoice.from_state || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, from_state: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From PIN</Label>
                                        <Input type="text" value={currentInvoice.from_pincode || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, from_pincode: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From State-Code</Label>
                                        <Input type="text" value={currentInvoice.from_state_code || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, from_state_code: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Batch ID</Label>
                                        <Input type="text" value={currentInvoice.batch_id || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, batch_id: e.target.value})} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From GST No</Label>
                                        <Input type="text" value={currentInvoice.from_gst_no || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, from_gst_no: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">From PAN No</Label>
                                        <Input type="text" value={currentInvoice.from_pan_no || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, from_pan_no: e.target.value})} />
                                    </FormGroup>
                                </Col>
                            </Row>

                            {/* To Section */}
                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-primary mt-4">Recipient Details (To)</h6>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To Name</Label>
                                        <Input type="text" value={currentInvoice.to_name || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, to_name: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To Address</Label>
                                        <Input type="textarea" rows={1} value={currentInvoice.to_address || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, to_address: e.target.value})} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To City</Label>
                                        <Input type="text" value={currentInvoice.to_city || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, to_city: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To State</Label>
                                        <Input type="text" value={currentInvoice.to_state || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, to_state: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To PINCODE</Label>
                                        <Input type="text" value={currentInvoice.to_pincode || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, to_pincode: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To State-Code</Label>
                                        <Input type="text" value={currentInvoice.to_state_code || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, to_state_code: e.target.value})} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To GST No</Label>
                                        <Input type="text" value={currentInvoice.to_gst_no || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, to_gst_no: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="small fw-bold">To PAN No</Label>
                                        <Input type="text" value={currentInvoice.to_pan_no || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, to_pan_no: e.target.value})} />
                                    </FormGroup>
                                </Col>
                            </Row>

                            {/* Summary Section */}
                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-primary mt-4">Financial Summary</h6>
                            <Row className="mb-3">
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Total Qty</Label>
                                        <Input type="number" value={currentInvoice.total_quantity || 0} onChange={(e) => setCurrentInvoice({...currentInvoice, total_quantity: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Total Freight</Label>
                                        <Input type="number" value={currentInvoice.total_freight || 0} onChange={(e) => setCurrentInvoice({...currentInvoice, total_freight: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">CGST</Label>
                                        <Input type="number" value={currentInvoice.total_cgst || 0} onChange={(e) => setCurrentInvoice({...currentInvoice, total_cgst: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">SGST</Label>
                                        <Input type="number" value={currentInvoice.total_sgst || 0} onChange={(e) => setCurrentInvoice({...currentInvoice, total_sgst: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">IGST</Label>
                                        <Input type="number" value={currentInvoice.total_igst || 0} onChange={(e) => setCurrentInvoice({...currentInvoice, total_igst: e.target.value})} />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Grand Total</Label>
                                        <Input type="number" value={currentInvoice.total_amount || 0} onChange={(e) => setCurrentInvoice({...currentInvoice, total_amount: e.target.value})} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row className="mb-4">
                                <Col md={12}>
                                    <FormGroup>
                                        <Label className="small fw-bold">Amount In Words</Label>
                                        <Input type="text" value={currentInvoice.amount_in_words || ""} onChange={(e) => setCurrentInvoice({...currentInvoice, amount_in_words: e.target.value})} />
                                    </FormGroup>
                                </Col>
                            </Row>

                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-primary mt-4">Invoice Origins/Items</h6>
                            <div className="table-responsive" style={{ maxHeight: "400px" }}>
                                <Table striped bordered hover size="sm">
                                    <thead className="table-light sticky-top text-center">
                                        <tr>
                                            <th style={{ width: "15%" }}>Origin</th>
                                            <th style={{ width: "15%" }}>Shipments</th>
                                            <th style={{ width: "15%" }}>Freight</th>
                                            <th style={{ width: "12%" }}>CGST</th>
                                            <th style={{ width: "12%" }}>SGST</th>
                                            <th style={{ width: "12%" }}>IGST</th>
                                            <th style={{ width: "15%" }}>Total</th>
                                            <th style={{ width: "4%" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentInvoice.items?.map((item, idx) => (
                                            <tr key={item.id || idx}>
                                                <td>
                                                    <Input 
                                                        type="text" 
                                                        bsSize="sm"
                                                        className="text-center"
                                                        value={item.origin || ""} 
                                                        onChange={(e) => {
                                                            const newItems = [...currentInvoice.items];
                                                            newItems[idx].origin = e.target.value;
                                                            setCurrentInvoice({...currentInvoice, items: newItems});
                                                        }} 
                                                    />
                                                </td>
                                                <td>
                                                    <Input 
                                                        type="number" 
                                                        bsSize="sm"
                                                        className="text-center"
                                                        value={item.shipments || 0} 
                                                        onChange={(e) => {
                                                            const newItems = [...currentInvoice.items];
                                                            newItems[idx].shipments = parseFloat(e.target.value) || 0;
                                                            setCurrentInvoice({...currentInvoice, items: newItems});
                                                        }} 
                                                    />
                                                </td>
                                                <td>
                                                    <Input 
                                                        type="number" 
                                                        bsSize="sm"
                                                        className="text-center"
                                                        value={item.freight || 0} 
                                                        onChange={(e) => {
                                                            const newItems = [...currentInvoice.items];
                                                            newItems[idx].freight = parseFloat(e.target.value) || 0;
                                                            // Recalculate row total
                                                            newItems[idx].total = (parseFloat(e.target.value) || 0) + (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
                                                            setCurrentInvoice({...currentInvoice, items: newItems});
                                                        }} 
                                                    />
                                                </td>
                                                <td>
                                                    <Input 
                                                        type="number" 
                                                        bsSize="sm"
                                                        className="text-center text-info"
                                                        value={item.cgst || 0} 
                                                        onChange={(e) => {
                                                            const newItems = [...currentInvoice.items];
                                                            newItems[idx].cgst = parseFloat(e.target.value) || 0;
                                                            newItems[idx].total = (item.freight || 0) + (parseFloat(e.target.value) || 0) + (item.sgst || 0) + (item.igst || 0);
                                                            setCurrentInvoice({...currentInvoice, items: newItems});
                                                        }} 
                                                    />
                                                </td>
                                                <td>
                                                    <Input 
                                                        type="number" 
                                                        bsSize="sm"
                                                        className="text-center text-info"
                                                        value={item.sgst || 0} 
                                                        onChange={(e) => {
                                                            const newItems = [...currentInvoice.items];
                                                            newItems[idx].sgst = parseFloat(e.target.value) || 0;
                                                            newItems[idx].total = (item.freight || 0) + (item.cgst || 0) + (parseFloat(e.target.value) || 0) + (item.igst || 0);
                                                            setCurrentInvoice({...currentInvoice, items: newItems});
                                                        }} 
                                                    />
                                                </td>
                                                <td>
                                                    <Input 
                                                        type="number" 
                                                        bsSize="sm"
                                                        className="text-center text-info"
                                                        value={item.igst || 0} 
                                                        onChange={(e) => {
                                                            const newItems = [...currentInvoice.items];
                                                            newItems[idx].igst = parseFloat(e.target.value) || 0;
                                                            newItems[idx].total = (item.freight || 0) + (item.cgst || 0) + (item.sgst || 0) + (parseFloat(e.target.value) || 0);
                                                            setCurrentInvoice({...currentInvoice, items: newItems});
                                                        }} 
                                                    />
                                                </td>
                                                <td>
                                                    <Input 
                                                        type="number" 
                                                        bsSize="sm"
                                                        className="text-center fw-bold text-primary"
                                                        value={item.total || 0} 
                                                        onChange={(e) => {
                                                            const newItems = [...currentInvoice.items];
                                                            newItems[idx].total = parseFloat(e.target.value) || 0;
                                                            setCurrentInvoice({...currentInvoice, items: newItems});
                                                        }} 
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <Button color="danger" size="sm" outline onClick={() => handleDeleteItem(item.id)}>
                                                        <MdDelete size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Container>
                    )}
                </ModalBody>
                <ModalFooter>
                    <div className="me-auto text-muted small">
                        * Row totals are calculated automatically when freight/GST changes.
                    </div>
                    <Button color="secondary" onClick={() => setIsEditModalOpen(false)}>Close</Button>
                    <Button color="primary" onClick={handleUpdateInvoice}>
                        <MdSave size={18} className="me-2" /> Save Changes
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Overrides Modal — shown before file picker */}
            <Modal
                isOpen={isOverrideModalOpen}
                toggle={() => setIsOverrideModalOpen(false)}
                size="lg"
                centered
            >
                <ModalHeader toggle={() => setIsOverrideModalOpen(false)}>
                    <span className="fw-bold">
                        <i className="mdi mdi-tune-variant me-2 text-primary"></i>
                        Optional Overrides
                    </span>
                </ModalHeader>
                <ModalBody>
                    <p className="text-muted mb-4">
                        All fields below are <strong>optional</strong>. If left empty, values from the Excel file will be used.
                        Fill in any field you want to override, then click <strong>Continue &amp; Select File</strong>.
                    </p>

                    <Row className="mb-2">
                        <Col md={4}>
                            <FormGroup>
                                <Label className="fw-bold small">
                                    <i className="mdi mdi-calendar-outline me-1 text-primary"></i>
                                    Custom Invoice Date
                                    <span className="text-muted fw-normal ms-1">(optional)</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <hr className="my-3" />
                    <h6 className="fw-bold text-secondary mb-3">GST Numbers</h6>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label className="fw-bold small">
                                    From GST No
                                    <span className="text-muted fw-normal ms-1">(optional)</span>
                                </Label>
                                <Input
                                    type="select"
                                    value={fromGstNo}
                                    onChange={(e) => setFromGstNo(e.target.value)}
                                >
                                    <option value="">Select From GST (Optional)</option>
                                    {companyAddresses.map((addr) => (
                                        <option key={addr.id} value={addr.gst_no}>
                                            {addr.state} | {addr.gst_no}
                                        </option>
                                    ))}
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label className="fw-bold small">
                                    To GST No
                                    <span className="text-muted fw-normal ms-1">(optional)</span>
                                </Label>
                                <Input
                                    type="text"
                                    placeholder="Leave empty to use Excel value"
                                    value={toGstNo}
                                    onChange={(e) => setToGstNo(e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <hr className="my-3" />
                    {/* <h6 className="fw-bold text-secondary mb-3">PAN Numbers</h6> */}
                    {/* <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label className="fw-bold small">
                                    From PAN No
                                    <span className="text-muted fw-normal ms-1">(optional)</span>
                                </Label>
                                <Input
                                    type="text"
                                    placeholder="Leave empty to use Excel value"
                                    value={fromPanNo}
                                    onChange={(e) => setFromPanNo(e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label className="fw-bold small">
                                    To PAN No
                                    <span className="text-muted fw-normal ms-1">(optional)</span>
                                </Label>
                                <Input
                                    type="text"
                                    placeholder="Leave empty to use Excel value"
                                    value={toPanNo}
                                    onChange={(e) => setToPanNo(e.target.value)}
                                />
                            </FormGroup>
                        </Col>
                    </Row> */}
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="secondary"
                        outline
                        onClick={() => {
                            // Clear overrides and close without selecting
                            setInvoiceDate("")
                            setFromGstNo("")
                            setToGstNo("")
                            setFromPanNo("")
                            setToPanNo("")
                            setIsOverrideModalOpen(false)
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="success"
                        className="px-4"
                        onClick={() => {
                            setIsOverrideModalOpen(false)
                            // Small delay so modal closes before file picker opens
                            setTimeout(() => {
                                const input = document.getElementById("invoice-upload")
                                if (input) {
                                    input.value = "" // reset so same file can be re-selected
                                    input.click()
                                }
                            }, 150)
                        }}
                    >
                        <MdFileUpload size={18} className="me-2" />
                        Continue &amp; Select File
                    </Button>
                </ModalFooter>
            </Modal>

            {/* PDF Preview Modal using shared component — client-rendered download, no download-pdf API call */}
            <ViewInvoice
                isOpen={isPdfModalOpen}
                toggle={() => setIsPdfModalOpen(false)}
                invoiceData={pdfData}
            />
        </React.Fragment>
    )
}

export default InvoiceFlow
