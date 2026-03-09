import { Button, Col, FormFeedback, FormGroup, Input, Label, Row, Spinner, Table } from "reactstrap"
import { useEffect, useMemo, useState } from "react";
import { MdDelete } from "react-icons/md";
import { CiEdit } from "react-icons/ci";
import SearchableDropdown from "../../../components/Common/SearchableDropdown";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { GENERATE_MANUAL_INVOICE, MANUAL_BILLING_INVOIVCE_ADDRESS } from "../../../api";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import TableContainer from "../../../components/Table/TableContainer";
import { usePDF } from 'react-to-pdf';
import Loader from "../../../Loaders/Loader";
import InvoicePdfGenerater from "../../../PdfComponents/InvoicePdfGenerater";
import ToasterProvider from "../../../helpers/ToasterProvider";

const ManualInvoice = () => {
    const { toPDF, targetRef } = usePDF({
        filename: `Manual_invoice.pdf`,
        page: {
            margin: 10,
            timeout: 30000,
        },
    });
    // pdf data
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const [PdfData, setPdfData] = useState(null)

    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            await toPDF();
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // defining the generate innvoice api
    const { apifunc: GenerateInvoice, data: GenerateInvoiceData, loading: GenerateInvoiceLoading } = usePostApiCall(null,)


    //  defining the api to get the address for invoice
    const { apifunc: GetInvoicesAddresses, data: InvoiceAddresses, loading: InvoiceAddressLoading } = useGetApiCall()
    // errors
    const [Errors, setErrors] = useState({})
    // manual invoice Errors
    const [InvoiceErors, setInvoiceErrors] = useState({})
    // company Address
    const [SelectedAddress, setSelectedAddress] = useState(null)
    //  select company address dropdown
    const [CompanyAddresses, setCompanyAddresses] = useState([])
    // manual invoice Info
    const [ManualInvoiceData, setManualInvoceData] = useState({
        to_name: "",
        to_address: "",
        to_city: "",
        to_state: "",
        to_pincode: "",
        // company_address: "",
        gst_no: "",
        pan_no: "",
        invoice_date: new Date().toISOString().split('T')[0],
        retail_invoice: false
    })
    // on invoice Change
    const onManualInvoiceChange = (e) => {
        const { name, value, type, checked } = e.target
        setManualInvoceData({
            ...ManualInvoiceData,
            [name]: type === "checkbox" ? checked : value
        })
    }
    const [Info, SetInfo] = useState({
        Description: "",
        Quantity: 0,
        Amount: 0
    })

    // info table, which stores the description and Qty and Amount
    const [Infotable, setInfoTable] = useState([])
    const OnInputChange = (e) => {
        const { value, name } = e.target
        SetInfo({
            ...Info,
            [name]: value
        })
    }

    //  on Add Info
    const OnAddInfoTable = () => {
        let newerrors = {}
        Object.entries(Info).forEach(([key, value]) => {
            if (value === "" || value === 0) {
                newerrors[key] = `${key} is required`
            }
        })

        setErrors(newerrors)
        console.log(newerrors, "errors")

        // ✅ Check if no errors
        if (Object.keys(newerrors).length === 0) {
            setInfoTable([...Infotable, {
                id: Infotable.length + 1,
                ...Info
            }])

            // Clear states
            SetInfo({
                Description: "",
                Quantity: 0,
                Amount: 0
            })
            setErrors({})
        }
    }

    // delete item
    const DeleteItem = (id) => {
        setInfoTable((prev) => {
            return prev.filter(ele => ele?.id !== id)
        })
    }

    // Select company address
    const handleLocationChange = (value) => {
        setSelectedAddress(value);

    }

    // on Click on generate Invoiece function calling the genarate manual invoice api
    const OnGenerateInvoiceClick = async () => {
        let invoiceErrors = {}
        console.log(ManualInvoiceData, "ManualInvoiceData")
        let optionalFields = ["retail_invoice", "gst_no", "pan_no"]
        console.log(ManualInvoiceData, "ManualInvoiceData")
        Object.entries(ManualInvoiceData).forEach(([key, value]) => {
            // ✅ Skip validation if the field is optional
            if (optionalFields.includes(key)) return;

            if (value === "") {
                invoiceErrors[key] = `${key} is required`;
            }
        });

        if (SelectedAddress?.name === "" || SelectedAddress === null) {
            invoiceErrors.SelectedAddress = "Company address is required"
        }
        setInvoiceErrors(invoiceErrors)

        // generating the payload
        let UserId = JSON.parse(localStorage.getItem("authUser"))?.user?.id
        const Payload = {
            "created_by_id": UserId,
            "invoice_data": {
                ...ManualInvoiceData,
                invoice_date: new Date(ManualInvoiceData.invoice_date).toLocaleDateString('en-GB').split('/').join('-'),
                company_address: SelectedAddress?.id
            },
            "row_data": Infotable.map((ele) => {
                return {
                    amount: ele?.Amount,
                    description: ele?.Description,
                    quantity: ele?.Quantity
                }
            })
        }
        if (Object.entries(invoiceErrors).length === 0) {
            //  api call
            let GeneratedInvoice = await GenerateInvoice(GENERATE_MANUAL_INVOICE, Payload)
            if (GeneratedInvoice?.context?.pdf_invoice) {

                setPdfData(GeneratedInvoice?.context?.pdf_invoice)
                const pdfInvoice = GeneratedInvoice?.context?.pdf_invoice;
                console.log(GeneratedInvoice, "pdfInvoice")
                if (!pdfInvoice?.to_name || !pdfInvoice?.total_amount) {
                    ErrorToaster("Error while generating PDF");
                    return;
                }
                SucceesToaster("Invoice Generated Successfully")
                //   reset the form
                //   and clearing all the filed
                setManualInvoceData({
                    to_name: "",
                    to_address: "",
                    to_city: "",
                    to_state: "",
                    to_pincode: "",
                    // company_address: "",
                    gst_no: "",
                    pan_no: "",
                    invoice_date: new Date().toISOString().split('T')[0],
                    retail_invoice: false
                })
                setSelectedAddress(null);
                setInfoTable([])
                SetInfo({
                    Description: "",
                    Quantity: 0,
                    Amount: 0
                })
                setSelectedAddress(null)

                //  calling the generate pdf function after 1 second
                setTimeout(() => {
                    handleDownload()
                }, 1000);

                setTimeout(() => {
                    window.location.reload(); // Reloads the page from cache
                }, 5000)
            }
            else {
                ErrorToaster("PdfData Not Available")
            }
        }
        else {
            alert("check all filed")
        }

    }

    // all useEffects
    useEffect(() => {
        // calling the company addresses api
        GetInvoicesAddresses(MANUAL_BILLING_INVOIVCE_ADDRESS)
    }, [])

    useEffect(() => {
        if (InvoiceAddresses) {
            let addresses = InvoiceAddresses?.context?.company_address?.map((ele) => {
                return {
                    name: ele?.state,
                    id: ele?.id
                }
            })
            setCompanyAddresses(addresses)
        }

    }, [InvoiceAddresses])
    return <>
        <div className='page-content'>
            <div className="container-fluid border-bottom">
                <h1>Generate Manual Bills</h1>
            </div>

            <div className="mt-2">
                {/*  new design */}
                <Row>
                    {/* row 1 */}
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="name">Name :</Label>
                                <Input id="name" name="to_name" type="text" invalid={!!InvoiceErors?.to_name} value={ManualInvoiceData?.to_name} onChange={onManualInvoiceChange} />
                                <FormFeedback>{InvoiceErors?.to_name}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="gst_no">Customer GST No.:</Label>
                                <Input id="gst_no" type="text" name="gst_no" placeholder="GST No." value={ManualInvoiceData?.gst_no} invalid={!!InvoiceErors?.gst_no} onChange={onManualInvoiceChange} />
                                <FormFeedback>{InvoiceErors?.gst_no}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="pan_no">Customer PAN No.:</Label>
                                <Input id="pan_no" type="text" name="pan_no" placeholder="PAN No." value={ManualInvoiceData?.pan_no} invalid={!!InvoiceErors?.pan_no} onChange={onManualInvoiceChange} />
                                <FormFeedback>{InvoiceErors?.pan_no}</FormFeedback>
                            </FormGroup>
                        </Col>
                    </Row>
                    {/* row 2 */}
                    <Row>
                        <Col md={4}>
                            {/* sub row 1 */}
                            <Row>
                                <Col md={12}>
                                    <FormGroup>
                                        <Label for="address">Address:</Label>
                                        <Input id="address" name="to_address" type="textarea" style={{ height: "110px" }} value={ManualInvoiceData?.to_address} invalid={!!InvoiceErors?.to_address} onChange={onManualInvoiceChange} />
                                        <FormFeedback>{InvoiceErors?.to_address}</FormFeedback>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Col>
                        <Col md={8}>
                            {/* sub 2 */}
                            <Row>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label for="city">City:</Label>
                                        <Input id="city" name="to_city" type="text" value={ManualInvoiceData?.to_city} invalid={!!InvoiceErors?.to_city} onChange={onManualInvoiceChange} />
                                        <FormFeedback>{InvoiceErors?.to_city}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label for="state">State:</Label>
                                        <Input id="state" name="to_state" type="text" value={ManualInvoiceData?.to_state} invalid={!!InvoiceErors?.to_state} onChange={onManualInvoiceChange} />
                                        <FormFeedback>{InvoiceErors?.to_state}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label for="company_address">Select Company Address:</Label>
                                        <SearchableDropdown
                                            className="w-100"
                                            onChange={handleLocationChange}
                                            locations={CompanyAddresses}
                                            value={SelectedAddress}
                                        />
                                        <small className="text-danger ">{InvoiceErors?.SelectedAddress}</small>
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label for="pincode">Pincode :</Label>
                                        <Input id="name" type="text" name="to_pincode" placeholder="Pincode" value={ManualInvoiceData?.to_pincode} invalid={!!InvoiceErors?.to_pincode} onChange={onManualInvoiceChange} />
                                        <FormFeedback>{InvoiceErors?.to_pincode}</FormFeedback>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Row>
                {/* table to display the Description and Qty and Amount */}
                <Row>
                </Row>

                {/* cards */}
                <Row>
                    <Col md={5} className="mt-0">
                        <Label for="Invoice_date">Invoice Date</Label>
                        <Input type="date" name="invoice_date" value={ManualInvoiceData?.invoice_date} onChange={onManualInvoiceChange} />
                    </Col>
                </Row>
                <Row className="d-flex gap-4 m-auto">
                    <Col md={5} className="">
                        {/* box */}
                        <Row className="border border-2 mt-3 px-2 py-3" >
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Description</Label>
                                    <Input type="textarea" name="Description"
                                        placeholder="Description" onChange={OnInputChange} value={Info.Description}
                                        invalid={!!Errors?.Description} />
                                    <FormFeedback>{Errors?.Description}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Qty</Label>
                                    <Input type="number" name="Quantity"
                                        placeholder="Quantity" onChange={OnInputChange} value={Info.Quantity}
                                        invalid={!!Errors?.Quantity} />
                                    <FormFeedback>{Errors?.Quantity}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Amount</Label>
                                    <Input type="number" name="Amount"
                                        placeholder="Amount" onChange={OnInputChange} value={Info.Amount} invalid={!!Errors?.Amount} />
                                    <FormFeedback>{Errors?.Amount}</FormFeedback>
                                </FormGroup>
                            </Col>

                            <Col md={12}>
                                <Button color="primary" className="mt-2 w-100" onClick={OnAddInfoTable}>Add</Button>
                            </Col>
                        </Row>
                    </Col>
                    <Col
                        md={6}
                        className="border border-2 rounded-2"
                        style={{ marginTop: "16px", height: "340px" }}
                    >
                        <div style={{ maxHeight: "290px", height: "290px", overflowY: "auto" }}>
                            <Table hover>
                                <thead className="bg-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                    <tr>
                                        <th>Description</th>
                                        <th>Quantity</th>
                                        <th>Amount</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {Infotable?.length >= 1 &&
                                        Infotable.map((ele, index) => (
                                            <tr key={index}>
                                                <td>{ele?.Description || "—"}</td>
                                                <td>{ele?.Quantity || "—"}</td>
                                                <td>{ele?.Amount || "—"}</td>
                                                <td>
                                                    <div className="d-flex gap-3">
                                                        <Button
                                                            color="light"
                                                            aria-label="Delete"
                                                            onClick={() => {
                                                                DeleteItem(ele?.id);
                                                            }}
                                                        >
                                                            <MdDelete
                                                                style={{ width: "16px", height: "16px" }}
                                                                className="text-danger"
                                                            />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </Table>
                        </div>

                        {/* bottom section */}
                        <Row className="mt-0">
                            <Col md={6}>
                                <FormGroup className="d-flex align-items-center">
                                    <Input
                                        type="checkbox"
                                        name="retail_invoice"
                                        style={{ width: "20px", height: "20px" }}
                                        placeholder="retail_invoice"
                                        className="d-block me-2 border-danger border-2"
                                        onChange={onManualInvoiceChange}
                                        value={Info.retail_invoice}
                                    />
                                    <span className="text-danger fw-bolder">Is Retail Invoice</span>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <div style={{ width: "300px" }}>
                                    <Button
                                        disabled={Infotable.length < 1}
                                        onClick={OnGenerateInvoiceClick}
                                        className="bg-primary w-75 d-flex justify-content-center align-items-center"
                                    >
                                        {GenerateInvoiceLoading ? (
                                            <Spinner>Loading...</Spinner>
                                        ) : (
                                            "Generate Invoice"
                                        )}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Col>

                </Row>


                {/* <Col md={2}>
                    <FormGroup>
                        <Label>Is Retail Invoice</Label>
                        <Input type="checkbox" name="retail_invoice" style={{ width: "20px", height: "20px" }}
                            placeholder="retail_invoice" className="d-block" onChange={onManualInvoiceChange} value={Info.retail_invoice} />
                        <FormFeedback>{Errors?.retail_invoice}</FormFeedback>
                    </FormGroup>
                </Col> */}




                {/*  showing the downloading message and loader */}
                {
                    isGenerating && <Loader message="Generating the Pdf....." />
                }
                {
                    PdfData && <InvoicePdfGenerater invoiceData={PdfData} ref={targetRef} />
                }

                {/* pdf which is already hidden */}

            </div>
        </div>
    </>
}
export default ManualInvoice