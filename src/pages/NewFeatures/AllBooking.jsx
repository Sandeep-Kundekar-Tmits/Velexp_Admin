import React, { useState, useEffect, useMemo } from "react"
import {
    Button, Card, CardBody, Col, FormGroup, Label, Row, Spinner, Badge
} from "@/components/ui"
import Select from "react-select"
import MainHeaderComp from "../../components/MainHeaderCom"
import TableContainer from "../../components/Table/TableContainer"
import DateRangeInput from "../../components/Common/DateRangeInput"
import { ALL_BOOKINGS_VIEW, ALL_BOOKINGS_EXPORT, CORPORATE_CUSTOMERS_LIST } from "../../api"
import axios from "axios"
import ToasterProvider from "../../helpers/ToasterProvider"
import { MdSearch, MdFileDownload } from "react-icons/md"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import { customStyles } from "../../helpers/CustomStyle"
import YMD_DateFormate from "../../helpers/YMD_DateFormate"
import { formatDisplayDate } from "../../helpers/formatDisplayDate"

// Format DD-MM-YYYY from a YYYY-MM-DD string for the API
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

const PAGE_SIZE_OPTIONS = [
    { value: 50, label: "50 / page" },
    { value: 100, label: "100 / page" },
    { value: 500, label: "500 / page" },
    { value: 1000, label: "1000 / page" },
]

const ALL_OPTION = { value: "All", label: "All Customers" }

