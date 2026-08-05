import React, { useEffect, useMemo, useState } from "react"
import { Button, Card, CardBody, Col, Container, Form, FormGroup, Input, Label, Row, Spinner, Badge, Pagination, PaginationItem, PaginationLink } from "@/components/ui"
import MainHeaderComp from "../../components/MainHeaderCom"
import SearchableDropdown from "../../components/Common/SearchableDropdown"
import DateRangeInput from "../../components/Common/DateRangeInput"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import usePostApiCall from "../../hooks/usePostApiCall"
import { CORPORATE_BILLING_SYNC, CORPORATE_BILLING_AUDIT, CORPORATE_CUSTOMERS_LIST, CORPORATE_BILLING_AUDIT_EXCEL } from "../../api"
import TableContainer from "../../components/Table/TableContainer"
import axios from "axios"
import ToasterProvider from "../../helpers/ToasterProvider"
import YMD_DateFormate from "../../helpers/YMD_DateFormate"
import { MdFileDownload } from "react-icons/md"
import Loader from "@/Loaders/Loader";
const ShipmentBilling = () => {
    const { apifunc: fetchCustomers, data: customerData, loading: customersLoading } = useGetApiCall()
    const { apifunc: triggerSync, loading: syncing } = usePostApiCall(null, "Sync successfully")
    const { apifunc: triggerAudit, data: auditData, loading: auditing } = usePostApiCall()

    const [customers, setCustomers] = useState([])
    const [selectedCustomerId, setSelectedCustomerId] = useState("")
    const [selectedRange, setSelectedRange] = useState(() => {
        const start = new Date()
        start.setDate(start.getDate() - 30)
        return { startDate: start, endDate: new Date() }
    })
    const [report, setReport] = useState(null)
    const [exporting, setExporting] = useState(false)
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    useEffect(() => {
        fetchCustomers(CORPORATE_CUSTOMERS_LIST)
    }, [])

    useEffect(() => {
        if (customerData?.user) {
            const formatted = customerData.user
                .filter(ele => ele?.cust_type?.type_of_cust === "Corporate" || ele?.cust_type?.type_of_cust === "Franchise")
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
        if (syncing || auditing || exporting) return
        if (!selectedCustomerId) {
            ErrorToaster("Please select a customer first")
            return
        }
        setReport(null) // Clear previous report before starting new sync
        const { from_date, to_date } = YMD_DateFormate(selectedRange)
        const body = {
            customer_id: selectedCustomerId,
            start_date: from_date,
            end_date: to_date
        }
        const response = await triggerSync(CORPORATE_BILLING_SYNC, body)
        if (response) {
            handleAudit(1)
        }
    }

    const handleAudit = async (page = 1) => {
        if (auditing || syncing || exporting) return
        if (!selectedCustomerId) {
            ErrorToaster("Please select a customer first")
            return
        }
        const { from_date, to_date } = YMD_DateFormate(selectedRange)
        const body = {
            customer_id: selectedCustomerId,
            start_date: from_date,
            end_date: to_date,
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
            const { from_date, to_date } = YMD_DateFormate(selectedRange)
            const body = {
                customer_id: selectedCustomerId,
                start_date: from_date,
                end_date: to_date
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
                {/* No sticky wrapper: MainHeaderComp draws nothing inline, it hands
                    the title to the layout's PageHeader. */}
                <MainHeaderComp title="Shipment Billing" />
                <div className="container-fluid px-4 py-4">
                    <Card className="shadow-sm border-0 mb-6">
                        <CardBody>
                            <Row className="items-end">
                                <Col md={4} className="mb-4 mb-md-0">
                                    <Label className="font-bold">Customer</Label>
                                    <SearchableDropdown
                                        onChange={(val) => setSelectedCustomerId(val?.id || "")}
                                        locations={customers}
                                        placeholder={customersLoading ? "Loading..." : "Select Customer"}
                                        className="w-full"
                                        value={selectedCustomerId ? (customers.find(c => c.id === selectedCustomerId)?.name || "Select Customer") : "select"}
                                    />
                                </Col>
                                <Col md={4} className="mb-4 mb-md-0">
                                    <Label className="font-bold">Date Range</Label>
                                    <DateRangeInput
                                        value={selectedRange}
                                        onChange={setSelectedRange}
                                        isBorder={true}
                                    />
                                </Col>
                                <Col md={4} className="flex justify-end gap-2 items-end">
                                    <Button 
                                        color="primary" 
                                        className="py-1 px-4 font-bold" 
                                        onClick={handleSync} 
                                        disabled={syncing || auditing || exporting}
                                        style={{ fontSize: '0.8rem', minWidth: '80px' }}
                                    >
                                        {syncing ? <><Spinner size="sm" /> ...</> : "Sync"}
                                    </Button>
                                    <Button 
                                        color="success" 
                                        className="py-1 px-4 font-bold" 
                                        onClick={() => handleAudit(1)} 
                                        disabled={syncing || auditing || exporting}
                                        style={{ fontSize: '0.8rem', minWidth: '80px' }}
                                    >
                                        {auditing ? <><Spinner size="sm" /> ...</> : "Audit"}
                                    </Button>
                                    <Button 
                                        color="info" 
                                        className="py-1 px-4 font-bold" 
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
                            <Row className="mb-6 gap-4 flex-nowrap overflow-auto scroll-slim pb-2">
                                <Col md={3}>
                                    <Card className="text-center border-0 shadow-sm bg-brand-500 text-white h-full">
                                        <CardBody className="flex flex-col justify-center py-2">
                                            <h6 className="text-white/70 uppercase mb-1" style={{ fontSize: '0.65rem' }}>Total Missing</h6>
                                            <h4 className="mb-0 font-bold">{report.total_missing}</h4>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center border-0 shadow-sm bg-accent-500 text-ink h-full">
                                        <CardBody className="flex flex-col justify-center py-2">
                                            <h6 className="text-ink/70 uppercase mb-1" style={{ fontSize: '0.65rem' }}>Billing Type</h6>
                                            <h4 className="mb-0 font-bold capitalize" style={{ fontSize: '1.2rem' }}>{report.billing_type}</h4>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col md={6} style={{ minWidth: '400px' }}>
                                    <Card className="border-0 shadow-sm h-full">
                                        <CardBody className="py-2 flex items-center overflow-auto scroll-slim">
                                            <div className="flex justify-around text-center w-full flex-nowrap">
                                                {report.reason_counts && Object.entries(report.reason_counts).map(([key, val]) => (
                                                    <div key={key} className="px-4 border-end last:border-r-0" style={{ minWidth: 'fit-content' }}>
                                                        <h6 className="text-ink-muted text-xs uppercase mb-1" style={{ fontSize: '0.65rem' }}>{key.replace(/_/g, ' ')}</h6>
                                                        <h5 className="mb-0 font-bold">{val}</h5>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Main Results Table */}
                            <Card className="shadow-sm border-0 mb-6">
                                <CardBody className="p-0">
                                    <div className="p-4 bg-canvas border-bottom flex justify-between items-center">
                                        <h5 className="mb-0">Audit Results (Page {report.page})</h5>
                                        <Badge color="secondary" className="p-2">Showing {report.results?.length} records</Badge>
                                    </div>
                                    {auditing ? (
                                        <Loader message="Fetching Audit Data..." fullscreen={false} />
                                    ) : (
                                        <>
                                            <TableContainer
                                                columns={resultColumns}
                                                data={report.results || []}
                                                isGlobalFilter={true}
                                                isPagination={false}
                                                defaultPageSize={100}
                                                SearchPlaceholder="Search results..."
                                                pagination="pagination pagination-rounded justify-content-end mb-2"
                                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                                tableClass="table-hover mb-0"
                                                tableHeight="550px"
                                                isStickyHeader={true}
                                            />
                                            {/* Server-side Pagination Controls */}
                                            <div className="p-4 flex justify-center border-top">
                                                <Pagination size="sm" aria-label="Page navigation example">
                                                    <PaginationItem disabled={report.page <= 1 || auditing}>
                                                        <PaginationLink onClick={() => handleAudit(report.page - 1)}>
                                                            Prev
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                    
                                                    {/* Numeric Page Buttons */}
                                                    {(() => {
                                                        const totalPages = Math.ceil((report.total_missing || 0) / 100);
                                                        const maxVisiblePages = 5;
                                                        let startPage = Math.max(1, report.page - 2);
                                                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                                                        if (endPage - startPage < maxVisiblePages - 1) {
                                                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                                        }

                                                        const pages = [];
                                                        for (let i = startPage; i <= endPage; i++) {
                                                            pages.push(i);
                                                        }

                                                        return (
                                                            <>
                                                                {startPage > 1 && (
                                                                    <>
                                                                        <PaginationItem>
                                                                            <PaginationLink onClick={() => handleAudit(1)}>1</PaginationLink>
                                                                        </PaginationItem>
                                                                        {startPage > 2 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}
                                                                    </>
                                                                )}
                                                                {pages.map(p => (
                                                                    <PaginationItem key={p} active={p === report.page} disabled={auditing}>
                                                                        <PaginationLink onClick={() => handleAudit(p)}>
                                                                            {p}
                                                                        </PaginationLink>
                                                                    </PaginationItem>
                                                                ))}
                                                                {endPage < totalPages && (
                                                                    <>
                                                                        {endPage < totalPages - 1 && <PaginationItem disabled><PaginationLink>...</PaginationLink></PaginationItem>}
                                                                        <PaginationItem>
                                                                            <PaginationLink onClick={() => handleAudit(totalPages)}>{totalPages}</PaginationLink>
                                                                        </PaginationItem>
                                                                    </>
                                                                )}
                                                            </>
                                                        );
                                                    })()}

                                                    <PaginationItem disabled={(report.results?.length < 100) || auditing}>
                                                        <PaginationLink onClick={() => handleAudit(report.page + 1)}>
                                                            Next
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                </Pagination>
                                            </div>
                                        </>
                                    )}
                                </CardBody>
                            </Card>

                            {/* Missing Products Section */}
                            {report.missing_products?.length > 0 && (
                                <Card className="shadow-sm border-0 border-top border-4 border-danger-500">
                                    <CardBody className="p-0">
                                        <div className="p-4 bg-danger-500 text-white flex justify-between items-center">
                                            <h5 className="mb-0 text-white font-size-16">Missing Products Detected</h5>
                                            <Badge color="light" className="text-danger-500 p-2">{report.missing_products.length} AWB(s)</Badge>
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
