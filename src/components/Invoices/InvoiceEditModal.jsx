import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Table,
    Row,
    Col,
    Alert,
    Spinner,
} from 'reactstrap';
import { DELETE_PDF_ENVOICE_ITEM } from '../../api';
import { useDeleteApiCall } from '../../hooks/useDeleteApiCall';
import ToasterProvider from '../../helpers/ToasterProvider';
import { numberToWords, amountToWords } from "amount-to-words";
const STATE_MAP = {
    // 1. Andhra Pradesh
    AP: "AP",
    ANDHRAPRADESH: "AP",

    // 2. Arunachal Pradesh
    AR: "AR",
    ARUNACHALPRADESH: "AR",

    // 3. Assam
    AS: "AS",
    ASSAM: "AS",

    // 4. Bihar
    BR: "BR",
    BIHAR: "BR",

    // 5. Chhattisgarh
    CG: "CG",
    CHHATTISGARH: "CG",

    // 6. Goa
    GA: "GA",
    GOA: "GA",

    // 7. Gujarat
    GJ: "GJ",
    GUJARAT: "GJ",

    // 8. Haryana
    HR: "HR",
    HARYANA: "HR",

    // 9. Himachal Pradesh
    HP: "HP",
    HIMACHALPRADESH: "HP",

    // 10. Jharkhand
    JH: "JH",
    JHARKHAND: "JH",

    // 11. Karnataka
    KA: "KA",
    KARNATAKA: "KA",

    // 12. Kerala
    KL: "KL",
    KERALA: "KL",

    // 13. Madhya Pradesh
    MP: "MP",
    MADHYAPRADESH: "MP",

    // 14. Maharashtra
    MH: "MH",
    MAHARASHTRA: "MH",
    MAHARATRA: "MH", // common typo

    // 15. Manipur
    MN: "MN",
    MANIPUR: "MN",

    // 16. Meghalaya
    ML: "ML",
    MEGHALAYA: "ML",

    // 17. Mizoram
    MZ: "MZ",
    MIZORAM: "MZ",

    // 18. Nagaland
    NL: "NL",
    NAGALAND: "NL",

    // 19. Odisha
    OD: "OD",
    ODISHA: "OD",
    ORISSA: "OD", // old name

    // 20. Punjab
    PB: "PB",
    PUNJAB: "PB",

    // 21. Rajasthan
    RJ: "RJ",
    RAJASTHAN: "RJ",

    // 22. Sikkim
    SK: "SK",
    SIKKIM: "SK",

    // 23. Tamil Nadu
    TN: "TN",
    TAMILNADU: "TN",

    // 24. Telangana
    TS: "TS",
    TELANGANA: "TS",

    // 25. Tripura
    TR: "TR",
    TRIPURA: "TR",

    // 26. Uttar Pradesh
    UP: "UP",
    UTTARPRADESH: "UP",

    // 27. Uttarakhand
    UK: "UK",
    UTTARAKHAND: "UK",

    // 28. West Bengal
    WB: "WB",
    WESTBENGAL: "WB",

    // 29. Jammu & Kashmir (state during GST rollout)
    JK: "JK",
    JAMMUKASHMIR: "JK",
};


