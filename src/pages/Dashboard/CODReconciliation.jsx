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

const CODReconciliation = () => {
    const [reconciliationData, setReconciliationData] = useState([])
    const [selectedRange, setSelectedRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
    })
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
    const [selectedCODRecord, setSelectedCODRecord] = useState(null)

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

    const fetchData = () => {
        const { from_date, to_date } = YMD_DateFormate(selectedRange)
        getReconciliation(`${COD_RECONCILIATION}?from_date=${from_date}&to_date=${to_date}`)
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
                    if (!value) return "N/A"
                    const manifests = value.split(",").map(m => m.trim())
                    if (manifests.length > 2) {
                        return `${manifests.slice(0, 2).join(", ")} + ${manifests.length - 2}`
                    }
                    return manifests.join(", ")
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
                        return <span className="text-success fw-bold">Approved</span>
                    }
                    if (row.dispute_remark) {
                        return <span className="text-danger fw-bold">Rejected</span>
                    }
                    return (
                        <div className="d-flex gap-2 justify-content-center ">
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
                                data={reconciliationData || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                SearchPlaceholder="Search reconciliation records..."
                                pagination="pagination pagination-rounded justify-content-end mb-2"
                                paginationWrapper="dataTables_paginate paging_simple_numbers"
                                tableClass="table-hover mb-0"
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
        </div>
    )
}

export default CODReconciliation
