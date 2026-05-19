import React, { useState, useEffect, useMemo, useRef } from "react";
import Select from "react-select";
import { Button, Col, FormGroup, Input, Label, Row, Spinner, Card, CardBody } from "reactstrap";
import { FaUpload, FaDownload, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import MainHeaderCom from "../../components/MainHeaderCom";
import SearchableDropdown from "../../components/Common/SearchableDropdown";
import DeleteModal from "../../components/Common/DeleteModal";
import { customStyles } from "../../helpers/CustomStyle";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import { usePatchApiCall } from "../../hooks/usePatchApiCall";
import { useDeleteApiCall } from "../../hooks/useDeleteApiCall";
import useExcelParser from "../../hooks/useExcelParser";
import { useExcelExport } from "../../hooks/useExcelExport";
import ToasterProvider from "../../helpers/ToasterProvider";
import { CORPORATE_CUSTOMERS_LIST, IMPORT_CORPORATE_RATE_DATA, GET_CUSTOMER_RATES, GET_SINGLE_CUSTOMER_RATE, PRODUCT_LIST, GET_CORPORATE_CUSTOMER_PRODUCTS } from "../../api";
import SimpleModal from "../../components/SimpleModal";
import TableContainer from "../../components/Table/TableContainer";

const CorporateRateUpload = ({ externalCustomer = null, onCustomerChange = null, hideHeader = false }) => {
    const { ErrorToaster, SucceesToaster } = ToasterProvider();
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [excelData, setExcelData] = useState([]);
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalError, setModalError] = useState("");

    // Hooks
    const { apifunc: GetCustomers, data: customerListRaw, loading: customersLoading } = useGetApiCall();
    const { parseExcel, isLoading: parsingLoading } = useExcelParser();
    const { exportToExcel: downloadTemplate, isExporting: downloadingTemplate } = useExcelExport();
    const { apifunc: uploadData, loading: uploadingData } = usePostApiCall();
    const { apifunc: GetRates, data: customerRates, loading: ratesLoading } = useGetApiCall();
    const { apifunc: GetSingleRate, data: singleRateData, loading: singleRateLoading } = useGetApiCall();
    const { apifunc: GetProducts, data: productListRaw } = useGetApiCall();
    const { apifunc: postRate, loading: postingRate } = usePostApiCall();
    const { apifunc: patchRate, loading: patchingRate } = usePatchApiCall("Rate updated successfully!");
    const { apifunc: deleteRate, loading: deletingRate } = useDeleteApiCall();

    const [viewRateModal, setViewRateModal] = useState(false);
    const [addRateModal, setAddRateModal] = useState(false);
    const [editRateModal, setEditRateModal] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [rateIdToDelete, setRateIdToDelete] = useState(null);
    const [selectedRateIds, setSelectedRateIds] = useState([]);
    const [isBulkDeletingRates, setIsBulkDeletingRates] = useState(false);
    const [isBulkDeleteRateModalOpen, setIsBulkDeleteRateModalOpen] = useState(false);
    const [newRate, setNewRate] = useState({
        product_id: null,
        weight_min: 0,
        weight_max: null,
        origin_zone: "",
        dest_zone: "",
        zone_type: "LOCAL",
        base_weight: 0,
        base_rate: 0,
        incremental_unit: 0,
        incremental_rate: 0,
        billing_type: "PER_KG"
    });

    useEffect(() => {
        GetCustomers(CORPORATE_CUSTOMERS_LIST);
    }, []);

    useEffect(() => {
        if (externalCustomer && externalCustomer?.id !== selectedCustomer?.id) {
            setSelectedCustomer(externalCustomer)
        }
    }, [externalCustomer])

    const customerOptions = useMemo(() => {
        if (!customerListRaw?.user) return [];
        return customerListRaw.user
            .filter(ele => ele?.cust_type?.type_of_cust === "Corporate" || ele?.cust_type?.type_of_cust === "Franchise")
            .map(ele => ({
                id: ele.id,
                value: ele.customer_name,
                label: `${ele.customer_name} - ${ele.username}`
            }));
    }, [customerListRaw]);

    useEffect(() => {
        if (selectedCustomer?.id) {
            GetRates(`${GET_CUSTOMER_RATES}?customer_id=${selectedCustomer.id}`);
            GetProducts(`${GET_CORPORATE_CUSTOMER_PRODUCTS}?customer_id=${selectedCustomer.id}`);
        } else {
            // Clear rates and products if no customer is selected
        }
        // Reset new rate product when customer changes
        setNewRate(prev => ({ ...prev, product_id: null }));
    }, [selectedCustomer]);

    const productOptions = useMemo(() => {
        const data = productListRaw?.results || productListRaw?.result || (Array.isArray(productListRaw) ? productListRaw : []);
        return data.map(ele => ({
            id: ele.id,
            value: ele.id,
            name: ele.product_name || ele.name || "Unknown Product"
        }));
    }, [productListRaw]);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setExcelData([]); // Reset data during parsing

        const requiredHeaders = [
            "product",
            "weight_min",
            "weight_max",
            "origin_zone",
            "dest_zone",
            "zone_type",
            "base_weight",
            "base_rate",
            "incremental_unit",
            "incremental_rate",
            "billing_type"
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

    const handleDeleteRate = (rateId) => {
        setRateIdToDelete(rateId);
        setIsDeleteModalOpen(true);
    };

    const handleBulkDeleteRates = async () => {
        setIsBulkDeletingRates(true);
        let successCount = 0;
        for (const id of selectedRateIds) {
            try {
                await deleteRate(`${GET_CUSTOMER_RATES}${id}/`);
                successCount++;
            } catch (_) {}
        }
        setIsBulkDeletingRates(false);
        setIsBulkDeleteRateModalOpen(false);
        setSelectedRateIds([]);
        if (successCount > 0) {
            SucceesToaster(`${successCount} rate(s) deleted successfully!`);
            if (selectedCustomer?.id) {
                GetRates(`${GET_CUSTOMER_RATES}?customer_id=${selectedCustomer.id}`);
            }
        } else {
            ErrorToaster("Failed to delete selected rates.");
        }
    };

    const handleConfirmDelete = async () => {
        if (!rateIdToDelete) return;
        const success = await deleteRate(`${GET_CUSTOMER_RATES}${rateIdToDelete}/`);
        if (success) {
            SucceesToaster("Rate deleted successfully!");
            setIsDeleteModalOpen(false);
            setRateIdToDelete(null);
            if (selectedCustomer?.id) {
                GetRates(`${GET_CUSTOMER_RATES}?customer_id=${selectedCustomer.id}`);
            }
        } else {
            ErrorToaster("Failed to delete rate.");
        }
    };

    const handleViewRate = (rateId) => {
        GetSingleRate(`${GET_SINGLE_CUSTOMER_RATE}${rateId}/`);
        setViewRateModal(true);
    };

    const handleEditRate = (rate) => {
        setEditingRate({
            ...rate,
            product_id: { value: rate.product_id, name: rate.product_name }
        });
        setEditRateModal(true);
    };

    const handleEditRateSubmit = async () => {
        if (!editingRate) return;

        const payload = {
            base_rate: parseFloat(editingRate.base_rate),
            incremental_rate: parseFloat(editingRate.incremental_rate),
            base_weight: parseFloat(editingRate.base_weight),
            incremental_unit: parseFloat(editingRate.incremental_unit),
            min_rate: parseFloat(editingRate.min_rate || 0),
            weight_min: parseFloat(editingRate.weight_min),
            weight_max: editingRate.weight_max ? parseFloat(editingRate.weight_max) : null,
            billing_type: editingRate.billing_type
        };

        const response = await patchRate(`${GET_CUSTOMER_RATES}${editingRate.id}/`, payload);
        if (response && !response.error) {
            setEditRateModal(false);
            if (selectedCustomer?.id) {
                GetRates(`${GET_CUSTOMER_RATES}?customer_id=${selectedCustomer.id}`);
            }
        }
    };

    const handleAddRateSubmit = async () => {
        if (!newRate.product_id) {
            ErrorToaster("Please select a product.");
            return;
        }

        const payload = {
            customer_id: selectedCustomer.id,
            product_id: newRate.product_id.value,
            weight_min: parseFloat(newRate.weight_min),
            weight_max: newRate.weight_max ? parseFloat(newRate.weight_max) : null,
            origin_zone: newRate.origin_zone,
            dest_zone: newRate.dest_zone,
            zone_type: newRate.zone_type,
            base_weight: parseFloat(newRate.base_weight),
            base_rate: parseFloat(newRate.base_rate),
            incremental_unit: parseFloat(newRate.incremental_unit),
            incremental_rate: parseFloat(newRate.incremental_rate),
            billing_type: newRate.billing_type
        };

        const response = await postRate(GET_CUSTOMER_RATES, payload);
        if (response && !response.error) {
            SucceesToaster(response?.msg || response?.message || "Rate added successfully!");
            setAddRateModal(false);
            // Refresh list
            if (selectedCustomer?.id) {
                GetRates(`${GET_CUSTOMER_RATES}?customer_id=${selectedCustomer.id}`);
            }
            // Reset form
            setNewRate({
                product_id: null,
                weight_min: 0,
                weight_max: null,
                origin_zone: "",
                dest_zone: "",
                zone_type: "LOCAL",
                base_weight: 0,
                base_rate: 0,
                incremental_unit: 0,
                incremental_rate: 0,
                billing_type: "PER_KG"
            });
        }
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

        // Validation & Parsing
        const errors = [];
        const formattedData = excelData.map((row, index) => {
            if (!row.product || String(row.product).trim() === "") {
                errors.push(`Row ${index + 1}: Product is required.`);
            }

            return {
                product: String(row.product || "").trim(),
                weight_min: Number(row.weight_min) || 0,
                weight_max: Number(row.weight_max) || 0,
                origin_zone: String(row.origin_zone || "").trim(),
                dest_zone: String(row.dest_zone || "").trim(),
                zone_type: String(row.zone_type || "LOCAL").trim(),
                base_weight: Number(row.base_weight) || 0,
                base_rate: Number(row.base_rate) || 0,
                incremental_unit: Number(row.incremental_unit) || 0,
                incremental_rate: Number(row.incremental_rate) || 0,
                billing_type: String(row.billing_type || "PER_KG").trim()
            };
        });

        if (errors.length > 0) {
            setModalError(errors.join("\n"));
            setShowErrorModal(true);
            return;
        }

        const payload = {
            customer_id: selectedCustomer.id,
            data: formattedData
        };

        const response = await uploadData(IMPORT_CORPORATE_RATE_DATA, payload);
        if (response?.status === 1 || response?.status === "success") {
            SucceesToaster(response?.msg || "Rate data imported successfully!");
            setFile(null);
            setExcelData([]);
            // setSelectedCustomer(null); // Keep customer selected to show the updated rates
            if (fileInputRef.current) fileInputRef.current.value = "";
            
            // Refresh rates
            GetRates(`${GET_CUSTOMER_RATES}?customer_id=${selectedCustomer.id}`);
        } else {
            ErrorToaster(response?.msg || response?.message || "Failed to import data.");
        }
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                product: "VELOFREIGHT",
                weight_min: 0,
                weight_max: 10,
                zone_type: "LOCAL",
                origin_zone: "Z10",
                dest_zone: "Z10",
                base_weight: 1,
                base_rate: 70,
                incremental_unit: 1,
                incremental_rate: 15,
                billing_type: "PER_KG"
            }
        ];
        downloadTemplate(templateData, "Corporate_Rate_Import_Template");
    };

    return (
        <div className="page-content py-0 px-0">
            {!hideHeader && <MainHeaderCom title="Rate Upload" />}
            <div className="container-fluid px-3 mt-4">
                <Card className="shadow-sm">
                    <CardBody>
                        <Row>
                            {!hideHeader && (
                                <Col md={4}>
                                    <FormGroup>
                                        <Label>Select Corporate Customer</Label>
                                        <Select
                                            options={customerOptions}
                                            placeholder={customersLoading ? "Loading..." : "Search Customer"}
                                            value={selectedCustomer}
                                            onChange={(val) => {
                                                setSelectedCustomer(val)
                                                if (onCustomerChange) onCustomerChange(val)
                                            }}
                                            isClearable={true}
                                            styles={customStyles}
                                        />
                                    </FormGroup>
                                </Col>
                            )}
                            <Col md={hideHeader ? 6 : 4}>
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
                            <Col md={hideHeader ? 6 : 4} className="d-flex flex-column gap-2 mb-3 mt-4 align-items-start">
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

                        {selectedCustomer && (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
                                    <h5 className="mb-0">Existing Rates for {selectedCustomer.label}</h5>
                                    <div className="d-flex gap-2">
                                        {selectedRateIds.length > 0 && (
                                            <Button
                                                color="danger"
                                                size="sm"
                                                onClick={() => setIsBulkDeleteRateModalOpen(true)}
                                                disabled={isBulkDeletingRates}
                                                className="d-flex align-items-center gap-1"
                                            >
                                                {isBulkDeletingRates ? <Spinner size="sm" /> : <FaTrash />}
                                                Delete Selected ({selectedRateIds.length})
                                            </Button>
                                        )}
                                        <Button
                                            color="primary"
                                            size="sm"
                                            onClick={() => setAddRateModal(true)}
                                        >
                                            Add Rate
                                        </Button>
                                    </div>
                                </div>
                                <Card className="shadow-sm">
                                    <CardBody className="p-0">
                                        {ratesLoading ? (
                                            <div className="text-center p-5">
                                                <Spinner color="primary" />
                                                <p className="mt-2 text-muted">Loading rates...</p>
                                            </div>
                                        ) : (
                                            <TableContainer
                                                columns={[
                                                    {
                                                        id: 'select',
                                                        header: () => (
                                                            <input
                                                                type="checkbox"
                                                                style={{ cursor: "pointer" }}
                                                                checked={
                                                                    (customerRates?.results?.length > 0) &&
                                                                    customerRates.results.every(r => selectedRateIds.includes(r.id))
                                                                }
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedRateIds((customerRates?.results || []).map(r => r.id));
                                                                    } else {
                                                                        setSelectedRateIds([]);
                                                                    }
                                                                }}
                                                            />
                                                        ),
                                                        cell: ({ row }) => (
                                                            <input
                                                                type="checkbox"
                                                                style={{ cursor: "pointer" }}
                                                                checked={selectedRateIds.includes(row.original.id)}
                                                                onChange={(e) => {
                                                                    const id = row.original.id;
                                                                    setSelectedRateIds(prev =>
                                                                        e.target.checked ? [...prev, id] : prev.filter(x => x !== id)
                                                                    );
                                                                }}
                                                            />
                                                        ),
                                                        enableSorting: false,
                                                        size: 40,
                                                    },
                                                    {
                                                        header: "Product",
                                                        accessorKey: "product_name",
                                                    },
                                                    {
                                                        header: "Weight Range",
                                                        accessorFn: (row) => `${row.weight_min} - ${row.weight_max || "∞"}`,
                                                    },
                                                    {
                                                        header: "Zones (Origin - Dest)",
                                                        accessorFn: (row) => `${row.origin_zone} - ${row.dest_zone} (${row.zone_type})`,
                                                    },
                                                    {
                                                        header: "Min Rate",
                                                        accessorKey: "min_rate",
                                                        accessorFn: (row) => row.min_rate || 0,
                                                    },
                                                    {
                                                        header: "Base Rate",
                                                        accessorFn: (row) => `${row.base_rate} for ${row.base_weight} kg`,
                                                    },
                                                    {
                                                        header: "Inc. Unit/Rate",
                                                        accessorFn: (row) => `${row.incremental_unit} kg / ${row.incremental_rate}`,
                                                    },
                                                    {
                                                        header: "Billing Type",
                                                        accessorKey: "billing_type",
                                                    },
                                                    {
                                                        header: "Action",
                                                        id: "action",
                                                        enableSorting: false,
                                                        cell: (cell) => {
                                                            const rate = cell.row.original;
                                                            return (
                                                                <div className="d-flex gap-2">
                                                                    <Button
                                                                        color="primary"
                                                                        size="sm"
                                                                        outline
                                                                        onClick={() => handleViewRate(rate.id)}
                                                                        title="View Details"
                                                                    >
                                                                        <FaEye />
                                                                    </Button>
                                                                    <Button
                                                                        color="info"
                                                                        size="sm"
                                                                        outline
                                                                        onClick={() => handleEditRate(rate)}
                                                                        title="Edit Rate"
                                                                    >
                                                                        <FaEdit />
                                                                    </Button>
                                                                    <Button
                                                                        color="danger"
                                                                        size="sm"
                                                                        outline
                                                                        onClick={() => handleDeleteRate(rate.id)}
                                                                        title="Delete Rate"
                                                                        disabled={deletingRate && rateIdToDelete === rate.id}
                                                                    >
                                                                        {deletingRate && rateIdToDelete === rate.id ? <Spinner size="sm" /> : <FaTrash />}
                                                                    </Button>
                                                                </div>
                                                            );
                                                        }
                                                    }
                                                ]}
                                                data={customerRates?.results || []}
                                                isGlobalFilter={true}
                                                isPagination={true}
                                                isCustomPageSize={true}
                                                defaultPageSize={10}
                                                SearchPlaceholder="Search rates..."
                                                pagination="pagination pagination-rounded justify-content-end mb-2"
                                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                                tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline mb-0"
                                            />
                                        )}
                                    </CardBody>
                                </Card>
                            </>
                        )}
                    </CardBody>
                </Card>
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
                isOpen={viewRateModal}
                setIsOpen={setViewRateModal}
                title="Rate Details"
                cancelButtonName="Close"
            >
                {singleRateLoading ? (
                    <div className="text-center py-4">
                        <Spinner color="primary" />
                        <p className="mt-2">Loading details...</p>
                    </div>
                ) : singleRateData?.result ? (
                    <div className="rate-details">
                        <Row className="mb-3">
                            <Col md={6}>
                                <strong>Product:</strong> {singleRateData.result.product_name}
                            </Col>
                            <Col md={6}>
                                <strong>Billing Type:</strong> {singleRateData.result.billing_type}
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={6}>
                                <strong>Origin Zone:</strong> {singleRateData.result.origin_zone}
                            </Col>
                            <Col md={6}>
                                <strong>Dest Zone:</strong> {singleRateData.result.dest_zone}
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={6}>
                                <strong>Zone Type:</strong> {singleRateData.result.zone_type}
                            </Col>
                            <Col md={6}>
                                <strong>Base Weight:</strong> {singleRateData.result.base_weight} kg
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={6}>
                                <strong>Base Rate:</strong> ₹{singleRateData.result.base_rate}
                            </Col>
                            <Col md={6}>
                                <strong>Min Rate:</strong> ₹{singleRateData.result.min_rate || 0}
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={6}>
                                <strong>Weight Range:</strong> {singleRateData.result.weight_min} - {singleRateData.result.weight_max || "∞"} kg
                            </Col>
                        </Row>
                        <div className="border-top pt-3">
                            <Row>
                                <Col md={6}>
                                    <strong>Inc. Unit:</strong> {singleRateData.result.incremental_unit} kg
                                </Col>
                                <Col md={6}>
                                    <strong>Inc. Rate:</strong> ₹{singleRateData.result.incremental_rate}
                                </Col>
                            </Row>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-danger">
                        Failed to load rate details.
                    </div>
                )}
            </SimpleModal>

            <SimpleModal
                isOpen={addRateModal}
                setIsOpen={setAddRateModal}
                title="Add New Rate"
                cancelButtonName="Cancel"
                successButtonName={postingRate ? "Saving..." : "Save Rate"}
                onSuccess={handleAddRateSubmit}
            >
                <div>
                    <Row>
                        <Col md={12}>
                            <FormGroup>
                                <Label>Product</Label>
                                <SearchableDropdown
                                    locations={productOptions}
                                    placeholder="Select Product"
                                    value={newRate.product_id ? newRate.product_id.name : "select"}
                                    onChange={(val) => setNewRate({ ...newRate, product_id: val })}
                                    className="w-100"
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Weight Min</Label>
                                <Input
                                    type="number"
                                    value={newRate.weight_min}
                                    onChange={(e) => setNewRate({ ...newRate, weight_min: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Weight Max (leave blank for ∞)</Label>
                                <Input
                                    type="number"
                                    value={newRate.weight_max || ""}
                                    onChange={(e) => setNewRate({ ...newRate, weight_max: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Origin Zone</Label>
                                <Input
                                    type="text"
                                    value={newRate.origin_zone}
                                    onChange={(e) => setNewRate({ ...newRate, origin_zone: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Dest Zone</Label>
                                <Input
                                    type="text"
                                    value={newRate.dest_zone}
                                    onChange={(e) => setNewRate({ ...newRate, dest_zone: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Zone Type</Label>
                                <Input
                                    type="select"
                                    value={newRate.zone_type}
                                    onChange={(e) => setNewRate({ ...newRate, zone_type: e.target.value })}
                                >
                                    <option value="LOCAL">LOCAL</option>
                                    <option value="METRO">METRO</option>
                                    <option value="REGIONAL">REGIONAL</option>
                                    <option value="ROI">ROI</option>
                                    <option value="SPECIAL">SPECIAL</option>
                                    <option value="WITHIN_STATE">WITHIN_STATE</option>
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Billing Type</Label>
                                <Input
                                    type="select"
                                    value={newRate.billing_type}
                                    onChange={(e) => setNewRate({ ...newRate, billing_type: e.target.value })}
                                >
                                    <option value="PER_KG">PER_KG</option>
                                    <option value="FIXED">FIXED</option>
                                </Input>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Base Weight (kg)</Label>
                                <Input
                                    type="number"
                                    value={newRate.base_weight}
                                    onChange={(e) => setNewRate({ ...newRate, base_weight: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Base Rate (₹)</Label>
                                <Input
                                    type="number"
                                    value={newRate.base_rate}
                                    onChange={(e) => setNewRate({ ...newRate, base_rate: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Inc. Unit (kg)</Label>
                                <Input
                                    type="number"
                                    value={newRate.incremental_unit}
                                    onChange={(e) => setNewRate({ ...newRate, incremental_unit: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Inc. Rate (₹)</Label>
                                <Input
                                    type="number"
                                    value={newRate.incremental_rate}
                                    onChange={(e) => setNewRate({ ...newRate, incremental_rate: e.target.value })}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                </div>
            </SimpleModal>
            <SimpleModal
                isOpen={editRateModal}
                setIsOpen={setEditRateModal}
                title="Edit Rate"
                cancelButtonName="Cancel"
                successButtonName={patchingRate ? "Updating..." : "Update Rate"}
                onSuccess={handleEditRateSubmit}
            >
                {editingRate && (
                    <div>
                        <Row>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Product (Read-only)</Label>
                                    <Input
                                        type="text"
                                        value={editingRate.product_name}
                                        disabled
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Weight Min</Label>
                                    <Input
                                        type="number"
                                        value={editingRate.weight_min}
                                        onChange={(e) => setEditingRate({ ...editingRate, weight_min: e.target.value })}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Weight Max (leave blank for ∞)</Label>
                                    <Input
                                        type="number"
                                        value={editingRate.weight_max || ""}
                                        onChange={(e) => setEditingRate({ ...editingRate, weight_max: e.target.value })}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Origin Zone</Label>
                                    <Input
                                        type="text"
                                        value={editingRate.origin_zone}
                                        disabled
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Dest Zone</Label>
                                    <Input
                                        type="text"
                                        value={editingRate.dest_zone}
                                        disabled
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Zone Type</Label>
                                    <Input
                                        type="text"
                                        value={editingRate.zone_type}
                                        disabled
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Billing Type</Label>
                                    <Input
                                        type="select"
                                        value={editingRate.billing_type}
                                        onChange={(e) => setEditingRate({ ...editingRate, billing_type: e.target.value })}
                                    >
                                        <option value="PER_KG">PER_KG</option>
                                        <option value="FIXED">FIXED</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Base Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        value={editingRate.base_weight}
                                        onChange={(e) => setEditingRate({ ...editingRate, base_weight: e.target.value })}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Base Rate (₹)</Label>
                                    <Input
                                        type="number"
                                        value={editingRate.base_rate}
                                        onChange={(e) => setEditingRate({ ...editingRate, base_rate: e.target.value })}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Inc. Unit (kg)</Label>
                                    <Input
                                        type="number"
                                        value={editingRate.incremental_unit}
                                        onChange={(e) => setEditingRate({ ...editingRate, incremental_unit: e.target.value })}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Inc. Rate (₹)</Label>
                                    <Input
                                        type="number"
                                        value={editingRate.incremental_rate}
                                        onChange={(e) => setEditingRate({ ...editingRate, incremental_rate: e.target.value })}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                    </div>
                )}
            </SimpleModal>

            <DeleteModal
                show={isDeleteModalOpen}
                onDeleteClick={handleConfirmDelete}
                onCloseClick={() => {
                    setIsDeleteModalOpen(false);
                    setRateIdToDelete(null);
                }}
                loading={deletingRate}
            />

            {/* Bulk Delete Rates Confirmation Modal */}
            <SimpleModal
                isOpen={isBulkDeleteRateModalOpen}
                setIsOpen={setIsBulkDeleteRateModalOpen}
                successButtonName={isBulkDeletingRates ? "Deleting..." : `Delete ${selectedRateIds.length} Rate(s)`}
                cancelButtonName="Cancel"
                onCancel={() => setIsBulkDeleteRateModalOpen(false)}
                onSuccess={handleBulkDeleteRates}
            >
                <div>
                    <p className="fw-bold text-danger mb-2">
                        <i className="mdi mdi-alert-circle-outline me-1"></i>
                        Are you sure you want to delete {selectedRateIds.length} selected rate(s)?
                    </p>
                    <p className="text-muted small mb-0">This action cannot be undone.</p>
                </div>
            </SimpleModal>
        </div>
    );
};

export default CorporateRateUpload;
