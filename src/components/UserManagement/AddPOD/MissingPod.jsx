import DateRangePicker from '@paprika/date-range-picker';
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select'
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardHeader, CardBody, Col, FormGroup, Label, Row, Spinner, Alert } from 'reactstrap';
import { customStyles } from '../../../helpers/CustomStyle';
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_MISSING_POD, POST_USER_API } from '../../../api';
import formatDateForPayload from '../../../helpers/DateHelper';
import usePostApiCall from '../../../hooks/usePostApiCall';
import MissingPodTable from './MissingPodTable';
import TableContainer from '../../Table/TableContainer';

const MissingPod = ({ onClose }) => {
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
            // {
            //     header: 'Status',
            //     accessorKey: 'status',
            //     enableColumnFilter: false,
            //     enableSorting: true,
            //     cell: ({ row }) => {
            //         const deliveryDate = new Date(row.original['Delivery Date'].split('-').reverse().join('-'));
            //         const today = new Date();
            //         const status = today > deliveryDate ? 'Delivered' : 'In Transit';

            //         return (
            //             <span
            //                 style={{
            //                     color: status === 'Delivered' ? '#28a745' : '#ffc107',
            //                     fontWeight: '500',
            //                     fontSize: '0.875rem'
            //                 }}
            //             >
            //                 {status}
            //             </span>
            //         );
            //     },
            // },
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
        <Card className="mb-4 mt-2">
            <CardHeader className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 ps-0" style={{ marginLeft: "-15px" }}>Find Missing Pod</h5>
            </CardHeader>
            <CardBody>
                <Row>
                    {/* select customer id */}
                    <Col md={4}>
                        <FormGroup className="mb-3">
                            <Label className='pb-0'>Select Customer</Label>
                            <Select
                                options={CustomerOptions}
                                placeholder="Search Customer"
                                value={selectedCustomer}
                                onChange={setSelectedCustomer}
                                isClearable={true}
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                    <Col>
                        {/* range selector */}
                        <FormGroup className="mb-3">
                            <Label className='pb-0 d-block'>Select Date</Label>
                            <DateRangePicker
                                startDate={selectedRange.startDate}
                                endDate={selectedRange.endDate}
                                onChange={handleChange}
                            />
                        </FormGroup>
                    </Col>

                    <Col className='d-flex justify-content-start align-items-center'>
                        <Button color="primary" onClick={CheckPod}>
                            Check
                        </Button>
                    </Col>
                </Row>

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
                {onClose && (
                    <div className="text-end">
                        <Button color="secondary" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    )
}

export default MissingPod;