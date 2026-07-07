import React, { useEffect, useMemo, useState } from "react"
import { Button, Card, CardBody, Col, Container, Form, FormGroup, Input, Label, Row, Spinner, Badge } from "reactstrap"
import MainHeaderComp from "../../components/MainHeaderCom"
import SearchableDropdown from "../../components/Common/SearchableDropdown"
import DateRangePicker from "../../components/Common/DateRangePicker"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import usePostApiCall from "../../hooks/usePostApiCall"
import { CORPORATE_BILLING_GENERATE, CORPORATE_BILLING_RUNS, CORPORATE_CUSTOMERS_LIST } from "../../api"
import TableContainer from "../../components/Table/TableContainer"
import ToasterProvider from "../../helpers/ToasterProvider"
import { MdRefresh, MdPlayArrow, MdFileDownload, MdLoop } from "react-icons/md"

const BillingWorking = () => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()
    const { apifunc: fetchCustomers, data: customerData, loading: customersLoading } = useGetApiCall()
    const { apifunc: queueRun, loading: queuing } = usePostApiCall(null, "Billing run queued successfully")
    const { apifunc: fetchRuns, data: runsData, loading: runsLoading } = usePostApiCall() // List runs uses POST
    const { apifunc: apiGet } = useGetApiCall()
    const { apifunc: apiPost } = usePostApiCall()

    const [customers, setCustomers] = useState([])
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [runs, setRuns] = useState([])
    const [processingIds, setProcessingIds] = useState(new Set())
    const [reRunningIds, setReRunningIds] = useState(new Set())

    useEffect(() => {
        fetchCustomers(CORPORATE_CUSTOMERS_LIST)
    }, [])

    useEffect(() => {
        loadRuns()
    }, [selectedCustomer])

    useEffect(() => {
        if (customerData?.user) {
            const formatted = customerData.user
                .filter(ele => ele?.cust_type?.type_of_cust === "Corporate" || ele?.cust_type?.type_of_cust === "Franchise")
                .map(ele => ({
                    name: `${ele?.customer_name || ""} - ${ele?.username}`,
                    id: ele?.id,
                    customer_name: ele?.customer_name,
                    username: ele?.username,
                    value: ele?.id
                }))
            setCustomers(formatted)
        }
    }, [customerData])

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

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "N/A"
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return dateStr
        const dd = String(date.getDate()).padStart(2, '0')
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const yyyy = date.getFullYear()
        let hours = date.getHours()
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12 // format 0 as 12
        const formattedHours = String(hours).padStart(2, '0')
        return `${dd}-${mm}-${yyyy} ${formattedHours}:${minutes}:${seconds} ${ampm}`
    }

    useEffect(() => {
        if (runsData?.result && Array.isArray(runsData.result)) {
            setRuns(runsData.result)
        } else if (runsData?.results) {
            setRuns(runsData.results)
        } else if (Array.isArray(runsData)) {
            setRuns(runsData)
        }
    }, [runsData])

    const loadRuns = async () => {
        const body = selectedCustomer ? { customer_id: selectedCustomer.id } : {}
        await fetchRuns(CORPORATE_BILLING_RUNS, body)
    }

    const handleQueueRun = async () => {
        if (!selectedCustomer || !startDate || !endDate) {
            ErrorToaster("Please select customer and date range")
            return
        }
        const body = {
            user_name: selectedCustomer.customer_name,
            start_date: startDate,
            end_date: endDate
        }
        const result = await queueRun(CORPORATE_BILLING_GENERATE, body)
        if (result) {
            await loadRuns()
            const newRunId = result.id || result.result?.id || (result.results && result.results[0]?.id)
            if (newRunId) {
                handleProcessRun(newRunId)
            }
        }
    }

    const handleReRunFromRow = async (run) => {
        setReRunningIds(prev => new Set(prev).add(run.id))
        try {
            const body = {
                user_name: run.customer_name,
                start_date: run.billing_period_start,
                end_date: run.billing_period_end
            }
            const result = await queueRun(CORPORATE_BILLING_GENERATE, body)
            if (result) {
                await  handleProcessRun(run.id)
                // await loadRuns()
                // const newRunId = result.id || result.result?.id || (result.results && result.results[0]?.id)
                // if (newRunId) {
                //     await handleProcessRun(newRunId)
                // }
            }
        } finally {
            setReRunningIds(prev => {
                const next = new Set(prev)
                next.delete(run.id)
                return next
            })
        }
    }

    const handleRefreshStatus = async (runId) => {
        const response = await apiGet(`${CORPORATE_BILLING_RUNS}${runId}/`)
        if (response?.status === "success" && response.result) {
            setRuns(prev => prev.map(run => run.id === runId ? response.result : run))
            SuccessToaster("Status updated")
        }
    }

    const handleProcessRun = async (runId) => {
        setProcessingIds(prev => new Set(prev).add(runId))
        const response = await apiPost(`${CORPORATE_BILLING_RUNS}${runId}/process/`, {})
        setProcessingIds(prev => {
            const next = new Set(prev)
            next.delete(runId)
            return next
        })
        if (response?.status === "success" && response.result) {
            setRuns(prev => prev.map(run => run.id === runId ? response.result : run))
            SuccessToaster("Processing Done Successfully")
        }
    }

    const handleDownload = (runId) => {
        window.open(`${CORPORATE_BILLING_RUNS}${runId}/download/`, '_blank')
    }

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case "COMPLETED":
            case "GENERATED": return "success"
            case "PROCESSING": return "info"
            case "FAILED": return "danger"
            case "CREATED": return "warning"
            default: return "secondary"
        }
    }

    const columns = useMemo(() => [
        {
            header: "Run ID",
            accessorKey: "id",
        },
        {
            header: "Customer",
            accessorKey: "customer_name",
        },
        {
            header: "Start Date",
            accessorKey: "billing_period_start",
            cell: (cell) => formatDate(cell.getValue())
        },
        {
            header: "End Date",
            accessorKey: "billing_period_end",
            cell: (cell) => formatDate(cell.getValue())
        },
        {
            header: "Shipments",
            accessorKey: "total_shipments",
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (cell) => (
                <Badge color={getStatusColor(cell.getValue())} className="p-2">
                    {cell.getValue()?.toUpperCase() || "N/A"}
                </Badge>
            )
        },
        {
            header: "created_at",
            accessorKey: "created_at",
            cell: (cell) => formatDateTime(cell.getValue())
        },
        {
            header: "Actions",
            cell: (cell) => {
                const run = cell.row.original
                const isProcessing = processingIds.has(run.id)
                const isReRunning = reRunningIds.has(run.id)
                const isGenerated = run.status === "GENERATED" || run.status === "COMPLETED"
                return (
                    <div className="d-flex gap-2 justify-content-center">
                        <Button color="light" size="sm" title="Refresh Status" onClick={() => handleRefreshStatus(run.id)}>
                            <MdRefresh size={18} />
                        </Button>
                        {isGenerated ? (
                            <Button 
                                color="warning" 
                                size="sm" 
                                title="Re-run" 
                                onClick={() => handleReRunFromRow(run)}
                                disabled={isProcessing || isReRunning || run.status === "PROCESSING"}
                                className="text-white"
                            >
                                {isReRunning ? <Spinner size="sm" /> : <MdLoop size={18} />}
                            </Button>
                        ) : (
                            <Button 
                                color="info" 
                                size="sm" 
                                title="Process" 
                                onClick={() => handleProcessRun(run.id)}
                                disabled={isProcessing || isReRunning || run.status === "PROCESSING"}
                            >
                                {isProcessing ? <Spinner size="sm" /> : <MdPlayArrow size={18} />}
                            </Button>
                        )}
                        <Button 
                            color="success" 
                            size="sm" 
                            title="Download Excel" 
                            onClick={() => handleDownload(run.id)}
                            disabled={!isGenerated}
                        >
                            <MdFileDownload size={18} />
                        </Button>
                    </div>
                )
            }
        }
    ], [processingIds])

    return (
        <React.Fragment>
            <div className='page-content py-0 px-0'>
                <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                    <MainHeaderComp title="Billing Working" />
                </div>
                <div className="container-fluid px-3 py-3">
                    <Card className="shadow-sm border-0 mb-4">
                        <CardBody>
                            <h5 className="mb-4 text-primary fw-bold">Queue New Billing Run</h5>
                            <Row className="align-items-end">
                                <Col md={4} className="mb-3">
                                    <Label className="fw-bold">Select Corporate Customer</Label>
                                    <SearchableDropdown
                                        onChange={(val) => setSelectedCustomer(val)}
                                        locations={customers}
                                        placeholder={customersLoading ? "Loading..." : "Search Customer"}
                                        className="w-100"
                                        value={selectedCustomer ? selectedCustomer.name : "select"}
                                    />
                                </Col>
                                <Col md={5} className="mb-3">
                                    <DateRangePicker
                                        startDate={startDate}
                                        endDate={endDate}
                                        onChange={(s, e) => { setStartDate(s); setEndDate(e) }}
                                        label="Date Range"
                                    />
                                </Col>
                                <Col md={3} className="mb-3 d-flex align-items-end">
                                    <Button 
                                        color="primary" 
                                        className="w-100 py-2 fw-bold" 
                                        onClick={handleQueueRun} 
                                        disabled={queuing}
                                    >
                                        {queuing ? <Spinner size="sm" /> : "Queue Run"}
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Card className="shadow-sm border-0">
                        <CardBody className="p-0">
                            <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">Billing Run History</h5>
                                <Button color="secondary" size="sm" onClick={loadRuns} disabled={runsLoading}>
                                    {runsLoading ? <Spinner size="sm" /> : "Refresh Table"}
                                </Button>
                            </div>
                            <TableContainer
                                columns={columns}
                                data={runs || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                SearchPlaceholder="Search by ID or Customer..."
                                pagination="pagination pagination-rounded justify-content-end mb-2"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-hover mb-0"
                            />
                        </CardBody>
                    </Card>
                </div>
            </div>
        </React.Fragment>
    )
}

export default BillingWorking
