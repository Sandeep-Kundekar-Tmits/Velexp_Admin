import { useEffect, useMemo, useState } from "react";
import { Button, Label } from "@/components/ui";
import Select from 'react-select'
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchServiceCenters } from "@/services/reference.service";
import { customStyles } from "../../../helpers/CustomStyle";
import { UPLOAD_SHIPMENT_CHECKPOINTS } from "../../../api";
import TableContainer from "../../../components/Table/TableContainer";
import Loader from "@/Loaders/Loader";
import usePostApiCall from "../../../hooks/usePostApiCall";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { useExcelExport } from "../../../hooks/useExcelExport";
import YMD_DateFormate from "../../../helpers/YMD_DateFormate";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import MainHeaderCom from "../../../components/MainHeaderCom";
const ShipmentCheckpoint = () => {
    const columns = useMemo(
        () => [
            {
                header: 'Status',
                accessorKey: 'status',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Mob Count',
                accessorKey: 'total_mobile_updates',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Manual Count',
                accessorKey: 'total_manual_updates',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Total ',
                accessorKey: 'total_updates',
                enableColumnFilter: false,
                enableSorting: true,
            },
        ],
        []
    );
    const [ShipmentCheckpoints, setShipmentCheckpoints] = useState([])
    const [Regions, setRegions] = useState([])
    const [ShipmentCheckpointPayload, setShipmentCheckpointPayload] = useState({
        "service_center": null,
        "region": null
    })
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null,
    });
    const [ServiceCenters, setServiceCenters] = useState([])
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const handleChange = (range) => {
        setSelectedRange(range);
    };
    // functions
    const OnSelectChange = (key, option) => {
        setShipmentCheckpointPayload({
            ...ShipmentCheckpointPayload,
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
    const { apifunc: UploadShipmentChekpoint, loading: UploadShipmentCheckpointLoading } = usePostApiCall()
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

    const DownloadShipmemtCheckpointDetails = () => {
        if (!selectedRange?.endDate || !selectedRange?.startDate) {
            ErrorToaster("Select the Date Range")
            return
        }
        let payload = {
            "start_date": YMD_DateFormate(selectedRange)?.from_date,
            "end_date": YMD_DateFormate(selectedRange)?.to_date,
            "service_center": ShipmentCheckpointPayload?.service_center?.value || "All",
            "region": ShipmentCheckpointPayload?.region?.value || "All"
        }

        exportToExcel(ShipmentCheckpoints, "Shipment_Checkpoint", (item) => ({
            "Status": item.status,
            "Mob Count": item.total_mobile_updates,
            "Manual Count": item.total_manual_updates,
            "Total": item?.total_updates ?? 0,
        }), payload);

    }

    // upload shipment checkpoint
    const GetDataFunctionCall = async () => {
        let payload = {
            "start_date": YMD_DateFormate(selectedRange)?.from_date,
            "end_date": YMD_DateFormate(selectedRange)?.to_date,
            "service_center": ShipmentCheckpointPayload?.service_center?.value || "All",
            "region": ShipmentCheckpointPayload?.region?.value || "All"
        }

        if (!selectedRange?.endDate || !selectedRange?.startDate) {
            ErrorToaster("Select the Date Range")
            return
        }
        // calling the  post  Shipment checkpoint
        const data = await UploadShipmentChekpoint(UPLOAD_SHIPMENT_CHECKPOINTS, payload)
        if (data?.result) {
            setShipmentCheckpoints(data?.result)
        }
        else {
            ErrorToaster("Something went wrong")
        }
        console.log(data, "data")
    }
    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderCom title="Status Update" subTitle="Mobile vs. manual status-update counts by service center." />

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
                            value={ShipmentCheckpointPayload?.service_center}
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
                        Get Data
                    </Button>
                </div>

                <div className="page-fit-body mt-4">
                    {
                        UploadShipmentCheckpointLoading ? <Loader message="Loading Status Update Report ..." fullscreen={false} /> : (
                            <TableContainer
                                columns={columns}
                                data={ShipmentCheckpoints || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                isCustomPageSize={true}
                                isDownloadExcle={true}
                                onDownloadExcle={DownloadShipmemtCheckpointDetails}
                                ExcleLoading={isExporting}
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
            </div>
        </div>
    )
}
export default ShipmentCheckpoint