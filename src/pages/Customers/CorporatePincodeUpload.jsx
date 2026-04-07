import React, { useState, useEffect, useMemo, useRef } from "react";
import Select from "react-select";
import { Button, Col, FormGroup, Input, Label, Row, Spinner, Card, CardBody } from "reactstrap";
import { FaFileExcel, FaUpload, FaDownload, FaPlus, FaTrash, FaEye, FaEdit } from "react-icons/fa";
import MainHeaderCom from "../../components/MainHeaderCom";
import SearchableDropdown from "../../components/Common/SearchableDropdown";
import { customStyles } from "../../helpers/CustomStyle";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import useExcelParser from "../../hooks/useExcelParser";
import { useExcelExport } from "../../hooks/useExcelExport";
import { usePutApiCall } from "../../hooks/usePutApuCall";
import { useDeleteApiCall } from "../../hooks/useDeleteApiCall";
import ToasterProvider from "../../helpers/ToasterProvider";
import DeleteModal from "../../components/Common/DeleteModal";
import { GET_USER_API, IMPORT_CORPORATE_PINCODE_DATA, GET_CORPORATE_CUSTOMER_PINCODE_LIST, GET_CORPORATE_CUSTOMER_PRODUCTS } from "../../api";
import SimpleModal from "../../components/SimpleModal";
import TableContainer from "../../components/Table/TableContainer";