const AllBooking = () => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()
    const { apifunc: fetchCustomers, data: customerListRaw, loading: customersLoading } = useGetApiCall()

    const [selectedCustomer, setSelectedCustomer] = useState(ALL_OPTION)
    const [selectedRange, setSelectedRange] = useState({ startDate: firstOfMonth, endDate: today })
    const [bookings, setBookings] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0].value)
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

    const buildPayload = (page = 1, size = pageSize) => {
        const { from_date, to_date } = YMD_DateFormate(selectedRange)
        return {
            customer_name: selectedCustomer?.value || "All",
            start_date: toApiDate(from_date),
            end_date: toApiDate(to_date),
            page,
            page_size: size,
        }
    }

    const fetchBookings = async (page = 1, size = pageSize) => {
        setLoading(true)
        try {
            const res = await axios.post(ALL_BOOKINGS_VIEW, buildPayload(page, size), {
                headers: { "Content-Type": "application/json" }
            })
            const data = res.data
            // Real shape: { success, items, total_count, page, page_size, total_pages }.
            // Kept the old { results/data, count/total } and flat-array fallbacks too,
            // since nothing here actually confirms the shape never varies by endpoint.
            const items = Array.isArray(data) ? data : (data.items || data.results || data.data || [])
            setBookings(items)
            setTotalCount(data.total_count ?? data.count ?? data.total ?? items.length)
            setTotalPages(data.total_pages || Math.ceil((data.total_count ?? items.length) / size) || 1)
            setCurrentPage(data.page || page)
            setPageSize(data.page_size || size)
            setHasFetched(true)
            SuccessToaster("Bookings loaded successfully")
        } catch (err) {
            ErrorToaster(err.response?.data?.message || err.response?.data?.msg || "Failed to fetch bookings")
        } finally {
            setLoading(false)
        }
    }

    const handlePageSizeChange = (option) => {
        const size = option?.value || PAGE_SIZE_OPTIONS[0].value
        setPageSize(size)
        fetchBookings(1, size)
    }

    const handleExport = async () => {
        setExporting(true)
        try {
            const res = await axios.post(ALL_BOOKINGS_EXPORT, buildPayload(1, 100000), {
                headers: { "Content-Type": "application/json" },
                responseType: "blob",
            })
            const { from_date, to_date } = YMD_DateFormate(selectedRange)
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `bookings_${from_date}_to_${to_date}.xlsx`)
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

    const columns = [
        { header: "#", cell: (c) => ((currentPage - 1) * pageSize) + c.row.index + 1 },
        { header: "AWB No", accessorKey: "awbno", cell: (c) => c.getValue() || "N/A" },
        { header: "AWB Date", accessorKey: "awbdate", cell: (c) => formatDisplayDate(c.getValue()) || c.getValue() || "N/A" },
        { header: "Order No", accessorKey: "orderno", cell: (c) => c.getValue() || "N/A" },
        { header: "Reference No", accessorKey: "ref2", cell: (c) => c.getValue() || "N/A" },
        { header: "Customer", accessorKey: "custname", cell: (c) => c.getValue() || "N/A" },
        { header: "Consignee Name", accessorKey: "ConsigneeName", cell: (c) => c.getValue() || "N/A" },
        { header: "Consignee City", accessorKey: "ConsCity", cell: (c) => c.getValue() || "N/A" },
        { header: "Consignee State", accessorKey: "consstate", cell: (c) => c.getValue() || "N/A" },
        { header: "Billing Pincode", accessorKey: "billing_PINCODE", cell: (c) => c.getValue() || "N/A" },
        { header: "Origin SC", accessorKey: "ORGSC", cell: (c) => c.getValue() || "N/A" },
        { header: "Destination SC", accessorKey: "DestinationSC", cell: (c) => c.getValue() || "N/A" },
        { header: "Origin Pincode", accessorKey: "origin_pincode", cell: (c) => c.getValue() || "N/A" },
        { header: "Vendor Name", accessorKey: "VendorName", cell: (c) => c.getValue() || "N/A" },
        { header: "Vendor Pincode", accessorKey: "vendorpincode", cell: (c) => c.getValue() || "N/A" },
        { header: "Quantity", accessorKey: "Quantity", cell: (c) => c.getValue() ?? "0" },
        { header: "Weight", accessorKey: "weight", cell: (c) => c.getValue() ?? "0" },
        { header: "Vol. Weight", accessorKey: "volumetric_weight", cell: (c) => c.getValue() ?? "0" },
        { header: "Shipment Value", accessorKey: "value", cell: (c) => c.getValue() != null ? `₹${c.getValue()}` : "₹0" },
        { header: "Total Amount", accessorKey: "Totalamount", cell: (c) => c.getValue() != null ? `₹${c.getValue()}` : "₹0" },
        { header: "Freight", accessorKey: "tot_freight", cell: (c) => c.getValue() != null ? `₹${c.getValue()}` : "₹0" },
        { header: "Payment Mode", accessorKey: "paymentmode", cell: (c) => c.getValue() || "N/A" },
        { header: "RTO AWB No", accessorKey: "RTOAWBNO", cell: (c) => c.getValue() || "N/A" },
        { header: "Invoice No", accessorKey: "INVNO", cell: (c) => c.getValue() || "N/A" },
        { header: "EC Code", accessorKey: "eccode", cell: (c) => c.getValue() || "N/A" },
        { header: "Product", accessorKey: "product_name", cell: (c) => c.getValue() || "N/A" },
        {
            header: "Status", accessorKey: "status",
            cell: (c) => {
                const val = c.getValue()
                if (!val) return "N/A"
                const key = String(val).toLowerCase()
                const color = key === "delivered" ? "success" : key === "pending" ? "warning" : key.includes("rto") ? "danger" : "info"
                return <Badge color={color}>{val}</Badge>
            }
        },
    ]

    return (
        <React.Fragment>
            <div className="page-content py-0 px-0">
                {/* No sticky wrapper: MainHeaderComp draws nothing inline, it hands
                    the title to the layout's PageHeader. */}
                <MainHeaderComp title="All Bookings" />
                <div className="container-fluid px-4 py-4">

                    {/* Filter Card */}
                    <Card className="shadow-sm border-0 mb-4">
                        <CardBody className="py-4">
                            <Row className="items-end gap-4">
                                <Col md={3}>
                                    <FormGroup className="mb-0">
                                        <Label className="font-bold text-xs">Customer</Label>
                                        <Select
                                            options={customerOptions}
                                            value={customerOptions.find(o => o.value === selectedCustomer?.value) || ALL_OPTION}
                                            onChange={(val) => setSelectedCustomer(val || ALL_OPTION)}
                                            isLoading={customersLoading}
                                            placeholder="All Customers"
                                            isClearable={false}
                                            styles={customStyles}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup className="mb-0">
                                        <Label className="font-bold text-xs">Date Range</Label>
                                        <DateRangeInput
                                            value={selectedRange}
                                            onChange={setSelectedRange}
                                            isBorder={true}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <div className="flex gap-2">
                                        <Button
                                            color="primary"
                                            className="flex-1"
                                            onClick={() => fetchBookings(1)}
                                            disabled={loading}
                                            id="view-bookings-btn"
                                        >
                                            {loading ? <><Spinner size="sm" className="mr-1" /> Loading...</> : <><MdSearch size={18} className="mr-1" /> View Bookings</>}
                                        </Button>
                                        <Button
                                            color="success"
                                            className="flex-1"
                                            onClick={handleExport}
                                            disabled={exporting}
                                            id="export-bookings-btn"
                                        >
                                            {exporting ? <><Spinner size="sm" className="mr-1" /> Exporting...</> : <><MdFileDownload size={18} className="mr-1" /> Export</>}
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* Results */}
                    {!hasFetched ? (
                        <Card className="shadow-sm border-0">
                            <CardBody className="text-center py-12">
                                <i className="mdi mdi-clipboard-list-outline text-ink-muted" style={{ fontSize: "3rem" }} />
                                <h5 className="text-ink-muted mt-2">Set your filters and click <strong>View Bookings</strong> to load data</h5>
                            </CardBody>
                        </Card>
                    ) : (
                        <Card className="shadow-sm border-0">
                            <CardBody className="p-0">
                                <TableContainer
                                    columns={columns}
                                    data={bookings}
                                    isGlobalFilter={true}
                                    isPagination={false}
                                    SearchPlaceholder="Search bookings..."
                                    tableClass="table-hover mb-0"
                                />
                                <div className="flex justify-between items-center gap-3 px-4 py-2 border-top bg-canvas">
                                    <span className="font-bold text-xs text-ink-muted">
                                        Showing page {currentPage} of {totalPages} &nbsp;|&nbsp; Total: <strong>{totalCount.toLocaleString()}</strong> bookings
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div style={{ width: 130 }}>
                                            <Select
                                                options={PAGE_SIZE_OPTIONS}
                                                value={PAGE_SIZE_OPTIONS.find(o => o.value === pageSize) || PAGE_SIZE_OPTIONS[0]}
                                                onChange={handlePageSizeChange}
                                                isSearchable={false}
                                                styles={customStyles}
                                                menuPortalTarget={document.body}
                                                menuPosition="fixed"
                                            />
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex gap-2">
                                                <Button size="sm" color="secondary" outline disabled={currentPage <= 1} onClick={() => fetchBookings(currentPage - 1)}>
                                                    &laquo; Prev
                                                </Button>
                                                <Button size="sm" color="secondary" outline disabled={currentPage >= totalPages} onClick={() => fetchBookings(currentPage + 1)}>
                                                    Next &raquo;
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>
        </React.Fragment>
    )
}

export default AllBooking
