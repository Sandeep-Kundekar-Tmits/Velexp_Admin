import React, { useEffect, useMemo, useState } from "react"
import { Button, Card, CardBody, Col, Container, Form, FormGroup, Input, Label, Row, Spinner, Badge } from "reactstrap"
import MainHeaderComp from "../../components/MainHeaderCom"
import SearchableDropdown from "../../components/Common/SearchableDropdown"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import usePostApiCall from "../../hooks/usePostApiCall"
import { CORPORATE_BILLING_SYNC, CORPORATE_BILLING_AUDIT, CORPORATE_CUSTOMERS_LIST, CORPORATE_BILLING_AUDIT_EXCEL } from "../../api"
import TableContainer from "../../components/Table/TableContainer"
import axios from "axios"
import ToasterProvider from "../../helpers/ToasterProvider"
import { MdFileDownload } from "react-icons/md"

const ShipmentBilling = () => {
    const { apifunc: fetchCustomers, data: customerData, loading: customersLoading } = useGetApiCall()
    const { apifunc: triggerSync, loading: syncing } = usePostApiCall(null, "Sync triggered successfully")
    const { apifunc: triggerAudit, data: auditData, loading: auditing } = usePostApiCall()

    const [customers, setCustomers] = useState([])
    const [selectedCustomerId, setSelectedCustomerId] = useState("")
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [report, setReport] = useState(null)
    const [exporting, setExporting] = useState(false)
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    useEffect(() => {
        fetchCustomers(CORPORATE_CUSTOMERS_LIST)
    }, [])

    useEffect(() => {
        if (customerData?.user) {
            const formatted = customerData.user
                .filter(ele => ele?.cust_type?.type_of_cust === "Corporate")
                .map(ele => ({
                    name: `${ele?.customer_name || ""} - ${ele?.username}`,
                    id: ele?.id,
                    value: ele?.id
                }))
            setCustomers(formatted)
        }
    }, [customerData])

    useEffect(() => {
        if (auditData) {
            setReport(auditData)
        }
    }, [auditData])

    const handleSync = async () => {
        if (!selectedCustomerId) {
            alert("Please select a customer first")
            return
        }
        setReport(null) // Clear previous report before starting new sync
        const body = {
            customer_id: selectedCustomerId,
            start_date: startDate,
            end_date: endDate
        }
        const response = await triggerSync(CORPORATE_BILLING_SYNC, body)
        if (response) {
            handleAudit(1)
        }
    }

    const handleAudit = async (page = 1) => {
        if (!selectedCustomerId) {
            alert("Please select a customer first")
            return
        }
        const body = {
            customer_id: selectedCustomerId,
            start_date: startDate,
            end_date: endDate,
            page: page,
            page_size: 100
        }
        await triggerAudit(CORPORATE_BILLING_AUDIT, body)
    }


    const handleAuditExcelDownload = async () => {
        if (!selectedCustomerId) {
            ErrorToaster("Please select a customer first")
            return
        }
        setExporting(true)
        try {
            const body = {
                customer_id: selectedCustomerId,
                start_date: startDate,
                end_date: endDate
            }
            const res = await axios.post(CORPORATE_BILLING_AUDIT_EXCEL, body, {
                headers: { "Content-Type": "application/json" },
                responseType: "blob",
                withCredentials: true
            })
            
            const customerName = customers.find(c => c.id === selectedCustomerId)?.name?.split('-')[0]?.trim() || "Customer"
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `Full_Audit_Report_${customerName}_${new Date().toISOString().split('T')[0]}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            SucceesToaster("Export started")
        } catch (err) {
            ErrorToaster(err.response?.data?.message || "Export failed")
        } finally {
            setExporting(false)
        }
    }

    const resultColumns = useMemo(() => [
        {
            header: "AWB",
            accessorKey: "awb",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Date",
            accessorKey: "booking_date",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Product",
            accessorKey: "product_name",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Weight (C)",
            accessorKey: "chargeable_weight",
            cell: (cell) => cell.getValue() || "0"
        },
        {
            header: "Reason",
            accessorKey: "reason",
            cell: (cell) => (
                <Badge color="danger" className="p-2">
                    {cell.getValue()?.replace(/_/g, ' ').toUpperCase() || "UNKNOWN"}
                </Badge>
            )
        },
        {
            header: "Origin",
            accessorKey: "origin_pincode",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Dest",
            accessorKey: "dest_pincode",
            cell: (cell) => cell.getValue() || "N/A"
        }
    ], [])

    const missingProductColumns = useMemo(() => [
        {
            header: "AWB",
            accessorKey: "awb",
        },
        {
            header: "Date",
            accessorKey: "booking_date",
        },
        {
            header: "Origin",
            accessorKey: "origin_pincode",
        },
        {
            header: "Dest",
            accessorKey: "dest_pincode",
        }
    ], [])

    return (
        <React.Fragment>
            <div className='page-content py-0 px-0'>
                <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                    <MainHeaderComp title="Shipment Billing" />
                </div>
                <div className="container-fluid px-3 py-3">
                    <Card className="shadow-sm border-0 mb-4">
                        <CardBody>
                            <Row className="align-items-end">
                                <Col md={4} className="mb-3 mb-md-0">
                                    <Label className="fw-bold">Customer</Label>
                                    <SearchableDropdown
                                        onChange={(val) => setSelectedCustomerId(val?.id || "")}
                                        locations={customers}
                                        placeholder={customersLoading ? "Loading..." : "Select Customer"}
                                        className="w-100"
                                        value={selectedCustomerId ? (customers.find(c => c.id === selectedCustomerId)?.name || "Select Customer") : "select"}
                                    />
                                </Col>
                                <Col md={2} className="mb-3 mb-md-0">
                                    <Label className="fw-bold">Start Date</Label>
                                    <Input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)} 
                                    />
                                </Col>
                                <Col md={2} className="mb-3 mb-md-0">
                                    <Label className="fw-bold">End Date</Label>
                                    <Input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)} 
                                    />
                                </Col>
                                <Col md={4} className="d-flex justify-content-end gap-2">
                                    <Button 
                                        color="primary" 
                                        className="py-1 px-3 fw-bold" 
                                        onClick={handleSync} 
                                        disabled={syncing || auditing || exporting}
                                        style={{ fontSize: '0.8rem', minWidth: '80px' }}
                                    >
                                        {syncing ? <><Spinner size="sm" /> ...</> : "Sync"}
                                    </Button>
                                    <Button 
                                        color="success" 
                                        className="py-1 px-3 fw-bold" 
                                        onClick={() => handleAudit(1)} 
                                        disabled={syncing || auditing || exporting}
                                        style={{ fontSize: '0.8rem', minWidth: '80px' }}
                                    >
                                        {auditing ? <><Spinner size="sm" /> ...</> : "Audit"}
                                    </Button>
                                    <Button 
                                        color="info" 
                                        className="py-1 px-3 fw-bold" 
                                        onClick={handleAuditExcelDownload} 
                                        disabled={syncing || auditing || exporting || !report}
                                        style={{ fontSize: '0.8rem', minWidth: '80px' }}
                                    >
                                        {exporting ? <><Spinner size="sm" /> ...</> : <><MdFileDownload /> Excel</>}
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {report && (
                        <div className="animate__animated animate__fadeIn">
                            {/* Summary Cards */}
                            <Row className="mb-4 g-3">
                                <Col md={3}>
                                    <Card className="text-center border-0 shadow-sm bg-primary text-white h-100">
                                        <CardBody className="d-flex flex-column justify-content-center py-2">
                                            <h6 className="text-white-50 text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Total Missing</h6>
                                            <h4 className="mb-0 fw-bold">{report.total_missing}</h4>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center border-0 shadow-sm bg-info text-white h-100">
                                        <CardBody className="d-flex flex-column justify-content-center py-2">
                                            <h6 className="text-white-50 text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Billing Type</h6>
                                            <h4 className="mb-0 fw-bold text-capitalize" style={{ fontSize: '1.2rem' }}>{report.billing_type}</h4>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <CardBody className="py-2 d-flex align-items-center">
                                            <div className="d-flex justify-content-around text-center w-100">
                                                {report.reason_counts && Object.entries(report.reason_counts).map(([key, val]) => (
                                                    <div key={key} className="px-3 border-end last-child-border-0">
                                                        <h6 className="text-muted small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>{key.replace(/_/g, ' ')}</h6>
                                                        <h5 className="mb-0 fw-bold">{val}</h5>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Main Results Table */}
                            <Card className="shadow-sm border-0 mb-4">
                                <CardBody className="p-0">
                                    <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">Audit Results (Page {report.page})</h5>
                                        <Badge color="secondary" className="p-2">Showing {report.results?.length} records</Badge>
                                    </div>
                                    <TableContainer
                                        columns={resultColumns}
                                        data={report.results || []}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        SearchPlaceholder="Search results..."
                                        pagination="pagination pagination-rounded justify-content-end mb-2"
                                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                                        tableClass="table-hover mb-0"
                                    />
                                </CardBody>
                            </Card>

                            {/* Missing Products Section */}
                            {report.missing_products?.length > 0 && (
                                <Card className="shadow-sm border-0 border-top border-4 border-danger">
                                    <CardBody className="p-0">
                                        <div className="p-3 bg-danger text-white d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0 text-white font-size-16">Missing Products Detected</h5>
                                            <Badge color="light" className="text-danger p-2">{report.missing_products.length} AWB(s)</Badge>
                                        </div>
                                        <TableContainer
                                            columns={missingProductColumns}
                                            data={report.missing_products}
                                            isGlobalFilter={false}
                                            isPagination={false}
                                            tableClass="table-sm mb-0"
                                        />
                                    </CardBody>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </React.Fragment>
    )
}

export default ShipmentBilling
