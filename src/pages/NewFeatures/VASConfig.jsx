import React, { useEffect, useMemo, useState } from "react"
import { Button, Card, CardBody, Col, Container, Form, FormGroup, Input, Label, Row, FormFeedback, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Table } from "@/components/ui"
import MainHeaderComp from "../../components/MainHeaderCom"
import AddProductButton from "../../components/Common/AddProductButton"
import SearchableDropdown from "../../components/Common/SearchableDropdown"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import usePostApiCall from "../../hooks/usePostApiCall"
import { useDeleteApiCall } from "../../hooks/useDeleteApiCall"
import { CORPORATE_BILLING_VAS, CORPORATE_CUSTOMERS_LIST, GET_CORPORATE_CUSTOMER_PRODUCTS } from "../../api"
import TableContainer from "../../components/Table/TableContainer"
import { FaEye, FaEdit, FaTrash, FaFileExcel, FaPlus } from "react-icons/fa"
import { useExcelExport } from "../../hooks/useExcelExport"
import { flattenRows } from "../../helpers/flattenRows"

// onChanged(message): called after a VAS is saved or removed (the onboarding wizard re-runs its checklist)
// extraActions: extra buttons shown in the header row, before Add New VAS (the onboarding wizard puts "Copy from the default setup" there)
// Inside the onboarding wizard the grid fills the card and only it scrolls, with a pinned header.
const FILL_TABLE_PROPS = { fillHeight: true, isStickyHeader: true, stickyTop: 0, theadClass: "sticky top-0 z-10", tableHeight: "58vh" }

