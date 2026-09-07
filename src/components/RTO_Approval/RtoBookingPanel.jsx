// Ops "Pending/Booked RTO" screen — view shipments flagged RTO_APPROVAL by CS, pending RTO,
// and already-booked RTO, scoped to a service center. Booking an approved AWB here calls
// /corporate-bulk-booking/ with RTO_booking: true (gated on the CS flag).
import { useEffect, useMemo, useState } from "react"
import { Button, Col, FormGroup, Label, Nav, NavItem, NavLink, Row } from "reactstrap"
import Select from "react-select"
import moment from "moment"
import TableContainer from "../../components/Table/TableContainer"
import DateRangeInput from "../../components/Common/DateRangeInput"
import { customStyles } from "../../helpers/CustomStyle"
import { PENDING_BOOKED_RTO, SERVICE_CENTER } from "../../api"
import usePostApiCall from "../../hooks/usePostApiCall"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import YMD_DateFormate from "../../helpers/YMD_DateFormate"
import BookRtoModal from "./BookRtoModal"

const SUB_TABS = [
    { value: "rto_approved", label: "Approved for RTO" },
    { value: "pending_rto", label: "Pending RTO" },
    { value: "booked_rto", label: "Booked RTO" },
]

const RtoBookingPanel = () => {
    const [selectedSC, setSelectedSC] = useState(null)
    const [scOptions, setScOptions] = useState([])
    const [selectedRange, setSelectedRange] = useState({ startDate: null, endDate: null })
    const [activeSubTab, setActiveSubTab] = useState("rto_approved")
    const [bookRow, setBookRow] = useState(null)

    const { apifunc: GetServiceCenter, data: serviceCenters } = useGetApiCall()
    const { apifunc: LoadRtoLists, data: rtoData, loading } = usePostApiCall()

    useEffect(() => {
        GetServiceCenter(SERVICE_CENTER)
    }, [])

    useEffect(() => {
        if (serviceCenters) {
            setScOptions(serviceCenters.map((sc) => ({ value: sc.ec_code, label: sc.ec_code })))
        }
    }, [serviceCenters])

    const loadList = () => {
        if (!selectedSC) return
        const payload = { service_center: selectedSC.value }
        if (selectedRange.startDate && selectedRange.endDate) {
            const datePayload = YMD_DateFormate(selectedRange)
            payload.from_date = datePayload.from_date
            payload.to_date = datePayload.to_date
        }
        LoadRtoLists(PENDING_BOOKED_RTO, payload)
    }

    const rtoApproved = rtoData?.rto_approved || []
    const pendingRto = rtoData?.pending_rto || []
    const bookedRto = rtoData?.booked_rto || []

    const approvedColumns = useMemo(() => [
        { header: "AWB No.", accessorKey: "awbno" },
        { header: "Remark", accessorKey: "flag_remark" },
        { header: "Flagged By", accessorKey: "flag_updated_by" },
        {
            header: "Flagged At",
            accessorKey: "flag_updated_at",
            cell: ({ row }) => row.original.flag_updated_at
                ? moment(row.original.flag_updated_at).format("DD-MM-YYYY HH:mm")
                : "--",
        },
        { header: "Current Status", accessorKey: "current_status" },
        {
            header: "Action",
            id: "action",
            cell: ({ row }) => (
                <Button
                    color="primary"
                    size="sm"
                    style={{ backgroundColor: "#0066b2", borderColor: "#0066b2", borderRadius: "8px" }}
                    onClick={() => setBookRow(row.original)}
                >
                    Book RTO
                </Button>
            ),
        },
    ], [])

    const pendingColumns = useMemo(() => [
        { header: "AWB No.", accessorKey: "awbno" },
        { header: "Status", accessorKey: "status" },
        {
            header: "Status Date",
            accessorKey: "status_date",
            cell: ({ row }) => row.original.status_date
                ? moment(row.original.status_date).format("DD-MM-YYYY HH:mm")
                : "--",
        },
        { header: "RTO AWB", accessorKey: "RTO_awbno", cell: ({ row }) => row.original.RTO_awbno || "--" },
        { header: "Created By", accessorKey: "created_by" },
    ], [])

    const bookedColumns = useMemo(() => [
        { header: "AWB No.", accessorKey: "awbno" },
        {
            header: "Status Date",
            accessorKey: "status_date",
            cell: ({ row }) => row.original.status_date
                ? moment(row.original.status_date).format("DD-MM-YYYY HH:mm")
                : "--",
        },
        { header: "RTO AWB", accessorKey: "RTO_awbno" },
        { header: "Created By", accessorKey: "created_by" },
    ], [])

    const tabsByValue = {
        rto_approved: { columns: approvedColumns, data: rtoApproved },
        pending_rto: { columns: pendingColumns, data: pendingRto },
        booked_rto: { columns: bookedColumns, data: bookedRto },
    }
    const tabData = tabsByValue[activeSubTab]

    return (
        <div>
            <Row className="mt-3 align-items-end">
                <Col md={4} lg={3}>
                    <FormGroup className="mb-0">
                        <Label className="form-label fw-bold">Service Center</Label>
                        <Select
                            options={scOptions}
                            placeholder="Select Service Center"
                            value={selectedSC}
                            onChange={setSelectedSC}
                            isClearable
                            styles={customStyles}
                        />
                    </FormGroup>
                </Col>
                <Col md={4} lg={3}>
                    <FormGroup className="mb-0">
                        <Label className="form-label fw-bold">Booked-RTO Date Range (optional)</Label>
                        <DateRangeInput
                            value={selectedRange}
                            onChange={setSelectedRange}
                            isBorder={true}
                        />
                    </FormGroup>
                </Col>
                <Col md={2}>
                    <Button
                        color="primary"
                        className="w-100"
                        style={{ height: "38px", marginBottom: "17px" }}
                        onClick={loadList}
                        disabled={!selectedSC}
                    >
                        {loading ? "Checking.." : "Check"}
                    </Button>
                </Col>
            </Row>

            <Nav tabs className="mt-2 mb-2">
                {SUB_TABS.map((tab) => (
                    <NavItem key={tab.value}>
                        <NavLink
                            className={activeSubTab === tab.value ? "active" : ""}
                            style={{ cursor: "pointer" }}
                            onClick={() => setActiveSubTab(tab.value)}
                        >
                            {tab.label}
                            {rtoData && (
                                <span className="badge bg-secondary ms-2">
                                    {tabsByValue[tab.value].data.length}
                                </span>
                            )}
                        </NavLink>
                    </NavItem>
                ))}
            </Nav>

            <div style={{ height: "62vh", overflowY: "auto", overflowX: "hidden" }}>
                <TableContainer
                    columns={tabData.columns}
                    data={tabData.data}
                    isGlobalFilter={true}
                    loading={loading}
                    isPagination={true}
                    SearchPlaceholder="Search across all columns..."
                    pagination="pagination"
                    paginationWrapper='dataTables_paginate paging_simple_numbers'
                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                />
            </div>

            <BookRtoModal
                isOpen={!!bookRow}
                toggle={() => setBookRow(null)}
                awbNumber={bookRow?.awbno || ""}
                onBooked={loadList}
            />
        </div>
    )
}

export default RtoBookingPanel
