import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { qk } from "@/lib/queryKeys"
import { fetchServiceCenters } from "@/services/reference.service"
import { UPLOAD_CD_UPDATE_REPORT } from "../../../api"
import { Button, Label } from "@/components/ui"
import Select from 'react-select'
import { customStyles } from "../../../helpers/CustomStyle"
import TableContainer from "../../../components/Table/TableContainer"
import DateRangeInput from "../../../components/Common/DateRangeInput";
import MainHeaderCom from "../../../components/MainHeaderCom";
import usePostApiCall from "../../../hooks/usePostApiCall"
import { useExcelExport } from "../../../hooks/useExcelExport"
import ToasterProvider from "../../../helpers/ToasterProvider"
import YMD_DateFormate from "../../../helpers/YMD_DateFormate"
import Loader from "@/Loaders/Loader";
import StatsCard from "../../../components/StatsCard"
const CDUpdate = () => {
    const columns = useMemo(
        () => [
            {
                header: 'AWB',
                accessorKey: 'awbno',
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
                header: 'Region',
                accessorKey: 'region',
                enableColumnFilter: false,
                enableSorting: true,
            },
        ],
        []
    );
    const DelayedCountColoumn = useMemo(() => [
        {
            header: 'Service Center',
            accessorKey: 'service_center',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'Delayed Update Count',
            accessorKey: 'delayed_update_count',
            enableColumnFilter: false,
            enableSorting: true,
        },
    ])
    const [ServiceCenters, setServiceCenters] = useState([])
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null,
    });
    const [CdUpdateList, SetCdUpdateList] = useState([])
    const [Delayed_counts, setDelayed_counts] = useState([])
    const [CdUpdatePayload, setCdUpdatePayload] = useState({
        "service_center": null,
        "region": null
    })
    const [Regions, setRegions] = useState([])
    const [showTable, setShowtable] = useState(false)
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const handleChange = (range) => {
        setSelectedRange(range);
    };
    // // functions
    const OnSelectChange = (key, option) => {
        setCdUpdatePayload({
            ...CdUpdatePayload,
            [key]: option
        })
    }

    //  api functions
    // service centers -- cached 30min via react-query instead of refetched on every mount
    const { data: ServiceCentersList, isLoading: ServiceCenterLoading } = useQuery({
        queryKey: qk.reference.serviceCenters(),
        queryFn: fetchServiceCenters,
        staleTime: 30 * 60_000,
    })
    // defining the get all shipment pickups api
    const { apifunc: UploadCDUpdateReport, loading: UploadCdReportUpdateLoading } = usePostApiCall(null, "")
    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    // useEffects
    useEffect(() => {
        // service center and regoins and it should be unique
        if (ServiceCentersList) {
            // service center
            let serviceCenter = ServiceCentersList.map((ele) => {
                return {
                    value: ele?.ec_code,
                    label: ele?.ec_code
                }
            }).filter((item, index, self) =>
                index === self.findIndex((t) => (
                    t.value === item.value
                ))
            );

            // regions

            let optionRegions = ServiceCentersList?.map((ele) => {
                return {
                    value: ele?.region,
                    label: ele?.region
                }
            }).filter((item, index, self) =>
                index === self.findIndex((t) => (
                    t.value === item.value
                ))
            );
            setServiceCenters(serviceCenter)
            setRegions(optionRegions)

        }


    }, [ServiceCentersList])

    const GetDataFunctionCall = async () => {
        setShowtable(false)
        SetCdUpdateList([])
        setDelayed_counts([])
        let payload = {
            "start_date": YMD_DateFormate(selectedRange)?.from_date,
            "end_date": YMD_DateFormate(selectedRange)?.to_date,
            "service_center": CdUpdatePayload?.service_center?.value || "All",
            "region": CdUpdatePayload?.region?.value || "All"
        }

        if (!selectedRange?.endDate || !selectedRange?.startDate) {
            ErrorToaster("Select the Date Range")
            return
        }
        // calling the  post  Shipment checkpoint
        const data = await UploadCDUpdateReport(UPLOAD_CD_UPDATE_REPORT, payload)
        if (data?.delayed_data) {
            SetCdUpdateList(data?.delayed_data[0] || [])
            setDelayed_counts(data?.delayed_counts || [])
        }
    }

    const DownloadExcle = () => {
        let payload = {
            "start_date": YMD_DateFormate(selectedRange)?.from_date,
            "end_date": YMD_DateFormate(selectedRange)?.to_date,
            "service_center": CdUpdatePayload?.service_center?.value || "All",
            "region": CdUpdatePayload?.region?.value || "All"
        }

        if (!selectedRange?.endDate || !selectedRange?.startDate) {
            ErrorToaster("Select the Date Range")
            return
        }
        exportToExcel(CdUpdateList, "cd_update_report", (item) => ({
            "AWB No": item.awbno,
            "Service Center": item.service_center,
            "Region": item.region,
        }), payload);

    }
    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderCom title="CD Update" subTitle="Delayed checkpoint updates by service center." />

            <div className="page-fit-body relative z-10 pb-4">
                {/* Filters -- single row that wraps rather than the fixed
                    Bootstrap grid, same as the rest of the report screens. */}
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Date Range
                        </Label>
                        <DateRangeInput
                            value={selectedRange}
                            onChange={handleChange}
                            isBorder={true}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-56">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Region
                        </Label>
                        <Select
                            name="region"
                            options={Regions}
                            placeholder={ServiceCenterLoading ? "loading...." : "Search Region"}
                            onChange={(option) => OnSelectChange("region", option)}
                            isClearable={true}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            styles={customStyles}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-56">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Service Center
                        </Label>
                        <Select
                            value={CdUpdatePayload?.service_center}
                            name="service_center"
                            options={ServiceCenters}
                            placeholder={ServiceCenterLoading ? "loading...." : "Search Service Center"}
                            onChange={(option) => OnSelectChange("service_center", option)}
                            isClearable={true}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            styles={customStyles}
                        />
                    </div>

                    <Button
                        color="primary"
                        className="h-9.5 shrink-0 px-6"
                        onClick={GetDataFunctionCall}
                    >
                        {UploadCdReportUpdateLoading ? "Getting data..." : "Get Data"}
                    </Button>
                </div>

                {/* delayed counts summary */}
                {Delayed_counts.length > 0 && (
                    <div className="mt-4">
                        <h4 className="mb-2 text-[14px] font-semibold text-ink">Delayed Counts</h4>
                        <TableContainer
                            columns={DelayedCountColoumn}
                            data={Delayed_counts || []}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            SearchPlaceholder="Search From Table"
                            pagination="pagination"
                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                            tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                            theadClass="sticky top-0 z-10"
                        />
                    </div>
                )}

                <div className="page-fit-body mt-4">
                    {
                        showTable ? (
                            <div className="page-fit-body">
                                {
                                    UploadCdReportUpdateLoading ? <Loader message="Loading CD Report ..." fullscreen={false} /> : (
                                        <TableContainer
                                            columns={columns}
                                            data={CdUpdateList || []}
                                            isGlobalFilter={true}
                                            isPagination={true}
                                            isCustomPageSize={true}
                                            isDownloadExcle={true}
                                            ExcleLoading={isExporting}
                                            onDownloadExcle={DownloadExcle}
                                            SearchPlaceholder="Search From Table"
                                            pagination="pagination"
                                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                                            tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                            theadClass="sticky top-0 z-10"
                                            isStickyHeader={true}
                                            stickyTop={0}
                                            fillHeight
                                            tableHeight="60vh"
                                        />
                                    )
                                }
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <Button color="primary" onClick={() => { setShowtable(!showTable) }} disabled={CdUpdateList.length < 1}>
                                    {showTable ? "Hide Delayed Data" : "Show Delayed Data"}
                                </Button>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}
export default CDUpdate