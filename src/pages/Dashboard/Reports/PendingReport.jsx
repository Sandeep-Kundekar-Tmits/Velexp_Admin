import { useCallback, useEffect, useMemo, useState } from "react";
import Select, { components } from "react-select";
import { Button, Col, FormGroup, Label, Row } from "reactstrap";
import { GridLoader } from "react-spinners";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import {
    GET_OPS_PENDING_REPORT,
    DOWNLOAD_OPS_PENDING_REPORT,
    SERVICE_CENTER,
} from "../../../api";
import { customStyles } from "../../../helpers/CustomStyle";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import YMD_DateFormate from "../../../helpers/YMD_DateFormate";

const SELECT_ALL_OPTION = { value: "__all__", label: "Select All" };

// Shows first 2 selected chips then "+N more" badge — same as Velocity-Ops
const SCMultiValue = ({ index, getValue, ...props }) => {
    const total = getValue().length;
    if (index < 2) return <components.MultiValue {...props} />;
    if (index === 2)
        return (
            <span className="badge bg-primary ms-1 align-self-center">
                +{total - 2}
            </span>
        );
    return null;
};

const PendingReport = () => {
    useEffect(() => {
        document.title = "Pending Report";
    }, []);

    // ── Service Centers (all, from API) ────────────────────────────────────
    const { apifunc: getServiceCenters, data: serviceCenterList, loading: scLoading } = useGetApiCall();
    const [scOptions, setScOptions] = useState([]);
    const [selectedSCs, setSelectedSCs] = useState([]);

    useEffect(() => {
        getServiceCenters(SERVICE_CENTER);
    }, []);

    useEffect(() => {
        if (serviceCenterList) {
            const opts = serviceCenterList
                .map((e) => ({ value: e.ec_code, label: e.ec_code }))
                .filter((item, idx, self) => idx === self.findIndex((t) => t.value === item.value));
            setScOptions(opts);
            setSelectedSCs(opts); // pre-select all service centers
        }
    }, [serviceCenterList]);

    const handleSCChange = (chosen) => {
        if (!chosen) { setSelectedSCs([]); return; }
        setSelectedSCs(chosen.some((o) => o.value === "__all__") ? scOptions : chosen);
    };

    // ── Date range: fixed 01-01-2025 → today (picker hidden) ──────────────
    const today = new Date().toISOString().split("T")[0];
    const [selectedRange] = useState({ startDate: "2025-01-01", endDate: today });

    // ── Report data ────────────────────────────────────────────────────────
    const SERVER_PAGE_SIZE = 1000;
    const [reportData, setReportData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const buildPayload = useCallback((page = 1, page_size = SERVER_PAGE_SIZE) => {
        const fmt = YMD_DateFormate(selectedRange);
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        const payload = {
            user_id: authUser?.user?.id,
            page,
            page_size,
            service_center: selectedSCs.map((s) => s.value),
            start_date: fmt.from_date || undefined,
            end_date: fmt.to_date || undefined,
        };
        return payload;
    }, [selectedSCs, selectedRange]);

    const fetchReport = async (page = 1) => {
        if (selectedSCs.length === 0) { alert("Please select at least one Service Center."); return; }
        setLoading(true);
        setReportData([]);
        try {
            const res = await fetch(GET_OPS_PENDING_REPORT, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload(page, SERVER_PAGE_SIZE)),
            });
            if (!res.ok) return;
            const json = await res.json();
            setReportData(Array.isArray(json.shipments) ? json.shipments : []);
            setTotalCount(json.total_shipments ?? 0);
            setCurrentPage(json.page ?? page);
            setTotalPages(json.total_pages ?? 1);
        } catch (err) {
            console.error("Pending report fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = async () => {
        setIsExporting(true);
        try {
            const fmt = YMD_DateFormate(selectedRange);
            const res = await fetch(DOWNLOAD_OPS_PENDING_REPORT, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload(1, 5000)),
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Pending_Report_${fmt.from_date}_${fmt.to_date}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download error:", err);
        } finally {
            setIsExporting(false);
        }
    };

    // ── Columns (same 39 fields as Velocity-Ops, admin TanStack format) ───
    const columns = useMemo(() => [
        { header: "#", accessorKey: "serial_no", enableColumnFilter: false, enableSorting: false },
        { header: "AWB No", accessorKey: "awbno", enableColumnFilter: false, enableSorting: true },
        { header: "AWB Date", accessorKey: "awbdate", enableColumnFilter: false, enableSorting: true },
        { header: "Ref2", accessorKey: "ref2", enableColumnFilter: false, enableSorting: false },
        { header: "Cust Code", accessorKey: "custcode", enableColumnFilter: false, enableSorting: true },
        { header: "Customer", accessorKey: "custname", enableColumnFilter: false, enableSorting: true },
        { header: "Consignee", accessorKey: "consigneename", enableColumnFilter: false, enableSorting: true },
        { header: "Address", accessorKey: "consignee_address", enableColumnFilter: false, enableSorting: false },
        { header: "City", accessorKey: "conscity", enableColumnFilter: false, enableSorting: true },
        { header: "State", accessorKey: "consstate", enableColumnFilter: false, enableSorting: true },
        { header: "Pincode", accessorKey: "pincode", enableColumnFilter: false, enableSorting: true },
        { header: "Payment", accessorKey: "paymentmode", enableColumnFilter: false, enableSorting: true },
        { header: "Value", accessorKey: "value", enableColumnFilter: false, enableSorting: true },
        {
            header: "Status",
            accessorKey: "chkpnt",
            enableColumnFilter: false,
            enableSorting: true,
            cell: (info) => (
                <span className="badge bg-primary-subtle text-primary fw-semibold text-uppercase">
                    {info.getValue() ?? "—"}
                </span>
            ),
        },
        { header: "Status Date", accessorKey: "chkdate", enableColumnFilter: false, enableSorting: true },
        { header: "Time", accessorKey: "time", enableColumnFilter: false, enableSorting: false },
        { header: "SAO Date", accessorKey: "sao_date", enableColumnFilter: false, enableSorting: true },
        { header: "EC Code", accessorKey: "eccode", enableColumnFilter: false, enableSorting: true },
        { header: "Remarks", accessorKey: "remarks", enableColumnFilter: false, enableSorting: false },
        { header: "Origin SC", accessorKey: "orgsc", enableColumnFilter: false, enableSorting: true },
        { header: "Dest SC", accessorKey: "destinationsc", enableColumnFilter: false, enableSorting: true },
        { header: "Employee", accessorKey: "empname", enableColumnFilter: false, enableSorting: true },
        { header: "Emp ID", accessorKey: "empid", enableColumnFilter: false, enableSorting: true },
        { header: "Marked RTO", accessorKey: "marked_for_rto", enableColumnFilter: false, enableSorting: true },
        { header: "RTO AWB No", accessorKey: "rtoawbno", enableColumnFilter: false, enableSorting: true },
        { header: "Wt", accessorKey: "chargeablewt", enableColumnFilter: false, enableSorting: true },
        { header: "Qty", accessorKey: "quantity", enableColumnFilter: false, enableSorting: true },
        { header: "Attempts", accessorKey: "attempts", enableColumnFilter: false, enableSorting: true },
        { header: "Ageing", accessorKey: "ageing", enableColumnFilter: false, enableSorting: true },
        { header: "Region", accessorKey: "region", enableColumnFilter: false, enableSorting: true },
        { header: "Service Type", accessorKey: "servicetype", enableColumnFilter: false, enableSorting: true },
        { header: "CNote No", accessorKey: "cnotno", enableColumnFilter: false, enableSorting: false },
        { header: "Box No", accessorKey: "boxno", enableColumnFilter: false, enableSorting: false },
        { header: "Mode", accessorKey: "mode", enableColumnFilter: false, enableSorting: true },
        { header: "Transport Rem", accessorKey: "transportrem", enableColumnFilter: false, enableSorting: false },
        { header: "Arrival Time", accessorKey: "arrivaltime", enableColumnFilter: false, enableSorting: true },
        { header: "Promise Date", accessorKey: "customer_promise_date", enableColumnFilter: false, enableSorting: true },
        { header: "Instruction to SC", accessorKey: "instruction_to_sc", enableColumnFilter: false, enableSorting: false },
        { header: "Telecall Instruction", accessorKey: "telecall_instruction", enableColumnFilter: false, enableSorting: false },
        { header: "Updation Remarks", accessorKey: "updationremarks", enableColumnFilter: false, enableSorting: false },
    ], []);

    return (
        <div className="page-content py-0 px-0">

            {/* ── Sticky title bar ── */}
            <div className="position-sticky bg-white" style={{ top: 0, zIndex: 100 }}>
                <MainHeaderComp title="Pending Report" />
            </div>

            <div className="container-fluid px-2">

                {/* ── Filter bar (mirrors Velocity-Ops filter layout) ── */}
                <Row className="gx-2 align-items-end flex-nowrap pt-2 border-bottom pb-2">

                    <Col xs="auto" style={{ minWidth: 320 }}>
                        <FormGroup className="mb-2">
                            <Label className="mb-1 small fw-semibold">Service Center</Label>
                            <Select
                                isMulti
                                placeholder={scLoading ? "Loading..." : "Select SC..."}
                                options={[SELECT_ALL_OPTION, ...scOptions]}
                                value={selectedSCs}
                                onChange={handleSCChange}
                                styles={customStyles}
                                closeMenuOnSelect={false}
                                hideSelectedOptions={false}
                                components={{ MultiValue: SCMultiValue }}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </FormGroup>
                    </Col>

                    <Col xs="auto" className="mb-2 d-flex align-items-center gap-2" style={{ flexWrap: "nowrap" }}>
                        <Button
                            color="primary"
                            onClick={() => fetchReport(1)}
                            disabled={loading}
                            style={{ height: "2.2rem", whiteSpace: "nowrap" }}
                        >
                            {loading ? "Loading..." : "Check"}
                        </Button>
                        {!loading && totalCount > 0 && (
                            <span
                                className="badge bg-light text-muted border"
                                style={{ fontSize: 11, whiteSpace: "nowrap" }}
                            >
                                {totalCount.toLocaleString()} records
                            </span>
                        )}
                    </Col>

                </Row>

                {/* ── Table ── */}
                <div className="mt-1">
                    {loading ? (
                        <div
                            className="d-flex flex-column justify-content-center align-items-center"
                            style={{ height: "40vh" }}
                        >
                            <GridLoader size={20} />
                            <p className="mt-4 h5">Loading Pending Report...</p>
                        </div>
                    ) : (
                        <>
                            <TableContainer
                                columns={columns}
                                data={reportData}
                                isGlobalFilter={true}
                                isCustomPageSize={true}
                                isDownloadExcle={true}
                                isPagination={true}
                                onDownloadExcle={downloadExcel}
                                ExcleLoading={isExporting}
                                SearchPlaceholder="Search from table..."
                                pagination="pagination"
                                paginationWrapper="dataTables_paginate paging_simple_numbers"
                                tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                defaultPageSize={50}
                            />

                            {/* ── Server-side page navigation ── */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-between align-items-center px-1 py-2 border-top">
                                    <span className="text-muted small">
                                        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                                        &nbsp;·&nbsp;{totalCount.toLocaleString()} total records
                                    </span>
                                    <div className="d-flex gap-2">
                                        <Button
                                            size="sm"
                                            color="secondary"
                                            outline
                                            disabled={currentPage <= 1}
                                            onClick={() => fetchReport(currentPage - 1)}
                                        >
                                            ‹ Prev
                                        </Button>
                                        <Button
                                            size="sm"
                                            color="secondary"
                                            outline
                                            disabled={currentPage >= totalPages}
                                            onClick={() => fetchReport(currentPage + 1)}
                                        >
                                            Next ›
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PendingReport;