const VASConfig = ({ externalCustomerId = "", onCustomerChange = null, hideHeader = false, extraActions = null, externalCustomerName = "", onChanged = null }) => {
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
    const { exportToExcel: exportRows, isExporting: exporting } = useExcelExport()
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
                onChanged?.("VAS updated")
            }
        }
    }

    const resetForm = () => {
        setFormData({
            customer_id: externalCustomerId || selectedCustomerId || "",
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
                charge_id: deleteTarget.id
            }
            const result = await deleteConfig(CORPORATE_BILLING_VAS, body)
            if (result) {
                loadConfigs(selectedCustomerId)
                toggleDeleteModal()
                onChanged?.("VAS removed")
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
            cell: (cell) => cell.getValue() ? <span className="badge bg-success-500">Yes</span> : <span className="badge bg-secondary">No</span>
        },
        {
            header: "Default",
            accessorKey: "is_default_applied",
            cell: (cell) => cell.getValue() ? <span className="badge bg-brand-500">Yes</span> : <span className="badge bg-secondary">No</span>
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

    // the buttons above the list: inside the table's toolbar in the onboarding wizard, in the page header elsewhere
    const actionButtons = (
        <div className="flex flex-wrap items-center gap-1.5">
            {isListView && extraActions}
            <Button size="sm" color="primary" title="Add VAS" className="flex items-center gap-1 whitespace-nowrap" onClick={() => { resetForm(); setIsListView(false) }}>
                <FaPlus /> Add
            </Button>
            <Button color="success" size="sm" outline title="Export to Excel" disabled={!configList.length || exporting} onClick={() => exportRows(flattenRows(configList), `VAS_${externalCustomerName || externalCustomerId || "customer"}`.replace(/\s+/g, "_"))} className="flex items-center gap-1 whitespace-nowrap">
                <FaFileExcel /> Export
            </Button>
        </div>
    )

    return (
        <React.Fragment>
            <div className={hideHeader ? 'flex min-h-0 flex-1 flex-col' : 'page-content py-0 px-0'}>
                {!hideHeader && (
                    <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                        <MainHeaderComp
                            title="VAS Configuration"
                        />
                    </div>
                )}
                <div className={hideHeader ? "container-fluid flex min-h-0 flex-1 flex-col px-0 py-0" : "container-fluid px-4 py-4"}>
                    {!hideHeader && (
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <h5 className="m-0 text-base">VAS list</h5>
                            {actionButtons}
                        </div>
                    )}

                        <Card className={hideHeader ? "flex min-h-0 flex-1 flex-col rounded-none border-0 bg-transparent shadow-none" : "shadow-sm"}>
                            <CardBody className={`${selectedCustomerId ? "p-0" : "p-3"} ${hideHeader ? "flex min-h-0 flex-1 flex-col" : ""}`}>
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
                                        <h5 className="text-ink-muted">Please select a customer to view VAS configurations</h5>
                                    </div>
                                ) : configsLoading ? (
                                    <div className="text-center p-12">
                                        <Spinner color="primary" />
                                        <p className="mt-2">Loading VAS configurations...</p>
                                    </div>
                                ) : (
                                    <TableContainer
                                        columns={columns}
                                        data={configList}
                                        compact
                                        searchClassName="w-40 shrink-0"
                                        rightExtraFiled={hideHeader ? actionButtons : null}
                                        footerNote={hideHeader ? <div className="text-sm font-semibold">VAS list <span className="font-normal text-ink-muted">({configList.length})</span></div> : null}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        defaultPageSize={100}
                                        SearchPlaceholder="Search..."
                                        pagination="pagination pagination-rounded justify-content-end mb-2"
                                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline mb-0"
                                        {...(hideHeader ? FILL_TABLE_PROPS : {})}
                                    />
                                )}
                            </CardBody>
                        </Card>
                </div>
            </div>
            {/* Add / edit form: a popup over the list. It closes by itself once the save succeeds (see handleSubmit). */}
            <Modal isOpen={!isListView} toggle={closeForm} size="lg" centered className="flex max-h-[85vh] flex-col">
                <ModalHeader toggle={closeForm}>{isEdit ? "Edit VAS" : "Add VAS"}</ModalHeader>
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
                                                <div className="flex items-center gap-2">
                                                    <div className="min-w-0 flex-1">
                                                    <SearchableDropdown
                                                        onChange={(val) => setFormData(prev => ({ ...prev, product_id: val?.id || "" }))}
                                                        locations={products}
                                                        placeholder={productsLoading ? "Loading..." : "Select Product"}
                                                        className="w-full"
                                                        value={isEdit ? (products.find(p => p.id === formData.product_id)?.name || "N/A") : (formData.product_id ? products.find(p => p.id === formData.product_id)?.name : "select")}
                                                    />
                                                    </div>
                                                    <AddProductButton onAdded={(pr) => setProducts((list) => (list.some((x) => x.id === pr.id) ? list : [...list, { id: pr.id, value: pr.id, name: pr.name }]))} />
                                                </div>
                                                {errors.product_id && <div className="text-danger-500 text-xs mt-1">{errors.product_id}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">Charge Name</Label>
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
                                        <Col md={4} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">Charge Type</Label>
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
                                        <Col md={4} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">Charge Category</Label>
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
                                        <Col md={6} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">Value</Label>
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
                                        <Col md={6} className="mb-4">
                                            <FormGroup>
                                                <Label className="font-bold">Minimum Value</Label>
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
                                        <Col md={6} className="mb-4">
                                            <FormGroup check className="mt-6">
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
                                        <Col md={6} className="mb-4">
                                            <FormGroup check className="mt-6">
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
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" type="button" onClick={closeForm} disabled={submitting}>Cancel</Button>
                        <Button color="primary" type="submit" disabled={submitting}>
                            {submitting ? (
                                <><Spinner size="sm" className="mr-2" /> Saving...</>
                            ) : (isEdit ? "Update VAS" : "Save VAS")}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>


            <Modal isOpen={isViewModalOpen} toggle={toggleViewModal} size="lg" centered>
                <ModalHeader toggle={toggleViewModal}>VAS Details</ModalHeader>
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
                                    <th className="bg-canvas">Charge Name</th>
                                    <td>{viewData.charge_name}</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">Charge Type</th>
                                    <td>{viewData.charge_type}</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">Charge Category</th>
                                    <td>{viewData.charge_category}</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">Value</th>
                                    <td>{viewData.value}</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">Minimum Value</th>
                                    <td>{viewData.min_value}</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">Mandatory</th>
                                    <td>{viewData.is_mandatory ? "Yes" : "No"}</td>
                                </tr>
                                <tr>
                                    <th className="bg-canvas">Default Applied</th>
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
                <ModalHeader toggle={toggleDeleteModal} className="text-danger-500">Confirm Delete</ModalHeader>
                <ModalBody className="py-6 text-center">
                    <i className="mdi mdi-alert-circle-outline text-danger-500" style={{ fontSize: "3rem" }}></i>
                    <h5 className="mt-4">Are you sure you want to delete this VAS configuration?</h5>
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

export default VASConfig
