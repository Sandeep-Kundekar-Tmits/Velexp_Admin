
import { useEffect, useMemo, useState } from "react";
import { Button, Label, Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import Select from "react-select";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import Loader from "@/Loaders/Loader";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { GET_ALL_SERVICE_PROVIDER_BOOKING, GET_DELIVARY_B2C_LABEL_GENERATION, SERVICE_PROVIDER_BOOKING_RETRY, CANCEL_UNBOOKED_DELHIVERY_BOOKING, GET_WAREHOUSE_LIST } from "../../../api";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { useExcelExport } from "../../../hooks/useExcelExport";
import { useNavigate } from "react-router-dom";
import { customStyles } from "../../../helpers/CustomStyle";
import { authFetch } from "@/lib/http";
// Updated formatDateLocal to handle both Date objects and strings
function formatDateLocal(d) {
    if (!d) return '';

    let date;
    if (typeof d === 'string') {
        date = new Date(d);
        // Handle YYYY-MM-DD format
        if (d.includes('-')) {
            const [year, month, day] = d.split('-').map(Number);
            date = new Date(year, month - 1, day);
        }
    } else if (d instanceof Date) {
        date = d;
    } else {
        return '';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.error('Invalid date:', d);
        return '';
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
const ServiceProviderBooking = () => {
    const navigate = useNavigate()
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });
    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    const [selectedOption, setSelectedOption] = useState({ value: "Delhivery", label: "Delhivery" })
    const handleDateChange = ({ startDate, endDate }) => {
        setSelectedRange({ startDate, endDate });
    };
    const [ServiceProviderData, setSerProviderBookingsData] = useState([])
    const [SelectedLabel, setSelectedLabel] = useState(null)
    const [isDownloading, setIsDownloading] = useState(false);
    const [retryingAwb, setRetryingAwb] = useState(null);
    // Row awaiting the "check warehouse" confirmation before a retry is sent
    const [retryRow, setRetryRow] = useState(null);
    // B2C Delhivery warehouses (each with its service center nested), loaded when the retry popup opens
    const [b2cWarehouses, setB2cWarehouses] = useState([]);
    const [warehousesLoading, setWarehousesLoading] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState(null);
    // Row awaiting a cancel reason, and the reason typed so far
    const [cancelRow, setCancelRow] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancellingAwb, setCancellingAwb] = useState(null);

    // Service center options come from the B2C warehouses only, one entry per center code
    const centerOptions = useMemo(() => {
        const seen = new Map();
        b2cWarehouses.forEach((w) => {
            const code = w?.service_center?.ec_code;
            if (code && !seen.has(code)) seen.set(code, { value: code, label: code });
        });
        return [...seen.values()];
    }, [b2cWarehouses]);

    // Warehouse(s) the backend will use for the selected service center
    const centerWarehouses = useMemo(
        () => b2cWarehouses.filter((w) => w?.service_center?.ec_code === selectedCenter?.value),
        [b2cWarehouses, selectedCenter]
    );

    useEffect(() => {
        if (!retryRow) return;
        setSelectedCenter(null);
        let cancelled = false;
        const load = async () => {
            try {
                setWarehousesLoading(true);
                const response = await authFetch(GET_WAREHOUSE_LIST);
                const list = await response.json();
                if (cancelled) return;
                const b2c = (Array.isArray(list) ? list : []).filter((w) => w?.product_type === "B2C");
                setB2cWarehouses(b2c);
                // Preselect the center whose warehouse is already on the row, if it can be matched
                const match = b2c.find((w) => w?.name && w.name === retryRow?.warehouse);
                if (match?.service_center?.ec_code) {
                    setSelectedCenter({ value: match.service_center.ec_code, label: match.service_center.ec_code });
                }
            } catch (e) {
                if (!cancelled) ErrorToaster("Could not load service centers");
            } finally {
                if (!cancelled) setWarehousesLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [retryRow]);


    //  defining the get service provider booking api
    const { apifunc: GetAllServiceProviderBooking, data: ServiceProviderBookings, error, loading: ServiceProviderBookingloading } = usePostApiCall()
    // defining the api to donwload the shipper lable
    const { apifunc: GetShipperLabelDownload, data: ShipperDownloadLableData, error: ShipperDownloadLablErr, loading: ShipperDownloadLabelLoading } = usePostApiCall()
    useEffect(() => {

        const today = new Date();               // e.g. 2025-12-20
        const start = new Date();
        start.setDate(today.getDate() - 6);     // 6 days before today => 7-day window
        setSelectedRange({
            startDate: formatDateLocal(start),
            endDate: formatDateLocal(today)
        })
        let payload = {
            user_id: JSON.parse(localStorage.getItem("authUser"))?.user?.id,
            service_provider: "Delhivery",
            from_date: formatDateLocal(start),    // e.g. "2025-12-14"
            to_date: formatDateLocal(today)     // e.g. "2025-12-20"
        };
        GetAllServiceProviderBooking(GET_ALL_SERVICE_PROVIDER_BOOKING, payload)
    }, [])

    const OnGetBookings = () => {
        if (selectedRange?.endDate === "" || selectedRange?.startDate == "") {
            alert("select the date range")
            return
        }
        if (!selectedOption) {
            alert("select the service providers")
        }
        let payload = {
            "user_id": JSON.parse(localStorage.getItem("authUser"))?.user?.id,
            "service_provider": selectedOption?.value,
            "from_date": formatDateLocal(selectedRange?.startDate),
            "to_date": formatDateLocal(selectedRange?.endDate)
        }
        console.log(payload, "payload")
        GetAllServiceProviderBooking(GET_ALL_SERVICE_PROVIDER_BOOKING, payload)
    }

    const DonwloadShippingLable = async (data) => {
        if (!data?.velexp_awbno || isDownloading) return;

        try {
            setSelectedLabel(data.velexp_awbno);
            setIsDownloading(true);

            const payload = {
                awbno: data.velexp_awbno,
                call_from: "booking",
            };

            const response = await authFetch(GET_DELIVARY_B2C_LABEL_GENERATION, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${token}`, // if needed
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                let errorMsg = "Failed to download shipping label";

                // Try reading error message if backend sends JSON
                try {
                    const errData = await response.json();
                    errorMsg = errData?.msg || errorMsg;
                } catch (e) {
                    // ignore JSON parse error
                }

                ErrorToaster(errorMsg);
                return;
            }


            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Shipping_Label_${data.velexp_awbno}.pdf`;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Download failed:", error);
        } finally {
            setIsDownloading(false);
            setSelectedLabel(null);
        }
    };

    const CancelBooking = async () => {
        const awb = cancelRow?.velexp_awbno;
        const reason = cancelReason.trim();
        if (!awb || cancellingAwb) return;
        if (!reason) {
            ErrorToaster("Reason is required");
            return;
        }

        try {
            setCancellingAwb(awb);
            const response = await authFetch(CANCEL_UNBOOKED_DELHIVERY_BOOKING, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ awbno: awb, reason }),
            });
            let body = {};
            try {
                body = await response.json();
            } catch (e) {
                // non-JSON body; generic message below
            }
            const message = body?.message || body?.msg;
            if (response.ok) {
                SucceesToaster(message || "Delhivery booking cancelled");
                setCancelRow(null);
                setCancelReason("");
                OnGetBookings();
            } else {
                // Keep the popup open so the reason isn't lost
                ErrorToaster(message || "Cancel failed");
            }
        } catch (error) {
            console.error("Cancel booking failed:", error);
            ErrorToaster("Cancel failed");
        } finally {
            setCancellingAwb(null);
        }
    };

    const RetryBooking = async (data, serviceCenterCode) => {
        const awb = data?.velexp_awbno;
        if (!awb || retryingAwb) return;

        try {
            setRetryingAwb(awb);
            // service_center_code is optional; omitted means the backend picks automatically
            const payload = serviceCenterCode ? { awbno: awb, service_center_code: serviceCenterCode } : { awbno: awb };
            const response = await authFetch(SERVICE_PROVIDER_BOOKING_RETRY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            let body = {};
            try {
                body = await response.json();
            } catch (e) {
                // non-JSON body; fall back to generic messages below
            }
            // Backend uses `message` in most responses but `msg` for "AWB No. Not Found"
            const message = body?.message || body?.msg;

            if (response.ok && body?.status === "success") {
                SucceesToaster(message || "Delhivery Booking Successful");
            } else if (message === "Delhivery Booking Already Exists") {
                SucceesToaster("Already booked");
            } else {
                ErrorToaster(message || "Booking retry failed");
            }
            // Refresh in every case: success flips can_retry, failure adds a new failed row
            OnGetBookings();
        } catch (error) {
            console.error("Retry booking failed:", error);
            ErrorToaster("Booking retry failed");
        } finally {
            setRetryingAwb(null);
        }
    };

    const DownloadBookingDetails = () => {
        console.log(ServiceProviderData, "ServiceProviderData")
        exportToExcel(ServiceProviderData, "Service_Providers", (item) => ({
            'Sl No.': item.id,
            'Created Date': item.createddate?.split("T")[0] || '--',
            'Velexp AWB No.': item.velexp_awbno || '--',
            'Way Bill No.': item.package_waybill || '--',
            'Warehouse': item.warehouse || '--',
            'Status': item.status || '--'
        }));
    }



    const columns = useMemo(
        () => [
            {
                header: 'Sl No.',
                accessorKey: 'id',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Created Date',
                accessorKey: 'createddate',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue()?.split("T")[0] ?? "--",
            },
            {
                header: 'Velexp AWB No.',
                accessorKey: 'velexp_awbno',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Way Bill No.',
                accessorKey: 'package_waybill',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue(),
            },
            {
                header: 'Warehouse',
                accessorKey: 'warehouse',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => {
                    const status = getValue();
                    if (!status) return "--";
                    const s = String(status).toLowerCase();
                    // success -> green, cancelled -> amber, anything else that failed -> red
                    // Explicit inline colours (solid fill + fixed text colour) rather than the
                    // Badge theme tokens, which rendered the text unreadable inside the grid.
                    const [bg, fg] = s.includes("success") ? ["#16a34a", "#ffffff"]
                        : s.includes("cancel") ? ["#f59d0e", "#1a1a1a"]
                        : /error|fail/.test(s) ? ["#e51b2b", "#ffffff"]
                        : ["#64748b", "#ffffff"];
                    return (
                        <span
                            style={{
                                display: "inline-block",
                                padding: "2px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 600,
                                lineHeight: 1.4,
                                backgroundColor: bg,
                                color: fg,
                            }}
                        >
                            {status}
                        </span>
                    );
                },
            },
            {
                header: "Actions",
                enableColumnFilter: false,
                accessorKey: "actions",
                enableSorting: false,
                cell: ({ row }) => {
                    const awb = row.original.velexp_awbno;
                    const isLoading =
                        isDownloading && SelectedLabel === awb;

                    return (
                        <div className="flex gap-2">
                            {row.original.status === "success" && (
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => DonwloadShippingLable(row.original)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Downloading..." : "Shipping Label"}
                                </button>
                            )}
                            {row.original.can_retry === true && (
                                <button
                                    className="btn btn-sm btn-warning"
                                    onClick={() => setRetryRow(row.original)}
                                    disabled={!!retryingAwb}
                                >
                                    {retryingAwb === awb ? "Retrying..." : "Retry"}
                                </button>
                            )}
                            {/* Any unbooked, uncancelled row. can_cancel only hides it when the backend
                                says false, so it still shows if the list API doesn't send the flag yet. */}
                            {row.original.can_cancel !== false &&
                                !/success|cancel/i.test(String(row.original.status || "")) && (
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => { setCancelReason(""); setCancelRow(row.original); }}
                                    disabled={!!cancellingAwb}
                                >
                                    Cancel Booking
                                </button>
                            )}
                        </div>
                    );
                },
            }

        ],
        [
            SelectedLabel,
            retryingAwb,
            cancellingAwb,
            selectedRange,
            selectedOption,
        ] // Add handler functions here if they're defined outside the component
    );

    useEffect(() => {
        if (ServiceProviderBookings) {
            setSerProviderBookingsData(ServiceProviderBookings)
        }
    }, [ServiceProviderBookings])
    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Bookings"
                extraFields={
                    <Button color="primary" className="table-action-btn table-action-btn-primary" onClick={() => {
                        navigate("/corporate-booking")
                    }} >
                        New Booking
                    </Button>
                }
            />

            <div className="page-fit-body relative z-10 pb-4">
                {/* Filters -- single row that wraps rather than the fixed
                    Bootstrap grid, same as the rest of the reworked screens. */}
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Date Range
                        </Label>
                        <DateRangeInput
                            onChange={handleDateChange}
                            value={selectedRange}
                            isBorder={true}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-56">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Service Provider
                        </Label>
                        <Select
                            options={[
                                { value: "Delhivery", label: "Delhivery" }
                            ]}
                            placeholder="Service Provider"
                            onChange={(value) => setSelectedOption(value)}
                            defaultValue={{ value: "Delhivery", label: "Delhivery" }}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>

                    <Button
                        color="primary"
                        className="h-9.5 shrink-0 px-6"
                        onClick={OnGetBookings}
                    >
                        Get Data
                    </Button>
                </div>

                <div className="page-fit-body mt-4">
                    {
                        ServiceProviderBookingloading ? <Loader message="Loading Bookings ..." fullscreen={false} /> : (
                            <TableContainer
                                columns={columns}
                                data={ServiceProviderData || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                isCustomPageSize={true}
                                isDownloadExcle={true}
                                onDownloadExcle={DownloadBookingDetails}
                                ExcleLoading={isExporting}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                theadClass="sticky top-0 z-10"
                                isStickyHeader={true}
                                stickyTop={0}
                                fillHeight
                                tableHeight="72vh"
                            />
                        )
                    }
                </div>
            </div>

            <Modal isOpen={!!retryRow} toggle={() => setRetryRow(null)} centered>
                <ModalHeader toggle={() => setRetryRow(null)}>Check Warehouse</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-2 text-sm">
                        <div><span className="font-bold">AWB No.:</span> {retryRow?.velexp_awbno ?? "--"}</div>
                        <div><span className="font-bold">Current Warehouse:</span> {retryRow?.warehouse || "--"}</div>
                        <div className="mt-2 flex flex-col gap-1.5">
                            <Label className="form-label m-0 font-bold text-ink-muted">Service Center Code</Label>
                            <Select
                                options={centerOptions}
                                value={selectedCenter}
                                onChange={setSelectedCenter}
                                isLoading={warehousesLoading}
                                isClearable
                                placeholder="Automatic (leave blank)"
                                styles={customStyles}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </div>
                        <div>
                            <span className="font-bold">Warehouse for selected center:</span>{" "}
                            {selectedCenter
                                ? (centerWarehouses.map((w) => w.name).join(", ") || "--")
                                : "Picked automatically by the system"}
                        </div>
                        <p className="m-0 text-ink-muted">
                            Leave the service center blank to use the automatic choice. Verify the
                            warehouse, then click OK to retry the booking.
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setRetryRow(null)}>Cancel</Button>
                    <Button
                        color="primary"
                        onClick={() => {
                            const row = retryRow;
                            const code = selectedCenter?.value;
                            setRetryRow(null);
                            RetryBooking(row, code);
                        }}
                    >
                        OK
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={!!cancelRow} toggle={() => setCancelRow(null)} centered>
                <ModalHeader toggle={() => setCancelRow(null)}>Cancel Booking</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-2 text-sm">
                        <div><span className="font-bold">AWB No.:</span> {cancelRow?.velexp_awbno ?? "--"}</div>
                        <Label className="form-label m-0 font-bold text-ink-muted">Reason (required)</Label>
                        <textarea
                            className="form-control"
                            rows={3}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="e.g. Pincode not serviceable, sent via Bluedart"
                        />
                        <p className="m-0 text-ink-muted">
                            This blocks any later Delhivery booking for this AWB. It cannot be used once
                            the shipment is already booked with Delhivery.
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setCancelRow(null)}>Close</Button>
                    <Button
                        color="danger"
                        onClick={CancelBooking}
                        disabled={!cancelReason.trim() || !!cancellingAwb}
                    >
                        {cancellingAwb ? "Cancelling..." : "Cancel Booking"}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
export default ServiceProviderBooking