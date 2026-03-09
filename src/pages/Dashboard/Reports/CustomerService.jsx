import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, FormGroup, Spinner } from 'reactstrap';
import { Button, FormFeedback, Input, Label, Table } from "reactstrap";
import DateRangePicker from "@paprika/date-range-picker";
import TableContainer from '../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles } from '../../../helpers/CustomStyle';
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_ADMIN_BOOKING_DETAILS, GET_CUSTOMER_SERVICE, GET_USER_API, SERVICE_CENTER } from '../../../api';
import usePostApiCall from '../../../hooks/usePostApiCall';
import formatDateForPayload from '../../../helpers/DateHelper';
import { GridLoader } from 'react-spinners';
import { IoMdCloudDownload } from "react-icons/io";
import CustomerServiceFilter from '../../../components/CustomerService/CustomerServiceFilter';
const CustomerService = () => {
    useEffect(() => {
        document.title = "Customer Services";
    }, []);
    const columns = useMemo(
        () => [
            {
                header: 'Customer Name',
                accessorKey: 'custname',  // changed from customer_name to custname
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
    // defining get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()

    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCenters } = useGetApiCall()

    // selected service center
    const [SelectedServiceCenters, setSelectedServiceCenters] = useState([])
    // service center option dropdown
    const [ServiceCenterOption, setServiceCenterOption] = useState([])
    // onCheck button click
    const [BookingData, setBookingData] = useState([])

    //  defining the get booking list 
    const { apifunc: GetBookingList, data: BookingList, loading: bookingLoading } = usePostApiCall()
    //  calling user api
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
        GetServiceCenter(SERVICE_CENTER)
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
    }, [UserList]);

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

            if (SelectedServiceCenters.length < 1) {
                alert("Select The Service Centers");
                return;
            }
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
                customer_name: username.value ? username.value : { value: "All", label: "All" },
                start_date: updatedDate.from_date,
                end_date: updatedDate.to_date,
                service_center: SelectedServiceCenters.map((ele) => ele?.value)
            };
            // API call
            const records = await GetBookingList(GET_CUSTOMER_SERVICE, payload);

            if (records?.records) {
                setBookingData(records?.records);
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


    //  apply filter 
    const ApplyFilter = (filterObj) => {
        // Default empty filter object if none provided
        const filters = filterObj || {};

        // Filter the BookingData based on all provided filters
        const filteredBooking = BookingList?.records?.filter((item) => {
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
        <div className='page-content'>
            <div className="container-fluid">
                <div>
                    <h3 className='pb-3 border-bottom'>Download Customer Services</h3>
                    <Row className='gx-3 d-flex align-items-center '>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Customer</Label>
                                <Select options={UserListOptions}
                                    placeholder="Search Customer"
                                    value={username}
                                    onChange={setUsername}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>

                        {/*  service centers list */}
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Service Center</Label>
                                <Select options={ServiceCenterOption}
                                    placeholder="Search"
                                    isMulti={true}
                                    value={SelectedServiceCenters}
                                    onChange={setSelectedServiceCenters}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>


                        {/* Date Range Picker */}
                        <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label>Start Date and End Date</Label>
                                <div style={{ minWidth: "200px" }}>
                                    <DateRangePicker
                                        startDate={selectedRange.startDate}
                                        endDate={selectedRange.endDate}
                                        onChange={handleChange}
                                        className="my-custom-range-picker"
                                    />
                                </div>
                            </FormGroup>
                        </Col>

                        <Col md={2} className=' d-flex align-items-cente'>
                            <div className="d-flex align-items-center gap-2 mt-2">
                                <Button color="primary" disabled={bookingLoading} style={{ height: "2.2rem", width: "4rem" }} onClick={OnCheckClick}>
                                    Check
                                </Button>

                                <Button
                                    color="primary"
                                    className='d-flex justify-content-center align-items-center'
                                    disabled={BookingData.length < 1}
                                    // onClick={DownloadBookingDetails}
                                    title='Download'
                                    style={{ height: "2.2rem", width: "4rem" }}
                                >
                                    <IoMdCloudDownload style={{ width: "25px", height: "25px" }} />
                                </Button>
                            </div>
                        </Col>
                        {
                            isShowFilter && <CustomerServiceFilter
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
                            bookingLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Customer Services ...</p>
                            </div>
                                :
                                <TableContainer
                                    columns={columns}
                                    data={BookingData || []}
                                    isGlobalFilter={true}
                                    isPagination={true}
                                    isDownloadExcle={true}
                                    isCustomPageSize={true}
                                    SearchPlaceholder="Search From Table"
                                    pagination="pagination"
                                    paginationWrapper='dataTables_paginate paging_simple_numbers'
                                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                    // onDownloadExcle={}
                                    // ExcleLoading={}
                                />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
export default CustomerService