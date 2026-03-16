import { useEffect, useMemo, useState } from "react";
import TableContainer from "../../components/Table/TableContainer";
import { IoMdCloudDownload } from "react-icons/io";
import { Button, Col, FormGroup, Label, Row } from "reactstrap";
import SearchableDropdown from "../../components/Common/SearchableDropdown";
import DateRangeInput from "../../components/Common/DateRangeInput";
import { GET_PAYMENT_DEATILS, GET_USER_API, GET_WALLET_TRASACTION_DETAILS } from "../../api";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import formatDateForPayload from "../../helpers/DateHelper";
import { GridLoader } from 'react-spinners';
import TabComponentProvider from "../../components/TabComponentProvider";
import { useExcelExport } from "../../hooks/useExcelExport";
import ToasterProvider from "../../helpers/ToasterProvider";
import SimpleModal from "../../components/SimpleModal";
import MainHeaderComp from "../../components/MainHeaderCom";
function toYYYYMMDD(dateStr) {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
}
const PaymentDeatils = () => {

    const columns = useMemo(
        () => [
            {
                header: "AWB",
                accessorKey: "awb",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Order ID",
                accessorKey: "orderid",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Customer",
                accessorKey: "customer",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Invoice No",
                accessorKey: "invoice_no",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "To Address",
                accessorKey: "to_address",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ row }) => {
                    const address = row.original.to_address || "-";
                    const isLong = address.length > 30;

                    return (
                        <>
                            <span>
                                {isLong ? address.substring(0, 30) + "..." : address}
                            </span>

                            {isLong && (
                                <button
                                    className="btn-primary border-0 text-xs ml-2"
                                    onClick={() => {
                                        setSelectedAddress(address);
                                        setShowAddressModal(true);
                                    }}
                                >
                                    View More
                                </button>
                            )}
                        </>
                    );
                },
            },
            {
                header: "GST No",
                accessorKey: "gst_no",
                enableColumnFilter: false,
                enableSorting: true,
                // Your JSON has total_amount_paid
                cell: (info) => info.row.original.gst_no || "-",
            },
            {
                header: "Payment Option",
                accessorKey: "payment_option",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Wallet Paid",
                accessorKey: "wallet_paid",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Online Paid",
                accessorKey: "online_paid",
                enableColumnFilter: false,
                enableSorting: true,
            },

            {
                header: "COD Paid",
                accessorKey: "cod_paid",
                enableColumnFilter: false,
                enableSorting: true,
                // Since your data has no cod_paid field, make it default 0
                cell: (info) => info.row.original.cod_paid ?? 0,
            },
            {
                header: "Online Transaction ID",
                accessorKey: "online_transaction_id",
                enableColumnFilter: false,
                enableSorting: false,
                cell: (info) => info.getValue() ?? "N/A",
            },
            {
                header: "Total Paid",
                accessorKey: "total_paid",
                enableColumnFilter: false,
                enableSorting: true,
                // Your JSON has total_amount_paid
                cell: (info) => info.row.original.total_amount_paid,
            },
            {
                header: "Total Amount",
                accessorKey: "total_amount",
                enableColumnFilter: false,
                enableSorting: true,
                // Your JSON has actual_total_amount
                cell: (info) => info.row.original.actual_total_amount,
            },
            {
                header: "Created Date",
                accessorKey: "createddate",
                enableColumnFilter: false,
                enableSorting: true,
                cell: (info) =>
                    new Date(info.getValue()).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    }),
            },
        ],
        []
    );
    const INTcolumns = useMemo(
        () => [
            {
                header: "AWB",
                accessorKey: "awb",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Velexp Awb",
                accessorKey: "velexp_awb",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Customer",
                accessorKey: "customer",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "To Address",
                accessorKey: "to_address",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ row }) => {
                    const address = row.original.to_address || "-";
                    const isLong = address.length > 30;

                    return (
                        <>
                            <span>
                                {isLong ? address.substring(0, 30) + "..." : address}
                            </span>

                            {isLong && (
                                <button
                                    className="btn-primary border-0 text-xs ml-2"
                                    onClick={() => {
                                        setSelectedAddress(address);
                                        setShowAddressModal(true);
                                    }}
                                >
                                    View More
                                </button>
                            )}
                        </>
                    );
                },
            },

            {
                header: "GST No",
                accessorKey: "gst_no",
                enableColumnFilter: false,
                enableSorting: true,
                // Your JSON has total_amount_paid
                cell: (info) => info.row.original.gst_no || "-",
            },
            {
                header: "Payment Option",
                accessorKey: "payment_option",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Wallet Paid",
                accessorKey: "wallet_paid",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Online Paid",
                accessorKey: "online_paid",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Online Transaction ID",
                accessorKey: "online_transaction_id",
                enableColumnFilter: false,
                enableSorting: false,
                cell: (info) => info.getValue() ?? "N/A",
            },
            {
                header: "Total Paid",
                accessorKey: "total_amount_paid",
                enableColumnFilter: false,
                enableSorting: true,
            },
            // {
            //     header: "Total Amount",
            //     accessorKey: "actual_total_amount",
            //     enableColumnFilter: false,
            //     enableSorting: true,
            //     cell: (info) => info.getValue() ?? 0,
            // },
            {
                header: "Booked date",
                accessorKey: "createddate",
                enableColumnFilter: false,
                enableSorting: true,
                cell: (info) =>
                    new Date(info.getValue()).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    }),
            },
        ],
        []
    );
    const WalletTransaction = useMemo(() => [
        {
            header: "Transaction Date",
            accessorKey: "createddate",
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: "Payment Id",
            accessorKey: "razorpay_paymentid",
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => {
                const value = getValue();
                return value ? value : "NA";
            },
        },

        {
            header: "Amount",
            accessorKey: "amount",
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ row }) => {
                const { transaction_type, status, amount } = row.original;

                let color = "black";
                let prefix = "";

                // ✅ Logic for coloring and prefix
                if (status?.toLowerCase() === "refund") {
                    color = "black";
                    prefix = "";
                } else if (transaction_type?.toLowerCase().includes("razorpay")) {
                    color = "green";
                    prefix = "+";
                } else if (transaction_type?.toLowerCase().includes("wallet")) {
                    color = "red";
                    prefix = "-";
                }

                return (
                    <span style={{ color, fontWeight: 600 }}>
                        {prefix} ₹{amount}
                    </span>
                );
            },
        },
        {
            header: "Status",
            accessorKey: "status",
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: "Wallet Balance",
            accessorKey: "wallet_balance",
            enableColumnFilter: false,
            enableSorting: true,
        },
    ], []);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState("");

    const [Customes, setCustomers] = useState([])
    const [WalletTrasactions, setWalletTransactions] = useState([])
    const [SelectedCustomer, setSelectedCustomer] = useState(null)
    const [PayementData, setPaymentDaata] = useState({})
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });
    // GET_USER_API
    // defining the get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()
    // defining the get payment details
    const { apifunc: GetPaymentDeatils, data: paymentDeatilsData, loading: PaymentDeatilsLoading } = usePostApiCall()
    // defining the get wallet transaction details
    const { apifunc: GetWalletDeatils, data: WalletDeatils, loading: WalletDeatailsLoading } = useGetApiCall()
    const { ErrorToaster } = ToasterProvider()
    const handleDateChange = (range) => {
        setSelectedRange(range);
    };

    const { exportToExcel, isExporting, exportProgress } = useExcelExport();

    useEffect(() => {
        // calling the get user list api
        GetUserList(`${GET_USER_API}/`)
    }, [])

    const handleLocationChange = (value) => {
        setSelectedCustomer(value);
    };

    useEffect(() => {
        if (UserList) {
            const UserUpdatedList = UserList?.map((ele) => {
                const name = ele?.customer_name ? ele?.customer_name : ele?.username
                // const name = `${ele?.customer_name || ""} - ${ele?.username}`
                return name !== "null" ? { name: name, id: ele?.id } : null;
            })
                .filter(Boolean); // Remove any null entries

            setCustomers(UserUpdatedList);

            // console.log(UserList, "UserList")
        }
        if (paymentDeatilsData) {
            setPaymentDaata(paymentDeatilsData)
        }
    }, [UserList, paymentDeatilsData]);

    //  calling the payment api
    const CheckPaymentDetails = async () => {
        let formatedDate = formatDateForPayload(selectedRange)
        console.log(selectedRange, "formatedDate", toYYYYMMDD(formatedDate?.from_date))
        console.log(formatedDate, "formatedDate")
        let payload = {
            "customer_name": SelectedCustomer?.name,
            "start_date": formatedDate?.from_date,
            "end_date": formatedDate.to_date
        }
        if (!formatedDate?.from_date || !formatedDate?.to_date) {
            ErrorToaster("Select The Date Range")
            return
        }
        let isPaymentDetails = await GetPaymentDeatils(GET_PAYMENT_DEATILS, payload)
        let query = `${GET_WALLET_TRASACTION_DETAILS}?from_date=${toYYYYMMDD(formatedDate?.from_date)}&to_date=${toYYYYMMDD(formatedDate.to_date)}`;

        if (SelectedCustomer?.name) {
            query += `&customer_name=${SelectedCustomer.name}`;
        }

        let isWalletTrasactionDetails = await GetWalletDeatils(query);
        if (isWalletTrasactionDetails) {
            setWalletTransactions(isWalletTrasactionDetails)
        }
        else {
            ErrorToaster(isWalletTrasactionDetails?.error)
        }
    }
    const DownloadDomesticPaymentDetails = () => {
        exportToExcel(PayementData?.domestic_data, "Domestic_PaymentDetails", (item) => ({
            "AWB": item.awb,
            "Order ID": item.orderid,
            "Customer": item.customer,
            "invoice_no": item?.invoice_no || "-",
            to_address: item?.to_address,
            gst_no: item?.gst_no,
            "Payment Option": item.payment_option,
            "Wallet Paid": item.wallet_paid,
            "Online Paid": item.online_paid,
            "COD Paid": item.cod_paid ?? 0,
            "Online Transaction Id": item?.online_transaction_id,
            "Total Paid": item.total_amount_paid,
            "Total Amount": item.actual_total_amount,
            "Created Date": new Date(item.createddate).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
            }),
        }));
    }

    const DownloadInternationalPaymentDetails = () => {
        exportToExcel(PayementData?.intl_data, "INT_PaymentDetails", (item) => ({
            "AWB": item.awb,
            "Customer Ref No": item.customer_refno,
            "Customer": item.customer,
            to_address: item?.to_address,
            gst_no: item?.gst_no,
            invoice_no: item?.invoice_no ?? "-",
            "Payment Option": item.payment_option,
            "Wallet Paid": item.wallet_paid,
            "Online Paid": item.online_paid,
            "Online Transaction ID": item.online_transaction_id ?? "-",
            "Total Paid": item.total_amount_paid,
            "Total Amount": item.actual_total_amount ?? 0,
            "Created Date": new Date(item.createddate).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
            }),
        }));

    }
    const DownloadWalletPaymentDetails = () => {
        exportToExcel(WalletTrasactions, "Wallet_Transactions", (item) => ({
            "ID": item.id,
            "Customer Name": item.customer_name ?? "-",
            "Customer ID": item.customer_id ?? "-",
            "Booking ID": item.booking ?? "-",
            "Transaction Type": item.transaction_type ?? "-",
            "Amount": item.amount ?? 0,
            "Wallet Balance": item.wallet_balance ?? 0,
            "Status": item.status ?? "-",
            "Payment Method": item.method ?? "-",
            "Bank": item.bank ?? "-",
            "Wallet": item.wallet ?? "-",
            "Razorpay Order ID": item.razorpay_orderid ?? "-",
            "Razorpay Payment ID": item.razorpay_paymentid ?? "-",
            "Acquirer Transaction ID": item.acquirer_transaction_id ?? "-",
            "Acquirer RRN": item.acquirer_rrn ?? "-",
            "Acquirer Auth Code": item.acquirer_auth_code ?? "-",
            "Currency": item.currency ?? "-",
            "Email": item.email ?? "-",
            "Contact": item.contact ?? "-",
            "Description": item.description ?? "-",
            "Captured": item.captured ? "Yes" : "No",
            "Refund Status": item.refund_status ?? "-",
            "Fee": item.fee ?? "-",
            "Tax": item.tax ?? "-",
            "Created Date": new Date(item.createddate).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
            }),
        }));
    };


    const tabConfig = [
        {
            id: 1, label: "Domestic", component: <div>
                <div className='mt-1'>
                    {

                        <TableContainer
                            columns={columns}
                            data={PayementData?.domestic_data || []}
                            isGlobalFilter={true}
                            isCustomPageSize={true}
                            isDownloadExcle={true}
                            isPagination={true}
                            ExcleLoading={isExporting}
                            onDownloadExcle={DownloadDomesticPaymentDetails}
                            SearchPlaceholder="Search From Table"
                            pagination="pagination"
                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                        />
                    }
                </div>
            </div>
        },
        {
            id: 2, label: "International", component: <div>
                <div className='mt-1'>
                    {

                        <TableContainer
                            columns={INTcolumns}
                            data={PayementData?.intl_data || []}
                            isGlobalFilter={true}
                            isCustomPageSize={true}
                            isDownloadExcle={true}
                            isPagination={true}
                            onDownloadExcle={DownloadInternationalPaymentDetails}
                            ExcleLoading={isExporting}
                            SearchPlaceholder="Search From Table"
                            pagination="pagination"
                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                        />
                    }
                </div>
            </div>
        },
        {
            id: 3, label: "Wallet Transaction", component: <div>
                <div className='mt-1'>
                    {

                        <TableContainer
                            columns={WalletTransaction}
                            data={WalletTrasactions || []}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            onDownloadExcle={DownloadWalletPaymentDetails}
                            ExcleLoading={isExporting}
                            isDownloadExcle={true}
                            SearchPlaceholder="Search From Table"
                            pagination="pagination"
                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                        />
                    }
                </div>
            </div>
        }
    ];
    return (
        <div className='page-content py-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp title="Payment Details" />
            </div>
            <div className="container-fluid">
                <div className=" justify-content-between mt-3">
                    <Row>
                        <Col md={4} className="">
                            <FormGroup>
                                <Label className="">Select Customer</Label>
                                <SearchableDropdown
                                    className="w-100"
                                    onChange={handleLocationChange}
                                    locations={Customes}
                                // value={SelectedCustomer}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup >
                                <Label>Start Date and End Date</Label>
                                <div >
                                    <DateRangeInput
                                        value={selectedRange}
                                        onChange={handleDateChange}
                                        isBorder={true}
                                    />
                                </div>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <div style={{ marginTop: "28px" }}>
                                <Button color="primary" onClick={CheckPaymentDetails} style={{ height: "2.2rem", width: "100%" }} >
                                    Check
                                </Button>

                            </div>
                        </Col>
                    </Row>
                </div>
                {/* display table */}
                {
                    PaymentDeatilsLoading ?
                        <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-5 h5">Loading ...</p>
                        </div> : <TabComponentProvider tabs={tabConfig} defaultActive={1} />
                }
                <SimpleModal
                    isOpen={showAddressModal}
                    setIsOpen={setShowAddressModal}
                    cancelButtonName="Close"
                    successButtonName={null}
                    onCancel={() => setShowAddressModal(false)}
                >
                    <h5 className="mb-3 fw-bold">To Address</h5>

                    <p className="text-muted" style={{ whiteSpace: "pre-wrap" }}>
                        {selectedAddress}
                    </p>
                </SimpleModal>


            </div>
        </div>
    )
}
export default PaymentDeatils