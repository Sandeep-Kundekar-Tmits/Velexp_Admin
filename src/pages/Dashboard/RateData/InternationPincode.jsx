import { Badge, Button, Col, FormGroup, Input, Label, Row, Spinner } from "reactstrap";
import { FaFileExcel } from "react-icons/fa";
import useExcelParser from "../../../hooks/useExcelParser";
import { useExcelExport } from "../../../hooks/useExcelExport";
import ToasterProvider from "../../../helpers/ToasterProvider";
import TableContainer from "../../../components/Table/TableContainer";
import SimpleModal from "../../../components/SimpleModal";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { DELETE_INTERNATIONAL_PINCODES, GET_INTERNATIONAL_PINCODES, UPLOAD_INTERNATIONAL_PINCODES } from "../../../api";
import { useEffect, useMemo, useState } from "react";
import { GridLoader } from "react-spinners";
import Select from "react-select";
import { customStyles } from "../../../helpers/CustomStyle";
import MainHeaderComp from "../../../components/MainHeaderCom";

const InternationPincode = () => {
    const { ErrorToaster, SucceesToaster } = ToasterProvider();
    const [pincodeData, setPincodeData] = useState([]);
    const [uploadedData, setUploadedData] = useState([]);
    const [file, setFile] = useState(null);
    const [selectedPincodes, setSelectedPincodes] = useState([]); // State for selected row IDs
    const [selectedCountryFilter, setSelectedCountryFilter] = useState(null);

    const { apifunc: fetchPincodes, loading: isFetchingPincodes, data: pincodesResponse } = useGetApiCall();
    const { apifunc: uploadPincodes, loading: isUploadingPincodes } = usePostApiCall(null, null);
    const { apifunc: bulkDeletePincodes, loading: isDeletingPincodes } = usePostApiCall(null, null);
    const { parseExcel: convertExcelToJson, isLoading: jsonLoading } = useExcelParser();
    const { exportToExcel: exportTemplate, isExporting: isExportingTemplate } = useExcelExport();
    const { exportToExcel: exportData, isExporting: isExportingData } = useExcelExport();

    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [modalErrorMessage, setModalErrorMessage] = useState("");
    const [modalTitle, setModalTitle] = useState("Invalid Template");

    useEffect(() => {
        fetchPincodes(GET_INTERNATIONAL_PINCODES);
    }, []);

    useEffect(() => {
        if (pincodesResponse) {
            const data = pincodesResponse?.data || pincodesResponse;
            setPincodeData(data);
            setSelectedPincodes([]); // Reset selection when data refreshed
        }
    }, [pincodesResponse]);

    const REQUIRED_HEADERS = [
        "country", "pincode", "locality", "city", "state",
        "state_code", "billing_code", "zone", "remark", "is_active"
    ];

    /**
     * handleFileChange
     * Parses a flat Excel file with pincode details.
     */
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);

        const options = { dataStartRow: 1, caseSensitiveHeaders: false };

        const result = await convertExcelToJson(selectedFile, REQUIRED_HEADERS, options);
        if (result?.message) {
            setModalTitle("Template Error");
            setModalErrorMessage(result.message);
            setIsErrorModalOpen(true);
            return;
        }

        // Strict Header Check: No extra columns allowed
        const actualHeaders = result?.actualHeaders?.map(h => h.toLowerCase().trim()) || [];
        const extraHeaders = actualHeaders.filter(h => !REQUIRED_HEADERS.map(rh => rh.toLowerCase()).includes(h));

        if (extraHeaders.length > 0) {
            setModalTitle("Template Error");
            setModalErrorMessage(`The uploaded file contains extra columns that are not allowed:\n\n${extraHeaders.join(", ")}\n\nPlease use the provided template.`);
            setIsErrorModalOpen(true);
            setFile(null);
            return;
        }

        const jsonData = result?.data || [];
        if (jsonData.length === 0) {
            setModalTitle("Template Error");
            setModalErrorMessage("The uploaded file contains no data.");
            setIsErrorModalOpen(true);
            return;
        }

        // Map data to ensure consistent keys
        const formattedData = jsonData.map(row => ({
            country: row["country"] || row["Country"] || null,
            pincode: row["pincode"] || row["Pincode"] || null,
            locality: row["locality"] || row["Locality"] || null,
            city: row["city"] || row["City"] || null,
            state: row["state"] || row["State"] || null,
            state_code: row["state_code"] || row["State Code"] || null,
            billing_code: row["billing_code"] || row["Billing Code"] || null,
            zone: row["zone"] || row["Zone"] || null,
            remark: row["remark"] || row["Remark"] || null,
            is_active: row["is_active"]?.toString().toLowerCase() === "true" || row["Is Active"]?.toString().toLowerCase() === "true"
        }));

        setUploadedData(formattedData);
    };

    const handleUpload = async () => {
        if (!uploadedData || uploadedData.length === 0) {
            ErrorToaster("No data to upload. Please select a valid file first.");
            return;
        }

        const response = await uploadPincodes(UPLOAD_INTERNATIONAL_PINCODES, uploadedData);
        if (response) {
            if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
                const errorLines = response.errors.map(err => {
                    const rowNum = (err.index !== undefined ? `Row ${err.index + 1}: ` : "");
                    return `${rowNum}${err.error || "Unknown error"}`;
                });
                setModalTitle("Upload Errors");
                setModalErrorMessage(errorLines.join("\n"));
                setIsErrorModalOpen(true);
            } else {
                SucceesToaster(response.message || "Pincodes uploaded successfully.");
                setFile(null);
                setUploadedData([]);
                // Refresh listing
                fetchPincodes(GET_INTERNATIONAL_PINCODES);
            }
        }
    };

    /**
     * handleBulkDelete
     * Opens the confirmation modal before deletion.
     */
    const handleBulkDelete = () => {
        if (selectedPincodes.length === 0) {
            ErrorToaster("Please select at least one pincode to delete.");
            return;
        }
        setIsDeleteModalOpen(true);
    };

    /**
     * onConfirm
     * Actually calls the API to delete selected pincodes.
     */
    const onConfirm = async () => {
        const payload = { pincode_ids: selectedPincodes };
        const response = await bulkDeletePincodes(DELETE_INTERNATIONAL_PINCODES, payload);
        if (response) {
            SucceesToaster(response.message || "Selected pincodes deleted successfully.");
            setSelectedPincodes([]);
            setIsDeleteModalOpen(false);
            // Refresh listing
            fetchPincodes(GET_INTERNATIONAL_PINCODES);
        }
    };

    /**
     * handleSelectAll
     * Toggles selection for all pincodes in the current filtered view.
     */
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = displayData.map(p => p.id).filter(id => id != null);
            setSelectedPincodes(allIds);
        } else {
            setSelectedPincodes([]);
        }
    };

    /**
     * handleSelectRow
     * Adds/removes a single pincode ID from the selected list.
     */
    const handleSelectRow = (id) => {
        setSelectedPincodes(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Derived unique countries for filter dropdown
    const countryOptions = useMemo(() => {
        const countries = [...new Set(pincodeData.map(p => p.country).filter(Boolean))];
        return countries.map(c => ({ value: c, label: c }));
    }, [pincodeData]);

    // Filtered data to display in the table
    const displayData = useMemo(() => {
        if (!selectedCountryFilter) return pincodeData;
        return pincodeData.filter(p => p.country === selectedCountryFilter.value);
    }, [pincodeData, selectedCountryFilter]);

    /**
     * onExcelDownload
     * Exports the current pincode data to an Excel file.
     */
    const onExcelDownload = () => {
        if (!pincodeData || pincodeData.length === 0) {
            ErrorToaster("No data available to export.");
            return;
        }

        const formatValue = (val) => (val === null || val === undefined || val === "") ? "--" : val;

        const exportDataList = pincodeData.map(row => ({
            "country": formatValue(row.country),
            "pincode": formatValue(row.pincode),
            "locality": formatValue(row.locality),
            "city": formatValue(row.city),
            "state": formatValue(row.state),
            "state_code": formatValue(row.state_code),
            "billing_code": formatValue(row.billing_code),
            "zone": formatValue(row.zone),
            "remark": formatValue(row.remark),
            "is_active": row.is_active === true ? "True" : "False"
        }));

        exportData(exportDataList, "International_Pincode_Data_Export");
    };

    const downloadTemplate = () => {
        const templateData = [
            {
                "country": "",
                "pincode": "",
                "locality": "",
                "city": "",
                "state": "",
                "state_code": "",
                "billing_code": "",
                "zone": "",
                "remark": "",
                "is_active": ""
            }
        ];
        exportTemplate(templateData, "International_Pincode_Template");
    };

    const columns = useMemo(() => [
        {
            header: () => (
                <Input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={displayData.length > 0 && selectedPincodes.length === displayData.length}
                />
            ),
            id: "selection",
            cell: ({ row }) => (
                <Input
                    type="checkbox"
                    checked={selectedPincodes.includes(row.original.id)}
                    onChange={() => handleSelectRow(row.original.id)}
                />
            ),
        },
        { header: "Pincode", accessorKey: "pincode", cell: ({ row }) => row.original?.pincode ?? "--" },
        { header: "Country", accessorKey: "country", cell: ({ row }) => row.original?.country ?? "--" },
        { header: "Locality", accessorKey: "locality", cell: ({ row }) => row.original?.locality ?? "--" },
        { header: "Zone", accessorKey: "zone", cell: ({ row }) => row.original?.zone ?? "--" },
        { header: "City", accessorKey: "city", cell: ({ row }) => row.original?.city ?? "--" },
        { header: "State", accessorKey: "state", cell: ({ row }) => row.original?.state ?? "--" },
        {
            header: "Status",
            accessorKey: "is_active",
            cell: ({ row }) => (
                <span
                    className={`badge badge-soft-${row.original?.is_active ? "success" : "danger"} text-${row.original?.is_active ? "success" : "danger"} font-size-12`}
                >
                    {row.original?.is_active ? "Active" : "Inactive"}
                </span>
            )
        }
    ], [displayData, selectedPincodes]);

    return (
        <div className="page-content py-0">
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp
                    title="International Pincode"
                    extraFields={
                        <div className="d-flex align-items-center">
                            <h6 className="text-black fw-bold mb-0 me-2" style={{ fontSize: "14px" }}>Template</h6>
                            <Button
                                color="success"
                                outline
                                onClick={downloadTemplate}
                                className="d-flex align-items-center justify-content-center p-2"
                                style={{ borderRadius: "7px", width: "180px", fontWeight: "500", fontSize: "12px", height: "35px" }}
                            >
                                {isExportingTemplate ? "Generating..." : "Download"}
                                <FaFileExcel size={14} className="ms-2" />
                            </Button>
                        </div>
                    }
                />
            </div>
            <div className="container-fluid">

                <Row className="mt-2 border-bottom pb-4">
                    <Col md={4}>
                        <FormGroup>
                            <Label>Upload Pincode Data</Label>
                            <Input type="file" onChange={handleFileChange} />
                        </FormGroup>
                    </Col>
                    <Col md={2} className="d-flex align-items-end mb-3">
                        <Button color="primary" className="w-100 d-flex align-items-center justify-content-center" disabled={!file || uploadedData.length === 0 || jsonLoading || isUploadingPincodes} onClick={handleUpload}>
                            {isUploadingPincodes ? <Spinner size="sm" /> : "Upload"}
                        </Button>
                    </Col>
                    {jsonLoading && <Col md={1} className="d-flex align-items-end mb-4"><Spinner size="sm" color="primary" /></Col>}
                </Row>


                <div className="mt-4">
                    {isFetchingPincodes ? (
                        <div style={{ height: "40vh" }} className="container-fluid d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-5 h5">Loading International Pincodes ...</p>
                        </div>
                    ) : (
                        <TableContainer
                            extraFiled={
                                <div className="d-flex align-items-center gap-2">
                                    <div style={{ width: "220px" }}>
                                        <Select
                                            options={countryOptions}
                                            value={selectedCountryFilter}
                                            onChange={(val) => {
                                                setSelectedCountryFilter(val);
                                                setSelectedPincodes([]); // Clear selection when filter changes
                                            }}
                                            isClearable
                                            placeholder="Filter by Country"
                                            styles={customStyles}
                                        />
                                    </div>
                                    {selectedPincodes.length > 0 && (
                                        <Button
                                            color="danger"
                                            onClick={handleBulkDelete}
                                            disabled={isDeletingPincodes}
                                            style={{ borderRadius: "5px" }}
                                        >
                                            {isDeletingPincodes ? <Spinner size="sm" /> : `(${selectedPincodes.length}) Delete`}
                                        </Button>
                                    )}
                                </div>
                            }
                            isDownloadExcle={true}
                            ExcleLoading={isExportingData}
                            onDownloadExcle={onExcelDownload}
                            isCustomPageSize={10}
                            columns={columns}
                            data={displayData}
                            isGlobalFilter={true}
                            isPagination={true}
                            SearchPlaceholder="Search from table..."
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers"
                            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                        />
                    )}
                </div>

                <SimpleModal
                    isOpen={isErrorModalOpen}
                    setIsOpen={setIsErrorModalOpen}
                    cancelButtonName="Close"
                >
                    <div className="text-center">
                        <i className="ri-error-warning-line text-danger" style={{ fontSize: "3rem" }}></i>
                        <h4 className="mt-2 text-danger">{modalTitle}</h4>
                        <p className="mt-3 text-muted" style={{ whiteSpace: "pre-line" }}>
                            {modalErrorMessage}
                        </p>
                    </div>
                </SimpleModal>

                <SimpleModal
                    isOpen={isDeleteModalOpen}
                    setIsOpen={setIsDeleteModalOpen}
                    cancelButtonName="Cancel"
                    successButtonName="Confirm"
                    onSuccess={onConfirm}
                >
                    <div className="text-start p-0">
                        <h5 className="mb-3">Confirm Deletion</h5>
                        <p className="text-muted mb-2" style={{ fontWeight: "500", fontSize: "14px" }}>The following default pincodes will be deleted:</p>
                        <div className="border p-2 rounded mb-2 d-flex flex-wrap gap-2" style={{ minHeight: "60px", maxHeight: "150px", overflowY: "auto", borderColor: "#e9ebec" }}>
                            {selectedPincodes.map(id => {
                                const pincode = pincodeData.find(p => p.id === id);
                                return (
                                    <Badge
                                        key={id}
                                        color="light"
                                        className="text-dark bg-opacity-10 d-flex align-items-center rounded-pill bg-gray-200"
                                        style={{ fontSize: "15px", fontWeight: "500", padding: "6px 12px" }}
                                    >
                                        {pincode?.pincode}
                                    </Badge>
                                );
                            })}
                        </div>
                        <p className="text-danger mb-0" style={{ fontWeight: "600", fontSize: "14px" }}>Are you sure you want to delete pincodes?</p>
                    </div>
                </SimpleModal>
            </div>
        </div>
    );
};

export default InternationPincode;