const CheckInvoice = (invoice) => {
    let obj = {
        manual: "manual",
        franchise: "franchise",
        corporate: "corporate",
        intl_retail: "intl_retail",
        retail: "retail"
    }

    if (invoice.type_of_invoice !== null) {
        return obj[invoice.type_of_invoice]
    }

    if (invoice.type_of_invoice === null) {
        let isManual = invoice?.items[0]?.description
        let isOrigin = invoice?.items[0]?.origin
        //  checking the items
        if (isManual) {
            return "manual"
        }
        if (isOrigin) {
            return "corporate"
        }
        return "franchise"
    }
}
const InvoiceEditModal = ({ invoice, isOpen, toggle, onSave, loading }) => {
    const initialState = {
        invoice_no: '',
        invoice_date: '',
        from_date: null,
        to_date: null,
        to_name: '',
        to_address: '',
        to_city: null,
        to_state: null,
        to_pincode: null,
        to_gst_no: '',
        to_pan_no: '',
        to_state_code: '',
        from_name: '',
        from_address: '',
        from_city: null,
        from_state: null,
        from_pincode: null,
        from_gst_no: '',
        from_pan_no: '',
        from_state_code: '',
        total_quantity: 0.0,
        total_freight: 0.0,
        total_cgst: 0.0,
        total_sgst: 0.0,
        total_igst: 0.0,
        total_amount: 0.0,
        amount_in_words: '',
        type_of_invoice: null,
        items: []
    };

    const [formData, setFormData] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [UserType, setUserType] = useState("")
    const [SelectedItemId, setSelectedItemId] = useState(null)
    const [StartInvoiceItems, setSetStartInvoiceItems] = useState([])

    // defining the delete item api
    const { apifunc: DeletePDFInvoiceItem, loading: PdfEnvoiceLoading } = useDeleteApiCall()

    // toaster provider
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    //  checking the type
    useEffect(() => {
        setUserType(CheckInvoice(invoice))
    }, [CheckInvoice(invoice)])

    useEffect(() => {
        if (invoice) {
            setSetStartInvoiceItems(invoice?.items?.map((ele) => ele?.id))
            const formattedData = {
                ...invoice,
                invoice_date: invoice.invoice_date ? invoice.invoice_date.substring(0, 10) : '',
                from_date: invoice.from_date ? invoice.from_date.substring(0, 10) : null,
                to_date: invoice.to_date ? invoice.to_date.substring(0, 10) : null,
                items: invoice.items ? invoice.items.map(item => ({
                    id: item.id || Date.now(),
                    description: item.description || null,
                    quantity: item.quantity || 0,
                    shipments: item.shipments || null,
                    origin: item.origin || null,
                    rate: item.rate || 0,
                    freight: item.freight || 0,
                    cgst: item.cgst || 0,
                    sgst: item.sgst || 0,
                    igst: item.igst || 0,
                    total: item.total || 0
                })) : []
            };
            setFormData(formattedData);
        } else {
            setFormData(initialState);
        }
    }, [invoice]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleItemChange = (index, field, value) => {

        const updatedItems = [...formData.items];
        const numericValue = ['quantity', 'rate', 'freight', 'cgst', 'sgst', 'igst'].includes(field)
            ? parseFloat(value) || 0
            : value;

        updatedItems[index] = {
            ...updatedItems[index],
            [field]: numericValue
        };

        // Recalculate item total
        if (['quantity', 'rate', 'freight', 'cgst', 'sgst', 'igst'].includes(field)) {
            const {
                quantity = 0,
                rate = 0,
                freight = 0,
                cgst = 0,
                sgst = 0,
                igst = 0,
            } = updatedItems[index];

            // Calculate and store subtotal
            const subtotal = quantity * rate;
            updatedItems[index].subtotal = subtotal;

            // Calculate total tax
            const taxTotal = cgst + sgst + igst;

            // Calculate final total including subtotal, freight, and taxes
            // updatedItems[index].total = subtotal + freight + taxTotal;
        }

        // Recalculate invoice totals
        const totals = updatedItems.reduce((acc, item) => ({
            quantity: acc.quantity + Number(item.quantity),
            freight: acc.freight + Number(item.freight),
            cgst: acc.cgst + Number(item.cgst),
            sgst: acc.sgst + Number(item.sgst),
            igst: acc.igst + Number(item.igst),
            amount: acc.amount + Number(item.total)
        }), { quantity: 0, freight: 0, cgst: 0, sgst: 0, igst: 0, amount: 0 });

        setFormData(prev => ({
            ...prev,
            items: updatedItems,
            total_quantity: totals.quantity,
            total_freight: totals.freight,
            total_cgst: totals.cgst,
            total_sgst: totals.sgst,
            total_igst: totals.igst,
            total_amount: totals.amount
        }));
    };


    //  validation
    const validate = () => {
        const newErrors = {};

        // Basic invoice validation
        if (!formData.invoice_no) newErrors.invoice_no = 'Invoice number is required';
        if (!formData.invoice_date) newErrors.invoice_date = 'Invoice date is required';
        if (!formData.to_name) newErrors.to_name = 'Recipient name is required';
        if (!formData.to_address) newErrors.to_address = 'Recipient address is required';
        if (!formData.from_name) newErrors.from_name = 'Sender name is required';
        if (!formData.from_address) newErrors.from_address = 'Sender address is required';

        // Items validation
        // formData.items.forEach((item, index) => {
        //     if (!item.description) newErrors[`items[${index}].description`] = 'Description is required';
        //     if (item.quantity <= 0) newErrors[`items[${index}].quantity`] = 'Quantity must be positive';
        //     if (item.rate <= 0) newErrors[`items[${index}].rate`] = 'Rate must be positive';
        // });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    //  on submit function
    const handleSubmit = (e) => {
        e.preventDefault();

        if (validate()) {
            // Proper way to remove a customer from formData
            // getting th loggged in user Id
            const CreatedUserId = JSON.parse(localStorage.getItem("authUser"))?.user?.id
            const updateData = () => {
                const newData = {
                    ...formData,
                    customer_id: invoice?.customer?.id ?? null,
                    created_by_id: CreatedUserId,
                };

                // Only remove "customer" if customer_id is NOT null
                // if (newData.customer_id !== null) {
                //     delete newData.customer;
                // }

                return newData;
            };
            // console.log(updateData(), "updateData");
            onSave(updateData());
        }
    };

    // adding new itesm
    const addNewItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    id: prev.items.length + 1,
                    description: null,
                    quantity: 0,
                    shipments: null,
                    origin: null,
                    rate: 0,
                    freight: 0,
                    cgst: 0,
                    sgst: 0,
                    igst: 0,
                    total: 0
                }
            ]
        }));
    };


    // removing the  items
    const removeItem = async (item) => {
        // for add new items
        if (!StartInvoiceItems.includes(item.id)) {
            const updatedItems = formData.items.filter((ele, i) => ele?.id !== item.id);
            setFormData(prev => ({
                ...prev,
                items: updatedItems
            }));
            return
        }


        //  calling the delete item APi
        setSelectedItemId(item?.id)
        //  for already present items
        let isDeleted = await DeletePDFInvoiceItem(`${DELETE_PDF_ENVOICE_ITEM}${invoice?.id}/delete_item/${item?.id}/`)


        if (isDeleted) {
            SucceesToaster("Item Deleted Successfully")
            console.log("item", item?.id, invoice?.id, isDeleted)
            const updatedItems = formData.items.filter((ele, i) => ele?.id !== item?.id);
            setFormData(prev => ({
                ...prev,
                items: updatedItems
            }));
        }
    };

    // rendering the  item table
    const renderItemsTable = (type) => {
        // const hasIGST = formData?.items?.some(item => Number(item.igst) > 0);
        // 🔹 Canonical state code map (India)


        // 🔹 Normalize any state input to a single code
        const normalizeState = (state) => {
            if (!state) return "";

            const normalized = String(state)
                .trim()
                .toUpperCase()
                .replace(/\s+/g, "");

            return STATE_MAP[normalized] || normalized;
        };

        // 🔹 FINAL IGST DECISION (100% working)
        const fromState = normalizeState(formData?.from_state);
        const toState = normalizeState(formData?.to_state);
        const hasIGST =
            fromState !== "" &&
            toState !== "" &&
            fromState !== toState;
        const getVisibleColumns = () => {
            switch (type) {
                case 'manual':
                    return ['srno', 'description', 'quantity', 'freight', hasIGST ? 'igst' : 'cgst', hasIGST ? null : 'sgst', 'total'].filter(Boolean);
                case 'corporate':
                    return ['srno', 'origin', 'shipments', 'freight', hasIGST ? 'igst' : 'cgst', hasIGST ? null : 'sgst', 'total'].filter(Boolean);
                case 'franchise':
                    return ['srno', 'quantity', hasIGST ? 'igst' : 'freight', hasIGST ? 'igst' : 'freight', 'total'].filter(Boolean);
                case 'intl_retail':
                    return ['srno', 'description', 'freight', hasIGST ? 'igst' : 'cgst', hasIGST ? null : 'sgst', 'total']
                case 'retail':
                    return ['description', "quantity", 'origin', 'rate', 'freight', hasIGST ? 'igst' : 'cgst', hasIGST ? null : 'sgst', 'total'].filter(Boolean);
                default:
                    return ['description', 'qty', 'shipments', 'origin', 'rate', 'freight', hasIGST ? 'igst' : 'cgst', hasIGST ? null : 'sgst', 'total'].filter(Boolean);
            }
        };
        const visibleColumns = getVisibleColumns();
        const isVisible = (column) => visibleColumns.includes(column);

        return (
            <div className="table-responsive mt-3">
                <Table bordered striped>
                    <thead className="thead-dark">
                        <tr>
                            {isVisible('srno') && <th>Sr. No</th>}
                            {isVisible('description') && <th>Description</th>}
                            {isVisible('quantity') && <th>Quantity</th>}
                            {isVisible('shipments') && <th>Shipments</th>}
                            {isVisible('origin') && <th>Origin</th>}
                            {isVisible('rate') && <th>Rate</th>}
                            {isVisible('freight') && <th>Freight</th>}
                            {isVisible('cgst') && <th>CGST</th>}
                            {isVisible('sgst') && <th>SGST</th>}
                            {isVisible('igst') && <th>IGST</th>}
                            {isVisible('total') && <th>Total</th>}
                            {type !== "franchise" && <th>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {formData?.items?.map((item, index) => (
                            <tr key={item.id}>
                                {isVisible('srno') && <td>{index + 1}</td>}
                                {isVisible('description') && (
                                    <td>
                                        <Input
                                            type="text"
                                            value={item?.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            invalid={!!errors[`items[${index}].description`]}
                                        />
                                        {errors[`items[${index}].description`] && (
                                            <div className="text-danger small">
                                                {errors[`items[${index}].description`]}
                                            </div>
                                        )}
                                    </td>
                                )}
                                {isVisible('quantity') && (
                                    <td>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            min="0"
                                            step="0.01"
                                            invalid={!!errors[`items[${index}].quantity`]}
                                        />
                                    </td>
                                )}
                                {isVisible('shipments') && (
                                    <td>
                                        <Input
                                            type="text"
                                            value={item.shipments}
                                            onChange={(e) => handleItemChange(index, 'shipments', e.target.value)}
                                        />
                                    </td>
                                )}
                                {isVisible('origin') && (
                                    <td>
                                        <Input
                                            type="text"
                                            value={item.origin}
                                            onChange={(e) => handleItemChange(index, 'origin', e.target.value)}
                                        />
                                    </td>
                                )}
                                {isVisible('rate') && (
                                    <td>
                                        <Input
                                            type="number"
                                            value={item.rate}
                                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                            min="0"
                                            step="0.01"
                                            invalid={!!errors[`items[${index}].rate`]}
                                        />
                                    </td>
                                )}
                                {isVisible('freight') && (
                                    <td>
                                        <Input
                                            type="number"
                                            value={item.freight}
                                            onChange={(e) => handleItemChange(index, 'freight', e.target.value)}
                                            min="0"
                                            step="0.01"
                                        />
                                    </td>
                                )}
                                {isVisible('cgst') && (
                                    <td>
                                        <Input
                                            type="number"
                                            value={item.cgst}
                                            onChange={(e) => handleItemChange(index, 'cgst', e.target.value)}
                                            min="0"
                                            step="0.01"
                                        />
                                    </td>
                                )}
                                {isVisible('sgst') && (
                                    <td>
                                        <Input
                                            type="number"
                                            value={item.sgst}
                                            onChange={(e) => handleItemChange(index, 'sgst', e.target.value)}
                                            min="0"
                                            step="0.01"
                                        />
                                    </td>
                                )}
                                {isVisible('igst') && (
                                    <td>
                                        <Input
                                            type="number"
                                            value={item.igst}
                                            onChange={(e) => handleItemChange(index, 'igst', e.target.value)}
                                            min="0"
                                            step="0.01"
                                        />
                                    </td>
                                )}
                                {isVisible('total') && (
                                    <td>
                                        <Input
                                            type="number"
                                            value={item?.total}
                                            onChange={(e) => handleItemChange(index, 'total', e.target.value)}
                                            step="0.01"
                                        />
                                    </td>
                                )}
                                {type !== "franchise" && (
                                    <td>
                                        <Button
                                            color="danger"
                                            size="sm"
                                            className='d-flex justify-content-center align-items-center'
                                            onClick={() => removeItem(item)}
                                        >
                                            {(PdfEnvoiceLoading && item.id === SelectedItemId) ? (
                                                <Spinner size="sm">Loading...</Spinner>
                                            ) : "×"}
                                        </Button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        );
    };


    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl">
            <ModalHeader toggle={toggle}>
                {console.log(formData, "1234")}
                {formData.invoice_no ? `Edit Invoice: ${formData.invoice_no}` : 'Create New Invoice'}
            </ModalHeader>
            <Form onSubmit={handleSubmit}>
                <ModalBody style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <h5 className="mb-3 border-bottom pb-2">Basic Information</h5>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="invoice_no">Invoice Number</Label>
                                <Input
                                    type="text"
                                    id="invoice_no"
                                    name="invoice_no"
                                    readOnly
                                    value={formData.invoice_no}
                                // onChange={handleChange}
                                // invalid={!!errors.invoice_no}
                                />
                                {errors.invoice_no && <div className="text-danger">{errors.invoice_no}</div>}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="invoice_date">Invoice Date</Label>
                                <Input
                                    type="date"
                                    id="invoice_date"
                                    name="invoice_date"
                                    value={formData.invoice_date}
                                    onChange={handleChange}
                                    invalid={!!errors.invoice_date}
                                />
                                {errors.invoice_date && <div className="text-danger">{errors.invoice_date}</div>}
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        {
                            formData.from_date &&
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="from_date">From Date</Label>
                                    <Input
                                        type="date"
                                        id="from_date"
                                        name="from_date"
                                        value={formData.from_date || ''}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>
                        }


                        {
                            formData.to_date && <Col md={6}>
                                <FormGroup>
                                    <Label for="to_date">To Date</Label>
                                    <Input
                                        type="date"
                                        id="to_date"
                                        name="to_date"
                                        value={formData.to_date || ''}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>
                        }

                    </Row>

                    <h5 className="mt-4 mb-3 border-bottom pb-2">Sender Details</h5>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="from_name">Name</Label>
                                <Input
                                    type="text"
                                    id="from_name"
                                    name="from_name"
                                    value={formData.from_name}
                                    onChange={handleChange}
                                    invalid={!!errors.from_name}
                                />
                                {errors.from_name && <div className="text-danger">{errors.from_name}</div>}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="from_gst_no">GST Number</Label>
                                <Input
                                    type="text"
                                    id="from_gst_no"
                                    name="from_gst_no"
                                    value={formData.from_gst_no}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Label for="from_address">Address</Label>
                        <Input
                            type="textarea"
                            id="from_address"
                            name="from_address"
                            value={formData.from_address}
                            onChange={handleChange}
                            rows={2}
                            invalid={!!errors.from_address}
                        />
                        {errors.from_address && <div className="text-danger">{errors.from_address}</div>}
                    </FormGroup>
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="from_pan_no">PAN Number</Label>
                                <Input
                                    type="text"
                                    id="from_pan_no"
                                    name="from_pan_no"
                                    value={formData.from_pan_no}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        {/*  */}
                        <Col md={4}>
                            <FormGroup>
                                <Label for="from_pincode">Pincode</Label>
                                <Input
                                    type="text"
                                    id="from_pincode"
                                    name="from_pincode"
                                    value={formData.from_pincode}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="from_pan_no">State</Label>
                                <Input
                                    type="text"
                                    id="from_state"
                                    name="from_state"
                                    value={formData.from_state}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="from_city">City</Label>
                                <Input
                                    type="text"
                                    id="from_city"
                                    name="from_city"
                                    value={formData.from_city}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        {/*  */}
                        <Col md={4}>
                            <FormGroup>
                                <Label for="from_state_code">State Code</Label>
                                <Input
                                    type="text"
                                    id="from_state_code"
                                    name="from_state_code"
                                    value={formData.from_state_code}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <h5 className="mt-4 mb-3 border-bottom pb-2">Recipient Details</h5>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="to_name">Name</Label>
                                <Input
                                    type="text"
                                    id="to_name"
                                    name="to_name"
                                    value={formData.to_name}
                                    onChange={handleChange}
                                    invalid={!!errors.to_name}
                                />
                                {errors.to_name && <div className="text-danger">{errors.to_name}</div>}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="to_gst_no">GST Number</Label>
                                <Input
                                    type="text"
                                    id="to_gst_no"
                                    name="to_gst_no"
                                    value={formData.to_gst_no}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Label for="to_address">Address</Label>
                        <Input
                            type="textarea"
                            id="to_address"
                            name="to_address"
                            value={formData.to_address}
                            onChange={handleChange}
                            rows={2}
                            invalid={!!errors.to_address}
                        />
                        {errors.to_address && <div className="text-danger">{errors.to_address}</div>}
                    </FormGroup>
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="to_pan_no">PAN Number</Label>
                                <Input
                                    type="text"
                                    id="to_pan_no"
                                    name="to_pan_no"
                                    value={formData.to_pan_no}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        {/*  */}
                        <Col md={4}>
                            <FormGroup>
                                <Label for="to_pincode">Pincode</Label>
                                <Input
                                    type="text"
                                    id="to_pincode"
                                    name="to_pincode"
                                    value={formData.to_pincode}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="to_state">State</Label>
                                <Input
                                    type="text"
                                    id="to_state"
                                    name="to_state"
                                    value={formData.to_state}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="to_city">City</Label>
                                <Input
                                    type="text"
                                    id="to_city"
                                    name="to_city"
                                    value={formData.to_city}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>


                        <Col md={4}>
                            <FormGroup>
                                <Label for="to_state_code">State Code</Label>
                                <Input
                                    type="text"
                                    id="to_state_code"
                                    name="to_state_code"
                                    value={formData.to_state_code}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                        <h5 className="mb-0">Invoice Items</h5>
                        {
                            UserType !== "franchise" && <div>
                                <Button color="primary" size="sm" onClick={addNewItem} className="me-2">
                                    + Add Item
                                </Button>
                            </div>
                        }

                    </div>

                    {formData.items.length > 0 ? (
                        renderItemsTable(UserType)
                    ) : (
                        <Alert color="info" className="text-center">No items added yet</Alert>
                    )}

                    <div className="mt-4 p-3 bg-light rounded">
                        <Row>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Total Quantity</Label>
                                    <Input
                                        type="number"
                                        value={formData.total_quantity}
                                        name='total_quantity'
                                        step="0.01"
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Total Freight</Label>
                                    <Input
                                        type="number"
                                        value={formData.total_freight}
                                        step="0.01"
                                        name='total_freight'
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Total CGST</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.total_cgst}
                                        name='total_cgst'
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Total SGST</Label>
                                    <Input
                                        type="number"
                                        value={formData.total_sgst}
                                        step="0.01"
                                        name='total_sgst'
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Total IGST</Label>
                                    <Input
                                        type="number"
                                        value={formData.total_igst}
                                        step="0.01"
                                        name='total_igst'
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="amount_in_words">Amount in Words</Label>
                                    <Input
                                        type="text"
                                        id="amount_in_words"
                                        name="amount_in_words"
                                        readOnly
                                        disabled={true}
                                        value={(() => {
                                            const result = amountToWords(formData?.total_amount || 0, 2);

                                            let words = result.numberInWords
                                                ? `${result.numberInWords} RUPEES`
                                                : "";

                                            if (result.decimalInWords && result.decimalInWords !== "Zero Zero") {
                                                words += ` AND ${result.decimalInWords} PAISE`;
                                            }

                                            return words.toUpperCase();
                                        })()}
                                    // onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Total Amount</Label>
                                    <Input
                                        type="number"
                                        name='total_amount'
                                        value={formData?.total_amount}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="fw-bold"
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" className='d-flex justify-content-center align-items-center' type="submit">
                        {
                            loading ? <Spinner size="sm">
                                Loading...
                            </Spinner> : "Update Invoice"
                        }
                    </Button>
                    <Button color="secondary" onClick={toggle}>Cancel</Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
};

export default InvoiceEditModal;