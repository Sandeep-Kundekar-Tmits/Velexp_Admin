import React, { useState, useEffect, useMemo } from "react"
import {
    Button, Card, CardBody, Col, FormGroup, Label, Row, Spinner, Badge
} from "reactstrap"
import Select from "react-select"
import MainHeaderComp from "../../components/MainHeaderCom"
import TableContainer from "../../components/Table/TableContainer"
import DateRangePicker from "../../components/Common/DateRangePicker"
import { ALL_BOOKINGS_VIEW, ALL_BOOKINGS_EXPORT, CORPORATE_CUSTOMERS_LIST } from "../../api"
import axios from "axios"
import ToasterProvider from "../../helpers/ToasterProvider"
import { MdSearch, MdFileDownload } from "react-icons/md"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import { customStyles } from "../../helpers/CustomStyle"

// Format date from YYYY-MM-DD to DD-MM-YYYY for API
const toApiDate = (dateStr) => {
    if (!dateStr) return ""
    const parts = dateStr.split("-")
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
    return dateStr
}

// Get default dates: first day of current month and today
const today = new Date()
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const fmtInput = (d) => d.toISOString().split("T")[0] // YYYY-MM-DD for <input type="date">

const PAGE_SIZE = 20

const ALL_OPTION = { value: "All", label: "All Customers" }

