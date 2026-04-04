import React, { useEffect, useMemo, useState } from "react"
import { Button, Card, CardBody, Col, Container, Form, FormGroup, Input, Label, Row, FormFeedback, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Table } from "reactstrap"
import MainHeaderComp from "../../components/MainHeaderCom"
import SearchableDropdown from "../../components/Common/SearchableDropdown"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import usePostApiCall from "../../hooks/usePostApiCall"
import { useDeleteApiCall } from "../../hooks/useDeleteApiCall"
import { CORPORATE_BILLING_VAS, CORPORATE_CUSTOMERS_LIST, GET_CORPORATE_CUSTOMER_PRODUCTS } from "../../api"
import TableContainer from "../../components/Table/TableContainer"
import { MdDelete, MdVisibility, MdEdit } from "react-icons/md"

const VASConfig = () => {
    const { apifunc: fetchCustomers, data: customerData, loading: customersLoading } = useGetApiCall()
    const { apifunc: fetchProducts, data: productData, loading: productsLoading } = useGetApiCall()
    const { apifunc: fetchConfigs, data: configData, loading: configsLoading } = useGetApiCall()
    const { apifunc: submitConfig, loading: submitting } = usePostApiCall(null, "VAS configuration saved successfully")
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
        charge_name: "",
        charge_type: "FLAT",
        charge_category: "VAS",
        value: "",
        min_value: 0,
        is_mandatory: false,
        is_default_applied: true
    })

    const [errors, setErrors] = useState({})
    const [isEdit, setIsEdit] = useState(false)
    const [isOthers, setIsOthers] = useState(false)

    const chargeNameOptions = ["COD CHARGES", "FOV", "SMS", "APPOINTMENT CHARGES"]

    useEffect(() => {
        fetchCustomers(CORPORATE_CUSTOMERS_LIST)
    }, [])

    const loadConfigs = (id) => {
        if (id) {
            fetchConfigs(`${CORPORATE_BILLING_VAS}?customer_id=${id}`)
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
        if (!formData.charge_name) newErrors.charge_name = "Charge Name is required"
        if (!formData.charge_type) newErrors.charge_type = "Charge Type is required"
        if (formData.value === "" || formData.value < 0) newErrors.value = "Value is required and cannot be negative"
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        let finalValue = value

        if (type === 'checkbox') {
            finalValue = checked
        } else if (['value', 'min_value'].includes(name)) {
            finalValue = value === "" ? "" : parseFloat(value)
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (validate()) {
            const result = await submitConfig(CORPORATE_BILLING_VAS, formData)
            if (result) {
                if (formData.customer_id === selectedCustomerId) {
                    loadConfigs(selectedCustomerId)
                } else if (!selectedCustomerId) {
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
            charge_name: "",
            charge_type: "FLAT",
            charge_category: "VAS",
            value: "",
            min_value: 0,
            is_mandatory: false,
            is_default_applied: true
        })
        setErrors({})
        setIsEdit(false)
        setIsOthers(false)
    }

    const toggleDeleteModal = () => setIsDeleteModalOpen(!isDeleteModalOpen)

    const handleDelete = (row) => {
        setDeleteTarget(row)
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (deleteTarget) {
            const body = {
                charge_id: deleteTarget.id
            }
            const result = await deleteConfig(CORPORATE_BILLING_VAS, body)
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
            id: row.id,
            customer_id: row.customer_id,
            product_id: row.product_id,
            charge_name: row.charge_name,
            charge_type: row.charge_type,
            charge_category: row.charge_category,
            value: row.value,
            min_value: row.min_value,
            is_mandatory: row.is_mandatory,
            is_default_applied: row.is_default_applied
        })
        
        const isPredefined = chargeNameOptions.includes(row.charge_name)
        setIsOthers(!isPredefined && row.charge_name !== "")
        
        setIsListView(false)
    }

    const toggleViewModal = () => setIsViewModalOpen(!isViewModalOpen)

    const columns = useMemo(() => [
        {
            header: "Charge Name",
            accessorKey: "charge_name",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Product",
            accessorKey: "product_name",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Type",
            accessorKey: "charge_type",
            cell: (cell) => cell.getValue() || "N/A"
        },
        {
            header: "Value",
            accessorKey: "value",
            cell: (cell) => cell.getValue() || "0"
        },
        {
            header: "Mandatory",
            accessorKey: "is_mandatory",
            cell: (cell) => cell.getValue() ? <span className="badge bg-success">Yes</span> : <span className="badge bg-secondary">No</span>
        },
        {
            header: "Default",
            accessorKey: "is_default_applied",
            cell: (cell) => cell.getValue() ? <span className="badge bg-primary">Yes</span> : <span className="badge bg-secondary">No</span>
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
                        title="VAS Configuration"
                    />
                </div>
                <div className="container-fluid px-3 py-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">{isListView ? "VAS List" : (isEdit ? "Edit VAS" : "Add VAS")}</h5>
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
                            {isListView ? "Add New VAS" : "Back to List"}
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
                                        <h5 className="text-muted">Please select a customer to view VAS configurations</h5>
                                    </div>
                                ) : configsLoading ? (
                                    <div className="text-center p-5">
                                        <Spinner color="primary" />
                                        <p className="mt-2">Loading VAS configurations...</p>
                                    </div>
                                ) : (
                                    <TableContainer
                                        columns={columns}
                                        data={configList}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        isCustomPageSize={true}
                                        defaultPageSize={10}
                                        SearchPlaceholder="Search VAS..."
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
                                                    value={isEdit ? (customers.find(c => c.id === formData.customer_id)?.name || "N/A") : (formData.customer_id ? customers.find(c => c.id === formData.customer_id)?.name : "select")}
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
                                                    value={isEdit ? (products.find(p => p.id === formData.product_id)?.name || "N/A") : (formData.product_id ? products.find(p => p.id === formData.product_id)?.name : "select")}
                                                />
                                                {errors.product_id && <div className="text-danger small mt-1">{errors.product_id}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">Charge Name</Label>
                                                <Input
                                                    type="select"
                                                    name="charge_name_dropdown"
                                                    value={isOthers ? "Others" : formData.charge_name}
                                                    onChange={(e) => {
                                                        const val = e.target.value
                                                        if (val === "Others") {
                                                            setIsOthers(true)
                                                            setFormData(prev => ({ ...prev, charge_name: "" }))
                                                        } else {
                                                            setIsOthers(false)
                                                            setFormData(prev => ({ ...prev, charge_name: val }))
                                                        }
                                                    }}
                                                    invalid={!!errors.charge_name}
                                                >
                                                    <option value="">Select Charge Name</option>
                                                    {chargeNameOptions.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                    <option value="Others">Others</option>
                                                </Input>
                                                {isOthers && (
                                                    <Input
                                                        type="text"
                                                        name="charge_name"
                                                        className="mt-2"
                                                        value={formData.charge_name}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter Manual Charge Name"
                                                        invalid={!!errors.charge_name}
                                                    />
                                                )}
                                                <FormFeedback>{errors.charge_name}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">Charge Type</Label>
                                                <Input
                                                    type="select"
                                                    name="charge_type"
                                                    value={formData.charge_type}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="FLAT">FLAT</option>
                                                    <option value="PERCENT">PERCENT</option>
                                                    <option value="PER_KG">PER_KG</option>
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">Charge Category</Label>
                                                <Input
                                                    type="select"
                                                    name="charge_category"
                                                    value={formData.charge_category}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="VAS">VAS</option>
                                                    <option value="CORE">CORE</option>
                                                    <option value="OPS">OPS</option>
                                                </Input>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">Value</Label>
                                                <Input
                                                    type="number"
                                                    name="value"
                                                    value={formData.value}
                                                    onChange={handleInputChange}
                                                    invalid={!!errors.value}
                                                    placeholder="50"
                                                />
                                                <FormFeedback>{errors.value}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <FormGroup>
                                                <Label className="fw-bold">Minimum Value</Label>
                                                <Input
                                                    type="number"
                                                    name="min_value"
                                                    value={formData.min_value}
                                                    onChange={handleInputChange}
                                                    placeholder="0"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6} className="mb-3">
                                            <FormGroup check className="mt-4">
                                                <Label check>
                                                    <Input 
                                                        type="checkbox" 
                                                        name="is_mandatory" 
                                                        checked={formData.is_mandatory} 
                                                        onChange={handleInputChange} 
                                                    />{' '}
                                                    Is Mandatory
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <FormGroup check className="mt-4">
                                                <Label check>
                                                    <Input 
                                                        type="checkbox" 
                                                        name="is_default_applied" 
                                                        checked={formData.is_default_applied} 
                                                        onChange={handleInputChange} 
                                                    />{' '}
                                                    Is Default Applied
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-end mt-4">
                                        <Button color="primary" type="submit" disabled={submitting} className="px-5" style={{ minWidth: "150px" }}>
                                            {submitting ? (
                                                <><Spinner size="sm" className="me-2" /> Saving...</>
                                            ) : (isEdit ? "Update VAS" : "Save VAS")}
                                        </Button>
                                    </div>
                                </Form>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>

            <Modal isOpen={isViewModalOpen} toggle={toggleViewModal} size="lg" centered>
                <ModalHeader toggle={toggleViewModal}>VAS Details</ModalHeader>
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
                                    <th className="bg-light">Charge Name</th>
                                    <td>{viewData.charge_name}</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">Charge Type</th>
                                    <td>{viewData.charge_type}</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">Charge Category</th>
                                    <td>{viewData.charge_category}</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">Value</th>
                                    <td>{viewData.value}</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">Minimum Value</th>
                                    <td>{viewData.min_value}</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">Mandatory</th>
                                    <td>{viewData.is_mandatory ? "Yes" : "No"}</td>
                                </tr>
                                <tr>
                                    <th className="bg-light">Default Applied</th>
                                    <td>{viewData.is_default_applied ? "Yes" : "No"}</td>
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
                    <h5 className="mt-3">Are you sure you want to delete this VAS configuration?</h5>
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

export default VASConfig
