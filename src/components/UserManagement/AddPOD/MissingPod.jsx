import DateRangeInput from '../../../components/Common/DateRangeInput';
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select'
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardHeader, CardBody, Col, FormGroup, Label, Row, Spinner, Alert, Offcanvas, OffcanvasHeader, OffcanvasBody } from 'reactstrap';
import { customStyles } from '../../../helpers/CustomStyle';
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_MISSING_POD, POST_USER_API } from '../../../api';
import formatDateForPayload from '../../../helpers/DateHelper';
import usePostApiCall from '../../../hooks/usePostApiCall';
import MissingPodTable from './MissingPodTable';
import TableContainer from '../../Table/TableContainer';

/**
 * MissingPod Component
 * An Offcanvas/Modal component used to find and display missing PODs (Proof of Delivery) for a selected customer.
 * Users can select a date range and fetch a list of AWB numbers that are missing a POD.
 *
 * @param {Object} props
 * @param {Function} props.onClose - Function to close the Offcanvas/Modal.
 */
const MissingPod = ({ onClose }) => {
    // Table column definitions for the Missing Pods list
    const columns = useMemo(
        () => [
            {
                header: 'AWB Number',
                accessorKey: 'AWBNO',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Booking Date',
                accessorKey: 'Book Date',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Delivery Date',
                accessorKey: 'Delivery Date',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'State',
                accessorKey: 'Consignee State',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'EC Code',
                accessorKey: 'ECCODE',
                enableColumnFilter: false,
                enableSorting: true,
            },
        ],
        []
    );
    // selected data range
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });

    // handle change range
    const handleChange = (range) => {
        setSelectedRange(range);
    };

    // defining the get user options
    const { apifunc: GetAllUsers, data: userData, } = useGetApiCall()
    // defining the check missing pod api
    const { apifunc: GetMissingPod, data: MissingPod, loading: MissingPodLoading } = usePostApiCall()

    const [CustomerOptions, setCustomerOption] = useState([])
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [MissingPodData, setMissingPodData] = useState(null)

    useEffect(() => {
        GetAllUsers(POST_USER_API)
    }, [])

    useEffect(() => {
        if (userData && Array.isArray(userData)) {
            const options = userData
                .map((ele) => {
                    // Skip if element is null/undefined
                    if (!ele) return null;

                    // First try customer_name
                    if (ele.customer_name) {
                        return {
                            value: ele.customer_name,
                            label: ele.customer_name,
                            id: ele?.id
                        };
                    }

                    // Fallback to username if customer_name is null or empty
                    if (ele.username) {
                        return {
                            value: ele.username,
                            label: ele.username,
                            id: ele?.id
                        };
                    }

                    // Skip if neither field exists
                    return null;
                })
                .filter(option => option !== null); // Remove null entries
            setCustomerOption(options);
        } else {
            setCustomerOption([]);
        }
    }, [userData]);


    // check missing pod
    const CheckPod = async () => {
        try {
            // Validate selectedCustomer exists and has an id
            if (!selectedCustomer?.id) {
                alert("No customer selected or customer ID is missing");
                return
            }

            // Validate selectedRange exists
            if (!selectedRange) {
                alert("Date range is not selected");
                return
            }

            // Format dates and validate the result
            let formatedDate = formatDateForPayload(selectedRange);
            if (!formatedDate || !formatedDate.from_date || !formatedDate.to_date) {
                alert("Invalid date format or missing date values");
                return
            }

            // Validate from_date is before or equal to to_date
            if (new Date(formatedDate.from_date) > new Date(formatedDate.to_date)) {
                alert("Start date cannot be after end date");
                return
            }


            let payload = {
                "customer_id": selectedCustomer.id,
                "start_date": formatedDate.from_date,
                "end_date": formatedDate.to_date
            };

            // Call missing pod API with error handling
            let MissingPod = await GetMissingPod(GET_MISSING_POD, payload);
            if (MissingPod) {
                setMissingPodData(MissingPod);
            }

            console.log(payload, "selectedRange");

        } catch (error) {
            console.error("Error in CheckPod:", error.message);

        }
    };
    return (
        <Offcanvas isOpen={true} toggle={onClose} direction="end" style={{ width: '650px' }}>
            <OffcanvasHeader toggle={onClose}>Find Missing Pod</OffcanvasHeader>
            <OffcanvasBody>
                <div className="mb-4 w-75 mx-auto">
                    {/* select customer id */}
                    <FormGroup className="mb-3">
                        <Label className='pb-0 fw-bold'>Select Customer</Label>
                        <Select
                            options={CustomerOptions}
                            placeholder="Search Customer"
                            value={selectedCustomer}
                            onChange={setSelectedCustomer}
                            isClearable={true}
                            styles={customStyles}
                        />
                    </FormGroup>

                    {/* range selector */}
                    <FormGroup className="mb-3">
                        <Label className='pb-1 d-block fw-bold'>Select Date Range</Label>
                        <DateRangeInput
                            value={selectedRange}
                            onChange={handleChange}
                            isBorder={true}
                        />
                    </FormGroup>

                    <Button color="primary" onClick={CheckPod} block className="mt-2" style={{ height: "40px" }}>
                        Check Missing POD
                    </Button>
                </div>

                {/* desplaying missing pods */}
                <div className='d-flex justify-content-center align-items-center w-100'>
                    {
                        MissingPodLoading ? <Spinner>
                            Loading...
                        </Spinner> : (
                            MissingPodData?.data ?
                                <div className='w-100'>
                                    <TableContainer
                                        columns={columns}
                                        data={MissingPodData?.data || []}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        SearchPlaceholder="Search From Table"
                                        pagination="pagination"
                                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                    />
                                </div>

                                : <h4 className='text-muted'>{MissingPodData?.msg}</h4>
                        )
                    }
                </div>
            </OffcanvasBody>
        </Offcanvas>
    )
}

export default MissingPod;