const AllBooking = () => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()
    const { apifunc: fetchCustomers, data: customerListRaw, loading: customersLoading } = useGetApiCall()

    const [selectedCustomer, setSelectedCustomer] = useState(ALL_OPTION)
    const [startDate, setStartDate] = useState(fmtInput(firstOfMonth))
    const [endDate, setEndDate] = useState(fmtInput(today))
    const [bookings, setBookings] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [hasFetched, setHasFetched] = useState(false)

    useEffect(() => {
        fetchCustomers(CORPORATE_CUSTOMERS_LIST)
    }, [])

    const customerOptions = useMemo(() => {
        if (!customerListRaw?.user) return [ALL_OPTION]
        const corporates = customerListRaw.user
            .filter(ele => ele?.cust_type?.type_of_cust === "Corporate" || ele?.cust_type?.type_of_cust === "Franchise")
            .map(ele => ({ value: ele.customer_name, label: `${ele.customer_name} - ${ele.username}` }))
        return [ALL_OPTION, ...corporates]
    }, [customerListRaw])

    const buildPayload = (page = 1, pageSize = PAGE_SIZE) => ({
        customer_name: selectedCustomer?.value || "All",
        start_date: toApiDate(startDate),
        end_date: toApiDate(endDate),
        page,
        page_size: pageSize,
    })

    const fetchBookings = async (page = 1) => {
        setLoading(true)
        try {
            const res = await axios.post(ALL_BOOKINGS_VIEW, buildPayload(page), {
                headers: { "Content-Type": "application/json" }
            })
            const data = res.data
            // Support both { results, count } and flat array responses
            if (Array.isArray(data)) {
                setBookings(data)
                setTotalCount(data.length)
            } else {
                setBookings(data.results || data.data || [])
                setTotalCount(data.count || data.total || (data.results || []).length)
            }
            setCurrentPage(page)
            setHasFetched(true)
            SuccessToaster("Bookings loaded successfully")
        } catch (err) {
            ErrorToaster(err.response?.data?.message || err.response?.data?.msg || "Failed to fetch bookings")
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        setExporting(true)
        try {
            const res = await axios.post(ALL_BOOKINGS_EXPORT, buildPayload(1, 100000), {
                headers: { "Content-Type": "application/json" },
                responseType: "blob",
            })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `bookings_${toApiDate(startDate)}_to_${toApiDate(endDate)}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            SuccessToaster("Export started")
        } catch (err) {
            ErrorToaster(err.response?.data?.message || "Export failed")
        } finally {
            setExporting(false)
        }
    }

    const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1

    const columns = [
        { header: "#", cell: (c) => ((currentPage - 1) * PAGE_SIZE) + c.row.index + 1 },
        { header: "AWB No", accessorKey: "awbno" },
        { header: "Date", accessorKey: "booking_date", cell: (c) => c.getValue() || "N/A" },
        { header: "Customer", accessorKey: "customer_name", cell: (c) => c.getValue() || "N/A" },
        { header: "Consignee", accessorKey: "consignee_name", cell: (c) => c.getValue() || "N/A" },
        { header: "From", accessorKey: "from_city", cell: (c) => c.getValue() || "N/A" },
        { header: "To", accessorKey: "to_city", cell: (c) => c.getValue() || "N/A" },
        { header: "Weight", accessorKey: "weight", cell: (c) => c.getValue() || "0" },
        { header: "Product", accessorKey: "product", cell: (c) => c.getValue() || "N/A" },
        {
            header: "Status", accessorKey: "status",
            cell: (c) => {
                const val = c.getValue()
                if (!val) return "N/A"
                const color = val === "DELIVERED" ? "success" : val === "PENDING" ? "warning" : "info"
                return <Badge color={color}>{val}</Badge>
            }
        },
        { header: "COD", accessorKey: "cod_amount", cell: (c) => c.getValue() ? `₹${c.getValue()}` : "₹0" },
    ]

    return (
        <React.Fragment>
            <div className="page-content py-0 px-0">
                <div className="bg-white" style={{ position: "sticky", top: "0px", zIndex: 1001, width: "100%" }}>
                    <MainHeaderComp title="All Bookings" />
                </div>
                <div className="container-fluid px-3 py-3">

                    {/* Filter Card */}
                    <Card className="shadow-sm border-0 mb-3">
                        <CardBody className="py-3">
                            <Row className="align-items-end g-3">
                                <Col md={3}>
                                    <FormGroup className="mb-0">
                                        <Label className="fw-bold small">Customer</Label>
                                        <Select
                                            options={customerOptions}
                                            value={customerOptions.find(o => o.value === selectedCustomer?.value) || ALL_OPTION}
                                            onChange={(val) => setSelectedCustomer(val || ALL_OPTION)}
                                            isLoading={customersLoading}
                                            placeholder="All Customers"
                                            isClearable={false}
                                            styles={customStyles}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup className="mb-0">
                                        <DateRangePicker
                                            startDate={startDate}
                                            endDate={endDate}
                                            onChange={(s, e) => { setStartDate(s); setEndDate(e) }}
                                            label="Date Range"
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <div className="d-flex gap-2">
                                        <Button
                                            color="primary"
                                            className="flex-fill"
                                            onClick={() => fetchBookings(1)}
                                            disabled={loading}
                                            id="view-bookings-btn"
                                        >
                                            {loading ? <><Spinner size="sm" className="me-1" /> Loading...</> : <><MdSearch size={18} className="me-1" /> View Bookings</>}
                                        </Button>
                                        <Button
                                            color="success"
                                            className="flex-fill"
                                            onClick={handleExport}
                                            disabled={exporting}
                                            id="export-bookings-btn"
                                        >
                                            {exporting ? <><Spinner size="sm" className="me-1" /> Exporting...</> : <><MdFileDownload size={18} className="me-1" /> Export</>}
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* Results */}
                    {!hasFetched ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center py-5">
                                <i className="mdi mdi-clipboard-list-outline text-muted" style={{ fontSize: "3rem" }} />
                                <h5 className="text-muted mt-2">Set your filters and click <strong>View Bookings</strong> to load data</h5>
                            </CardBody>
                        </Card>
                    ) : (
                        <Card className="shadow-sm border-0">
                            <CardBody className="p-0">
                                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light">
                                    <span className="fw-bold small text-muted">
                                        Showing page {currentPage} of {totalPages} &nbsp;|&nbsp; Total: <strong>{totalCount.toLocaleString()}</strong> bookings
                                    </span>
                                    {totalPages > 1 && (
                                        <div className="d-flex gap-2">
                                            <Button size="sm" color="outline-secondary" disabled={currentPage <= 1} onClick={() => fetchBookings(currentPage - 1)}>
                                                &laquo; Prev
                                            </Button>
                                            <Button size="sm" color="outline-secondary" disabled={currentPage >= totalPages} onClick={() => fetchBookings(currentPage + 1)}>
                                                Next &raquo;
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <TableContainer
                                    columns={columns}
                                    data={bookings}
                                    isGlobalFilter={true}
                                    isPagination={true}
                                    SearchPlaceholder="Search bookings..."
                                    pagination="pagination pagination-rounded justify-content-end mb-2"
                                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                                    tableClass="table-hover table-bordered mb-0"
                                />
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>
        </React.Fragment>
    )
}

export default AllBooking
