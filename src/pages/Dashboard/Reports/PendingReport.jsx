import { Button, Card, CardBody, Col, FormGroup, Label, Row } from "reactstrap"
import Select from 'react-select'
import { customStyles } from "../../../helpers/CustomStyle"
import { FaCloudDownloadAlt } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import MainHeaderComp from "../../../components/MainHeaderCom";
import { GET_USER_API, PENDING_UPLOAD_REPORT, SERVICE_CENTER, UPLOAD_GET_REVENUE_API } from "../../../api";
import TableContainer from "../../../components/Table/TableContainer";
import DateRangeInput from '../../../components/Common/DateRangeInput';
import usePostApiCall from "../../../hooks/usePostApiCall";
import { GridLoader } from "react-spinners";
import { useExcelExport } from "../../../hooks/useExcelExport";
import YMD_DateFormate from '../../../helpers/YMD_DateFormate';

const PendingReport = () => {
    const columns = useMemo(
        () => [
            {
                header: 'AWB No.',
                accessorKey: 'awbno',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Date',
                accessorKey: 'date',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Customer Name',
                accessorKey: 'customer_name',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'ORGSC ',
                accessorKey: 'orgsc',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Product type',
                accessorKey: 'product_type',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Payment Mode',
                accessorKey: 'payment mode',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Shipment Status',
                accessorKey: 'shipment_status',
                enableColumnFilter: false,
                enableSorting: true,
            },
        ],
        []
    );

    // states
    const [PendingReportData, setPendingReportData] = useState([])
    const [Customers, setCustomers] = useState([])
    const [Regions, setRegions] = useState([])
    const [ServiceCenters, setServiceCenters] = useState([])
    const [PaymentModes, setPaymentModes] = useState([
        { value: "All", label: "All" },
        { value: "paid ", label: "paid " },
        { value: 'cod', label: "cod" },
    ])
    const [ModeOption, setModeOption] = useState([
        { value: "forward", label: "forward" },
        { value: 'reverse', label: "reverse" }
    ])

    const [Product, setSelectProeduct] = useState([
        { value: "VELOSURE", label: "VELOSURE" },
        { value: "VELOFREIGHT", label: "VELOFREIGHT" },
        { value: "VELOSKY", label: "VELOSKY" },
        { value: "VELODOC", label: "VELODOC" },
        { value: 'VELOCOMM', label: "VELOCOMM" },
        { value: "VELOCOMM_NDD", label: "VELOCOMM_NDD" },
        { value: "VELOCOMM_SDD", label: "VELOCOMM_SDD" }
    ])
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });

    const [SelectedInfo, setSelectedInfo] = useState({
        customer: "All",
        region: "",
        serviceCenter: "",
        paymentmode: "All",
        product: "",
        mode: "forward",
        PaymentMode: "all"
    })

    // functions
    const OnSelectChange = (key, option) => {
        setSelectedInfo({
            ...SelectedInfo,
            [key]: option?.value
        })
    }
    const handleChange = (range) => {
        setSelectedRange(range);
    };


    //  api functions
    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCentersList, loading: ServiceCenterLoading } = useGetApiCall()
    // defining the get Pending api
    const { apifunc: UploadPendingReport, data: Pending_report, loading: Pending_ReportLoading } = usePostApiCall(null)
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


    // functions
    const CheckClick = async () => {

        const formattedRange = YMD_DateFormate(selectedRange);
        if (formattedRange?.from_date === "" || formattedRange?.to_date === "") {
            alert("select the range")
            return
        }

        let payload = {
            "start_date": formattedRange.from_date,
            "end_date": formattedRange.to_date,
            "product_name": SelectedInfo?.product,
            "service_center_name": SelectedInfo?.serviceCenter,
            "region": SelectedInfo?.region,
            "mode": SelectedInfo?.mode || "forword",
            "payment_mode": SelectedInfo?.PaymentMode || "All"
        }
        console.log(payload, "payload")
        //  calling the api
        const PendingBooking = await UploadPendingReport(PENDING_UPLOAD_REPORT, payload)

        if (PendingBooking) {
            setPendingReportData(PendingBooking?.bookings)
        }
    }

    const DownloadExcle = () => {

        const formattedRange = YMD_DateFormate(selectedRange);
        if (formattedRange?.from_date === "" || formattedRange?.to_date === "") {
            alert("select the range")
            return
        }
        let payload = {
            "start_date": formattedRange.from_date,
            "end_date": formattedRange.to_date,
            "product_name": SelectedInfo?.product,
            "service_center_name": SelectedInfo?.serviceCenter,
            "region": SelectedInfo?.region,
            "mode": SelectedInfo?.mode || "forword",
            "payment_mode": SelectedInfo?.PaymentMode || "All"
        }
        exportToExcel(PendingReportData, "Pending_Report", (item) => ({
            "AWB No": item?.awbno || "",
            "Pick Pincode": item?.pick_pincode || "",
            "Drop Pincode": item?.drop_pincode || "",
            "Weight": item?.weight ?? 0,
            "Shipment Value": item?.shipment_value ?? 0,
            "Payment Mode": item?.paymentmode || "",
            "Customer Name": item?.customer_name || "",
            "Origin SC": item?.orgsc || "",
            "Consignee City": item?.consignee_city || "",
            "Consignee State": item?.consignee_state || "",
            "Date": item?.date || "",
            "COD Amount": item?.cod_amount ?? 0,
            "Shipment Status": item?.shipment_status || "",
            "Product Type": item?.product_type || "",
        }), payload);
    }
    return (
        <div className='page-content py-0'>
            <div className="container-fluid">
                <div className="position-sticky bg-white" style={{ top: "0px", zIndex: 100 }}>
                    <MainHeaderComp title={"Pending Report"} />

                    <Row>

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
                                    name="serviceCenter"
                                    options={ServiceCenters}
                                    placeholder={ServiceCenterLoading ? "loading...." : "Search Service Center"}
                                    onChange={(option) => OnSelectChange("serviceCenter", option)}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        {/* <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Payment Mode</Label>
                                <Select
                                    options={PaymentModes}
                                    name="paymentMode"
                                    onChange={(option) => OnSelectChange("paymentMode", option)}
                                    placeholder="Payment Mode"
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col> */}
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Products</Label>
                                <Select
                                    name="product"
                                    options={Product}
                                    placeholder="Search Product"
                                    onChange={(option) => OnSelectChange("product", option)}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup className="mb-2 " >
                                <FormGroup className="mb-2">
                                    <Label for="Mode">Payment Mode</Label>
                                    <Select
                                        name="PaymentMode"
                                        options={PaymentModes}
                                        placeholder="Select Payment Mode"
                                        onChange={(option) => OnSelectChange("PaymentMode", option)}
                                        isClearable={true}
                                        styles={customStyles} />
                                </FormGroup>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup className="mb-2 " >
                                <FormGroup className="mb-2">
                                    <Label for="Mode">Mode</Label>
                                    <Select
                                        name="mode"
                                        options={ModeOption}
                                        placeholder="Select Mode"
                                        onChange={(option) => OnSelectChange("mode", option)}
                                        isClearable={true}
                                        styles={customStyles} />
                                </FormGroup>
                            </FormGroup>
                        </Col>


                        {/* buttons */}
                        <Col md={3} className='d-flex mb-3'>

                            <Button color="primary" onClick={CheckClick} style={{ height: "2.2rem", width: "100%", marginTop: "28px" }}>
                                {
                                    Pending_ReportLoading ? "Checking..." : "Check"
                                }
                            </Button>
                        </Col>

                    </Row>
                </div>

                <div className=''>
                    <div className='mt-1'>
                        {
                            Pending_ReportLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Pending Report Booking ...</p>
                            </div>
                                :
                                <TableContainer
                                    columns={columns}
                                    data={PendingReportData || []}
                                    isGlobalFilter={true}
                                    isCustomPageSize={true}
                                    isDownloadExcle={true}
                                    isPagination={true}
                                    onDownloadExcle={DownloadExcle}
                                    ExcleLoading={isExporting}
                                    extraFiled={
                                        <div style={{ width: "250px" }}>
                                            <DateRangeInput
                                                value={selectedRange}
                                                onChange={handleChange}
                                                // isBorder={true}
                                                isBorderRight={true}
                                            />
                                        </div>
                                    }
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
    )
}
export default PendingReport