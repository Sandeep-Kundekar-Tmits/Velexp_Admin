import React, { useEffect, useMemo, useState } from "react"
import { Button, Card, CardBody, Col, Container, Form, FormGroup, Input, Label, Row, FormFeedback, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Table } from "@/components/ui"
import MainHeaderComp from "../../components/MainHeaderCom"
import SearchableDropdown from "../../components/Common/SearchableDropdown"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import usePostApiCall from "../../hooks/usePostApiCall"
import { useDeleteApiCall } from "../../hooks/useDeleteApiCall"
import { CORPORATE_BILLING_CONFIG, CORPORATE_CUSTOMERS_LIST, GET_CORPORATE_CUSTOMER_PRODUCTS } from "../../api"
import TableContainer from "../../components/Table/TableContainer"
import { FaEye, FaEdit, FaTrash } from "react-icons/fa"

// extraActions: extra buttons shown in the header row, before Add New Configuration (the onboarding wizard puts "Copy from the default setup" there)
const CustomerProductConfig = ({ externalCustomerId = "", onCustomerChange = null, hideHeader = false, extraActions = null, externalCustomerName = "" }) => {
    const { apifunc: fetchCustomers, data: customerData, loading: customersLoading } = useGetApiCall()
    const { apifunc: fetchProducts, data: productData, loading: productsLoading } = useGetApiCall()
    const { apifunc: fetchConfigs, data: configData, loading: configsLoading } = useGetApiCall()
    const { apifunc: submitConfig, loading: submitting } = usePostApiCall(null, "Configuration saved successfully")
    const { apifunc: deleteConfig, loading: deleting } = useDeleteApiCall()

    const [isListView, setIsListView] = useState(true)
    const [selectedCustomerId, setSelectedCustomerId] = useState("")
    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([])
    const [configList, setConfigList] = useState([])
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [viewData, setViewData] = useState(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    
    // Form state
    const [formData, setFormData] = useState({
        customer_id: "",
        product_id: "",
        billing_mode: "ZONE_MATRIX",
        volumetric_divisor: 5000,
        fsc_percentage: 0,
        docket_charge: 0,
        rto_multiplier: 1,
        gst_rate: 18,
        show_detailed_extra_charges: false
    })

    const [errors, setErrors] = useState({})
    const [isEdit, setIsEdit] = useState(false)

    useEffect(() => {
        fetchCustomers(CORPORATE_CUSTOMERS_LIST)
    }, [])

    const loadConfigs = (id) => {
        if (id) {
            fetchConfigs(`${CORPORATE_BILLING_CONFIG}?customer_id=${id}`)
        } else {
            setConfigList([])
        }
    }

    useEffect(() => {
        if (isListView && selectedCustomerId) {
            loadConfigs(selectedCustomerId)
        }
    }, [selectedCustomerId, isListView])

    useEffect(() => {
        if (externalCustomerId && externalCustomerId !== selectedCustomerId) {
            setSelectedCustomerId(externalCustomerId)
        }
        // the add form starts on this customer (the wizard fixes it)
        if (externalCustomerId) setFormData(prev => ({ ...prev, customer_id: externalCustomerId }))
    }, [externalCustomerId])

    useEffect(() => {
        if (configData) {
            setConfigList(configData.results || (Array.isArray(configData) ? configData : []))
        }
    }, [configData])

    useEffect(() => {
        if (formData.customer_id) {
            fetchProducts(`${GET_CORPORATE_CUSTOMER_PRODUCTS}?customer_id=${formData.customer_id}`)
        } else {
            setProducts([])
            if (!isEdit) setFormData(prev => ({ ...prev, product_id: "" }))
        }
    }, [formData.customer_id])

    useEffect(() => {
        if (customerData?.user) {
            const formatted = customerData.user
                .filter(ele => ele?.cust_type?.type_of_cust === "Corporate" || ele?.cust_type?.type_of_cust === "Franchise")
                .map(ele => ({
                    name: `${ele?.customer_name || ""} - ${ele?.username}`,
                    id: ele?.id,
                    value: ele?.id
                }))
            setCustomers(formatted)
        }
    }, [customerData])

    useEffect(() => {
        if (productData) {
            const prodList = productData.results || (Array.isArray(productData) ? productData : (productData.products || []))
            const formatted = prodList.map(ele => ({
                name: ele?.product_name || ele?.name || "Unknown Product",
                id: ele?.id,
                value: ele?.id
            }))
            setProducts(formatted)
        }
    }, [productData])

    const validate = () => {
        let newErrors = {}
        if (!formData.customer_id) newErrors.customer_id = "Customer is required"
        if (!formData.product_id) newErrors.product_id = "Product is required"
        if (!formData.billing_mode) newErrors.billing_mode = "Billing Mode is required"
        if (formData.volumetric_divisor === "" || formData.volumetric_divisor <= 0) newErrors.volumetric_divisor = "Must be greater than 0"
        if (formData.fsc_percentage === "" || formData.fsc_percentage < 0 || formData.fsc_percentage > 100) newErrors.fsc_percentage = "Must be between 0 and 100"
        if (formData.docket_charge === "" || formData.docket_charge < 0) newErrors.docket_charge = "Cannot be negative"
        if (formData.rto_multiplier === "" || formData.rto_multiplier < 0) newErrors.rto_multiplier = "Cannot be negative"
        if (formData.gst_rate === "" || formData.gst_rate < 0 || formData.gst_rate > 100) newErrors.gst_rate = "Must be between 0 and 100"
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        const numericValue = ['volumetric_divisor', 'fsc_percentage', 'docket_charge', 'rto_multiplier', 'gst_rate'].includes(name) 
            ? (value === "" ? "" : parseFloat(value)) 
            : (e.target.type === 'checkbox' ? e.target.checked : value)

        setFormData(prev => ({
            ...prev,
            [name]: numericValue
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (validate()) {
            const result = await submitConfig(CORPORATE_BILLING_CONFIG, formData)
            if (result) {
                // If we were adding for the current selected customer, reload the list
                if (formData.customer_id === selectedCustomerId) {
                    loadConfigs(selectedCustomerId)
                } else if (!selectedCustomerId) {
                    // If no customer was selected in list, maybe switch to it
                    setSelectedCustomerId(formData.customer_id)
                }
                setIsListView(true)
                resetForm()
            }
        }
    }

    const resetForm = () => {
        setFormData({
            customer_id: externalCustomerId || selectedCustomerId || "",
            product_id: "",
            billing_mode: "ZONE_MATRIX",
            volumetric_divisor: 5000,
            fsc_percentage: 0,
            docket_charge: 0,
            rto_multiplier: 1,
            gst_rate: 18,
            show_detailed_extra_charges: false
        })
        setErrors({})
        setIsEdit(false)
    }

    const closeForm = () => {
        setIsListView(true)
        resetForm()
    }

    const toggleDeleteModal = () => setIsDeleteModalOpen(!isDeleteModalOpen)

    const handleDelete = (row) => {
        setDeleteTarget(row)
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (deleteTarget) {
            const body = {
                customer_id: deleteTarget.customer_id,
                product_id: deleteTarget.product_id
            }
            const result = await deleteConfig(CORPORATE_BILLING_CONFIG, body)
            if (result) {
                loadConfigs(selectedCustomerId)
                toggleDeleteModal()
            }
        }
    }

    const handleView = (row) => {
        setViewData(row)
        setIsViewModalOpen(true)
    }

    const handleEdit = (row) => {
        setIsEdit(true)
        setFormData({
            customer_id: row.customer_id,
            product_id: row.product_id,
            billing_mode: row.billing_mode,
            volumetric_divisor: row.volumetric_divisor,
            fsc_percentage: row.fsc_percentage,
            docket_charge: row.docket_charge,
            rto_multiplier: row.rto_multiplier,
            gst_rate: row.gst_rate,
            show_detailed_extra_charges: row.show_detailed_extra_charges || false
        })
        setIsListView(false)
    }

    const toggleViewModal = () => setIsViewModalOpen(!isViewModalOpen)

    const columns = useMemo(() => [
        {
            header: "Cust ID",
            accessorKey: "customer_id",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Customer Name",
            accessorKey: "customer_name",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Prod ID",
            accessorKey: "product_id",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Product Name",
            accessorKey: "product_name",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Billing Mode",
            accessorKey: "billing_mode",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Actions",
            id: "actions",
            enableSorting: false,
            cell: (cell) => (
                <div className="flex gap-2 justify-center">
                    {/* same buttons as the Rates table: outline view / edit / delete */}
                    <Button color="primary" size="sm" outline title="View Details" aria-label="View details" onClick={() => handleView(cell.row.original)}>
                        <FaEye />
                    </Button>
                    <Button color="info" size="sm" outline title="Edit Details" aria-label="Edit" onClick={() => handleEdit(cell.row.original)}>
                        <FaEdit />
                    </Button>
                    <Button color="danger" size="sm" outline title="Delete" aria-label="Delete" onClick={() => handleDelete(cell.row.original)} disabled={deleting}>
                        <FaTrash />
                    </Button>
                </div>
            )
        }
    ], [configList, deleting])

    return (
        <React.Fragment>
            <div className={hideHeader ? '' : 'page-content py-0 px-0'}>
                {!hideHeader && (
                    <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                        <MainHeaderComp
                            title="Customer Product Config"
                        />
                    </div>
                )}
                <div className={hideHeader ? "container-fluid px-0 py-0" : "container-fluid px-4 py-4"}>
                    <div className={`flex flex-wrap items-center justify-between gap-2 ${hideHeader ? "mb-2" : "mb-4"}`}>
                        <h5 className="m-0 text-base">Configuration list</h5>
                        <div className="flex flex-wrap gap-2">
                        {isListView && extraActions}
                        <Button
                            size="sm"
                            className="flex items-center gap-1 whitespace-nowrap"
                            color="primary"
                            onClick={() => {
                                resetForm()
                                setIsListView(false)
                            }}
                        >
                            Add new configuration
                        </Button>
                        </div>
                    </div>

                        <Card className={hideHeader ? "border-0 bg-transparent shadow-none" : "shadow-sm"}>
                            <CardBody className={selectedCustomerId ? "p-0" : "p-3"}>
                                {!hideHeader && (
                                    <div className="p-4 bg-canvas border-bottom">
                                        <Row>
                                            <Col md={4}>
                                                <Label className="font-bold">Filter by Customer</Label>
                                                <SearchableDropdown
                                                    onChange={(val) => {
                                                        const id = val?.id || ""
                                                        setSelectedCustomerId(id)
                                                        if (onCustomerChange) onCustomerChange(val)
                                                    }}
                                                    locations={customers}
                                                    placeholder={customersLoading ? "Loading..." : "Select Customer"}
                                                    className="w-full"
                                                    value={selectedCustomerId ? (customers.find(c => c.id === selectedCustomerId)?.name || "Select Customer") : "select"}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                )}
                                
                                {!selectedCustomerId ? (
                                    <div className="text-center p-12">
                                        <div className="mb-4">
                                            <i className="mdi mdi-account-search-outline text-ink-muted" style={{ fontSize: "3rem" }}></i>
                                        </div>
                                        <h5 className="text-ink-muted">Please select a customer to view configurations</h5>
                                        <p className="text-ink-muted text-xs">Configurations will be fetched once a customer is selected.</p>
                                    </div>
                                ) : configsLoading ? (
                                    <div className="text-center p-12">
                                        <Spinner color="primary" />
                                        <p className="mt-2">Loading configurations...</p>
                                    </div>
                                ) : (
                                    <TableContainer
                                        columns={columns}
                                        data={configList}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        isCustomPageSize={true}
                                        defaultPageSize={10}
                                        SearchPlaceholder="Search configurations..."
                                        pagination="pagination pagination-rounded justify-content-end mb-2"
                                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline mb-0"
                                    />
                                )}
                            </CardBody>
                        </Card>
                </div>
            </div>
            {/* Add / edit form: a popup over the list. It closes by itself once the save succeeds (see handleSubmit). */}
            <Modal isOpen={!isListView} toggle={closeForm} size="lg" centered className="flex max-h-[85vh] flex-col">
                <ModalHeader toggle={closeForm}>{isEdit ? "Edit configuration" : "Add configuration"}</ModalHeader>
                <Form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <ModalBody className="overflow-y-auto">
                                    <Row>
                                        <Col md={6} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">Customer</Label>
                                                {externalCustomerId ? (
                                                    <Input type="text" value={externalCustomerName || customers.find(c => c.id === externalCustomerId)?.name || `Customer #${externalCustomerId}`} disabled readOnly />
                                                ) : (
                                                <SearchableDropdown
                                                    onChange={(val) => setFormData(prev => ({ ...prev, customer_id: val?.id || "" }))}
                                                    locations={customers}
                                                    placeholder={customersLoading ? "Loading..." : "Select Customer"}
                                                    className="w-full"
                                                    value={isEdit ? (customers.find(c => c.id === formData.customer_id)?.name || "N/A") : (formData.customer_id ? customers.find(c => c.id === formData.customer_id)?.name : "select")}
                                                />
                                                )}
                                                {errors.customer_id && <div className="text-danger-500 text-xs mt-1">{errors.customer_id}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">Product</Label>
                                                <SearchableDropdown
                                                    onChange={(val) => setFormData(prev => ({ ...prev, product_id: val?.id || "" }))}
                                                    locations={products}
                                                    placeholder={productsLoading ? "Loading..." : "Select Product"}
                                                    className="w-full"
                                                    value={isEdit ? (products.find(p => p.id === formData.product_id)?.name || "N/A") : "select"}
                                                />
                                                {errors.product_id && <div className="text-danger-500 text-xs mt-1">{errors.product_id}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">Billing Mode</Label>
                                                <Input
                                                    type="select"
                                                    name="billing_mode"
                                                    value={formData.billing_mode}
                                                    onChange={handleInputChange}
                                                    invalid={!!errors.billing_mode}
                                                >
                                                    <option value="">Select Billing Mode</option>
                                                    <option value="ZONE_MATRIX">ZONE_MATRIX</option>
                                                    <option value="GEO_BASED">GEO_BASED</option>
                                                </Input>
                                                <FormFeedback>{errors.billing_mode}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">Volumetric Divisor</Label>
                                                <Input
                                                    type="number"
                                                    name="volumetric_divisor"
                                                    value={formData.volumetric_divisor}
                                                    onChange={handleInputChange}
                                                    invalid={!!errors.volumetric_divisor}
                                                    placeholder="5000"
                                                />
                                                <FormFeedback>{errors.volumetric_divisor}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">FSC Percentage (%)</Label>
                                                <Input
                                                    type="number"
                                                    name="fsc_percentage"
                                                    value={formData.fsc_percentage}
                                                    onChange={handleInputChange}
                                                    invalid={!!errors.fsc_percentage}
                                                    placeholder="12"
                                                />
                                                <FormFeedback>{errors.fsc_percentage}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">Docket Charge</Label>
                                                <Input
                                                    type="number"
                                                    name="docket_charge"
                                                    value={formData.docket_charge}
                                                    onChange={handleInputChange}
                                                    invalid={!!errors.docket_charge}
                                                    placeholder="30"
                                                />
                                                <FormFeedback>{errors.docket_charge}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">RTO Multiplier</Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    name="rto_multiplier"
                                                    value={formData.rto_multiplier}
                                                    onChange={handleInputChange}
                                                    invalid={!!errors.rto_multiplier}
                                                    placeholder="1.0"
                                                />
                                                <FormFeedback>{errors.rto_multiplier}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">GST Rate (%)</Label>
                                                <Input
                                                    type="number"
                                                    name="gst_rate"
                                                    value={formData.gst_rate}
                                                    onChange={handleInputChange}
                                                    invalid={!!errors.gst_rate}
                                                    placeholder="18"
                                                />
                                                <FormFeedback>{errors.gst_rate}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4} className="mb-4 flex items-center">
                                            <FormGroup check>
                                                <Label check className="font-bold">
                                                    <Input
                                                        type="checkbox"
                                                        name="show_detailed_extra_charges"
                                                        checked={formData.show_detailed_extra_charges}
                                                        onChange={handleInputChange}
                                                        className="mr-2"
                                                    />
                                                    Show Detailed Extra Charges
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" type="button" onClick={closeForm} disabled={submitting}>Cancel</Button>
                        <Button color="primary" type="submit" disabled={submitting}>
                            {submitting ? (
                                <><Spinner size="sm" className="mr-2" /> Saving...</>
                            ) : (isEdit ? "Update Configuration" : "Save Configuration")}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>


            <Modal isOpen={isViewModalOpen} toggle={toggleViewModal} size="lg" centered>
                <ModalHeader toggle={toggleViewModal}>Configuration Details</ModalHeader>
                <ModalBody>
                    {viewData && (
                        <Table bordered responsive>
                            <tbody>
                                <tr>
                                    <th className="bg-canvas w-1/4">Customer</th>
                                    <td>{viewData.customer_name} ({viewData.customer_id})</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">Product</th>
                                    <td>{viewData.product_name} ({viewData.product_id})</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">Billing Mode</th>
                                    <td>{viewData.billing_mode}</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">Volumetric Divisor</th>
                                    <td>{viewData.volumetric_divisor}</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">FSC Percentage</th>
                                    <td>{viewData.fsc_percentage}%</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">Docket Charge</th>
                                    <td>{viewData.docket_charge}</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">RTO Multiplier</th>
                                    <td>{viewData.rto_multiplier}</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">GST Rate</th>
                                    <td>{viewData.gst_rate}%</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">Show Detailed Extra Charges</th>
                                    <td>{viewData.show_detailed_extra_charges ? "Yes" : "No"}</td>
                                </tr>
                            </tbody>
                        </Table>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleViewModal}>Close</Button>
                    <Button color="warning" onClick={() => {
                        toggleViewModal()
                        handleEdit(viewData)
                    }}>
                        Edit
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} toggle={toggleDeleteModal} centered>
                <ModalHeader toggle={toggleDeleteModal} className="text-danger-500">Confirm Delete</ModalHeader>
                <ModalBody className="py-6 text-center">
                    <i className="mdi mdi-alert-circle-outline text-danger-500" style={{ fontSize: "3rem" }}></i>
                    <h5 className="mt-4">Are you sure you want to delete this configuration?</h5>
                    <p className="text-ink-muted">This action cannot be undone.</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleDeleteModal}>Cancel</Button>
                    <Button color="danger" onClick={confirmDelete} disabled={deleting}>
                        {deleting ? <Spinner size="sm" /> : "Delete Now"}
                    </Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    )
}

export default CustomerProductConfig
