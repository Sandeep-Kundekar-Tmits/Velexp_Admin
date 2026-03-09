import React, { useEffect, useMemo } from 'react';
import { Pagination, PaginationItem, PaginationLink, Container, Row, Col, FormGroup, Spinner } from 'reactstrap';

import { Button, FormFeedback, Input, Label, Table } from "reactstrap";
import DateRangePicker from "@paprika/date-range-picker";
import { useState } from "react";
import TableContainer from '../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles } from '../../../helpers/CustomStyle';
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_ADMIN_BOOKING_DETAILS, GET_USER_API, PRODUCT_LIST, SERVICE_CENTER } from '../../../api';
import formatDateForPayload from '../../../helpers/DateHelper';
import usePostApiCall from '../../../hooks/usePostApiCall';

import AdminBookingFilter from '../../../components/AdminBooking/AdminBookingFilter';
import { GridLoader } from 'react-spinners';
import { downloadExcel } from '../../../helpers/downloadExcel';
const AdminBooking = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    useEffect(() => {
        document.title = "Admin Booking";
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
    const [SelectedProduct, setSelectedProduct] = useState()
    const [SelectedMode, setSelectedMode] = useState()
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });
    // service center option dropdown
    // const [ServiceCenterOption, setServiceCenterOption] = useState([])
    // selected service center
    const [SelectedServiceCenters, setSelectedServiceCenters] = useState([])

    const handleChange = (range) => {
        setSelectedRange(range);
    };

    // defining get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()

    //  defining the get booking list 
    const { apifunc: GetBookingList, data: BookingList, loading: bookingLoading } = usePostApiCall()
    //  defining the get product api
    const { apifunc: GetProductsList, data: ProductList, loading: ProductListLoading } = useGetApiCall()

    // select user option
    const [UserListOptions, setUserListOption] = useState([])

    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCenters } = useGetApiCall()

    //  calling user api
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
        //  calling the service center api
        GetServiceCenter(SERVICE_CENTER)
        //  calling the get product list api
        GetProductsList(PRODUCT_LIST)
    }, [])


    // getting the service center data
    // useEffect(() => {
    //     if (ServiceCenters) {
    //         let updatedServiceCenters = ServiceCenters.map((ele) => {
    //             return {
    //                 value: ele?.ec_code,
    //                 label: ele?.ec_code
    //             }
    //         })
    //         setServiceCenterOption(updatedServiceCenters)
    //     }
    // }, [ServiceCenters])

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
                customer_name: !username.value ? { value: "All", label: "All" } : username.value,
                start_date: updatedDate.from_date,
                end_date: updatedDate.to_date,
                service_center: SelectedServiceCenters.map((ele) => ele?.value),
                product: SelectedProduct?.value,
                mode: SelectedMode?.value
            };
            // API call
            const booking = await GetBookingList(GET_ADMIN_BOOKING_DETAILS, payload);

            if (booking?.bookings) {
                setBookingData(booking.bookings);
                setAllEntries(booking)
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
        // 2. Start try block for error handling
        try {
            // 3. Set loading state to true to show export in progress
            setIsExporting(true);

            // 4. Initialize progress counter at 0%
            setExportProgress(0);

            // 5. Transform raw booking data into export format with clean field names
            const exportData = BookingData.map(item => ({
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
            }));

            // 7. Define maximum records per Excel file (50,000)
            const CHUNK_SIZE = 50000;

            // 8. Calculate total number of files needed
            const totalChunks = Math.ceil(exportData.length / CHUNK_SIZE);

            // 9. Create timestamp for unique filenames (replaces special chars)
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            // 10. Set base filename for all chunks
            const baseFilename = 'BookingDetails';

            // 11. Loop through each chunk of data
            for (let i = 0; i < totalChunks; i++) {
                // 12. Calculate start index for current chunk
                const start = i * CHUNK_SIZE;

                // 13. Calculate end index for current chunk
                const end = start + CHUNK_SIZE;

                // 14. Extract the current chunk of data
                const chunk = exportData.slice(start, end);

                // 15. Create descriptive filename with part number and timestamp
                const filename = `${baseFilename}_part${i + 1}-of-${totalChunks}_${timestamp}.xlsx`;

                // 16. Calculate overall progress percentage
                const progress = Math.round(((i + 1) / totalChunks) * 100);

                // 17. Update progress state
                setExportProgress(progress);

                // 18. Log progress to console
                console.log(`Exporting ${filename} (${progress}%)`);

                // 19. Export current chunk using your existing downloadExcel function
                await downloadExcel(
                    chunk,
                    filename,
                    "",
                    "",
                    () => { } // Empty progress callback for individual files
                );

                // 20. Add small delay between chunks to keep UI responsive
                if (i < totalChunks - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // 21. Set progress to 100% when all chunks complete
            setExportProgress(100);
            // 22. Show success alert with total records and file count
            alert(`Successfully exported ${exportData.length} records in ${totalChunks} files.`);
            // 23. Catch block for error handling
        } catch (error) {
            // 24. Log detailed error to console
            console.error('Export failed:', error);
            // 25. Show user-friendly error message
            alert('Export failed: ' + error.message);
            // 26. Finally block to clean up
        } finally {
            // 27. Reset loading state regardless of success/failure
            setIsExporting(false);
        }
    }
    const ApplyFilter = (filterObj) => {
        // Default empty filter object if none provided
        const filters = filterObj || {};

        // Filter the BookingData based on all provided filters
        const filteredBooking = BookingList?.bookings?.filter((item) => {
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
        <div className='page-content'>
            <div className="container-fluid">
                <div>
                    <h3 className='pb-3 border-bottom'>Admin Booking Download</h3>
                    <Row className='d-flex justify-content-between pt-2'>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Customer</Label>
                                <Select options={UserListOptions}
                                    placeholder="Search Customer"
                                    value={username || { value: "All", label: "All" }}
                                    onChange={setUsername}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        {/* Date Range Picker */}
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label>Start Date and End Date</Label>
                                <div style={{ minWidth: "200px" }}>
                                    <DateRangePicker
                                        startDate={selectedRange.startDate}
                                        endDate={selectedRange.endDate}
                                        onChange={handleChange}
                                    />
                                </div>
                            </FormGroup>
                        </Col>
                        {/* product */}
                        <Col md={2}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Product</Label>
                                <Select
                                    options={ProductListOption}
                                    placeholder="Search Product"
                                    value={SelectedProduct}
                                    onChange={setSelectedProduct}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>

                        {/* mode */}

                        <Col md={2}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Mode</Label>
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
                        </Col>



                        {/*  service centers list */}
                        {/* <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Service Center</Label>
                                <Select options={ServiceCenterOption}
                                    placeholder="Search Service Center"
                                    isMulti={true}
                                    value={SelectedServiceCenters}
                                    onChange={setSelectedServiceCenters}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col> */}




                        <Col md={2} className='d-flex align-items-baseline flex-wrap gap-2'>
                            {/* <div className="d-flex "> */}
                            <FormGroup className="mb-2">
                                <Button disabled={bookingLoading} onClick={OnCheckClick} color="primary" className='' style={{ height: "2.3rem", width: "8rem",marginTop:"28px" }}>
                                    Check
                                </Button>
                            </FormGroup>

                            {/* <Button
                                    color="primary"
                                    disabled={BookingData.length < 1}
                                    onClick={DownloadBookingDetails}
                                    style={{ height: "2.2rem", width: "10rem" }}
                                >
                                    {isExporting ? (
                                        <>
                                            <span className="spinner"></span>
                                            Exporting...
                                        </>
                                    ) : (
                                        'Download'
                                    )}

                                </Button> */}
                            {/* </div> */}
                        </Col>
                        {
                            isShowFilter &&
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h3 className="m-0">Filters</h3>
                                </div>
                                <AdminBookingFilter
                                    AllEntries={AllEntries}
                                    ApplyFilter={ApplyFilter}
                                    BookingList={BookingData}
                                />
                            </>
                        }

                    </Row>
                </div>

                <div className=''>
                    {/* <h2>Bookings</h2> */}
                    <div className='mt-1'>
                        {
                            bookingLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Admin Booking ...</p>
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
                                    isBordered={true}
                                    isDownloadExcle={true}
                                    isCustomPageSize={true}
                                    onDownloadExcle={DownloadBookingDetails}
                                />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminBooking