import DateRangePicker from "@paprika/date-range-picker"
import { useEffect, useMemo, useState } from "react";
import { Button, Col, FormGroup, Label, Row } from "reactstrap";
import Select from 'react-select'
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { customStyles } from "../../../helpers/CustomStyle";
import { SERVICE_CENTER, UPLOAD_SHIPMENT_CHECKPOINTS } from "../../../api";
import TableContainer from "../../../components/Table/TableContainer";
import { GridLoader } from "react-spinners";
import usePostApiCall from "../../../hooks/usePostApiCall";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { useExcelExport } from "../../../hooks/useExcelExport";
import YMD_DateFormate from "../../../helpers/YMD_DateFormate";
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
    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCentersList, loading: ServiceCenterLoading } = useGetApiCall()
    // defining the get all shipment pickups api
    const { apifunc: UploadShipmentChekpoint, loading: UploadShipmentCheckpointLoading } = usePostApiCall()
    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    // useEffects
    useEffect(() => {
        // calling the service Center api
        GetServiceCenter(SERVICE_CENTER)
    }, [])



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
        <>
            <div className='page-content'>
                <div className="container-fluid">
                    <div>
                        <h3 className='pb-3 border-bottom'>Status Update</h3>
                    </div>
                    <Row>
                        <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label>Start Date and End Date</Label>
                                <div style={{ minWidth: "200px" }}>
                                    <DateRangePicker
                                        startDate={selectedRange.startDate}
                                        endDate={selectedRange.endDate}
                                        onChange={handleChange}
                                        className="h-100"
                                    />
                                </div>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Region</Label>
                                <Select
                                    name="region"
                                    options={Regions}
                                    placeholder={ServiceCenterLoading ? "loading...." : "Search Region"}
                                    onChange={(option) => OnSelectChange("region", option)}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Service Center</Label>
                                <Select
                                    value={ShipmentCheckpointPayload?.service_center}
                                    name="service_center"
                                    options={ServiceCenters}
                                    placeholder={ServiceCenterLoading ? "loading...." : "Search Service Center"}
                                    onChange={(option) => OnSelectChange("service_center", option)}
                                    isClearable={true}

                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        <Col md={2}>
                            <Button color="primary" className="" style={{ height: "2.3rem", width: "100%", marginTop: "28px" }} onClick={GetDataFunctionCall}>
                                Get Data
                            </Button>
                        </Col>
                    </Row>
                    {/*  */}
                    <div className=''>
                        <div className='mt-1'>
                            {
                                UploadShipmentCheckpointLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                    <GridLoader size={20} />
                                    <p className="mt-5 h5">Loading Pending Report Booking ...</p>
                                </div>
                                    :
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
                                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                    />
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
export default ShipmentCheckpoint