import React, { useEffect, useMemo, useState } from "react";
import { Button, Label } from "@/components/ui";
import Select from "react-select";
import Loader from "@/Loaders/Loader";
import MainHeaderComp from "../../../components/MainHeaderCom";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import TableContainer from "../../../components/Table/TableContainer";
import { customStyles, CheckboxOption, SelectedCountValue } from "../../../helpers/CustomStyle";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchServiceCenters as fetchServiceCentersRaw } from "@/services/reference.service";
import { useRegions } from "../../../hooks/queries/useReferenceData";
import { STATUS_UPDATE } from "../../../api";
import YMD_DateFormate from "../../../helpers/YMD_DateFormate";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { useExcelExport } from "../../../hooks/useExcelExport";

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

const StatusUpdateAudit = () => {
    const { ErrorToaster } = ToasterProvider();
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null,
    });
    const [selectedRegion, setSelectedRegion] = useState([]);
    const [selectedServiceCenter, setSelectedServiceCenter] = useState([]);
    const [auditData, setAuditData] = useState([]);
    const [fullResponse, setFullResponse] = useState(null);

    // regions -- cached 30min, shared across every screen that asks
    const { data: regionOptions = [] } = useRegions()
    // service centers -- raw shape (region field intact) needed for the
    // region-based filtering below, still on the same shared cache entry
    const { data: serviceCenterData } = useQuery({
        queryKey: qk.reference.serviceCenters(),
        queryFn: fetchServiceCentersRaw,
        staleTime: 30 * 60_000,
    })
    // defining the api for audit data
    const { apifunc: fetchAuditData, loading: auditLoading } = usePostApiCall();
    const { exportToExcel, isExporting } = useExcelExport();

    // clear or filter service centers when region changes
    useEffect(() => {
        if (selectedRegion && selectedRegion.length > 0) {
            const selectedRegionValues = selectedRegion.map(r => r.value.toLowerCase());
            setSelectedServiceCenter(prev => prev.filter(sc => {
                const scData = serviceCenterData?.find(item => (item.ec_code || item.name) === sc.value);
                return scData && scData.region && selectedRegionValues.includes(scData.region.toLowerCase());
            }));
        }
    }, [selectedRegion, serviceCenterData]);

    const serviceCenterOptions = useMemo(() => {
        if (serviceCenterData) {
            let filteredData = serviceCenterData;
            if (selectedRegion && selectedRegion.length > 0) {
                const selectedRegionValues = selectedRegion.map(r => r.value.toLowerCase());
                filteredData = serviceCenterData.filter(item =>
                    item.region && selectedRegionValues.includes(item.region.toLowerCase())
                );
            }
            return filteredData.map(item => ({
                value: item.ec_code || item.name,
                label: item.ec_code || item.name
            }));
        }
        return [];
    }, [serviceCenterData, selectedRegion]);

    const totals = useMemo(() => {
        return auditData.reduce((acc, curr) => {
            acc.mobile += curr.mobile_count || 0;
            acc.manual += curr.manual_count || 0;
            acc.total += curr.total_count || 0;
            return acc;
        }, { mobile: 0, manual: 0, total: 0 });
    }, [auditData]);

    const columns = useMemo(
        () => [
            {
                header: "Status",
                id: "status_group",
                columns: [
                    {
                        header: () => null,
                        accessorKey: "status",
                        id: "status",
                        cell: ({ row }) => <span className="">{row.original.status || 0}</span>,
                        footer: () => <span className="font-extrabold">Total</span>
                    }
                ]
            },
            {

                header: "Mob Count",
                columns: [
                    {
                        header: "Count",
                        accessorKey: "mobile_count",
                        cell: ({ row }) => <span className="">{row.original.mobile_count || 0}</span>,
                        footer: () => <span className="font-extrabold">{totals.mobile}</span>
                    },
                    {
                        header: "%",
                        id: "mobile_percent",
                        cell: ({ row }) => {
                            const val = row.original.mobile_count || 0;
                            const total = row.original.total_count || 1;
                            return <span className="text-ink-muted">{((val / total) * 100).toFixed(2)}%</span>;
                        },
                        footer: () => {
                            const percentage = totals.total > 0 ? ((totals.mobile / totals.total) * 100).toFixed(2) : "0.00";
                            return <span className="font-extrabold">{percentage}%</span>;
                        }
                    }
                ]
            },
            {
                header: "Manual Count",
                columns: [
                    {
                        header: "Count",
                        accessorKey: "manual_count",
                        cell: ({ row }) => <span className="">{row.original.manual_count || 0}</span>,
                        footer: () => <span className="font-extrabold">{totals.manual}</span>
                    },
                    {
                        header: "%",
                        id: "manual_percent",
                        cell: ({ row }) => {
                            const val = row.original.manual_count || 0;
                            const total = row.original.total_count || 1;
                            return <span className="text-ink-muted">{((val / total) * 100).toFixed(2)}%</span>;
                        },
                        footer: () => {
                            const percentage = totals.total > 0 ? ((totals.manual / totals.total) * 100).toFixed(2) : "0.00";
                            return <span className="font-extrabold">{percentage}%</span>;
                        }
                    }
                ]
            },
            {
                header: () => "Total",
                id: "total_group",
                columns: [
                    {
                        header: () => null,
                        accessorKey: "total_count",
                        cell: ({ row }) => <span className="">{row.original.total_count || 0}</span>,
                        footer: () => <span className="font-extrabold">{totals.total}</span>
                    },
                ]
            },
        ],
        [totals, auditData]
    );

    const handleGetData = async () => {
        const { from_date, to_date } = YMD_DateFormate(selectedRange);

        if (!from_date || !to_date) {
            ErrorToaster("Please select a valid date range");
            return;
        }

        const payload = {
            start_date: from_date,
            end_date: to_date,
            regions: selectedRegion && selectedRegion.length > 0 ? selectedRegion.map(r => r.value) : [],
            service_centers: selectedServiceCenter && selectedServiceCenter.length > 0 ? selectedServiceCenter.map(sc => sc.value) : []
        };

        const response = await fetchAuditData(STATUS_UPDATE, payload);
        if (response) {
            setAuditData(response.status_totals || []);
            setFullResponse(response);
        } else {
            setAuditData([]);
            setFullResponse(null);
        }
    };

    const handleDownloadExcel = () => {
        if (!fullResponse || !fullResponse.report) {
            ErrorToaster("No data available to export");
            return;
        }

        const { from_date, to_date } = YMD_DateFormate(selectedRange);

        const filterPayload = {
            "Start Date": from_date || "--",
            "End Date": to_date || "--",
            "Regions": selectedRegion.length > 0 ? selectedRegion.map(r => r.label).join(", ") : "All",
            "Service Centers": selectedServiceCenter.length > 0 ? selectedServiceCenter.map(sc => sc.label).join(", ") : "All",
        };

        const reportData = fullResponse.report;

        // Calculate grand totals for Excel
        const excelGrandTotals = reportData.reduce((acc, curr) => {
            acc.mobile += Number(curr.mobile_count) || 0;
            acc.manual += Number(curr.manual_count) || 0;
            acc.total += Number(curr.total_count) || 0;
            return acc;
        }, { mobile: 0, manual: 0, total: 0 });

        const mappedData = reportData.map((item) => {
            const rowTotal = item.total_count || 1;
            return {
                "Service Center": item.service_center || "NA",
                "Status": item.status || "NA",
                "Date": item.trans_date || "NA",
                "Mobile Count": item.mobile_count || 0,
                "Mobile %": (((item.mobile_count || 0) / rowTotal) * 100).toFixed(2) + "%",
                "Manual Count": item.manual_count || 0,
                "Manual %": (((item.manual_count || 0) / rowTotal) * 100).toFixed(2) + "%",
                "Total Count": item.total_count || 0
            };
        });

        // Add Grand Total row at the end
        const grandTotalDenom = excelGrandTotals.total || 1;
        mappedData.push({
            "Service Center": "Grand Total",
            "Status": "",
            "Date": "",
            "Mobile Count": excelGrandTotals.mobile,
            "Mobile %": ((excelGrandTotals.mobile / grandTotalDenom) * 100).toFixed(2) + "%",
            "Manual Count": excelGrandTotals.manual,
            "Manual %": ((excelGrandTotals.manual / grandTotalDenom) * 100).toFixed(2) + "%",
            "Total Count": excelGrandTotals.total
        });

        exportToExcel(
            mappedData,
            "Status_Update_Audit",
            null,
            filterPayload
        );
    };


    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp title="Status Update Audit" subTitle="Mobile vs. manual status counts by region and service center." />

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
                            options={regionOptions}
                            value={selectedRegion}
                            onChange={setSelectedRegion}
                            placeholder="Select Region"
                            {...MULTI_SELECT_PROPS}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Service Center
                        </Label>
                        <Select
                            options={serviceCenterOptions}
                            value={selectedServiceCenter}
                            onChange={setSelectedServiceCenter}
                            placeholder="Search Service Center"
                            {...MULTI_SELECT_PROPS}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Date Range
                        </Label>
                        <DateRangeInput value={selectedRange} onChange={setSelectedRange} isBorder={true} />
                    </div>

                    <Button
                        color="primary"
                        className="h-9.5 shrink-0 px-6"
                        onClick={handleGetData}
                        disabled={auditLoading || !selectedRange?.startDate || !selectedRange?.endDate}
                    >
                        {auditLoading ? "Loading..." : "Get Data"}
                    </Button>
                </div>

                <div className="page-fit-body mt-4">
                    {
                        auditLoading ? (
                            <Loader message="Loading Audit Data..." fullscreen={false} />
                        ) : (
                            <TableContainer
                                columns={columns}
                                data={auditData || []}
                                isGlobalFilter={true}
                                isDownloadExcle={true}
                                onDownloadExcle={handleDownloadExcel}
                                ExcleLoading={isExporting}
                                isPagination={true}
                                defaultPageSize={50}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-nowrap dt-responsive w-full dataTable no-footer"
                                theadClass="sticky top-0 z-10"
                                isCustomPageSize={true}
                                isStickyHeader={true}
                                isStickyFooter={true}
                                fillHeight
                                tableHeight="72vh"
                            />
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default StatusUpdateAudit;