import React, { useEffect, useMemo, useState } from "react"
import { Button, Card, CardBody, Col, Container, Form, FormGroup, Input, Label, Row, FormFeedback, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Table } from "reactstrap"
import MainHeaderComp from "../../components/MainHeaderCom"
import SearchableDropdown from "../../components/Common/SearchableDropdown"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import usePostApiCall from "../../hooks/usePostApiCall"
import { useDeleteApiCall } from "../../hooks/useDeleteApiCall"
import { CORPORATE_BILLING_CONFIG, CORPORATE_CUSTOMERS_LIST, GET_CORPORATE_CUSTOMER_PRODUCTS } from "../../api"
import TableContainer from "../../components/Table/TableContainer"
import { MdDelete, MdVisibility, MdEdit } from "react-icons/md"

const CustomerProductConfig = () => {
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
                .filter(ele => ele?.cust_type?.type_of_cust === "Corporate")
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
        setErrors({})
        setIsEdit(false)
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
            cell: (cell) => (
                <div className="d-flex gap-2 justify-content-center">
                    <Button color="info" size="sm" title="View Details" onClick={() => handleView(cell.row.original)}>
                        <MdVisibility size={16} />
                    </Button>
                    <Button color="warning" size="sm" title="Edit" onClick={() => handleEdit(cell.row.original)}>
                        <MdEdit size={16} />
                    </Button>
                    <Button color="danger" size="sm" title="Delete" onClick={() => handleDelete(cell.row.original)} disabled={deleting}>
                        <MdDelete size={16} />
                    </Button>
                </div>
            )
        }
    ], [configList, deleting])

    return (
        <React.Fragment>
            <div className='page-content py-0 px-0'>
                <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                    <MainHeaderComp
                        title="Customer Product Config"
                    />
                </div>
                <div className="container-fluid px-3 py-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">{isListView ? "Configuration List" : (isEdit ? "Edit Configuration" : "Add Configuration")}</h5>
                        <Button 
                            color={isListView ? "primary" : "secondary"} 
                            onClick={() => {
                                if (isListView) {
                                    resetForm()
                                    setIsListView(false)
                                } else {
                                    setIsListView(true)
                                }
                            }}
                        >
                            {isListView ? "Add New Configuration" : "Back to List"}
                        </Button>
                    </div>

                    {isListView ? (
                        <Card className="shadow-sm">
                            <CardBody className={selectedCustomerId ? "p-0" : "p-3"}>
                                <div className="p-3 bg-light border-bottom">
                                    <Row>
                                        <Col md={4}>
                                            <Label className="fw-bold">Filter by Customer</Label>
                                            <SearchableDropdown
                                                onChange={(val) => setSelectedCustomerId(val?.id || "")}
                                                locations={customers}
                                                placeholder={customersLoading ? "Loading..." : "Select Customer"}
                                                className="w-100"
                                                value={selectedCustomerId ? (customers.find(c => c.id === selectedCustomerId)?.name || "Select Customer") : "select"}
                                            />
                                        </Col>
                                    </Row>
                                </div>
                                
                                {!selectedCustomerId ? (
                                    <div className="text-center p-5">
                                        <div className="mb-3">
                                            <i className="mdi mdi-account-search-outline text-muted" style={{ fontSize: "3rem" }}></i>
                                        </div>
                                        <h5 className="text-muted">Please select a customer to view configurations</h5>
                                        <p className="text-muted small">Configurations will be fetched once a customer is selected.</p>
                                    </div>
                                ) : configsLoading ? (
                                    <div className="text-center p-5">
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
                                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline mb-0"
                                    />
                                )}
                            </CardBody>
                        </Card>
                    ) : (
                        <Card className="shadow-sm">
                            <CardBody>
                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col md={6} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">Customer</Label>
                                                <SearchableDropdown
                                                    onChange={(val) => setFormData(prev => ({ ...prev, customer_id: val?.id || "" }))}
                                                    locations={customers}
                                                    placeholder={customersLoading ? "Loading..." : "Select Customer"}
                                                    className="w-100"
                                                    value={isEdit ? (customers.find(c => c.id === formData.customer_id)?.name || "N/A") : "select"}
                                                />
                                                {errors.customer_id && <div className="text-danger small mt-1">{errors.customer_id}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">Product</Label>
                                                <SearchableDropdown
                                                    onChange={(val) => setFormData(prev => ({ ...prev, product_id: val?.id || "" }))}
                                                    locations={products}
                                                    placeholder={productsLoading ? "Loading..." : "Select Product"}
                                                    className="w-100"
                                                    value={isEdit ? (products.find(p => p.id === formData.product_id)?.name || "N/A") : "select"}
                                                />
                                                {errors.product_id && <div className="text-danger small mt-1">{errors.product_id}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">Billing Mode</Label>
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
                                        <Col md={4} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">Volumetric Divisor</Label>
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
                                        <Col md={4} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">FSC Percentage (%)</Label>
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
                                        <Col md={4} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">Docket Charge</Label>
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
                                        <Col md={4} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">RTO Multiplier</Label>
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
                                        <Col md={4} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">GST Rate (%)</Label>
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
                                        <Col md={4} className="mb-3 d-flex align-items-center">
                                            <FormGroup check>
                                                <Label check className="fw-bold">
                                                    <Input
                                                        type="checkbox"
                                                        name="show_detailed_extra_charges"
                                                        checked={formData.show_detailed_extra_charges}
                                                        onChange={handleInputChange}
                                                        className="me-2"
                                                    />
                                                    Show Detailed Extra Charges
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-end mt-4">
                                        <Button color="primary" type="submit" disabled={submitting} className="px-5" style={{ minWidth: "150px" }}>
                                            {submitting ? (
                                                <><Spinner size="sm" className="me-2" /> Saving...</>
                                            ) : (isEdit ? "Update Configuration" : "Save Configuration")}
                                        </Button>
                                    </div>
                                </Form>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>

            <Modal isOpen={isViewModalOpen} toggle={toggleViewModal} size="lg" centered>
                <ModalHeader toggle={toggleViewModal}>Configuration Details</ModalHeader>
                <ModalBody>
                    {viewData && (
                        <Table bordered responsive>
                            <tbody>
                                <tr>
                                    <th className="bg-light w-25">Customer</th>
                                    <td>{viewData.customer_name} ({viewData.customer_id})</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">Product</th>
                                    <td>{viewData.product_name} ({viewData.product_id})</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">Billing Mode</th>
                                    <td>{viewData.billing_mode}</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">Volumetric Divisor</th>
                                    <td>{viewData.volumetric_divisor}</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">FSC Percentage</th>
                                    <td>{viewData.fsc_percentage}%</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">Docket Charge</th>
                                    <td>{viewData.docket_charge}</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">RTO Multiplier</th>
                                    <td>{viewData.rto_multiplier}</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">GST Rate</th>
                                    <td>{viewData.gst_rate}%</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">Show Detailed Extra Charges</th>
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
                <ModalHeader toggle={toggleDeleteModal} className="text-danger">Confirm Delete</ModalHeader>
                <ModalBody className="py-4 text-center">
                    <i className="mdi mdi-alert-circle-outline text-danger" style={{ fontSize: "3rem" }}></i>
                    <h5 className="mt-3">Are you sure you want to delete this configuration?</h5>
                    <p className="text-muted">This action cannot be undone.</p>
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
