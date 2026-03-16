import React, { useEffect, useMemo } from 'react';
import { Pagination, PaginationItem, PaginationLink, Container, Row, Col, FormGroup, Spinner, Card, CardBody } from 'reactstrap';

import { Button, FormFeedback, Input, Label, Table } from "reactstrap";
import { useState } from "react";
import TableContainer from '../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles } from '../../../helpers/CustomStyle';
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_ADMIN_BOOKING_DETAILS, GET_ALL_REGION, GET_CUSTOMER_PERFORMANCE, GET_USER_API, PRODUCT_LIST, SERVICE_CENTER } from '../../../api';
import formatDateForPayload from '../../../helpers/DateHelper';
import usePostApiCall from '../../../hooks/usePostApiCall';

import AdminBookingFilter from '../../../components/AdminBooking/AdminBookingFilter';
import { GridLoader } from 'react-spinners';
import { downloadExcel } from '../../../helpers/downloadExcel';
import { useExcelExport } from '../../../hooks/useExcelExport';
import MainHeaderCom from '../../../components/MainHeaderCom';
import SelectedItemsDisplay from '../../../components/Common/SelectedItemsDisplay';
import DateRangeInput from '../../../components/Common/DateRangeInput';

const CustomerPerformance = () => {
    useEffect(() => {
        document.title = "Customer Performance";
    }, []);
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
                accessorKey: 'awbdate',
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
                header: 'ORGSC ',
                accessorKey: 'orgsc',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Service Center ',
                accessorKey: 'service_center',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'CheckPts',
                accessorKey: 'CHKPNT',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'TAT',
                accessorKey: 'tat_days',
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
                header: "Attempts",
                accessorKey: 'attempts',
                enableColumnFilter: false,
                enableSorting: true,
            }
        ],
        []
    );

    const [username, setUsername] = useState({})
    // to show and hide the filter
    const [isShowFilter, setIsShowFilter] = useState(false)
    // to store all entries
    const [AllEntries, setAllEntries] = useState({})
    // product list
    const [ProductListOption, setProductListOption] = useState([])
    const [AllRegions, setAllRegions] = useState([])
    const [SelectedProduct, setSelectedProduct] = useState()
    const [SelectedMode, setSelectedMode] = useState()
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });
    // region state
    const [SelectedRegion, setSelectedRegion] = useState()
    // service center option dropdown
    const [ServiceCenterOption, setServiceCenterOption] = useState([])
    // selected service center
    const [SelectedServiceCenters, setSelectedServiceCenters] = useState([])

    const handleChange = (range) => {
        setSelectedRange(range);
    };

    // defining get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()
    // defining the get regions api
    const { apifunc: GetAllRegions, data: Regions } = useGetApiCall()
    //  defining the get customer performance list 
    const { apifunc: GetPerformaceList, data: customerPerformance, loading: customerPerformanceLoading } = usePostApiCall()
    //  defining the get product api
    const { apifunc: GetProductsList, data: ProductList, loading: ProductListLoading } = useGetApiCall()

    // select user option
    const [UserListOptions, setUserListOption] = useState([])

    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCenters } = useGetApiCall()
    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    //  calling user api
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
        //  calling the service center api
        GetServiceCenter(SERVICE_CENTER)
        //  calling the get product list api
        GetProductsList(PRODUCT_LIST)
        //  calling the regions api
        GetAllRegions(GET_ALL_REGION)
    }, [])


    // getting the service center data
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
            const regionCounts = new Map();

            Regions.forEach((ele) => {
                const key = ele?.region?.toLowerCase();
                if (key) {
                    regionCounts.set(key, (regionCounts.get(key) || 0) + 1);
                }
            });

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
            // .filter((item) => {
            //     const key = item.value?.toLowerCase();
            //     return key && regionCounts.get(key) === 1; // Keep only unique
            // });

            console.log(updatedRegions, "updatedRegions")
            setAllRegions(updatedRegions);
        }
    }, [Regions]);

    // onCheck button click
    const [BookingData, setBookingData] = useState([])
    const OnCheckClick = async () => {

        setIsShowFilter(false)
        try {
            // Validate username exists before proceeding
            if (!username.value) {
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
                customer_name: !username.value ? "All" : username.value,
                start_date: updatedDate.from_date,
                end_date: updatedDate.to_date,
                service_center: SelectedServiceCenters.map((ele) => ele?.value),
                product: SelectedProduct?.value || "",
                mode: SelectedMode?.value || "",
                region: SelectedRegion?.map(ele => ele?.value) || []
            };
            // API call
            const Performance = await GetPerformaceList(GET_CUSTOMER_PERFORMANCE, payload);

            if (Performance?.bookings) {
                setBookingData(Performance.bookings);
                setAllEntries(Performance)
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

    // const DownloadBookingDetails = async () => {
    //     try { // Start loading
    //         setIsExporting(true);
    //         setExportProgress(0);
    //         // Transform your data with all required fields
    // const exportData = BookingData.map(item => ({
    //     'AWB No': item.awbno,
    //     'Customer Name': item.customer_name,
    //     'AWB Date': item.awbdate,
    //     'Order No': item.orderno,
    //     'Reference 2': item.ref2,
    //     'Consignee Name': item.consignee_name,
    //     'Consignee City': item.consignee_city,
    //     'Consignee State': item.consignee_state,
    //     'Billing Pincode': item.billing_pincode,
    //     'Vendor Name': item.vendor_name,
    //     'Vendor Pincode': item.vendor_pincode,
    //     'Origin SC': item.orgsc,
    //     'Destination': item.destination,
    //     'Service Center': item.service_center,
    //     'Quantity': item.quantity,
    //     'Weight': item.weight,
    //     'Shipment Value': item.shipment_value,
    //     "TATA Days": item?.tat_days,
    //     'Total Amount': item.total_amount,
    //     'Payment Mode': item.paymentmode,
    //     'RTO AWB No': item.rtoawbno,
    //     'Total Freight': item.tot_freight,
    //     'Invoice No': item.invno,
    //     'Checkpoint': item.CHKPNT
    // }));

    //         await downloadExcel(exportData, 'BookingDetails.xlsx', "", "", (progress) => {
    //             // Update progress
    //             setExportProgress(progress);
    //             console.log(`Export progress: ${progress}%`);
    //         });

    //     } catch (error) {
    //         console.error('Export failed:', error);
    //         alert('Export failed: ' + error.message);
    //     } finally {
    //         // Stop loading regardless of success/failure
    //         setIsExporting(false);
    //     }
    // }


    //  apply filter 

    // 1. Define the async function to download booking details
    const DownloadBookingDetails = async () => {
        // Format dates
        const updatedDate = formatDateForPayload(selectedRange);
        if (updatedDate?.from_date === "" || updatedDate?.to_date === "") {
            alert("Please select a valid date range");
            return;
        }
        // Prepare payload
        const payload = {
            customer_name: !username.value ? "All" : username.value,
            start_date: updatedDate.from_date,
            end_date: updatedDate.to_date,
            service_center: SelectedServiceCenters.map((ele) => ele?.value),
            product: SelectedProduct?.value || "",
            mode: SelectedMode?.value,
            region: SelectedRegion?.map(ele => ele?.value)
        };

        exportToExcel(BookingData, "Customer_performance", (item) => ({
            'AWB No': item.awbno,
            'Customer Name': item.customer_name,
            'AWB Date': item.awbdate,
            'Order No': item.orderno,
            'Reference 2': item.ref2,
            'Consignee Name': item.consignee_name,
            'Consignee City': item.consignee_city,
            'Consignee State': item.consignee_state,
            'Billing Pincode': item.billing_pincode,
            'Vendor Name': item.vendor_name,
            'Vendor Pincode': item.vendor_pincode,
            'Origin SC': item.orgsc,
            'Destination': item.destination,
            'Service Center': item.service_center,
            'Quantity': item.quantity,
            'Weight': item.weight,
            'Shipment Value': item.shipment_value,
            "TATA Days": item?.tat_days,
            'Total Amount': item.total_amount,
            'Payment Mode': item.paymentmode,
            'RTO AWB No': item.rtoawbno,
            'Total Freight': item.tot_freight,
            'Invoice No': item.invno,
            'Checkpoint': item.CHKPNT
        }), payload)
    }
    const ApplyFilter = (filterObj) => {
        // Default empty filter object if none provided
        const filters = filterObj || {};

        // Filter the BookingData based on all provided filters
        const filteredBooking = customerPerformance?.bookings?.filter((item) => {
            return Object.entries(filters).every(([key, value]) => {
                // If filter value is empty or undefined, skip this filter
                if (!value || (Array.isArray(value) && value.length === 0)) return true;

                // Handle different filter cases
                switch (key) {
                    case 'checkpt':
                        return item.CHKPNT === value;
                    case 'Orgsc':
                        return item.orgsc === value;
                    case 'serviceCenter':
                        // Check if item's service_center is in the serviceCenter array
                        return value.some(sc => sc.toLocaleLowerCase() === item?.service_center?.toLocaleLowerCase());
                    case 'region':
                        return true; // Implement your region filtering logic here
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
        <div className='page-content py-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderCom title="Customer Performance" />
            </div>
            <div className="container-fluid">
                <div>
                    <Row className='gx-3 d-flex align-items-center pt-2'>
                        {/*  service centers list */}
                        <Col md={6}>
                            <FormGroup className="mb-2">
                                <Label for="ServiceCenter" className="fw-bold text-muted mb-1">Select Service Center</Label>
                                <div className="d-flex align-items-center">
                                    <div style={{ width: "250px", minWidth: "200px" }}>
                                        <Select
                                            options={ServiceCenterOption}
                                            placeholder="Search Service Center"
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
                                    />
                                </div>
                            </FormGroup>
                        </Col>
                        {/* select region  */}
                        <Col md={6}>
                            <FormGroup className="mb-2">
                                <Label for="Region" className="fw-bold text-muted mb-1">Select Region</Label>
                                <div className="d-flex align-items-center">
                                    <div style={{ width: "250px", minWidth: "200px" }}>
                                        <Select
                                            options={AllRegions}
                                            placeholder="Search"
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
                                    />
                                </div>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row className='gx-3 d-flex align-items-end mt-2'>
                        {/* mode */}
                        <Col md={3}>
                            <div style={{ width: "250px" }}>
                                <FormGroup className="mb-2">
                                    <Label for="Mode">Select Mode</Label>
                                    <Select
                                        options={[
                                            { label: "forward", value: "forward" },
                                            { label: "reverse", value: "reverse" }
                                        ]}
                                        placeholder="Search Mode"
                                        value={SelectedMode}
                                        onChange={setSelectedMode}
                                        isClearable={true}
                                        styles={customStyles} />
                                </FormGroup>
                            </div>
                        </Col>
                        {/* product */}
                        <Col md={3}>
                            <div style={{ width: "250px" }}>
                                <FormGroup className="mb-2">
                                    <Label for="Product">Select Product</Label>
                                    <Select
                                        options={ProductListOption}
                                        placeholder="Search Product"
                                        value={SelectedProduct}
                                        onChange={setSelectedProduct}
                                        isClearable={true}
                                        styles={customStyles} />
                                </FormGroup>
                            </div>
                        </Col>

                        <Col md={2} className='d-flex mb-3 align-content-center flex-wrap gap-2 mt-2'>
                            <Button disabled={customerPerformanceLoading} onClick={OnCheckClick} color="primary" className='mt-3 fw-bold' style={{ height: "2.4rem", width: "100%" }}>
                                Check
                            </Button>
                        </Col>
                        {
                            isShowFilter && <>
                                <AdminBookingFilter
                                    AllEntries={AllEntries}
                                    ApplyFilter={ApplyFilter}
                                    BookingList={BookingData}
                                    avarageData={customerPerformance}
                                />
                            </>
                        }
                    </Row>
                </div>

                <div className=''>
                    {/* <h2>Bookings</h2> */}
                    <div className='mt-1'>
                        {
                            customerPerformanceLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Customer Performance ...</p>
                            </div> :
                                <TableContainer
                                    columns={columns}
                                    data={BookingData || []}
                                    isGlobalFilter={true}
                                    isPagination={true}
                                    SearchPlaceholder="Search From Table"
                                    pagination="pagination"
                                    paginationWrapper='dataTables_paginate paging_simple_numbers'
                                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                    isCustomPageSize={true}
                                    isDownloadExcle={true}
                                    onDownloadExcle={DownloadBookingDetails}
                                    ExcleLoading={isExporting}
                                    isStickyHeader={true}
                                    stickyTop={0}
                                    tableHeight="60vh"
                                    extraFiled={
                                        <div className="d-flex align-items-center">
                                            <div style={{ width: "250px", borderRight: "1px solid #B0ACAC" }}>
                                                <Select options={UserListOptions}
                                                    placeholder="Search Customer"
                                                    value={username?.value ? username : null}
                                                    onChange={setUsername}
                                                    isClearable={true}
                                                    styles={{
                                                        ...customStyles,
                                                        control: (base) => ({
                                                            ...base,
                                                            border: "none",
                                                            boxShadow: "none",
                                                            height: "45px",
                                                            minHeight: "45px",
                                                            backgroundColor: "transparent",
                                                            cursor: "pointer",
                                                        }),
                                                        valueContainer: (base) => ({
                                                            ...base,
                                                            padding: "0 8px"
                                                        }),
                                                        indicatorSeparator: () => ({
                                                            display: "none"
                                                        })
                                                    }} />
                                            </div>
                                            <div style={{ width: "250px" }}>
                                                <DateRangeInput
                                                    value={selectedRange}
                                                    onChange={handleChange}
                                                    isBorderRight={false}
                                                />
                                            </div>
                                        </div>
                                    }
                                />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomerPerformance