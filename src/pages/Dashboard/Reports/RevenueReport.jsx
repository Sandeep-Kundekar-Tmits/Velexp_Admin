import { Button, Card, CardBody, Col, FormGroup, Label, Row } from "reactstrap"
import Select from 'react-select'
import { customStyles } from "../../../helpers/CustomStyle"
import { FaCloudDownloadAlt } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { GET_USER_API, SERVICE_CENTER, UPLOAD_GET_REVENUE_API } from "../../../api";
import TableContainer from "../../../components/Table/TableContainer";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { GridLoader } from "react-spinners";
import { downloadExcel } from "../../../helpers/downloadExcel";
import { useExcelExport } from "../../../hooks/useExcelExport";
import MainHeaderComp from "../../../components/MainHeaderCom";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import { format } from "date-fns";

const RevenueReport = () => {

    const columns = useMemo(
        () => [
            {
                header: 'Customer Name',
                accessorKey: 'customer_name',
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
                header: 'AWB No.',
                accessorKey: 'awbno',
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
                header: 'Destination SC',
                accessorKey: 'destination_sc',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Weight ',
                accessorKey: 'weight',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'No pieces',
                accessorKey: 'quantity',
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
                header: 'Total',
                accessorKey: 'total_amount',
                enableColumnFilter: false,
                enableSorting: true,
            },
        ],
        []
    );

    // states
    const [RevenueListData, setRevenueListData] = useState([])
    const [Customers, setCustomers] = useState([])
    const [Regions, setRegions] = useState([])
    const [ServiceCenters, setServiceCenters] = useState([])
    const [Modes, setMode] = useState([
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
        customer: "",
        region: "",
        serviceCenter: "",
        mode: "",
        product: ""
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
    // defining get user api
    const { apifunc: GetAllCustomers, data: CustomerList, loading: CustomerLoading } = useGetApiCall()
    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCentersList, loading: ServiceCenterLoading } = useGetApiCall()
    // defining the get revenue api
    const { apifunc: UploadRevenue, data: RevenueData, loading: RevenueDataLoading } = usePostApiCall()
    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    // useEffects
    useEffect(() => {
        // calling the customer api
        GetAllCustomers(`${GET_USER_API}/`)
        // calling the service Center api
        GetServiceCenter(SERVICE_CENTER)
    }, [])


    useEffect(() => {

        // customers
        if (CustomerList) {
            let updatedOptions = CustomerList
                .filter(ele => {
                    const name = ele?.customer_name?.trim();
                    return name != null &&
                        name !== "null" &&
                        name !== "undefined" &&
                        name !== "";
                })
                .map((ele) => ({
                    value: ele.customer_name,
                    label: ele.customer_name
                }));

            setCustomers(updatedOptions)
        }

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


    }, [CustomerList, ServiceCentersList])


    // functions
    const CheckClick = async () => {
        setRevenueListData({})
        if (selectedRange.startDate === "" && selectedRange.endDate === "") {
            alert("select the range")
            return
        }

        if (SelectedInfo.customer === "") {
            setSelectedInfo("All")
        }

        const formattedRange = {
            start: selectedRange?.startDate
                ? format(selectedRange.startDate, 'dd-MM-yyyy')
                : "",
            end: selectedRange?.endDate
                ? format(selectedRange.endDate, 'dd-MM-yyyy')
                : "",
        };

        let payload = {
            "start_date": formattedRange?.start,
            "end_date": formattedRange?.end,
            "customer_name": SelectedInfo?.customer ? SelectedInfo?.customer : "All",
            "product_name": SelectedInfo?.product,
            "service_center_name": SelectedInfo?.serviceCenter,
            "region": SelectedInfo?.region,
            "mode": SelectedInfo?.mode
        }
        //  calling the api
        const Revenue = await UploadRevenue(UPLOAD_GET_REVENUE_API, payload)

        if (Revenue) {
            setRevenueListData(Revenue?.bookings)
        }
    }

    const DownloadRevenueDetails = async () => {
        if (!selectedRange.startDate && !selectedRange.endDate) {
            alert("select the range")
            return
        }

        const formattedRange = {
            start: selectedRange?.startDate
                ? format(selectedRange.startDate, 'dd-MM-yyyy')
                : "",
            end: selectedRange?.endDate
                ? format(selectedRange.endDate, 'dd-MM-yyyy')
                : "",
        };


        let payload = {
            "start_date": formattedRange?.start,
            "end_date": formattedRange?.end,
            "customer_name": SelectedInfo?.customer ? SelectedInfo?.customer : "All",
            "product_name": SelectedInfo?.product,
            "service_center_name": SelectedInfo?.serviceCenter,
            "region": SelectedInfo?.region,
            "mode": SelectedInfo?.mode
        }

        exportToExcel(RevenueListData, "Revenue_Report", (item) => ({
            'AWB No': item.awbno,
            'Customer Name': item.customer_name,
            'Pickup Pincode': item.pick_pincode,
            'Drop Pincode': item.drop_pincode,
            'Weight': item.weight,
            'Quantity': item?.quantity,
            'Destination_SC': item?.destination_sc,
            'Shipment Value': item.shipment_value,
            'Payment Mode': item.paymentmode,
            'Origin SC': item.orgsc,
            'Consignee City': item.consignee_city,
            'Consignee State': item.consignee_state,
            'Length': item.length,
            'Breadth': item.breadth,
            'Height': item.height,
            'Volumetric Weight': item.volwt,
            'ODA Amount': item.oda_amount,
            'Product Type': item.product_type,
            'Customer Type': item.customer_type,
            'Zone': item.zone,
            'Total Amount': item.total_amount,
            // 'Call From': item.callfrom
        }), payload)
    }
    return (
        <div className='page-content py-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp title="Revenue Report" />
            </div>
            <div className="container-fluid">
                <div className="mt-4">
                    <Row>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Customer</Label>
                                <Select
                                    name="customer"
                                    options={Customers}
                                    placeholder={CustomerLoading ? "Loading..." : "Search Customer"}
                                    isClearable={true}
                                    onChange={(option) => OnSelectChange("customer", option)}
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
                            <FormGroup className="mb-2 " >
                                <Label for="Mode">Mode</Label>
                                <Select
                                    name="mode"
                                    options={Modes}
                                    placeholder="Payment Mode"
                                    onChange={(option) => OnSelectChange("mode", option)}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
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
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Date Range</Label>
                                <DateRangeInput
                                    value={selectedRange}
                                    onChange={handleChange}
                                    isBorder={true}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3} className='d-flex mt-4 align-content-center flex-wrap gap-2'>
                            <Button color="primary" onClick={CheckClick} style={{ width: "100%", height: "38px" }}>
                                {
                                    RevenueDataLoading ? "Checking..." : "Check"
                                }
                            </Button>
                        </Col>
                    </Row>

                    {/*  filter section */}
                    {
                        RevenueListData?.total_revenue &&
                        <Row className="border-top pt-4 ms-0" style={{ width: "100%" }}>
                            <Col md="3">
                                <Card className="mb-3 border" style={{ minHeight: "70px" }}>
                                    <CardBody className="py-2">
                                        <h5 className="text-muted text-center">Total Revenue</h5>
                                        <h3 className="my-2 text-center">{RevenueListData?.total_revenue}</h3>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col md="3">
                                <Card className="mb-3 border" style={{ minHeight: "70px" }}>
                                    <CardBody className="py-2">
                                        <h5 className="text-muted text-center">Total Shipments</h5>
                                        <h3 className="my-2 text-center">{RevenueListData?.bookings?.length}</h3>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col md="3">
                                <Card className="mb-3  border" style={{ minHeight: "70px" }}>
                                    <CardBody className="py-2">
                                        <h5 className="text-muted text-center">Avarage</h5>
                                        <h3 className="my-0 text-center">{Math.ceil(RevenueListData?.total_revenue / RevenueListData?.bookings?.length)}</h3>
                                    </CardBody>
                                </Card>
                            </Col>
                            {/* <Col md="3">
                                <Card className="mb-3 shadow-sm" style={{ minHeight: "80px" }}>
                                    <CardBody className="py-2">
                                        <h5 className="text-muted text-center"></h5>
                                        <h3 className="my-2 text-center"></h3>
                                    </CardBody>
                                </Card>
                            </Col> */}
                        </Row>
                    }

                </div>

                <div className=''>
                    {/* <h2>Bookings</h2> */}
                    <div className='mt-1'>
                        {
                            RevenueDataLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading ...</p>
                            </div>
                                :
                                <TableContainer
                                    columns={columns}
                                    data={RevenueListData || []}
                                    isGlobalFilter={true}
                                    isPagination={true}
                                    isCustomPageSize={true}
                                    SearchPlaceholder="Search From Table"
                                    pagination="pagination"
                                    paginationWrapper='dataTables_paginate paging_simple_numbers'
                                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                    isDownloadExcle={true}
                                    ExcleLoading={isExporting}
                                    onDownloadExcle={DownloadRevenueDetails}
                                />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
export default RevenueReport