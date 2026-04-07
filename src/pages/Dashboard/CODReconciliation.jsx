import React, { useEffect, useMemo, useState } from "react"
import { Badge, Button, Card, CardBody, Col, Container, Row, Spinner } from "reactstrap"
import MainHeaderComp from "../../components/MainHeaderCom"
import DateRangeInput from "../../components/Common/DateRangeInput"
import TableContainer from "../../components/Table/TableContainer"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import usePostApiCall from "../../hooks/usePostApiCall"
import ToasterProvider from "../../helpers/ToasterProvider"
import { COD_RECONCILIATION, COD_RECONCILIATION_APPROVE } from "../../api"
import YMD_DateFormate from "../../helpers/YMD_DateFormate"
import { GridLoader } from "react-spinners"
import axios from "axios"
import CODRejectModal from "./CODRejectModal"
import { MdVisibility } from "react-icons/md"
import { MdFileDownload } from "react-icons/md"
import * as XLSX from "xlsx"
import CODViewModal from "./CODViewModal"

const CODReconciliation = () => {
    const [reconciliationData, setReconciliationData] = useState([])
    const [selectedRange, setSelectedRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
    })
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
    const [selectedCODRecord, setSelectedCODRecord] = useState(null)
    const [statusFilter, setStatusFilter] = useState("pending")
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [viewRecord, setViewRecord] = useState(null)

    const { apifunc: getReconciliation, data, loading } = useGetApiCall()
    const { apifunc: postReconciliation, loading: actionLoading } = usePostApiCall()
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (data && data.results) {
            setReconciliationData(data.results)
        }
    }, [data])

    const fetchData = (filter = statusFilter) => {
        const { from_date, to_date } = YMD_DateFormate(selectedRange)
        // Map dropdown values to API status params
        const statusMap = { approved: "success", rejected: "reject", pending: "pending" }
        const statusParam = statusMap[filter] ? `&status=${statusMap[filter]}` : ""
        getReconciliation(`${COD_RECONCILIATION}?from_date=${from_date}&to_date=${to_date}${statusParam}`)
    }

    const exportToExcel = () => {
        if (!reconciliationData || reconciliationData.length === 0) {
            ErrorToaster("No data to export")
            return
        }
        const exportData = reconciliationData.map(r => ({
            "Manifest No.": r.manifests_covered || "N/A",
            "UTR No.": r.utr_number || "N/A",
            "Amount": r.amount_received || 0,
            "Status": r.is_approved ? "Success" : r.dispute_remark ? "Exception" : "Pending",
            "Dispute Remark": r.dispute_remark || "",
        }))
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "COD Reconciliation")
        XLSX.writeFile(wb, `COD_Reconciliation_${new Date().toLocaleDateString('en-GB').split('/').join('-')}.xlsx`)
        SucceesToaster("Exported successfully")
    }

    const handleAction = async (id, action, row) => {
        if (action === 'reject') {
            setSelectedCODRecord(row)
            setIsRejectModalOpen(true)
            return
        }

        try {
            // Using the specific approval endpoint: POST accountant-approval/{id}/approve/
            const url = `${COD_RECONCILIATION_APPROVE}/${id}/approve/`
            const response = await axios.post(url, {})
            if (response.status === 200 || response.status === 201) {
                SucceesToaster(`Successfully approved`)
                fetchData()
            } else {
                ErrorToaster(`Failed to approve`)
            }
        } catch (error) {
            console.error(`Error in approval:`, error)
            ErrorToaster(`Error while approving`)
        }
    }

    const columns = useMemo(
        () => [
            {
                header: "Manifest No.",
                accessorKey: "manifests_covered",
                cell: (cell) => {
                    const value = cell.getValue()
                    const row = cell.row.original
                    const manifests = value ? value.split(",").map(m => m.trim()) : []
                    const displayText = manifests.length > 2
                        ? `${manifests.slice(0, 2).join(", ")} +${manifests.length - 2}`
                        : manifests.join(", ") || "N/A"
                    return (
                        <span
                            className="text-primary fw-semibold"
                            style={{ cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => { setViewRecord(row); setIsViewModalOpen(true) }}
                            title="View Manifest Details"
                        >
                            {displayText}
                        </span>
                    )
                }
            },
            {
                header: "UTR NO.",
                accessorKey: "utr_number",
                cell: (cell) => cell.getValue() || "N/A"
            },
            {
                header: "Amount",
                accessorKey: "amount_received",
                cell: (cell) => cell.getValue()?.toLocaleString() || "0"
            },
            {
                header: "Attachment",
                accessorKey: "photo",
                cell: (cell) => (
                    <div className="d-flex justify-content-center">
                        <Button
                            color="info"
                            size="sm"
                            onClick={() => window.open(cell.getValue(), '_blank')}
                            title="View Image"
                            disabled={!cell.getValue()}
                        >
                            <MdVisibility size={18} />
                        </Button>
                    </div>
                )
            },
            {
                header: "Action",
                accessorKey: "id",
                id: "action",
                cell: (cell) => {
                    const row = cell.row.original
                    if (row.is_approved) {
                        return (
                            <div className="d-flex justify-content-end">
                                <Badge color="primary" className="px-2 py-1" style={{ fontSize: "12px", borderRadius: "4px" }}>
                                    Success
                                </Badge>
                            </div>
                        )
                    }
                    if (row.dispute_remark) {
                        return (
                            <div className="d-flex justify-content-end">
                                <Badge color="warning" className="px-2 py-1 text-dark" style={{ fontSize: "12px", borderRadius: "4px" }}>
                                    Exception
                                </Badge>
                            </div>
                        )
                    }
                    return (
                        <div className="d-flex gap-2 justify-content-end ">
                            <Button
                                color="success"
                                size="sm"
                                onClick={() => handleAction(row.id, 'accept', row)}
                                // disabled={actionLoading || row.is_completed}
                            >
                                Accept
                            </Button>
                            <Button
                                color="danger"
                                size="sm"
                                onClick={() => handleAction(row.id, 'reject', row)}
                                // disabled={actionLoading || row.is_completed}
                            >
                                Reject
                            </Button>
                        </div>
                    )
                }
            }
        ],
        []
    )

    return (
        <div className="page-content py-0 px-0">
            <div className="bg-white sticky-top" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp title="COD Reconciliation" />
            </div>
            
            <Container fluid className="px-3 mt-3">
                <Card className="shadow-sm border-0 mb-4">
                    <CardBody>
                        <Row className="align-items-end">
                            <Col md={4}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Select Date Range</label>
                                    <DateRangeInput
                                        value={selectedRange}
                                        onChange={setSelectedRange}
                                        isBorder={true}
                                    />
                                </div>
                            </Col>
                            <Col md={2}>
                                <div className="mb-3">
                                    <Button
                                        color="primary"
                                        className="w-100"
                                        onClick={fetchData}
                                        disabled={loading}
                                        style={{ height: "38px" }}
                                    >
                                        {loading ? <Spinner size="sm" /> : "Check"}
                                    </Button>
                                </div>
                            </Col>
                            <Col md={2}>
                                <div className="mb-3">
                                    <Button
                                        color="success"
                                        className="w-100 d-flex align-items-center justify-content-center gap-1"
                                        onClick={exportToExcel}
                                        disabled={loading || reconciliationData.length === 0}
                                        style={{ height: "38px" }}
                                    >
                                        <MdFileDownload size={18} /> Export
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                <Card className="shadow-sm border-0">
                    <CardBody className="p-0">
                        {loading ? (
                            <div style={{ height: "40vh" }} className="d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} color="#5b73e8" />
                                <p className="mt-3 text-muted">Fetching reconciliation data...</p>
                            </div>
                        ) : (
                            <TableContainer
                                columns={columns}
                                data={reconciliationData}
                                isGlobalFilter={true}
                                isPagination={true}
                                SearchPlaceholder="Search reconciliation records..."
                                pagination="pagination pagination-rounded justify-content-end mb-2"
                                paginationWrapper="dataTables_paginate paging_simple_numbers"
                                tableClass="table-hover mb-0"
                                extraFiled={null}
                                rightExtraFiled={
                                    <select
                                        className="form-select border-0"
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value)
                                            fetchData(e.target.value)
                                        }}
                                        style={{ height: "34px", minWidth: "130px", fontSize: "13px" }}
                                    >
                                        <option value="all">All</option>
                                        <option value="approved">✅ Approved</option>
                                        <option value="rejected">❌ Rejected</option>
                                        <option value="pending">⏳ Pending</option>
                                    </select>
                                }
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>
            <CODRejectModal
                isOpen={isRejectModalOpen}
                toggle={() => setIsRejectModalOpen(!isRejectModalOpen)}
                data={selectedCODRecord}
                refreshData={fetchData}
            />
            <CODViewModal
                isOpen={isViewModalOpen}
                toggle={() => setIsViewModalOpen(!isViewModalOpen)}
                data={viewRecord}
            />
        </div>
    )
}

export default CODReconciliation
