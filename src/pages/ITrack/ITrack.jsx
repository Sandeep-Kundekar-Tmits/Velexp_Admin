import React, { useState, useMemo, useCallback } from "react";
import { Button, Input, Label, Nav, NavItem, NavLink, TabContent, TabPane } from "@/components/ui";
import MainHeaderCom from "../../components/MainHeaderCom";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { ITRACK_SCANS } from "../../api";
import ToasterProvider from "../../helpers/ToasterProvider";
import Loader from "@/Loaders/Loader";

// screen_name is logged as "<screen> by <who scanned it>" (see TrackAWB.jsx's
// logTrackScan) -- e.g. "Shipment & Bag Tracking by Admin" and "Shipment &
// Bag Tracking by PNSO TECHNOLOGY PVT LTD" are the same screen, different
// scanners. Just two tabs: that screen (whoever did it), and everything else
// together -- not one tab per distinct "by <who>" or per other screen name.
const isTrackingScreen = (screenName) => /shipment\s*&\s*bag\s*tracking/i.test(screenName || "");

const ITrack = () => {
    const [awbNumber, setAwbNumber] = useState("");
    const [activeTab, setActiveTab] = useState("tracking");
    const { apifunc: getScans, data, loading, error } = useGetApiCall();
    const { ErrorToaster } = ToasterProvider();

    const handleScan = async () => {
        if (!awbNumber) {
            ErrorToaster("Please enter an AWB number");
            return;
        }
        // Back to the first tab for every new lookup, same reasoning as
        // before: a tab that happened to be active for the previous AWB
        // might have zero rows for this one.
        setActiveTab("tracking");
        await getScans(`${ITRACK_SCANS}?awb=${awbNumber}`);
    };

    const columns = useMemo(() => [
        {
            header: 'ID',
            accessorKey: 'id',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'AWB',
            accessorKey: 'awb',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'Employee Code',
            accessorKey: 'employee_code',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'Scanned By',
            accessorKey: 'scanned_by',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'Service Center',
            accessorKey: 'service_center',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'Screen Name',
            accessorKey: 'screen_name',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'Scan Time',
            accessorKey: 'created_at',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => {
                const date = new Date(getValue());
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            }
        },
    ], []);

    const processedData = useMemo(() => {
        return Array.isArray(data) ? data : [];
    }, [data]);

    // Exactly two tabs: Shipment & Bag Tracking scans, and everything else
    // (Manual Status Update, or any other screen_name) lumped into "Other".
    const trackingRows = useMemo(
        () => processedData.filter((row) => isTrackingScreen(row.screen_name)),
        [processedData]
    );
    const otherRows = useMemo(
        () => processedData.filter((row) => !isTrackingScreen(row.screen_name)),
        [processedData]
    );

    const tabs = useMemo(() => ([
        { key: "tracking", label: "Shipment & Bag Tracking", count: trackingRows.length },
        { key: "other", label: "Other", count: otherRows.length },
    ]), [trackingRows, otherRows]);

    const visibleData = activeTab === "tracking" ? trackingRows : otherRows;

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderCom
                title="ITrack - AWB Scan History"
                subTitle="Scan an AWB to see every checkpoint recorded against it."
            />

            <div className="container-fluid page-fit-body relative z-10 pb-4">
                {/* One filter row, no Card around it: a bordered box holding a
                    single field and a button was a panel inside a panel once
                    the grid below grew its own. A rule separates them.

                    A form, so Enter submits -- this screen is fed by a barcode
                    scanner, which types the AWB and sends Return. The old
                    onKeyPress handler did that by hand and is now the browser's
                    job. */}
                <form
                    className="filter-row"
                    onSubmit={(e) => { e.preventDefault(); handleScan(); }}
                >
                    <div className="filter-group">
                        <div className="flex w-full flex-col gap-1.5 sm:w-64">
                            <Label for="awbInput" className="form-label m-0 font-bold text-ink-muted">
                                Scan AWB
                            </Label>
                            <Input
                                id="awbInput"
                                type="text"
                                placeholder="Enter AWB Number"
                                value={awbNumber}
                                onChange={(e) => setAwbNumber(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            className="table-action-btn table-action-btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Scanning..." : "Submit"}
                        </Button>
                    </div>
                </form>

                {!loading && processedData.length > 0 && (
                    <Nav tabs className="nav-tabs-custom nav-justified mt-4 mb-0">
                        {tabs.map((tab) => (
                            <NavItem key={tab.key}>
                                <NavLink
                                    active={activeTab === tab.key}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={activeTab === tab.key ? "bg-[#3B82F6]/12 text-[15px] font-bold" : "text-[15px] font-bold"}
                                >
                                    {tab.label} ({tab.count})
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>
                )}

                <div className="page-fit-body mt-4">
                    {loading ? (
                        <Loader message="Fetching scan records..." fullscreen={false} />
                    ) : (
                        <TabContent activeTab={activeTab} className="page-fit-body">
                            {tabs.map((tab) => (
                                <TabPane key={tab.key} tabId={tab.key} className="page-fit-body">
                                    {activeTab === tab.key && (
                                        <TableContainer
                                            columns={columns}
                                            data={visibleData}
                                            isGlobalFilter={true}
                                            isPagination={true}
                                            isCustomPageSize={true}
                                            SearchPlaceholder="Search scan records..."
                                            pagination="pagination"
                                            buttonClass="btn-success"
                                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                                            /* table-bordered dropped: .grid-shell draws the row
                                               rules now, and the two only fought each other. */
                                            tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                            theadClass="sticky top-0 z-10"
                                            isStickyHeader={true}
                                            stickyTop={0}
                                            fillHeight
                                            tableHeight="60vh"
                                        />
                                    )}
                                </TabPane>
                            ))}
                        </TabContent>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ITrack;
