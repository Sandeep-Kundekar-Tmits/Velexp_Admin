import { useEffect, useMemo, useState } from "react"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import { SERVICE_CENTER, UPLOAD_CD_UPDATE_REPORT } from "../../../api"
import { Button, Card, Col, FormGroup, Label, Row } from "reactstrap"
import Select from 'react-select'
import { customStyles } from "../../../helpers/CustomStyle"
import TableContainer from "../../../components/Table/TableContainer"
import DateRangePicker from "@paprika/date-range-picker"
import usePostApiCall from "../../../hooks/usePostApiCall"
import { useExcelExport } from "../../../hooks/useExcelExport"
import ToasterProvider from "../../../helpers/ToasterProvider"
import YMD_DateFormate from "../../../helpers/YMD_DateFormate"
import { GridLoader } from "react-spinners";
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
    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCentersList, loading: ServiceCenterLoading } = useGetApiCall()
    // defining the get all shipment pickups api
    const { apifunc: UploadCDUpdateReport, loading: UploadCdReportUpdateLoading } = usePostApiCall(null, "")
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

            setServiceCenters(serviceCenter)
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
        (
            <div className='page-content'>
                <div className="container-fluid">
                    {/* head */}
                    <div className="d-flex justify-content-between mb-2 align-items-center border-bottom">
                        <h3 className=''>CD Update</h3>
                    </div>
                    {/*  */}

                    {/*  cards */}
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
                                    value={CdUpdatePayload?.service_center}
                                    name="service_center"
                                    options={ServiceCenters}
                                    placeholder={ServiceCenterLoading ? "loading...." : "Search Service Center"}
                                    onChange={(option) => OnSelectChange("service_center", option)}
                                    isClearable={true}

                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        <Col md={2}>
                            <Button color="primary" className="" style={{ height: "2.3rem", width: "100%", marginTop: "28px" }}
                                onClick={GetDataFunctionCall}
                            >
                                {
                                    UploadCdReportUpdateLoading ? "Getting data..." : " Get Data"
                                }
                            </Button>
                        </Col>
                    </Row>

                    {/* delayed counts cards */}
                    {
                        Delayed_counts.length > 0 && <div className="border-top pt-3">
                            <h4>Delayed Counts</h4>
                            <TableContainer
                                columns={DelayedCountColoumn}
                                data={Delayed_counts || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                isCustomPageSize={true}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                            />
                        </div>
                    }

                    <div className=' border-top pt-3'>
                        {
                            showTable ? <div className='mt-3'>
                                {
                                    UploadCdReportUpdateLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                        <GridLoader size={20} />
                                        <p className="mt-5 h5">Loading CD Report ...</p>
                                    </div>
                                        :
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
                                            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                        />
                                }
                            </div> : <div className="d-flex justify-content-center align-items-center">
                                <Button color="primary" onClick={() => { setShowtable(!showTable) }} disabled={CdUpdateList.length < 1}>{
                                    showTable ? "Hide Delayed Data" : "Show Delayed Data"
                                }</Button>
                            </div>
                        }
                    </div>
                </div>
            </div>
        )
    )
}
export default CDUpdate