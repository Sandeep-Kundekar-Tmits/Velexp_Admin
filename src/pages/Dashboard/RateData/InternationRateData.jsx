import { useMemo, useState, useEffect } from "react";
import { Button, Col, FormGroup, Input, Label, Row, Spinner } from "reactstrap";
import Select from "react-select";
import { FaFileExcel, FaEye } from "react-icons/fa";
import { customStyles } from "../../../helpers/CustomStyle";
import useExcelParser from "../../../hooks/useExcelParser";
import { useExcelExport } from "../../../hooks/useExcelExport";
import ToasterProvider from "../../../helpers/ToasterProvider";
import TableContainer from "../../../components/Table/TableContainer";
import { GET_INTERNATIONAL_RATE_DATA, GET_INTERNATIONAL_RATE_DATA_CUSTOMER, POST_USER_API, UPLOAD_INTERNATIONAL_RATE_DATA_CUSTOMER } from "../../../api";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { GridLoader } from "react-spinners";
import SimpleModal from "../../../components/SimpleModal";
import MainHeaderComp from "../../../components/MainHeaderCom";

/**
 * Required vertical labels that must exist in the first column "Country"
 */
const REQUIRED_VERTICAL_KEYS = [
    "TAT",
    "Duty",
    "Add Kg",
    "Max Box Weight",
    "One Box One AWB",
    "Volumetric Divisor",
    "Max Liability",
    "FSC"
];

