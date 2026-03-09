import { Button, Col, FormGroup, Label, Row } from "reactstrap"
import Select from "react-select";
import { customStyles } from "../../helpers/CustomStyle";
import { useEffect, useMemo, useState } from "react";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { GET_POP_RECONSILATION_PAYMENT_REPORT, GET_USER_API, POP_RECONCILATION_PAYMENT_CONFIRMATION, SERVICE_CENTER } from "../../api";
import DateRangePicker from "@paprika/date-range-picker";
import TableContainer from "../../components/Table/TableContainer";
import UpdatedReconcilation from "../../components/POP_Reconcilation/UpdatedReconcilation";
import usePostApiCall from "../../hooks/usePostApiCall";
import YMD_DateFormate from "../../helpers/YMD_DateFormate";
import { GridLoader } from "react-spinners";
import { useExcelExport } from "../../hooks/useExcelExport";
import moment from 'moment';
// Use local date methods instead of toISOString()
const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const PopReconcilation = () => {

    const [POP_Reconcilation, setPOP_Reconcilation] = useState([])
    // selected service center
    const [SelectedServiceCenter, setSelectedServiceCenters] = useState({ label: "All", value: "All" })
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });
    const [showPopup, setShowPopup] = useState(false)
    // service center option dropdown
    const [ServiceCenterOption, setServiceCenterOption] = useState([])
    //  defining the get all pop_payment_report  api
    const { apifunc: POP_Get_AllReconcilation, data: ReconcilationData, loading: ReconcilationListLoading } = usePostApiCall()
    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCenters } = useGetApiCall()
    // defining the payment confirmation api
    const { apifunc: PaymentConfirmation, loading: PaymentConfirmationLoading } = usePostApiCall(() => {
        setShowPopup(false)
    }, "")
    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    const columns = useMemo(
        () => [
            {
                header: "AWB",
                accessorKey: "awbno",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "POP Amount",
                accessorKey: "pop_amount",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "PUD Date",
                accessorKey: "pud_date",
                enableColumnFilter: false,
                enableSorting: true,
            },

        ],
        []
    );

    //  calling user api
    useEffect(() => {
        GetServiceCenter(SERVICE_CENTER)
        // calling the  get all reconsilation api call
        const targetDate = new Date();
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        setSelectedRange({
            startDate: moment(firstDay),  // Convert to Moment object
            endDate: moment(lastDay)      // Convert to Moment object
        });
        POP_Get_AllReconcilation(GET_POP_RECONSILATION_PAYMENT_REPORT, {
            service_center: "All",
            from_date: formatDate(firstDay),
            to_date: formatDate(lastDay)
        });
    }, [])
    useEffect(() => {
        if (ReconcilationData) {
            setPOP_Reconcilation(ReconcilationData?.pop_data)
        }

        //  getting the service center data
        if (ServiceCenters) {
            let updatedServiceCenters = ServiceCenters.map((ele) => {
                return {
                    value: ele?.ec_code,
                    label: ele?.ec_code
                }
            })
            setServiceCenterOption(updatedServiceCenters)
        }
    }, [ReconcilationData, ServiceCenters]);


    const handleDateChange = (range) => {
        setSelectedRange(range);
    };
    //  click on check button click
    const onCheckClick = async () => {

        if (!selectedRange?.endDate || !selectedRange?.startDate) {
            alert("Select Date Range")
            return
        }
        let Date = YMD_DateFormate(selectedRange)
        let payload = {
            service_center: SelectedServiceCenter?.value || "All",
            from_date: Date.from_date,
            to_date: Date.to_date
        }
        // api calls
        POP_Get_AllReconcilation(GET_POP_RECONSILATION_PAYMENT_REPORT, payload)
    }

    //  payment confirmation
    const onUpdatePOP_PayemntConfirm = async (payload) => {
        // // api call
        let ispaymentConfirm = await PaymentConfirmation(POP_RECONCILATION_PAYMENT_CONFIRMATION, payload)
        if (ispaymentConfirm?.status === "success") {
            // calling the  get all reconsilation api call
            const targetDate = new Date();
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            setSelectedRange({
                startDate: moment(firstDay),
                endDate: moment(lastDay)
            });
            POP_Get_AllReconcilation(GET_POP_RECONSILATION_PAYMENT_REPORT, {
                service_center: "All",
                from_date: formatDate(firstDay),
                to_date: formatDate(lastDay)
            });
        }
    }


    const DownloadPOP_ReconcilationPaymentDetails = () => {
        exportToExcel(POP_Reconcilation, "POP_Reconcilation", (item) => ({
            "awbno": item.awbno,
            "POP Amount": item.pop_amount,
            "PUD Date": item.pud_date,
            "Amount_Received": item.amount_received,
            "Transaction_id": item.wallet_paid,
        }));

    }


    return (
        <div className='page-content '>
            <div className="container-fluid ">
                <div className="d-flex pb-1 w-100  m-0 border-bottom justify-content-between align-items-center">
                    <h3 className="p-0 m-0">POP Reconciliation </h3>
                    <Button className="bg-primary" onClick={() => { setShowPopup(true) }}>Update POP Status</Button>
                </div>

                {/* filter */}
                <Row className=" mt-2 border-bottom">
                    <Col md={5}>
                        <FormGroup className="mb-2">
                            <Label for="Customer">Select Service Center</Label>
                            <Select options={ServiceCenterOption}
                                placeholder="Search"
                                value={SelectedServiceCenter}
                                onChange={setSelectedServiceCenters}
                                isClearable={true}

                                styles={customStyles} />
                        </FormGroup>
                    </Col>
                    <Col md={5}>
                        <FormGroup >
                            <Label>Start Date and End Date</Label>
                            <div >
                                <DateRangePicker
                                    startDate={selectedRange.startDate}
                                    endDate={selectedRange.endDate}
                                    onChange={handleDateChange}
                                />
                            </div>
                        </FormGroup>
                    </Col>
                    <Col md={2}>
                        <div style={{ marginTop: "25px" }}>
                            <Button color="primary" onClick={onCheckClick} style={{ height: "2.2rem", width: "100%" }} >
                                {ReconcilationListLoading ? "Checking.." : "Check"}
                            </Button>
                        </div>
                    </Col>
                </Row>

                {/*  main table */}
                <div className="mt-3">
                    {
                        ReconcilationListLoading ?
                            <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading ...</p>
                            </div> :
                            <TableContainer
                                columns={columns}
                                data={POP_Reconcilation || []}
                                isGlobalFilter={true}
                                isCustomPageSize={true}
                                isDownloadExcle={true}
                                isPagination={true}
                                onDownloadExcle={DownloadPOP_ReconcilationPaymentDetails}
                                ExcleLoading={isExporting}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                            />
                    }

                </div>
            </div>
            {
                showPopup && <UpdatedReconcilation
                    show={true}
                    onCloseClick={() => { setShowPopup(false) }}
                    onUpdate={onUpdatePOP_PayemntConfirm}
                    loading={PaymentConfirmationLoading} />
            }

        </div>
    )
}
export default PopReconcilation