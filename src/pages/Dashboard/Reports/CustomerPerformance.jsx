import React, { useEffect, useMemo } from 'react';
import { Pagination, PaginationItem, PaginationLink, Container, Spinner, Card, CardBody } from "@/components/ui";

import { Button, FormFeedback, Input, Label, Table } from "@/components/ui";
import { useState } from "react";
import TableContainer from '../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles, CheckboxOption, SelectedCountValue } from '../../../helpers/CustomStyle';
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { useServiceCenters } from '../../../hooks/queries/useReferenceData';
import { GET_ADMIN_BOOKING_DETAILS, GET_ALL_REGION, GET_CUSTOMER_PERFORMANCE, GET_USER_API, PRODUCT_LIST } from '../../../api';
import formatDateForPayload from '../../../helpers/DateHelper';
import usePostApiCall from '../../../hooks/usePostApiCall';

import AdminBookingFilter from '../../../components/AdminBooking/AdminBookingFilter';
import Loader from "@/Loaders/Loader";
import { downloadExcel } from '../../../helpers/downloadExcel';
import { useExcelExport } from '../../../hooks/useExcelExport';
import MainHeaderCom from '../../../components/MainHeaderCom';
import DateRangeInput from '../../../components/Common/DateRangeInput';
import ToasterProvider from '../../../helpers/ToasterProvider';

/* Same contract as LastMileOperations.jsx: a checkbox per option instead of a
   chip strip beside the control, and a count in the control instead of one
   chip per value. See CustomStyle.jsx for why. */
const MULTI_SELECT_PROPS = {
    isMulti: true,
    isClearable: true,
    hideSelectedOptions: false,
    closeMenuOnSelect: false,
    styles: customStyles,
    components: { Option: CheckboxOption, ValueContainer: SelectedCountValue },
    menuPortalTarget: document.body,
    menuPosition: "fixed",
};

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
    const { ErrorToaster, SuccessToaster } = ToasterProvider()

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
    // service centers -- cached 30min, shared across every screen that asks
    const { data: ServiceCenterOption = [] } = useServiceCenters()
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

    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    //  calling user api
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
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
                ErrorToaster(Performance?.message)
                setBookingData([]); // Reset or set to empty array
            }
        } catch (error) {
            console.error("Error in OnCheckClick:", error);
            ErrorToaster("An error occurred while fetching booking details");
            setBookingData([]); // Reset on error
        }
    };

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
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderCom title="Customer Performance" subTitle="Every filter combined, one customer's bookings." />

            <div className="page-fit-body relative z-10 pb-4">
                {/* Filters -- see LastMileOperations.jsx for the reasoning:
                    checkboxes in the dropdown replace the chip strip beside
                    the control, and every field wraps to the next line rather
                    than push the row past the card. */}
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Service Center
                        </Label>
                        <Select
                            options={ServiceCenterOption}
                            placeholder="Search Service Center"
                            value={SelectedServiceCenters}
                            onChange={setSelectedServiceCenters}
                            {...MULTI_SELECT_PROPS}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Region
                        </Label>
                        <Select
                            options={AllRegions}
                            placeholder="Search Region"
                            value={SelectedRegion}
                            onChange={setSelectedRegion}
                            {...MULTI_SELECT_PROPS}
                        />
                    </div>

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

                    <div className="flex w-full flex-col gap-1.5 sm:w-52">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Customer
                        </Label>
                        <Select
                            options={UserListOptions}
                            placeholder="Search Customer"
                            value={username?.value ? username : null}
                            onChange={setUsername}
                            isClearable={true}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-40">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Mode
                        </Label>
                        <Select
                            options={[
                                { label: "forward", value: "forward" },
                                { label: "reverse", value: "reverse" }
                            ]}
                            placeholder="Search Mode"
                            value={SelectedMode}
                            onChange={setSelectedMode}
                            isClearable={true}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-48">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Product
                        </Label>
                        <Select
                            options={ProductListOption}
                            placeholder="Search Product"
                            value={SelectedProduct}
                            onChange={setSelectedProduct}
                            isClearable={true}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>

                    <Button
                        disabled={customerPerformanceLoading}
                        onClick={OnCheckClick}
                        color="primary"
                        className="h-9.5 shrink-0 px-6"
                    >
                        Check
                    </Button>
                </div>

                {isShowFilter && (
                    <div className="mt-4">
                        <AdminBookingFilter
                            AllEntries={AllEntries}
                            ApplyFilter={ApplyFilter}
                            BookingList={BookingData}
                            avarageData={customerPerformance}
                        />
                    </div>
                )}

                <div className="page-fit-body mt-4">
                    {
                        customerPerformanceLoading ? <Loader message="Loading Customer Performance ..." fullscreen={false} /> : (
                            <TableContainer
                                columns={columns}
                                data={BookingData || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                theadClass="sticky top-0 z-10"
                                isCustomPageSize={true}
                                isDownloadExcle={true}
                                onDownloadExcle={DownloadBookingDetails}
                                ExcleLoading={isExporting}
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

export default CustomerPerformance