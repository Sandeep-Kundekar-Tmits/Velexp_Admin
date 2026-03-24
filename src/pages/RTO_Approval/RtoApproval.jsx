import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, FormGroup, Input, Label, Row } from "reactstrap";
import Select from "react-select";
import MainHeaderComp from "../../components/MainHeaderCom";
import TableContainer from "../../components/Table/TableContainer";
import DateRangeInput from "../../components/Common/DateRangeInput";
import { customStyles } from "../../helpers/CustomStyle";
import RtoApprovalModal from "../../components/RTO_Approval/RtoApprovalModal";
import RtoBulkApprovalModal from "../../components/RTO_Approval/RtoBulkApprovalModal";
import ViewRtoApproval from "../../components/RTO_Approval/ViewRtoApproval";
import { UPDATE_CUSTOMER_SERVICE_REMARK, BULK_RTS_STATUS_UPDATE, GET_USER_API, GET_UNDELIVERED_SHIPMENTS, GET_DELIVERY_ATTEMPTS_REMARKS } from "../../api/index";
import usePostApiCall from "../../hooks/usePostApiCall";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import YMD_DateFormate from "../../helpers/YMD_DateFormate";
import { toast } from "react-toastify";

const RtoApproval = () => {
    // State for managing date range filtering
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null,
    });
    // State to track which modal is currently active (single_approval, bulk_approval, view_approval)
    const [selectedModel, setSelectdModel] = useState("")
    // State to store the currently selected row for single actions
    const [selectedRow, setSelectedRow] = useState(null);
    // State for the customer filter dropdown
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    // List of customer options fetched from the API
    const [userListOptions, setUserListOptions] = useState([])

    // Hook for fetching the customer list
    const { apifunc: GetUserList, data: userListData } = useGetApiCall()
    // Hook for fetching undelivered shipments (now using POST)
    const { apifunc: GetUndeliveredShipments, data: shipmentsData, loading: shipmentsLoading } = usePostApiCall()

    // Load user list on component mount
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
    }, [])

    // Process user list data into dropdown options when API returns
    useEffect(() => {
        if (userListData) {
            const options = userListData
                .filter(ele => {
                    const name = ele?.customer_name?.trim();
                    return name != null && name !== "null" && name !== "undefined" && name !== "";
                })
                .map((ele) => ({
                    value: ele.id,
                    label: ele.customer_name
                }));
            setUserListOptions(options);
        }
    }, [userListData]);

    // Table state for row selections
    const [remarks, setRemarks] = useState({});
    const [rowSelection, setRowSelection] = useState({});

    // Hooks for submitting approval and status updates
    const { apifunc: UpdateRemark } = usePostApiCall(null, "Remark Updated Successfully");
    const { apifunc: BulkRtsUpdate } = usePostApiCall(() => {
        if (!selectedCustomer || !selectedRange.startDate || !selectedRange.endDate) {
            toast.error("Please select both a customer and a date range.");
            return;
        }

        const datePayload = YMD_DateFormate(selectedRange);
        const payload = {
            // customer_id: selectedCustomer.value,
            customer_name: selectedCustomer.label,
            from_date: datePayload.from_date,
            to_date: datePayload.to_date
        };
        GetUndeliveredShipments(GET_UNDELIVERED_SHIPMENTS, payload);
    }, "RTS Status Updated Successfully");

    // List of shipments derived from the API response
    // Only return data if both customer and date range are selected
    const filteredShipments = useMemo(() => {
        if (!selectedCustomer || !selectedRange.startDate || !selectedRange.endDate) {
            return [];
        }
        return shipmentsData?.data || [];
    }, [shipmentsData, selectedCustomer, selectedRange.startDate, selectedRange.endDate]);

    /**
     * Manually fetch undelivered shipments when "Check" is clicked.
     */
    const handleCheck = () => {
        if (!selectedCustomer || !selectedRange.startDate || !selectedRange.endDate) {
            toast.error("Please select both a customer and a date range.");
            return;
        }
        const datePayload = YMD_DateFormate(selectedRange);
        const payload = {
            // customer_id: selectedCustomer.value,
            customer_name: selectedCustomer.label,
            from_date: datePayload.from_date,
            to_date: datePayload.to_date
        };
        GetUndeliveredShipments(GET_UNDELIVERED_SHIPMENTS, payload);
    };

    // Clear row selections whenever filters change
    useEffect(() => {
        setRowSelection({});
    }, [selectedCustomer, selectedRange.startDate, selectedRange.endDate]);

    // Triggered when clicking Approve on a single row
    const handleApprove = (row) => {
        console.log("Approving row:", row);
        setSelectedRow(row);
        setSelectdModel("single_approval")
    };

    /**
     * Handles the final submission for both single and bulk approvals.
     * Orchestrates remark updates followed by optional RTS status updates.
     */
    const handleApproveSubmit = async (data) => {
        const { remark, isRts, shipments } = data;
        const currentAwb = selectedRow?.awbno || "";
        // Normalize AWB list for bulk or single scenario
        const awbList = shipments ? shipments.map(s => s.awbno || "") : [currentAwb];

        try {
            // 1. Update Remark for all selected AWBs
            const remarkPayload = {
                awbno: awbList,
                remark: remark
            };
            await UpdateRemark(UPDATE_CUSTOMER_SERVICE_REMARK, remarkPayload);

            // 2. If 'Mark RTS' is selected, update the status for all AWBs
            if (isRts) {
                const authUser = JSON.parse(localStorage.getItem("authUser"));
                const rtsPayload = {
                    awbno_list: shipments
                        ? shipments.map(s => ({
                            awbno: s.awbno || "",
                            employee_id: authUser?.user?.id,
                            service_center: s.service_center
                        }))
                        : [{
                            awbno: currentAwb,
                            employee_id: authUser?.user?.id,
                            service_center: selectedRow?.service_center
                        }]
                };
                await BulkRtsUpdate(BULK_RTS_STATUS_UPDATE, rtsPayload);
            }
            // Close modal and clear selection on success
            setSelectdModel("");
            setRowSelection({});
        } catch (error) {
            console.error("Approval flow failed:", error);
        }
    };

    // Triggered when clicking View on a row
    const handleView = (row) => {
        console.log("Viewing row:", row);
        setSelectedRow(row);
        setSelectdModel("view_approval");
    };

    // Triggered by the Bulk Approval floating footer button
    const handleBulkApprove = () => {
        const selectedIds = Object.keys(rowSelection);
        console.log("Bulk approving IDs:", selectedIds);
        setSelectdModel("bulk_approval")
    };

    // Clear all row selections
    const handleCancelSelection = () => {
        setRowSelection({});
    };

    const selectedShipments = useMemo(() => {
        return filteredShipments.filter((item, index) => rowSelection[index]);
    }, [rowSelection, filteredShipments]);


    // Configuration for modal types
    const Components = [
        {
            title: "single_approval",
            component: <RtoApprovalModal
                isOpen={true}
                toggle={() => setSelectdModel("")}
                awbNumber={selectedRow?.awbno || ""}
                onApprove={handleApproveSubmit}
            />
        },
        {
            title: "bulk_approval",
            component: <RtoBulkApprovalModal
                isOpen={true}
                toggle={() => setSelectdModel("")}
                selectedShipments={selectedShipments.map(s => ({
                    ...s,
                    awbno: s.awbno || ""
                }))}
                onApprove={handleApproveSubmit}
            />
        },
        {
            title: "view_approval",
            component: <ViewRtoApproval
                isOpen={true}
                toggle={() => setSelectdModel("")}
                awbNumber={selectedRow?.awbno || ""}
                serviceCenter={selectedRow?.service_center}
            />
        }
    ]


    // Helper to render the currently selected modal
    const ReturnComponent = (title) => {
        let comp = Components.find(ele => ele.title === title)
        if (comp) {
            return comp.component
        }
        return <></>
    }

    // Table columns
    const columns = useMemo(() => [
        {
            id: 'selection',
            header: ({ table }) => (
                <div className="d-flex justify-content-center">
                    {selectedCustomer && (
                        <Input
                            type="checkbox"
                            checked={table.getIsAllRowsSelected()}
                            onChange={table.getToggleAllRowsSelectedHandler()}
                        />
                    )}
                </div>
            ),
            cell: ({ row }) => (
                <div className="d-flex justify-content-center">
                    <Input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                </div>
            ),
            size: 50,
        },
        {
            header: "AWB No.",
            accessorKey: "awbno",
        },
        {
            header: "Delivery Attempts",
            accessorKey: "delivery_attempts",
        },
        {
            header: "Action",
            id: "action",
            cell: ({ row }) => (
                <div className="d-flex gap-2">
                    <Button
                        color="primary"
                        size="sm"
                        className="px-3 py-1"
                        style={{ backgroundColor: "#0066b2", borderColor: "#0066b2", borderRadius: "8px" }}
                        onClick={() => handleApprove(row.original)}
                    >
                        Approve
                    </Button>
                    <Button
                        color="secondary"
                        size="sm"
                        className="px-3 py-1"
                        outline
                        style={{ borderRadius: "8px" }}
                        onClick={() => handleView(row.original)}
                    >
                        View
                    </Button>
                </div>
            ),
        },
    ], [selectedCustomer, filteredShipments]);



    const selectedRowCount = Object.keys(rowSelection).length;

    return (
        <div className='page-content py-0 px-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp title="RTO Approval" />
            </div>

            <div className="container-fluid px-3">
                <Row className="mt-3 align-items-end">
                    <Col md={4} lg={3}>
                        <FormGroup className="mb-0">
                            <Label className="form-label fw-bold">Select Customer</Label>
                            <Select
                                options={userListOptions}
                                placeholder="Select Customer"
                                value={selectedCustomer}
                                onChange={(val) => setSelectedCustomer(val)}
                                isClearable={true}
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={4} lg={3}>
                        <FormGroup className="mb-0">
                            <Label className="form-label fw-bold">Select Date Range</Label>
                            <DateRangeInput
                                value={selectedRange}
                                onChange={(range) => setSelectedRange(range)}
                                isBorder={true}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={2}>
                        <Button
                            color="primary"
                            className="w-100"
                            style={{ height: "38px", marginBottom: "17px" }}
                            onClick={handleCheck}
                        >
                            {shipmentsLoading ? "Checking.." : "Check"}
                        </Button>
                    </Col>
                </Row>

                <div className="mt-2" style={{ height: "75vh", overflowY: "auto", overflowX: "hidden" }}>
                    <TableContainer
                        columns={columns}
                        data={filteredShipments}
                        isGlobalFilter={true}
                        loading={shipmentsLoading}
                        isPagination={true}
                        SearchPlaceholder="Search across all columns..."
                        pagination="pagination"
                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                        rowSelection={rowSelection}
                        onRowSelectionChange={setRowSelection}
                    />
                </div>
            </div>

            {
                ReturnComponent(selectedModel)
            }

            {/* Bulk Action Footer */}
            {selectedRowCount > 0 && (
                <div
                    className="position-fixed bottom-0 start-0 w-100 d-flex justify-content-end align-items-center px-4 py-3 bg-white border-top shadow-lg"
                    style={{ zIndex: 1000, gap: "15px" }}
                >
                    <Button
                        color="danger"
                        onClick={handleCancelSelection}
                        style={{ borderRadius: "8px", padding: "8px 25px" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onClick={handleBulkApprove}
                        style={{ backgroundColor: "#0066b2", borderColor: "#0066b2", borderRadius: "8px", padding: "8px 25px" }}
                    >
                        Bulk Approval
                    </Button>
                </div>
            )}
        </div>
    );
};

export default RtoApproval;