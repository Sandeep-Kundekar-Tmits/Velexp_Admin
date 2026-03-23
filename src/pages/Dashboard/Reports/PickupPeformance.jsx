import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, FormGroup, Spinner } from 'reactstrap';
import { Button, FormFeedback, Input, Label, Table } from "reactstrap";
import DateRangeInput from '../../../components/Common/DateRangeInput';
import TableContainer from '../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles } from '../../../helpers/CustomStyle';
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_ALL_REGION, GET_CUSTOMER_SERVICE, GET_OPERATION_PERFORMANCE, GET_PICKUP_PERFORMANCE, GET_USER_API, PRODUCT_LIST, SERVICE_CENTER } from '../../../api';
import usePostApiCall from '../../../hooks/usePostApiCall';
import formatDateForPayload from '../../../helpers/DateHelper';
import { GridLoader } from 'react-spinners';
import { IoMdCloudDownload } from "react-icons/io";
import SelectedItemsDisplay from '../../../components/Common/SelectedItemsDisplay';
import MainHeaderCom from '../../../components/MainHeaderCom';
import PickupPerformanceFilter from '../../../components/Report/PickupPerformanceFilter';
import { FaCloudDownloadAlt } from 'react-icons/fa';
import { downloadExcel } from '../../../helpers/downloadExcel';
import { useExcelExport } from '../../../hooks/useExcelExport';
const PickupPeformance = () => {
    useEffect(() => {
        document.title = "Pickup Performance Report";
    }, []);
    const columns = useMemo(
        () => [
            {
                header: 'Customer Name',
                accessorKey: 'customer_name',  // changed from customer_name to custname
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Awb Date',
                accessorKey: 'awbdate',
                enableColumnFilter: false,
                enableSorting: true,
                size: 150,
            },
            {
                header: 'AWB No.',
                accessorKey: 'awbno',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Order No.',
                accessorKey: 'orderno',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Reference',
                accessorKey: 'ref2',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Consignee Name',
                accessorKey: 'consignee_name',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'City',
                accessorKey: 'consignee_city',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'State',
                accessorKey: 'consignee_state',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Pincode',
                accessorKey: 'billing_pincode',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'ORGSC',
                accessorKey: 'orgsc',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Vendor Name',
                accessorKey: 'vendor_name',
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
                header: 'Checkpnt',
                accessorKey: 'CHKPNT',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Qty',
                accessorKey: 'quantity',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Weight',
                accessorKey: 'weight',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Shipment Value',
                accessorKey: 'shipment_value',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Total Amount',
                accessorKey: 'total_amount',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Payment Mode',
                accessorKey: 'paymentmode',
                enableColumnFilter: false,
                enableSorting: true,
            },

        ],
        []
    );

    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });

    const handleChange = (range) => {
        setSelectedRange(range);
    };


    const [username, setUsername] = useState({})
    // to show and hide the filter
    const [isShowFilter, setIsShowFilter] = useState(false)
    // to store all entries
    const [AllEntries, setAllEntries] = useState({})
    // select user option
    const [UserListOptions, setUserListOption] = useState([])
    // product list
    const [ProductListOption, setProductListOption] = useState([])
    const [SelectedProduct, setSelectedProduct] = useState()
    const [AllRegions, setAllRegions] = useState([])
    // defining get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()

    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCenters } = useGetApiCall()

    // selected service center
    const [SelectedServiceCenters, setSelectedServiceCenters] = useState([])
    // service center option dropdown
    const [ServiceCenterOption, setServiceCenterOption] = useState([])
    // region state
    const [SelectedRegion, setSelectedRegion] = useState()
    const [SelectedMode, setSelectedMode] = useState()
    // onCheck button click
    const [BookingData, setBookingData] = useState([])

    //  defining the get booking list 
    const { apifunc: GetPerformaceList, data: PerformaceList, loading: PerformanceLoading } = usePostApiCall()
    //  defining the get product api
    const { apifunc: GetProductsList, data: ProductList, loading: ProductListLoading } = useGetApiCall()
    // defining the get regions api
    const { apifunc: GetAllRegions, data: Regions } = useGetApiCall()
    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    //  calling user api
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
        GetServiceCenter(SERVICE_CENTER)
        //  calling the get product list api
        GetProductsList(PRODUCT_LIST)
        //  calling the regions api
        GetAllRegions(GET_ALL_REGION)
    }, [])

    useEffect(() => {
        if (UserList) {
            let updatedOptions = UserList
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
            setUserListOption(updatedOptions);
        }

        if (ProductList) {
            let updatedProductList = ProductList?.map((ele) => {
                return {
                    value: ele?.name,
                    label: ele?.name
                }
            })
            setProductListOption(updatedProductList)
        }
    }, [UserList, ProductList]);

    useEffect(() => {
        if (Regions) {
            // Count occurrences of each region (case-insensitive)

            // Filter out regions that appear more than once
            const updatedRegions = Regions
                .map((ele) => ({
                    value: ele?.region,
                    label: ele?.region,
                })).filter((item, index, self) =>
                    index === self.findIndex((t) => t.value.toLowerCase() === item.value?.toLowerCase())
                ).filter((item, index, self) =>
                    index === self.findIndex((t) => t.value === item.value)
                );
            setAllRegions(updatedRegions);
        }
    }, [Regions]);
    //  
    //  getting the service center data
    useEffect(() => {
        if (ServiceCenters) {
            let updatedServiceCenters = ServiceCenters.map((ele) => {
                return {
                    value: ele?.ec_code,
                    label: ele?.ec_code
                }
            })
            setServiceCenterOption(updatedServiceCenters)
        }
    }, [ServiceCenters])

    const OnCheckClick = async () => {
        setIsShowFilter(false)
        try {
            // Validate username exists before proceeding

            // if (SelectedServiceCenters.length < 1) {
            //     alert("Select The Service Centers");
            //     return;
            // }
            if (!username?.value) {
                setUsername({ value: "All", label: "All" })
            }

            // Format dates
            const updatedDate = formatDateForPayload(selectedRange);
            if (updatedDate?.from_date === "" || updatedDate?.to_date === "") {
                alert("Please select a valid date range");
                return;
            }

            // Prepare payload
            const payload = {
                customer_name: username.value ? username.value : "All",
                start_date: updatedDate.from_date,
                end_date: updatedDate.to_date,
                service_center: SelectedServiceCenters.map((ele) => ele?.value) || [],
                product: SelectedProduct?.value || "",
                mode: SelectedMode?.value || "",
                region: SelectedRegion?.map(ele => ele?.value) || []
            };
            // API call
            const records = await GetPerformaceList(GET_PICKUP_PERFORMANCE, payload);

            if (records?.bookings) {
                setBookingData(records?.bookings);
                setAllEntries(records)
                // enabling the filter
                setIsShowFilter(true)
            } else {
                setBookingData([]); // Reset or set to empty array
            }
        } catch (error) {
            console.error("Error in OnCheckClick:", error);
            alert("An error occurred while fetching booking details");
            setBookingData([]); // Reset on error
        }
    };

    const DownloadPickupPerformanceDetails = async () => {
        // Format dates
        const updatedDate = formatDateForPayload(selectedRange);
        if (updatedDate?.from_date === "" || updatedDate?.to_date === "") {
            alert("Please select a valid date range");
            return;
        }

        // Prepare payload
        const payload = {
            customer_name: username.value ? username.value : "All",
            start_date: updatedDate.from_date,
            end_date: updatedDate.to_date,
            service_center: SelectedServiceCenters.map((ele) => ele?.value) || [],
            product: SelectedProduct?.value || "",
            mode: SelectedMode?.value || "",
            region: SelectedRegion?.map(ele => ele?.value) || []
        };

        exportToExcel(BookingData, "PickUpPerformance", (item) => ({
            'AWB No': item?.awbno,
            'AWB Date': item?.awbdate,
            'Order No': item?.orderno,
            'Reference No': item?.ref2,
            'Customer Name': item?.customer_name,
            'Consignee Name': item?.consignee_name,
            'Consignee City': item?.consignee_city,
            'Consignee State': item?.consignee_state,
            'Billing Pincode': item?.billing_pincode,
            'Origin SC': item?.orgsc,
            'Service Center': item?.service_center,
            'Vendor Name': item?.vendor_name,
            'Vendor Pincode': item?.vendor_pincode,
            'Quantity': item?.quantity,
            'Weight': item?.weight,
            'Shipment Value': item?.shipment_value,
            'Total Amount': item?.total_amount,
            'Payment Mode': item?.paymentmode,
            'RTO AWB No': item?.rtoawbno,
            'Destination': item?.destination,
            'Freight Charges': item?.tot_freight,
            'Invoice No': item?.invno,
            'Checkpoint': item?.CHKPNT,
            'TAT (Days)': item?.tat_days,
            'Delivery Attempts': item?.attempts,
        }), payload)
    }

    //  apply filter 
    const ApplyFilter = (filterObj) => {
        // Default empty filter object if none provided
        const filters = filterObj || {};

        // Filter the BookingData based on all provided filters
        const filteredBooking = PerformaceList?.bookings?.filter((item) => {
            return Object.entries(filters).every(([key, value]) => {
                // If filter value is empty or undefined, skip this filter
                if (!value || (Array.isArray(value) && value.length === 0)) return true;
                // Handle different filter cases
                switch (key) {
                    case 'checkpt':
                        return item.CHKPNT === value;
                    default:
                        return true;
                }
            });
        });

        // Update the filtered data
        setBookingData(filteredBooking);
        return filteredBooking;
    };
    return (
        <div className='page-content py-0 px-0' style={{ overflowX: 'hidden' }}>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderCom title="Pickup Performance" />
            </div>
            <div className="container-fluid px-2">
                <div>
                    <Row className='gx-3 d-flex align-items-center pt-2 border-bottom pb-1'>
                        {/* Select Customer moved to table head */}
                        <Col md={12}>
                            <Row>
                                {/*  service centers list */}
                                <Col md={6}>
                                    <FormGroup className="mb-2">
                                        <Label for="ServiceCenter">Select Service Center</Label>
                                        <div className="d-flex align-items-center">
                                            <div style={{ width: "250px", minWidth: "200px" }}>
                                                <Select options={ServiceCenterOption}
                                                    placeholder="Search"
                                                    isMulti={true}
                                                    value={SelectedServiceCenters}
                                                    onChange={setSelectedServiceCenters}
                                                    isClearable={true}
                                                    controlShouldRenderValue={false}
                                                    hideSelectedOptions={false}
                                                    styles={customStyles} />
                                            </div>
                                            <SelectedItemsDisplay
                                                selectedItems={SelectedServiceCenters || []}
                                                onRemove={(itemToRemove) => {
                                                    setSelectedServiceCenters(prev => prev.filter(item => item.value !== itemToRemove.value));
                                                }}
                                                targetId="serviceCenterPopover"
                                                placeholder='No Service Center Selected'
                                            />
                                        </div>
                                    </FormGroup>
                                </Col>
                                {/* select region  */}
                                <Col md={6}>
                                    <FormGroup className="mb-2">
                                        <Label for="Region">Select Region</Label>
                                        <div className="d-flex align-items-center">
                                            <div style={{ width: "250px", minWidth: "200px" }}>
                                                <Select
                                                    options={AllRegions}
                                                    placeholder="Search Region"
                                                    isMulti={true}
                                                    value={SelectedRegion}
                                                    onChange={setSelectedRegion}
                                                    isClearable={true}
                                                    controlShouldRenderValue={false}
                                                    hideSelectedOptions={false}
                                                    styles={customStyles} />
                                            </div>
                                            <SelectedItemsDisplay
                                                selectedItems={SelectedRegion || []}
                                                onRemove={(itemToRemove) => {
                                                    setSelectedRegion(prev => prev.filter(item => item.value !== itemToRemove.value));
                                                }}
                                                targetId="regionPopover"
                                                placeholder='No Region Selected'
                                            />
                                        </div>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Col>

                    </Row>
                    <Row className='gx-3 d-flex align-items-end mt-2'>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label className='mb-1'>Select Date Range</Label>
                                <DateRangeInput
                                    value={selectedRange}
                                    isBorder={true}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label className='mb-1' for="Customer">Customer</Label>
                                <Select
                                    options={UserListOptions}
                                    placeholder="Search Customer"
                                    value={username?.value ? username : null}
                                    onChange={setUsername}
                                    isClearable={true}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={customStyles}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label className='mb-1' for="Mode">Select Mode</Label>
                                <Select
                                    options={[
                                        { label: "forward", value: "forward" },
                                        { label: "reverse", value: "reverse" }
                                    ]}
                                    placeholder="Search Mode"
                                    value={SelectedMode}
                                    onChange={setSelectedMode}
                                    isClearable={true}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>

                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label className='mb-1' for="Product">Select Product</Label>
                                <Select
                                    options={ProductListOption}
                                    placeholder="Search Product"
                                    value={SelectedProduct}
                                    onChange={setSelectedProduct}
                                    isClearable={true}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row className='gx-3 d-flex align-items-center mt-2'>
                        <Col md={3} className=' d-flex align-items-center gap-2 mb-2'>
                            <Button color="primary" disabled={PerformanceLoading} style={{ height: "38px", width: "100%" }} onClick={OnCheckClick}>
                                Check
                            </Button>
                        </Col>
                        {
                            isShowFilter && <PickupPerformanceFilter
                                AllEntries={AllEntries}
                                ApplyFilter={ApplyFilter}
                                BookingList={() => { }}
                            />
                        }
                    </Row>
                </div>

                <div className=''>

                    <div className='mt-3'>
                        {
                            PerformanceLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Pickup Performance ...</p>
                            </div>
                                :
                                <TableContainer
                                    columns={columns}
                                    data={BookingData || []}
                                    isGlobalFilter={true}
                                    isCustomPageSize={true}
                                    isDownloadExcle={true}
                                    isPagination={true}
                                    SearchPlaceholder="Search From Table"
                                    pagination="pagination"
                                    paginationWrapper='dataTables_paginate paging_simple_numbers'
                                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                    onDownloadExcle={DownloadPickupPerformanceDetails}
                                    ExcleLoading={isExporting}
                                    isStickyHeader={true}
                                    stickyTop={0}
                                    tableHeight="60vh"
                                />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
export default PickupPeformance