const CorporatePincodeUpload = () => {
    const { ErrorToaster, SucceesToaster } = ToasterProvider();
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [excelData, setExcelData] = useState([]);
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalError, setModalError] = useState("");

    // Hooks
    const { apifunc: GetCustomers, data: customerListRaw, loading: customersLoading } = useGetApiCall();
    const { apifunc: GetPincodes, data: pincodeDataRaw, loading: pincodesLoading } = useGetApiCall();
    const { parseExcel, isLoading: parsingLoading } = useExcelParser();
    const { exportToExcel: downloadTemplate, isExporting: downloadingTemplate } = useExcelExport();
    const { apifunc: uploadData, loading: uploadingData } = usePostApiCall();
    const { apifunc: GetProducts, data: productListRaw } = useGetApiCall();
    const { apifunc: GetSinglePincode, data: singlePincodeRaw, loading: singlePincodeLoading } = useGetApiCall();
    const { apifunc: postSinglePincode, loading: postingSinglePincode } = usePostApiCall();
    const { apifunc: putSinglePincode, loading: updatingSinglePincode } = usePutApiCall("Pincode updated successfully!");
    const { apifunc: deleteSinglePincode, loading: deletingSinglePincode } = useDeleteApiCall();

    const [pincodeList, setPincodeList] = useState([]);

    useEffect(() => {
        GetCustomers(`${GET_USER_API}/`);
    }, []);

    const fetchPincodes = (customerId) => {
        if (customerId) {
            GetPincodes(`${GET_CORPORATE_CUSTOMER_PINCODE_LIST}?customer_id=${customerId}`);
        } else {
            setPincodeList([]);
        }
    };

    useEffect(() => {
        if (selectedCustomer?.id) {
            fetchPincodes(selectedCustomer.id);
            GetProducts(`${GET_CORPORATE_CUSTOMER_PRODUCTS}?customer_id=${selectedCustomer.id}`);
        } else {
            setPincodeList([]);
        }
    }, [selectedCustomer]);

    const [addPincodeModal, setAddPincodeModal] = useState(false);
    const [viewPincodeModal, setViewPincodeModal] = useState(false);
    const [singlePincodeDetails, setSinglePincodeDetails] = useState(null);
    const [editingPincodeId, setEditingPincodeId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [pincodeIdToDelete, setPincodeIdToDelete] = useState(null);
    const [newPincode, setNewPincode] = useState({
        pincode: "",
        city: "",
        state: "",
        region: "",
        legacy_zone: "",
        zone_tag: "",
        is_metro: false,
        services: [
            { product: null, can_pickup: true, can_deliver: true, is_oda: false }
        ]
    });

    const productOptions = useMemo(() => {
        if (!productListRaw) return [];
        const resultData = productListRaw.result || (Array.isArray(productListRaw) ? productListRaw : (productListRaw.results || []));
        return resultData.map(p => ({
            id: p.id,
            value: p.id,
            name: p.product_name || p.name || "Unknown Product"
        }));
    }, [productListRaw]);

    useEffect(() => {
        if (pincodeDataRaw) {
            const list = pincodeDataRaw.result || (Array.isArray(pincodeDataRaw) ? pincodeDataRaw : (pincodeDataRaw.results || []));
            setPincodeList(list);
        }
    }, [pincodeDataRaw]);

    const customerOptions = useMemo(() => {
        if (!customerListRaw) return [];
        return customerListRaw
            .filter(ele => ele?.cust_type?.type_of_cust === "Corporate")
            .map(ele => ({
                id: ele.id,
                value: ele.customer_name,
                label: ele.customer_name
            }));
    }, [customerListRaw]);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setExcelData([]); // Reset data during parsing

        const requiredHeaders = [
            "pincode",
            "city",
            "state",
            "region",
            "legacy_zone",
            "is_metro",
            "zone_tag",
            "product",
            "pickup",
            "deliver",
            "oda"
        ];

        const options = {
            dataStartRow: 1,
            caseSensitiveHeaders: false
        };

        const result = await parseExcel(selectedFile, requiredHeaders, options);
        if (result.message) {
            setModalError(result.message);
            setShowErrorModal(true);
            setExcelData([]);
            return;
        }

        const normalizedData = result.data.map(row => {
            const newRow = {};
            Object.keys(row).forEach(key => {
                newRow[key.toLowerCase().trim()] = row[key];
            });
            return newRow;
        });

        setExcelData(normalizedData);
    };

    const validateAndUpload = async () => {
        if (!selectedCustomer) {
            ErrorToaster("Please select a customer first.");
            return;
        }
        if (excelData.length === 0) {
            ErrorToaster("No data found in the selected file.");
            return;
        }

        // Group by Pincode
        const pincodeGroups = {};
        const errors = [];

        excelData.forEach((row, index) => {
            const pincode = String(row.pincode || "").trim();
            if (pincode.length !== 6) {
                errors.push(`Row ${index + 1}: Pincode "${pincode}" must be exactly 6 digits.`);
                return;
            }

            const productName = String(row.product || "").trim();
            if (!productName) {
                errors.push(`Row ${index + 1}: Product name is missing.`);
                return;
            }

            // Find product ID from options
            const product = productOptions.find(p => p.name.toLowerCase() === productName.toLowerCase());
            if (!product) {
                errors.push(`Row ${index + 1}: Product "${productName}" is not valid for this customer.`);
                return;
            }

            if (!pincodeGroups[pincode]) {
                pincodeGroups[pincode] = {
                    pincode: pincode,
                    city: (row.city || "").toString().toUpperCase(),
                    state: (row.state || "").toString().toUpperCase(),
                    region: (row.region || "").toString().toUpperCase(),
                    legacy_zone: (row.legacy_zone || "").toString().toUpperCase(),
                    is_metro: String(row.is_metro || "").toLowerCase() === "yes" || String(row.is_metro || "").toLowerCase() === "true" || row.is_metro === 1,
                    zone_tag: (row.zone_tag || "").toString().toUpperCase() || null,
                    services: []
                };
            }

            const isTrue = (val) => String(val || "").toLowerCase() === "yes" || String(val || "").toLowerCase() === "true" || val === 1 || val === true;

            pincodeGroups[pincode].services.push({
                product: product.id,
                can_pickup: isTrue(row.pickup),
                can_deliver: isTrue(row.deliver),
                is_oda: isTrue(row.oda)
            });
        });

        const formattedData = Object.values(pincodeGroups);

        if (errors.length > 0) {
            setModalError(errors.join("\n"));
            setShowErrorModal(true);
            return;
        }

        const payload = {
            customer_id: String(selectedCustomer.id),
            pincodes: formattedData
        };

        const response = await uploadData(IMPORT_CORPORATE_PINCODE_DATA, payload);
        if (response?.status === 1 || response?.status === "success") {
            SucceesToaster(response?.msg || "Pincode data imported successfully!");
            setFile(null);
            setExcelData([]);
            // Refresh list if still on the same customer
            if (selectedCustomer?.id) {
                fetchPincodes(selectedCustomer.id);
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
            ErrorToaster(response?.msg || response?.message || "Failed to import data.");
        }
    };

    const addServiceRow = () => {
        setNewPincode({
            ...newPincode,
            services: [...newPincode.services, { product: null, can_pickup: true, can_deliver: true, is_oda: false }]
        });
    };

    const removeServiceRow = (index) => {
        const updated = [...newPincode.services];
        updated.splice(index, 1);
        setNewPincode({ ...newPincode, services: updated });
    };

    const handleServiceChange = (index, field, value) => {
        const updated = [...newPincode.services];
        updated[index][field] = value;
        setNewPincode({ ...newPincode, services: updated });
    };

    useEffect(() => {
        if (addPincodeModal && singlePincodeRaw && editingPincodeId) {
            const data = singlePincodeRaw.result || singlePincodeRaw;
            setNewPincode({
                pincode: data.pincode,
                city: data.city,
                state: data.state,
                region: data.region,
                legacy_zone: data.legacy_zone,
                zone_tag: data.zone_tag || "",
                is_metro: data.is_metro || false,
                services: data.services.map(s => ({
                    product: { id: s.product, name: s.product_name },
                    can_pickup: s.can_pickup,
                    can_deliver: s.can_deliver,
                    is_oda: s.is_oda
                }))
            });
        }
    }, [singlePincodeRaw, addPincodeModal, editingPincodeId]);

    const handleAddPincodeSubmit = async () => {
        if (!selectedCustomer) {
            ErrorToaster("Please select a customer first.");
            return;
        }
        if (!newPincode.pincode || newPincode.pincode.length !== 6) {
            ErrorToaster("Please enter a valid 6-digit pincode.");
            return;
        }

        const validServices = newPincode.services.filter(s => s.product !== null);
        if (validServices.length === 0) {
            ErrorToaster("Please add at least one product service.");
            return;
        }

        const payload = {
            customer_id: selectedCustomer.id,
            pincode: newPincode.pincode,
            city: newPincode.city.toUpperCase(),
            state: newPincode.state.toUpperCase(),
            region: newPincode.region.toUpperCase(),
            legacy_zone: newPincode.legacy_zone.toUpperCase(),
            zone_tag: newPincode.zone_tag?.toUpperCase() || null,
            is_metro: newPincode.is_metro,
            services: validServices.map(s => ({
                product: s.product.id || s.product.value,
                can_pickup: s.can_pickup,
                can_deliver: s.can_deliver,
                is_oda: s.is_oda
            }))
        };

        let response;
        if (editingPincodeId) {
            response = await putSinglePincode(`${GET_CORPORATE_CUSTOMER_PINCODE_LIST}${editingPincodeId}/?customer_id=${selectedCustomer.id}`, payload);
        } else {
            response = await postSinglePincode(GET_CORPORATE_CUSTOMER_PINCODE_LIST, payload);
        }

        if (response && !response.error && (response.status === "success" || response.id || response.result)) {
            setAddPincodeModal(false);
            setEditingPincodeId(null);
            setNewPincode({
                pincode: "",
                city: "",
                state: "",
                region: "",
                legacy_zone: "",
                zone_tag: "",
                is_metro: false,
                services: [
                    { product: null, can_pickup: true, can_deliver: true, is_oda: false }
                ]
            });
            fetchPincodes(selectedCustomer.id);
        } else {
            ErrorToaster(response?.message || "Failed to save pincode.");
        }
    };

    const handleViewPincode = (pincodeId) => {
        if (selectedCustomer?.id) {
            GetSinglePincode(`${GET_CORPORATE_CUSTOMER_PINCODE_LIST}${pincodeId}/?customer_id=${selectedCustomer.id}`);
            setViewPincodeModal(true);
        }
    };

    const handleEditPincode = (pincodeId) => {
        if (selectedCustomer?.id) {
            GetSinglePincode(`${GET_CORPORATE_CUSTOMER_PINCODE_LIST}${pincodeId}/?customer_id=${selectedCustomer.id}`);
            setEditingPincodeId(pincodeId);
            setAddPincodeModal(true);
        }
    };

    const handleDeletePincode = (pincodeId) => {
        setPincodeIdToDelete(pincodeId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (pincodeIdToDelete && selectedCustomer?.id) {
            const response = await deleteSinglePincode(`${GET_CORPORATE_CUSTOMER_PINCODE_LIST}${pincodeIdToDelete}/?customer_id=${selectedCustomer.id}`);
            if (response) {
                setIsDeleteModalOpen(false);
                setPincodeIdToDelete(null);
                fetchPincodes(selectedCustomer.id);
            }
        }
    };

    useEffect(() => {
        if (singlePincodeRaw) {
            setSinglePincodeDetails(singlePincodeRaw.result || singlePincodeRaw);
        }
    }, [singlePincodeRaw]);

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                pincode: "411001",
                city: "Pune",
                state: "MH",
                region: "West",
                legacy_zone: "N1",
                is_metro: "No",
                zone_tag: "ZT1",
                product: productOptions.length > 0 ? productOptions[0].name : "VELOFREIGHT",
                pickup: "Yes",
                deliver: "Yes",
                oda: "No"
            },
            {
                pincode: "411001",
                city: "Pune",
                state: "MH",
                region: "West",
                legacy_zone: "N1",
                is_metro: "No",
                zone_tag: "ZT1",
                product: productOptions.length > 1 ? productOptions[1].name : "VELOSURE",
                pickup: "Yes",
                deliver: "No",
                oda: "Yes"
            }
        ];
        downloadTemplate(templateData, "Corporate_Pincode_Import_Template");
    };

    const columns = useMemo(() => [
        {
            header: "Pincode",
            accessorKey: "pincode",
        },
        {
            header: "City",
            accessorKey: "city",
        },
        {
            header: "State",
            accessorKey: "state",
        },
        {
            header: "Region",
            accessorKey: "region",
        },
        {
            header: "Legacy Zone",
            accessorKey: "legacy_zone",
        },
        {
            header: "Zone Tag",
            accessorKey: "zone_tag",
        },
        {
            header: "Products",
            accessorKey: "services",
            cell: (cell) => {
                const services = cell.getValue();
                if (Array.isArray(services)) {
                    return services.map(s => s.product_name || "N/A").join(", ");
                }
                return "N/A";
            }
        },
        {
            header: "Action",
            accessorKey: "id",
            cell: (cell) => (
                <div className="d-flex gap-1 justify-content-center">
                    <Button
                        color="primary"
                        size="sm"
                        outline
                        onClick={() => handleViewPincode(cell.getValue())}
                        title="View Details"
                    >
                        <FaEye />
                    </Button>
                    <Button
                        color="info"
                        size="sm"
                        outline
                        onClick={() => handleEditPincode(cell.getValue())}
                        title="Edit Details"
                    >
                        <FaEdit />
                    </Button>
                    <Button
                        color="danger"
                        size="sm"
                        outline
                        onClick={() => handleDeletePincode(cell.getValue())}
                        title="Delete Pincode"
                    >
                        {pincodeIdToDelete === cell.getValue() && deletingSinglePincode ? <Spinner size="sm" /> : <FaTrash />}
                    </Button>
                </div>
            )
        }
    ], [selectedCustomer, productOptions]);

    return (
        <div className="page-content py-0 px-0">
            <MainHeaderCom title="Pincode Upload" />
            <div className="container-fluid px-3 mt-4">
                <Card>
                    <CardBody>
                        <Row>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Select Corporate Customer</Label>
                                    <Select
                                        options={customerOptions}
                                        placeholder={customersLoading ? "Loading..." : "Search Customer"}
                                        value={selectedCustomer}
                                        onChange={setSelectedCustomer}
                                        isClearable={true}
                                        styles={customStyles}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>File Upload (.xlsx)</Label>
                                    <Input
                                        type="file"
                                        accept=".xlsx"
                                        innerRef={fileInputRef}
                                        onChange={handleFileChange}
                                        disabled={!selectedCustomer}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4} className="d-flex flex-column gap-2 mb-3 mt-4 align-items-start">
                                <Button
                                    color="primary"
                                    onClick={validateAndUpload}
                                    disabled={!file || parsingLoading || uploadingData || !selectedCustomer || excelData.length === 0}
                                    className="w-100 d-flex align-items-center justify-content-center"
                                    style={{ height: "38px" }}
                                >
                                    {uploadingData ? (
                                        <Spinner size="sm" className="me-2" />
                                    ) : (
                                        <FaUpload className="me-2" />
                                    )}
                                    {uploadingData ? "Importing..." : "Start Import"}
                                </Button>
                                <Button
                                    color="success"
                                    onClick={handleDownloadTemplate}
                                    className="w-100 d-flex align-items-center justify-content-center"
                                    outline
                                    style={{ height: "38px" }}
                                >
                                    <FaDownload className="me-2" />
                                    {downloadingTemplate ? "Generating..." : "Download Template"}
                                </Button>
                            </Col>
                        </Row>

                        {excelData.length > 0 && (
                            <Row className="mt-4">
                                <Col md={12}>
                                    <div className="alert alert-info py-2">
                                        <strong>Ready to Import:</strong> {excelData.length} rows found in file.
                                    </div>
                                </Col>
                            </Row>
                        )}
                    </CardBody>
                </Card>

                {selectedCustomer && (
                    <Card className="mt-4 shadow-sm">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">Existing Pincode Services: {selectedCustomer.label}</h5>
                                <Button
                                    color="primary"
                                    size="sm"
                                    onClick={() => setAddPincodeModal(true)}
                                >
                                    Add Pincode
                                </Button>
                            </div>
                            {pincodesLoading ? (
                                <div className="text-center p-5">
                                    <Spinner color="primary" />
                                    <p className="mt-2 text-muted">Fetching existing pincodes...</p>
                                </div>
                            ) : (
                                <TableContainer
                                    columns={columns}
                                    data={pincodeList}
                                    isGlobalFilter={true}
                                    isPagination={true}
                                    SearchPlaceholder="Search pincodes..."
                                    pagination="pagination pagination-rounded justify-content-end mb-2"
                                    paginationWrapper='dataTables_paginate paging_simple_numbers'
                                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline mb-0"
                                />
                            )}
                        </CardBody>
                    </Card>
                )}
            </div>
            <SimpleModal
                isOpen={showErrorModal}
                setIsOpen={setShowErrorModal}
                cancelButtonName="Close"
            >
                <div>
                    <h4 className="text-danger mb-3">Validation Errors</h4>
                    <pre style={{ maxHeight: "300px", overflowY: "auto", whiteSpace: "pre-wrap" }}>
                        {modalError}
                    </pre>
                </div>
            </SimpleModal>

            <SimpleModal
                isOpen={addPincodeModal}
                size="lg"
                setIsOpen={(val) => {
                    setAddPincodeModal(val);
                    if (!val) {
                        setEditingPincodeId(null);
                        setNewPincode({
                            pincode: "",
                            city: "",
                            state: "",
                            region: "",
                            legacy_zone: "",
                            zone_tag: "",
                            is_metro: false,
                            services: [{ product: null, can_pickup: true, can_deliver: true, is_oda: false }]
                        });
                    }
                }}
                onSuccess={handleAddPincodeSubmit}
                successButtonName={(postingSinglePincode || updatingSinglePincode) ? "Saving..." : (editingPincodeId ? "Update Pincode" : "Save Pincode")}
            >
                <div className="p-3" style={{ minHeight: "300px" }}>
                    <h5 className="mb-4 border-bottom pb-2">
                        {editingPincodeId ? "Edit Pincode" : "Add Pincode"} for {selectedCustomer?.label}
                    </h5>
                    <h6 className="text-primary mb-3">Pincode Details</h6>
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label className="fw-bold text-muted small">Pincode</Label>
                                <Input
                                    type="text"
                                    maxLength={6}
                                    value={newPincode.pincode}
                                    onChange={(e) => setNewPincode({ ...newPincode, pincode: e.target.value.replace(/\D/g, "") })}
                                    placeholder="6 digit pincode"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label className="fw-bold text-muted small">City</Label>
                                <Input
                                    type="text"
                                    value={newPincode.city}
                                    onChange={(e) => setNewPincode({ ...newPincode, city: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label className="fw-bold text-muted small">State</Label>
                                <Input
                                    type="text"
                                    value={newPincode.state}
                                    onChange={(e) => setNewPincode({ ...newPincode, state: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label className="fw-bold text-muted small">Region</Label>
                                <Input
                                    type="text"
                                    value={newPincode.region}
                                    onChange={(e) => setNewPincode({ ...newPincode, region: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label className="fw-bold text-muted small">Legacy Zone</Label>
                                <Input
                                    type="text"
                                    value={newPincode.legacy_zone}
                                    onChange={(e) => setNewPincode({ ...newPincode, legacy_zone: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={2}>
                            <FormGroup>
                                <Label className="fw-bold text-muted small">Zone Tag</Label>
                                <Input
                                    type="text"
                                    value={newPincode.zone_tag}
                                    onChange={(e) => setNewPincode({ ...newPincode, zone_tag: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={2}>
                            <FormGroup className="h-100 d-flex align-items-center mb-0 mt-2">
                                <Label className="d-flex align-items-center gap-2 cursor-pointer mb-0">
                                    <Input
                                        type="checkbox"
                                        checked={newPincode.is_metro}
                                        onChange={(e) => setNewPincode({ ...newPincode, is_metro: e.target.checked })}
                                    />
                                    <strong>Metro</strong>
                                </Label>
                            </FormGroup>
                        </Col>
                    </Row>

                    <div className="mt-4 border-top pt-3 pb-5">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">Product Services</h6>
                            <Button color="success" size="sm" onClick={addServiceRow} outline>
                                <FaPlus className="me-1" /> Add Product
                            </Button>
                        </div>
                        {newPincode.services.map((service, index) => (
                            <Card key={index} className="shadow-none border mb-2 bg-light bg-opacity-10" style={{ overflow: "visible" }}>
                                <CardBody className="py-2 px-3" style={{ overflow: "visible" }}>
                                    <Row className="align-items-center g-2" style={{ overflow: "visible" }}>
                                        <Col md={4} style={{ overflow: "visible" }}>
                                            <SearchableDropdown
                                                locations={productOptions}
                                                value={service.product ? service.product.name : "select"}
                                                onChange={(val) => handleServiceChange(index, "product", val)}
                                                placeholder="Select Product"
                                                className="w-100"
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <FormGroup check className="mb-0">
                                                <Label check className="small">
                                                    <Input
                                                        type="checkbox"
                                                        checked={service.can_pickup}
                                                        onChange={(e) => handleServiceChange(index, "can_pickup", e.target.checked)}
                                                    />
                                                    Pickup
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                        <Col md={2}>
                                            <FormGroup check className="mb-0">
                                                <Label check className="small">
                                                    <Input
                                                        type="checkbox"
                                                        checked={service.can_deliver}
                                                        onChange={(e) => handleServiceChange(index, "can_deliver", e.target.checked)}
                                                    />
                                                    Deliver
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                        <Col md={2}>
                                            <FormGroup check className="mb-0">
                                                <Label check className="small">
                                                    <Input
                                                        type="checkbox"
                                                        checked={service.is_oda}
                                                        onChange={(e) => handleServiceChange(index, "is_oda", e.target.checked)}
                                                    />
                                                    ODA
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                        <Col md={2} className="text-end">
                                            {newPincode.services.length > 1 && (
                                                <Button color="danger" size="sm" outline onClick={() => removeServiceRow(index)}>
                                                    <FaTrash />
                                                </Button>
                                            )}
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        ))}
                        <div style={{ height: "150px" }}></div>
                    </div>
                </div>
            </SimpleModal>

            <SimpleModal
                isOpen={viewPincodeModal}
                setIsOpen={setViewPincodeModal}
                cancelButtonName="Close"
            >
                <div style={{ padding: "10px" }}>
                    <h5 className="mb-4 border-bottom pb-2">Pincode Details</h5>
                    {singlePincodeLoading ? (
                        <div className="text-center py-5">
                            <Spinner color="primary" />
                            <p className="mt-2 text-muted">Loading details...</p>
                        </div>
                    ) : singlePincodeDetails ? (
                        <div>
                            <Row className="mb-4">
                                <Col md={4}>
                                    <div className="text-muted small fw-bold">Pincode</div>
                                    <div className="fs-5">{singlePincodeDetails.pincode}</div>
                                </Col>
                                <Col md={4}>
                                    <div className="text-muted small fw-bold">City</div>
                                    <div>{singlePincodeDetails.city} ({singlePincodeDetails.state})</div>
                                </Col>
                                <Col md={4}>
                                    <div className="text-muted small fw-bold">Region</div>
                                    <div>{singlePincodeDetails.region}</div>
                                </Col>
                            </Row>
                            <Row className="mb-4">
                                <Col md={4}>
                                    <div className="text-muted small fw-bold">Legacy Zone</div>
                                    <div>{singlePincodeDetails.legacy_zone}</div>
                                </Col>
                                <Col md={4}>
                                    <div className="text-muted small fw-bold">Zone Tag</div>
                                    <div>{singlePincodeDetails.zone_tag || "N/A"}</div>
                                </Col>
                                <Col md={4}>
                                    <div className="text-muted small fw-bold">Metro Status</div>
                                    <div className={`badge ${singlePincodeDetails.is_metro ? "bg-info" : "bg-secondary"}`}>
                                        {singlePincodeDetails.is_metro ? "Metro" : "Non-Metro"}
                                    </div>
                                </Col>
                            </Row>

                            <h6 className="mt-4 mb-3 border-top pt-3">Product Services</h6>
                            <div className="table-responsive">
                                <table className="table table-sm table-bordered">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Product</th>
                                            <th className="text-center">Pickup</th>
                                            <th className="text-center">Deliver</th>
                                            <th className="text-center">ODA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {singlePincodeDetails.services?.map((service, idx) => (
                                            <tr key={idx}>
                                                <td>{service.product_name}</td>
                                                <td className="text-center">
                                                    {service.can_pickup ? <span className="text-success fw-bold">Yes</span> : <span className="text-danger">No</span>}
                                                </td>
                                                <td className="text-center">
                                                    {service.can_deliver ? <span className="text-success fw-bold">Yes</span> : <span className="text-danger">No</span>}
                                                </td>
                                                <td className="text-center">
                                                    {service.is_oda ? <span className="text-warning fw-bold">Yes</span> : <span>No</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-danger">
                            Failed to load pincode details.
                        </div>
                    )}
                </div>
            </SimpleModal>

            <DeleteModal
                show={isDeleteModalOpen}
                onDeleteClick={handleConfirmDelete}
                onCloseClick={() => {
                    setIsDeleteModalOpen(false);
                    setPincodeIdToDelete(null);
                }}
                loading={deletingSinglePincode}
            />
        </div>
    );
};

export default CorporatePincodeUpload;
