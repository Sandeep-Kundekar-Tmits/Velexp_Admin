import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from "react";
import { Input, Modal, ModalBody, Spinner } from "@/components/ui";
import TableContainer from '../Table/TableContainer';
import Loader from "@/Loaders/Loader";
import { GET_MIS_TALLY_FILTER_BY_TITLE, GET_MIS_TALLY_FILTER_DATA } from '../../api';
import { RiErrorWarningLine } from "react-icons/ri";
import usePostApiCall from '../../hooks/usePostApiCall';

const MisTallyViewModel = ({
    show,
    onCloseClick,
    data = {}
}) => {

    const columns = useMemo(() => [
        {
            header: 'Title',
            accessorKey: 'title',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue() || "--",
        },
        {
            header: 'Date',
            accessorKey: 'vch_date',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => {
                const dateValue = getValue();
                if (!dateValue) return "--";

                // Parse the date (assuming it's a valid date string or Date object)
                const date = new Date(dateValue);

                // Check if the date is valid
                if (isNaN(date.getTime())) return "--";

                // Format as dd/mm/yyyy
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
                const year = date.getFullYear();

                return `${day}/${month}/${year}`;
            },
        },
        {
            header: 'Particulars',
            accessorKey: 'particulars',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue() || "--",
        },
        {
            header: 'Customer',
            accessorKey: 'customer_name',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue() || "--",
        },
        {
            header: 'Voucher Type',
            accessorKey: 'vch_type',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue() || "--",
        },
        {
            header: 'Voucher No',
            accessorKey: 'vch_no',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => {
                const value = getValue();
                return value !== undefined && value !== null ? value : "--";
            },
        },
        {
            header: 'Region',
            accessorKey: 'region',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue() || "--",
        },
        {
            header: 'Cost Center',
            accessorKey: 'cost_service_center',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue() || "--",
        },
        {
            header: 'Debit',
            accessorKey: 'debit',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => {
                const value = getValue();
                return value !== undefined && value !== null ? value : "--";
            },
        },
        {
            header: 'Credit',
            accessorKey: 'credit',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => {
                const value = getValue();
                return value !== undefined && value !== null ? value : "--";
            },
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => {
                const dateValue = getValue();
                if (!dateValue) return "--";

                const date = new Date(dateValue);
                if (isNaN(date.getTime())) return "--";

                // Format as dd/mm/yyyy hh:mm:ss
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');

                return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            },
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => {
                const dateValue = getValue();
                if (!dateValue) return "--";

                const date = new Date(dateValue);
                if (isNaN(date.getTime())) return "--";

                // Format as dd/mm/yyyy hh:mm:ss
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');

                return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            },
        },
    ], []);


    // definging the get Mis grouped data api
    const { apifunc: GetMISGroupedDataFunc, data: MISGroupedInfo, loading: MISGroupedDataLoading } = usePostApiCall()

    const [MisGroupedData, setMisGroupedData] = useState([])
    useEffect(() => {

        console.log(data, "data")
        GetMISGroupedDataFunc(GET_MIS_TALLY_FILTER_BY_TITLE, data)
    }, [data])

    useEffect(() => {
        if (MISGroupedInfo) {
            setMisGroupedData(MISGroupedInfo)
        }
    }, [MISGroupedInfo])
    return (
        <Modal size="xl" isOpen={show} centered={true} className="auth-modal">
            <div className="modal-content border-0">
                <ModalBody className="px-6 py-12 text-center">
                    <button
                        type="button"
                        onClick={onCloseClick}
                        className="btn-close absolute end-0 top-0 m-4"
                        aria-label="Close"
                    ></button>

                    <h4 className="mb-4 border-bottom">MIS Tally Of The "{data?.cost_service_center}" Cost Center</h4>
                    {
                        MISGroupedDataLoading ? <Loader message="Loading MIS Tally ..." fullscreen={false} /> : MisGroupedData.length >= 1 ? <TableContainer
                            columns={columns}
                            data={MisGroupedData || []}
                            isGlobalFilter={true}
                            isPagination={true}
                            // isCustomPageSize={true}
                            SearchPlaceholder="Search From Table"
                            pagination="pagination"
                            buttonClass="btn-success"
                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                            tableClass="table-bordered table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                        /> :
                            //  if data not available for the given payload
                            <div className='m-auto ' style={{ width: "320px" }}>
                                <div style={{ color: '#6c757d', marginBottom: '12px' }}>
                                    <RiErrorWarningLine className='text-brand-500' style={{ width: "25px", height: "25px" }} />
                                </div>
                                <h4 style={{ margin: '0 0 8px', color: '#343a40' }}>No Data Found For</h4>

                                <h5 style={{ margin: '0 0 8px', color: '#343a40' }}>
                                    {new Date(data.year, data.month).toLocaleString('default', { month: 'long' })} {data.year}
                                </h5>
                            </div>
                    }

                    <div className="flex justify-end mt-6">
                        <button
                            type="button"
                            className="btn btn-light "
                            onClick={onCloseClick}
                            style={{ width: "200px" }}
                        >
                            Cancel
                        </button>
                    </div>
                </ModalBody>
            </div>
        </Modal>
    );
};

MisTallyViewModel.propTypes = {
    onCloseClick: PropTypes.func,
    show: PropTypes.bool,
};

export default MisTallyViewModel;