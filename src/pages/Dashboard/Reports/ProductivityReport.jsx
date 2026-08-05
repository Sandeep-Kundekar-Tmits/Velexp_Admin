import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import Loader from "@/Loaders/Loader";
import { Button, Label } from "@/components/ui";
import Select from "react-select";
import MainHeaderComp from "../../../components/MainHeaderCom";
import TabsProvider from "../../../components/TabsProvider";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import TableContainer from "../../../components/Table/TableContainer";
import { customStyles, CheckboxOption, SelectedCountValue } from "../../../helpers/CustomStyle";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { useMultiExcelExport } from "../../../hooks/useMultiExcelExport";
import { useRegions, useServiceCenters } from "../../../hooks/queries/useReferenceData";
import { FaFileExcel } from "react-icons/fa";
import { PRODUCTIVITY_REPORT } from "../../../api";

/* Same contract as LastMileOperations.jsx: a checkbox per option instead of a
   chip strip beside the control, and a count in the control instead of one
   chip per value. See CustomStyle.jsx for why. */
const MULTI_SELECT_PROPS = {
    isMulti: true,
    isClearable: true,
    hideSelectedOptions: false,
    closeMenuOnSelect: false,
    styles: customStyles,
    components: { Option: CheckboxOption, ValueContainer: SelectedCountValue },
    menuPortalTarget: document.body,
    menuPosition: "fixed",
};