const InternationRateData = () => {
    const { ErrorToaster, SucceesToaster } = ToasterProvider();
    const [customer, setCustomer] = useState(null);
    const [isViewingCustomerData, setIsViewingCustomerData] = useState(false);
    const [rateData, setRateData] = useState([]);
    const [masterData, setMasterData] = useState([]);
    const [uploadedData, setUploadedData] = useState([]);
    const [file, setFile] = useState(null);
    const [userListOptions, setUserListOptions] = useState([]);
    const { apifunc: fetchUsers, data: usersList } = useGetApiCall();
    const { apifunc: fetchRateData, loading: isFetchingData, data: usersListFromApi } = useGetApiCall();
    const { apifunc: fetchCustomerRateData, loading: isFetchingCustomerData } = usePostApiCall(null, null);
    const { apifunc: uploadBulkData, loading: isUploadingData } = usePostApiCall(null, null);

    const { parseExcel: convertExcelToJson, isLoading: jsonLoading } = useExcelParser();
    const { exportToExcel: exportTemplate, isExporting: isExportingTemplate } = useExcelExport();

    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [modalErrorMessage, setModalErrorMessage] = useState("");

    useEffect(() => {
        fetchUsers(POST_USER_API);
        fetchRateData(GET_INTERNATIONAL_RATE_DATA);
    }, []);

    useEffect(() => {
        if (usersList && Array.isArray(usersList)) {
            const options = usersList
                .map((u) => {
                    const label = u.customer_name || u.username;
                    return label ? { value: label, label, id: u.id } : null;
                })
                .filter(Boolean);
            setUserListOptions(options);
        }
    }, [usersList]);

    useEffect(() => {
        if (usersListFromApi) {
            const data = usersListFromApi?.data || usersListFromApi;
            setMasterData(data);
            setRateData(data);
        }
    }, [usersListFromApi]);

    const handleView = async () => {
        if (!customer) {
            setIsViewingCustomerData(false);
            fetchRateData(GET_INTERNATIONAL_RATE_DATA);
            return;
        }
        const payload = { customer_name: customer.label };
        const response = await fetchCustomerRateData(GET_INTERNATIONAL_RATE_DATA_CUSTOMER, payload);
        if (response) {
            const data = response?.data || response;
            setRateData(data);
            setIsViewingCustomerData(true);
        }
    };


    /**
     * handleFileChange
     * Matrix Parsing Logic: 
     * Treats Col A as keys, every subsequent column as a dynamic Country.
     */
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);

        const options = { dataStartRow: 1, caseSensitiveHeaders: false };

        const result = await convertExcelToJson(selectedFile, ["Country"], options);
        if (result?.message) {
            setModalErrorMessage(result.message);
            setIsErrorModalOpen(true);
            return;
        }

        const jsonData = result?.data || [];

        const countries = result?.actualHeaders?.slice(1);
        if (!countries || countries.length === 0) {
            setModalErrorMessage("No country columns found. Please add countries to the template.");
            setIsErrorModalOpen(true);
            return;
        }

        const foundKeys = new Set();
        jsonData.forEach(row => {
            const label = row["Country"]?.toString().trim();
            if (!label) return;
            REQUIRED_VERTICAL_KEYS.forEach(reqKey => {
                if (label.toLowerCase().includes(reqKey.toLowerCase())) foundKeys.add(reqKey);
            });
        });

        const missingKeys = REQUIRED_VERTICAL_KEYS.filter(k => !foundKeys.has(k));
        if (missingKeys.length > 0) {
            setModalErrorMessage(`Invalid Template structure. The following required labels are missing in the first column:\n\n${missingKeys.join(", ")}`);
            setIsErrorModalOpen(true);
            return;
        }

        try {
            const countryAttribs = {};
            countries.forEach(country => {
                countryAttribs[country] = {
                    country, tat_days: 0, duty_paid: false, add_kg: 0,
                    max_box_weight: 0, one_box_one_awb: false,
                    volumetric_divisor: 0, max_liability: 0, FSC: 0, rate_slabs: []
                };
            });

            jsonData.forEach(row => {
                const label = row["Country"]?.toString().trim();
                if (!label) return;

                countries.forEach(country => {
                    const value = row[country];
                    const lowerLabel = label.toLowerCase();

                    if (lowerLabel.includes("tat")) {
                        countryAttribs[country].tat_days = parseInt(value) || 0;
                    } else if (lowerLabel.includes("duty")) {
                        countryAttribs[country].duty_paid = value?.toString().toUpperCase() === "DDP";
                    } else if (lowerLabel.includes("add kg")) {
                        countryAttribs[country].add_kg = parseFloat(value) || 0;
                    } else if (lowerLabel.includes("max box weight")) {
                        countryAttribs[country].max_box_weight = parseFloat(value?.toString().replace(/[^0-9.]/g, '')) || 0;
                    } else if (lowerLabel.includes("one box one awb")) {
                        countryAttribs[country].one_box_one_awb = value?.toString().toLowerCase() === "yes";
                    } else if (lowerLabel.includes("volumetric divisor")) {
                        countryAttribs[country].volumetric_divisor = parseInt(value) || 0;
                    } else if (lowerLabel.includes("max liability")) {
                        countryAttribs[country].max_liability = parseFloat(value) || 0;
                    } else if (lowerLabel === "fsc") {
                        countryAttribs[country].FSC = parseFloat(value) || 0;
                    } else if (!isNaN(parseFloat(label))) {
                        const weight_kg = parseFloat(label);
                        const rate = parseFloat(value);
                        if (!isNaN(rate)) countryAttribs[country].rate_slabs.push({ weight_kg, rate });
                    }
                });
            });

            const finalData = Object.values(countryAttribs).filter(c => c.rate_slabs.length > 0);

            if (finalData.length === 0) {
                setModalErrorMessage("Empty Template. No rate data found for any country. Please fill in the rates under the 'Weight Slabs (Kg)' section before uploading.");
                setIsErrorModalOpen(true);
                return;
            }

            setUploadedData(finalData);
        } catch (err) {
            ErrorToaster("Failed to process Excel matrix.");
        }
    };

    const handleUpload = async () => {
        if (!customer) {
            ErrorToaster("Please select a customer first.");
            return;
        }
        if (uploadedData.length === 0) {
            ErrorToaster("No data to upload. Please parse an Excel file first.");
            return;
        }

        const payload = {
            customer_name: customer.label,
            countries: uploadedData
        };



        const response = await uploadBulkData(UPLOAD_INTERNATIONAL_RATE_DATA_CUSTOMER, payload);
        if (response?.status === "success" || response?.status === 1) {
            setUploadedData([]);
            setFile(null);
            SucceesToaster(response?.message || "Rate data uploaded successfully.");
            fetchRateData(GET_INTERNATIONAL_RATE_DATA);
        }
    };

    const downloadTemplate = () => {
        const exampleCountries = ["Example Country (Edit)"];
        const templateData = [
            { "Country": "TAT (Days)", ...exampleCountries.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
            { "Country": "Duty (DDU/DDP)", ...exampleCountries.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
            { "Country": "Add Kg Rate", ...exampleCountries.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
            { "Country": "Max Box Weight (Kg)", ...exampleCountries.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
            { "Country": "One Box One AWB (Yes/No)", ...exampleCountries.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
            { "Country": "Volumetric Divisor", ...exampleCountries.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
            { "Country": "Max Liability (INR)", ...exampleCountries.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
            { "Country": "FSC", ...exampleCountries.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
            { "Country": "--- Weight Slabs (Kg) ---", ...exampleCountries.reduce((acc, c) => ({ ...acc, [c]: "Rates ↓" }), {}) },
            { "Country": "", ...exampleCountries.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
            { "Country": "", ...exampleCountries.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
        ];
        exportTemplate(templateData, "International_Rate_Data_Template");
    };

    const onIntDonloadExcelFile = () => {
        if (!rateData || rateData.length === 0) {
            ErrorToaster("No data available to export.");
            return;
        }

        const countryGroups = {};
        const weightsSet = new Set();

        rateData.forEach(item => {
            const countryName = item.country?.country || item.country || "Unknown";
            if (!countryGroups[countryName]) {
                const metadata = { ...(item.country || {}), ...item };
                countryGroups[countryName] = {
                    metadata,
                    slabs: {}
                };
            }
            const weight = item.weight_min ?? item.weight_kg ?? item.weight;
            if (weight != null) {
                countryGroups[countryName].slabs[weight] = item.rate;
                weightsSet.add(weight);
            }
        });

        const countries = Object.keys(countryGroups);
        const sortedWeights = [...weightsSet].sort((a, b) => parseFloat(a) - parseFloat(b));

        const getMeta = (country, keys) => {
            const meta = countryGroups[country].metadata;
            for (const k of keys) {
                if (meta[k] !== undefined && meta[k] !== null) return meta[k];
            }
            return "";
        };

        const formatDuty = (val) => {
            if (val === true || (typeof val === 'string' && val.toUpperCase() === "DDP")) return "DDP";
            if (val === false || (typeof val === 'string' && val.toUpperCase() === "DDU")) return "DDU";
            return val || "";
        };

        const formatBool = (val) => {
            if (val === true || (typeof val === 'string' && val.toLowerCase() === "yes")) return "Yes";
            if (val === false || (typeof val === 'string' && val.toLowerCase() === "no")) return "No";
            return val || "";
        }

        const exportData = [
            { "Country": "TAT (Days)", ...countries.reduce((acc, c) => ({ ...acc, [c]: getMeta(c, ["tat", "tat"]) }), {}) },
            { "Country": "Duty (DDU/DDP)", ...countries.reduce((acc, c) => ({ ...acc, [c]: formatDuty(getMeta(c, ["duty_paid", "duty"])) }), {}) },
            { "Country": "Add Kg Rate", ...countries.reduce((acc, c) => ({ ...acc, [c]: getMeta(c, ["add_kgs", "add_kg_rate", "add_kg_price"]) }), {}) },
            { "Country": "Max Box Weight (Kg)", ...countries.reduce((acc, c) => ({ ...acc, [c]: getMeta(c, ["max_box_weight", "max_box"]) }), {}) },
            { "Country": "One Box One AWB (Yes/No)", ...countries.reduce((acc, c) => ({ ...acc, [c]: formatBool(getMeta(c, ["one_box_one_awb", "one_box"])) }), {}) },
            { "Country": "Volumetric Divisor", ...countries.reduce((acc, c) => ({ ...acc, [c]: getMeta(c, ["volumentric_divisor", "divisor"]) }), {}) },
            { "Country": "Max Liability (INR)", ...countries.reduce((acc, c) => ({ ...acc, [c]: getMeta(c, ["max_liability", "liability"]) }), {}) },
            { "Country": "FSC", ...countries.reduce((acc, c) => ({ ...acc, [c]: getMeta(c, ["FSC", "fsc"]) }), {}) },
            { "Country": "--- Weight Slabs (Kg) ---", ...countries.reduce((acc, c) => ({ ...acc, [c]: "Rates ↓" }), {}) },
        ];

        sortedWeights.forEach(w => {
            const row = { "Country": w };
            countries.forEach(c => {
                row[c] = countryGroups[c].slabs[w] ?? "";
            });
            exportData.push(row);
        });

        exportTemplate(exportData, "International_Rate_Data_Export");
    };

    const columns = useMemo(() => {
        const baseColumns = [
            { header: "Country", accessorKey: "country.country", cell: ({ row }) => row.original?.country?.country ?? "NA" },
            { header: "Code", accessorKey: "country.country_code", cell: ({ row }) => row.original?.country?.country_code ?? "NA" },
            { header: "Weight Min", accessorKey: "weight_min", cell: ({ row }) => row.original?.weight_min ?? "NA" },
            { header: "Weight Max", accessorKey: "weight_max", cell: ({ row }) => row.original?.weight_max ?? "NA" },
            { header: "Rate", accessorKey: "rate", cell: ({ row }) => row.original?.rate ?? "NA" },
            { header: "FSC (%)", accessorKey: "FSC", cell: ({ row }) => row.original?.FSC ?? "NA" },
            { header: "GST (%)", accessorKey: "gst", cell: ({ row }) => row.original?.gst ?? "NA" },
        ];

        if (!isViewingCustomerData) return baseColumns;

        return [
            ...baseColumns,
            {
                header: "Duty",
                accessorKey: "duty_paid",
                cell: ({ row }) => {
                    const val = row.original?.duty_paid;
                    if (val === true || (typeof val === 'string' && val.toUpperCase() === "DDP")) return "DDP";
                    if (val === false || (typeof val === 'string' && val.toUpperCase() === "DDU")) return "DDU";
                    return "NA";
                }
            },
            { header: "Add Kg", accessorKey: "add_kgs", cell: ({ row }) => row.original?.add_kgs ?? row.original?.add_kg_rate ?? "NA" },
            { header: "Max Box Weight", accessorKey: "max_box_weight", cell: ({ row }) => row.original?.max_box_weight ?? "NA" },
            {
                header: "One Box One AWB",
                accessorKey: "one_box_one_awb",
                cell: ({ row }) => {
                    const val = row.original?.one_box_one_awb;
                    if (val === true || (typeof val === 'string' && val.toLowerCase() === "yes")) return "Yes";
                    if (val === false || (typeof val === 'string' && val.toLowerCase() === "no")) return "No";
                    return "NA";
                }
            },
            { header: "Vol. Divisor", accessorKey: "volumentric_divisor", cell: ({ row }) => row.original?.volumentric_divisor ?? "NA" },
            { header: "Max Liability", accessorKey: "max_liability", cell: ({ row }) => row.original?.max_liability ?? "NA" },
            { header: "TAT", accessorKey: "tat_days", cell: ({ row }) => row.original?.tat_days ?? row.original?.tat ?? "NA" },
        ];
    }, [isViewingCustomerData]);

    return (
        <div className="page-content py-0">
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp
                    title="International Rate Data"
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

                <Row className="mt-4">
                    <Col md={4}>
                        <FormGroup>
                            <Label>Select Customer</Label>
                            <Select
                                options={userListOptions}
                                value={customer}
                                onChange={(val) => {
                                    setCustomer(val);
                                    if (!val) {
                                        setIsViewingCustomerData(false);
                                        fetchRateData(GET_INTERNATIONAL_RATE_DATA);
                                    }
                                }}
                                placeholder="Search Customer"
                                isClearable
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={2} className="d-flex align-items-end mb-3">
                        <Button color="primary" className="w-100 d-flex align-items-center justify-content-center" onClick={handleView} disabled={!customer || isFetchingData || isFetchingCustomerData}>
                            <FaEye className="me-2" /> View
                        </Button>
                    </Col>
                </Row>

                <Row className="mt-2 border-bottom pb-4">
                    <Col md={4}>
                        <FormGroup>
                            <Label>Upload Rate Data</Label>
                            <Input type="file" onChange={handleFileChange} />
                        </FormGroup>
                    </Col>
                    <Col md={2} className="d-flex align-items-end mb-3">
                        <Button color="primary" className="w-100 d-flex align-items-center justify-content-center" disabled={!customer || !file || uploadedData.length === 0 || jsonLoading || isUploadingData} onClick={handleUpload}>
                            {isUploadingData ? <Spinner size="sm" /> : "Upload"}
                        </Button>
                    </Col>
                    {jsonLoading && <Col md={1} className="d-flex align-items-end mb-4"><Spinner size="sm" color="primary" /></Col>}
                </Row>

                <div className="mt-0">
                    {(isFetchingData || isFetchingCustomerData) ? (
                        <div style={{ height: "40vh" }} className="container-fluid d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-5 h5">Loading International Rate Data ...</p>
                        </div>
                    ) : (
                        <TableContainer
                            columns={columns}
                            isCustomPageSize={10}
                            isDownloadExcle={true}
                            onDownloadExcle={onIntDonloadExcelFile}
                            data={rateData}
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
                    title="Template Error"
                    cancelButtonName="Close"
                >
                    <div className="text-center">
                        <i className="ri-error-warning-line text-danger" style={{ fontSize: "3rem" }}></i>
                        <h4 className="mt-2 text-danger">Invalid Template</h4>
                        <p className="mt-3 text-muted" style={{ whiteSpace: "pre-line" }}>
                            {modalErrorMessage}
                        </p>
                    </div>
                </SimpleModal>
            </div>
        </div>
    );
};

export default InternationRateData;
