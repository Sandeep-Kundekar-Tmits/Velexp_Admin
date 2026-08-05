import { Button, Col, FormGroup, Label, Row } from "@/components/ui"
import Select from 'react-select'
import { customStyles } from "../../../helpers/CustomStyle"
import { FaCloudDownloadAlt } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchServiceCenters } from "@/services/reference.service";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { GET_USER_API, UPLOAD_GET_REVENUE_API } from "../../../api";
import TableContainer from "../../../components/Table/TableContainer";
import usePostApiCall from "../../../hooks/usePostApiCall";
import Loader from "@/Loaders/Loader";
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
    // service centers -- cached 30min via react-query instead of refetched on every mount
    const { data: ServiceCentersList, isLoading: ServiceCenterLoading } = useQuery({
        queryKey: qk.reference.serviceCenters(),
        queryFn: fetchServiceCenters,
        staleTime: 30 * 60_000,
    })
    // defining the get revenue api
    const { apifunc: UploadRevenue, data: RevenueData, loading: RevenueDataLoading } = usePostApiCall()
    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    // useEffects
    useEffect(() => {
        // calling the customer api
        GetAllCustomers(`${GET_USER_API}/`)
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
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            {/* No sticky wrapper: MainHeaderComp draws nothing inline now, it
                hands the title to the layout's PageHeader. */}
            <MainHeaderComp
                title="Old Revenue Report"
                subTitle="Revenue by customer, service centre and region."
            />
            <div className="container-fluid page-fit-body relative z-10 pb-4">
                <div className="">
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
                        {/* items-end + mb-2, not mt-4: the button has no label
                            above it, and mt-4 was a hand-picked 16px standing
                            in for a label whose real height is ~22px -- so the
                            button sat above the inputs' baseline instead of on
                            it. mb-2 matches the FormGroup margin beside it. */}
                        <Col md={3} className="mb-2 flex items-end">
                            <Button
                                color="primary"
                                onClick={CheckClick}
                                className="w-full"
                                style={{ height: "38px" }}
                            >
                                {
                                    RevenueDataLoading ? "Checking..." : "Check"
                                }
                            </Button>
                        </Col>
                    </Row>

                    {/*  filter section */}
                    {
                        RevenueListData?.total_revenue &&
                        /* Stat tiles on the same glass as the rest of the app,
                           and sized like the customer list's: ~92px, so they
                           give context without competing with the grid for the
                           screen. Was three bordered Cards in a Row, ~124px
                           tall and painted on the canvas. */
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {[
                                ["Total Revenue", RevenueListData?.total_revenue],
                                ["Total Shipments", RevenueListData?.bookings?.length],
                                ["Average", Math.ceil(RevenueListData?.total_revenue / RevenueListData?.bookings?.length)],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-xl border border-white/8 bg-[rgba(17,24,39,0.70)] p-3.5 backdrop-blur-xl"
                                >
                                    <p className="m-0 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                                        {label}
                                    </p>
                                    <p className="m-0 mt-1.5 text-[22px] font-semibold leading-tight tracking-tight text-white">
                                        {Number.isFinite(value) ? value.toLocaleString() : (value ?? "--")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    }

                </div>

                <div className="page-fit-body mt-4">
                    {
                        RevenueDataLoading ? <Loader message="Loading ..." fullscreen={false} />
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
                                /* table-bordered dropped: .grid-shell draws the
                                   row rules now, and the two only fought. */
                                tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                theadClass="sticky top-0 z-10"
                                isStickyHeader={true}
                                stickyTop={0}
                                fillHeight
                                tableHeight="60vh"
                                isDownloadExcle={true}
                                ExcleLoading={isExporting}
                                onDownloadExcle={DownloadRevenueDetails}
                            />
                    }
                </div>
            </div>
        </div>
    )
}
export default RevenueReport