const ProductivityReport = () => {
    const [filters, setFilters] = useState({
        start_date: "",
        end_date: "",
        region: [],
        service_center: [],
    });

    // regions & service centers -- cached 30min, shared across every screen that asks
    const { data: regions = [], isLoading: regionLoading } = useRegions();
    const { data: serviceCenters = [], isLoading: scLoading } = useServiceCenters();
    const [reportData, setReportData] = useState({
        region_report: [],
        service_center_report: [],
        raw_data: [],
    });

    const { apifunc: getReport, loading: reportLoading } = usePostApiCall();
    const { exportMultiToExcel, isExporting: excelLoading } = useMultiExcelExport();

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || []
        }));
    };

    const handleDateChange = (range) => {
        setFilters(prev => ({
            ...prev,
            start_date: range.startDate,
            end_date: range.endDate
        }));
    };

    const handleApply = async () => {
        if (!filters.start_date || !filters.end_date) {
            alert("Please select a date range.");
            return;
        }

        const payload = {
            start_date: filters.start_date ? format(new Date(filters.start_date), 'yyyy-MM-dd') : "",
            end_date: filters.end_date ? format(new Date(filters.end_date), 'yyyy-MM-dd') : "",
            region: filters.region.map(r => r.value),
            service_center: filters.service_center.map(sc => sc.value),
        };

        const res = await getReport(PRODUCTIVITY_REPORT, payload);
        if (res) {
            setReportData({
                region_report: res.region_report || [],
                service_center_report: res.service_center_report || [],
                raw_data: res.raw_data || [],
            });
        }
    };

    const handleDownloadExcel = () => {
        if (!reportData.raw_data || reportData.raw_data.length === 0) {
            alert("No data available to export.");
            return;
        }

        const headingPart = [
            `Start Date: ${format(new Date(filters.start_date), 'yyyy-MM-dd')}`,
            `End Date: ${format(new Date(filters.end_date), 'yyyy-MM-dd')}`,
            `Region: ${filters.region.map(r => r.value).join(", ") || "All"}`,
            `Service Center: ${filters.service_center.map(sc => sc.value).join(", ") || "All"}`
        ].join(", ");

        const sheets = [
            {
                sheetName: "Region Report",
                data: reportData.region_report.map(item => ({
                    "Region": item.region,
                    "Total SCs": item.total_scs,
                    "Unique Pincodes": item.unique_pincodes_served,
                    "Delivered (D)": item.delivered_d,
                    "Delivered (DV)": item.delivered_dv,
                    "Delivered (V)": item.delivered_v,
                    "Total Delivered": item.total_delivered,
                })),
                mainHeading: `Productivity Region Report, ${headingPart}`
            },
            {
                sheetName: "Service Center Report",
                data: reportData.service_center_report.map(item => ({
                    "Service Center": item.service_center,
                    "Region": item.region,
                    "Master Pincodes": item.master_pincodes,
                    "Served Pincodes": item.served_pincodes,
                    "Delivered (D)": item.delivered_d,
                    "Delivered (DV)": item.delivered_dv,
                    "Delivered (V)": item.delivered_v,
                    "Total Delivered": item.total_delivered,
                    "Active Staff": item.active_staff,
                    "Capacity": item.capacity,
                    "Gap": item.gap,
                })),
                mainHeading: `Productivity Service Center Report, ${headingPart}`
            },
            {
                sheetName: "Raw Data",
                data: reportData.raw_data.map(item => ({
                    "AWB No": item.awbno,
                    "AWB Date": item.awb_date ? format(new Date(item.awb_date), 'dd-MM-yyyy') : "-",
                    "Customer": item.customer_name,
                    "Pincode": item.drop_pincode,
                    "City": item.drop_city,
                    "Status Date": item.statdate ? format(new Date(item.statdate), 'dd-MM-yyyy') : "-",
                    "Status": item.status,
                    "Service Center": item.service_center,
                    "Emp ID": item.empid,
                    "Employee Name": item.empname,
                })),
                mainHeading: `Productivity Raw Data Report, ${headingPart}`
            }
        ];

        exportMultiToExcel(sheets, "Productivity_Report");
    };

    const regionColumns = useMemo(() => [
        { header: "Region", accessorKey: "region" },
        { header: "Total SCs", accessorKey: "total_scs" },
        { header: "Unique Pincodes", accessorKey: "unique_pincodes_served" },
        { header: "Delivered (D)", accessorKey: "delivered_d" },
        { header: "Delivered (DV)", accessorKey: "delivered_dv" },
        { header: "Delivered (V)", accessorKey: "delivered_v" },
        { header: "Total Delivered", accessorKey: "total_delivered" },
    ], []);

    const scColumns = useMemo(() => [
        { header: "Service Center", accessorKey: "service_center" },
        { header: "Region", accessorKey: "region" },
        { header: "Master Pincodes", accessorKey: "master_pincodes" },
        { header: "Served Pincodes", accessorKey: "served_pincodes" },
        { header: "Delivered (D)", accessorKey: "delivered_d" },
        { header: "Delivered (DV)", accessorKey: "delivered_dv" },
        { header: "Delivered (V)", accessorKey: "delivered_v" },
        { header: "Total Delivered", accessorKey: "total_delivered" },
        { header: "Active Staff", accessorKey: "active_staff" },
        { header: "Capacity", accessorKey: "capacity" },
        { header: "Gap", accessorKey: "gap" },
    ], []);

    const rawDataColumns = useMemo(() => [
        { header: "AWB No", accessorKey: "awbno" },
        {
            header: "AWB Date",
            accessorKey: "awb_date",
            cell: (info) => info.getValue() ? format(new Date(info.getValue()), 'dd-MM-yyyy') : "-"
        },
        { header: "Customer", accessorKey: "customer_name" },
        { header: "Pincode", accessorKey: "drop_pincode" },
        { header: "City", accessorKey: "drop_city" },
        {
            header: "Status Date",
            accessorKey: "statdate",
            cell: (info) => info.getValue() ? format(new Date(info.getValue()), 'dd-MM-yyyy') : "-"
        },
        { header: "Status", accessorKey: "status" },
        { header: "Service Center", accessorKey: "service_center" },
        { header: "Emp ID", accessorKey: "empid" },
        { header: "Employee Name", accessorKey: "empname" },
    ], []);

    const tabs = [
        {
            id: "region_report",
            label: "Region Report",
            component: reportLoading ? (
                <Loader message="Loading Region Report ..." fullscreen={false} />
            ) : (
                <TableContainer
                    columns={regionColumns}
                    data={reportData.region_report}
                    isGlobalFilter={true}
                    isCustomPageSize={true}
                    isPagination={true}
                    SearchPlaceholder="Search Region Report..."
                    pagination="pagination  justify-content-end mb-2"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                    theadClass="sticky top-0 z-10"
                    isStickyHeader={true}
                    stickyTop={0}
                    tableHeight="72vh"
                />
            )
        },
        {
            id: "service_center_report",
            label: "Service Center Report",
            component: reportLoading ? (
                <Loader message="Loading SC Report ..." fullscreen={false} />
            ) : (
                <TableContainer
                    columns={scColumns}
                    data={reportData.service_center_report}
                    isGlobalFilter={true}
                    isCustomPageSize={true}
                    isPagination={true}
                    SearchPlaceholder="Search SC Report..."
                    pagination="pagination justify-content-end mb-2"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                    theadClass="sticky top-0 z-10"
                    isStickyHeader={true}
                    stickyTop={0}
                    tableHeight="72vh"
                />
            )
        },
        {
            id: "raw_data",
            label: "Raw Data",
            component: reportLoading ? (
                <Loader message="Loading Raw Data ..." fullscreen={false} />
            ) : (
                <TableContainer
                    columns={rawDataColumns}
                    data={reportData.raw_data}
                    isGlobalFilter={true}
                    isCustomPageSize={true}
                    isPagination={true}
                    SearchPlaceholder="Search Raw Data..."
                    pagination="pagination justify-content-end mb-2"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                    theadClass="sticky top-0 z-10"
                    isStickyHeader={true}
                    stickyTop={0}
                    tableHeight="72vh"
                />
            )
        }
    ];

    const hasReport = reportData.region_report.length > 0 || reportData.service_center_report.length > 0 || reportData.raw_data.length > 0;

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp title="Productivity Report" subTitle="Delivery and staffing capacity by region and service center." />

            <div className="page-fit-body relative z-10 pb-4">
                {/* Filters -- see LastMileOperations.jsx for the reasoning:
                    checkboxes in the dropdown replace the chip strip beside
                    the control, and every field wraps to the next line rather
                    than push the row past the card. */}
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Region
                        </Label>
                        <Select
                            options={regions}
                            value={filters.region}
                            onChange={(val) => handleFilterChange("region", val)}
                            placeholder={regionLoading ? "Loading..." : "Select Region"}
                            {...MULTI_SELECT_PROPS}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Service Center
                        </Label>
                        <Select
                            options={serviceCenters}
                            value={filters.service_center}
                            onChange={(val) => handleFilterChange("service_center", val)}
                            placeholder={scLoading ? "Loading..." : "Select Service Center"}
                            {...MULTI_SELECT_PROPS}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Date Range
                        </Label>
                        <DateRangeInput
                            value={{ startDate: filters.start_date, endDate: filters.end_date }}
                            onChange={handleDateChange}
                            isBorder={true}
                        />
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            color="primary"
                            onClick={handleApply}
                            disabled={reportLoading}
                            className="h-9.5 px-6"
                        >
                            {reportLoading ? "Applying..." : "Apply"}
                        </Button>
                        {hasReport && (
                            <Button
                                disabled={excelLoading}
                                onClick={handleDownloadExcel}
                                className="table-action-btn table-action-btn-solid"
                            >
                                {excelLoading ? "Exporting..." : "Download"}
                                <FaFileExcel size={15} aria-hidden="true" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="mt-4">
                    <TabsProvider tabs={tabs} />
                </div>
            </div>
        </div>
    );
};

export default ProductivityReport;