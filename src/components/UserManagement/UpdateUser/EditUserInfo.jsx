// Edit customer, first part. Laid out like the New customer form: three columns, in the same groups
// (Contact details, Customer details, Other details), so both screens read the same.
import { Button, Col, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, Row } from "@/components/ui"
import EmployeeCodePicker from "../../Common/EmployeeCodePicker";
import { MdOutlineCancel } from "react-icons/md";
import { useState } from "react";
import { BILLING_TYPES, INDUSTRIES } from "../../../data/customerOptions";

const SectionTitle = ({ children, first = false }) => (
    <>
        {!first && <div role="separator" className="my-2 h-px w-full bg-[rgb(var(--overlay-rgb)/0.15)]" />}
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{children}</div>
    </>
);

const clean = (v) => (v === "null" || v == null ? "" : v)

const EditUserInfo = ({ formData, handleChange, setUpdatedData, setIsUpdated, onImageCancel }) => {

    const [modal, setModal] = useState(false);
    const toggle = () => setModal(!modal);

    // a value saved before the dropdowns existed stays selectable
    const withCurrent = (list, value) => (value && !list.includes(value) ? [value, ...list] : list)

    // one document field: the file name with a remove (x) and View, or a file chooser
    const docField = (name, label, { preview = false } = {}) => {
        const doc = formData?.[name]
        return (
            <Col md={4}>
                <FormGroup>
                    <Label>{label}</Label>
                    {doc ? (
                        <div className="flex h-9.5 items-center gap-2 text-sm">
                            <span className="min-w-0 truncate" title={typeof doc === "string" ? doc : doc?.name}>
                                {typeof doc === "string" ? doc.split("/").pop() : doc?.name || "No File Found"}
                            </span>
                            <MdOutlineCancel
                                role="button"
                                aria-label={`Remove ${label}`}
                                onClick={() => {
                                    setUpdatedData(prev => ({ ...prev, [name]: null }));
                                    setIsUpdated(true)
                                    if (name === "kyc_document" && onImageCancel) onImageCancel()
                                }}
                                className="shrink-0 cursor-pointer text-brand-500"
                                size={18}
                            />
                            {preview ? (
                                <button type="button" className="border-0 bg-transparent p-0 text-brand-500" onClick={toggle}>View</button>
                            ) : (
                                typeof doc === "string" && <a href={doc} target="_blank" rel="noreferrer" className="text-brand-500">View</a>
                            )}
                        </div>
                    ) : (
                        <Input type="file" name={name} onChange={handleChange} />
                    )}
                </FormGroup>
            </Col>
        )
    }

    return (
        <div className="mb-1">
            <div>
                <SectionTitle first>Contact details</SectionTitle>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>First Name</Label>
                            <Input type="text" name="first_name" value={formData?.first_name} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Last Name</Label>
                            <Input type="text" name="last_name" value={formData?.last_name} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Email</Label>
                            <Input type="email" name="email" value={formData?.email} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Phone</Label>
                            <Input type="text" name="phone" inputMode="numeric" maxLength={10} value={formData?.phone} onChange={(e) => handleChange({ target: { ...e.target, name: "phone", value: e.target.value.replace(/\D/g, "").slice(0, 10) } })} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Account No</Label>
                            <Input type="text" name="accno" value={formData?.accno || ""} readOnly title="Account number cannot be changed" style={{ cursor: "not-allowed" }} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Username</Label>
                            <Input type="text" name="username" value={formData?.username} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>

                <SectionTitle>Customer details</SectionTitle>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Customer Type</Label>
                            <Input type="select" name="cust_type" disabled value={formData?.cust_type?.id} title="Customer type cannot be changed" style={{ cursor: "not-allowed" }}>
                                <option value="">Select Type</option>
                                <option value="2">Corporate</option>
                                <option value="1">Retail</option>
                                <option value="3">Franchise</option>
                            </Input>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Customer Name</Label>
                            <Input type="text" name="customer_name" value={formData?.customer_name || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Type of Industry</Label>
                            <Input type="select" name="industry" value={formData?.industry || ""} onChange={handleChange}>
                                <option value="">Select type of industry</option>
                                {withCurrent(INDUSTRIES, formData?.industry).map((t) => <option key={t} value={t}>{t}</option>)}
                            </Input>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Sales Head (Employee Code)</Label>
                            <EmployeeCodePicker name="sales_head_emp_code" label="sales head" value={formData?.sales_head_emp_code || ''} savedName={formData?.sales_head_name || undefined} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Lead Generated By (Employee Code)</Label>
                            <EmployeeCodePicker name="lead_generated_by_emp_code" label="lead owner" value={formData?.lead_generated_by_emp_code || ''} savedName={formData?.lead_generated_by_name || undefined} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>

                <SectionTitle>Other details</SectionTitle>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Soft Limit</Label>
                            <Input type="number" name="soft_limit" value={formData?.soft_limit || ''} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Customer Potential</Label>
                            <Input type="text" name="customer_potential" value={formData?.customer_potential || ''} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Expected Business</Label>
                            <Input type="number" name="expected_business" value={formData?.expected_business || ''} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Billing Type</Label>
                            <Input type="select" name="billing_type" value={clean(formData?.billing_type)} onChange={handleChange}>
                                <option value="">Select billing type</option>
                                {withCurrent(BILLING_TYPES, clean(formData?.billing_type)).map((t) => <option key={t} value={t}>{t}</option>)}
                            </Input>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>GST No</Label>
                            <Input type="text" name="gst_no" value={clean(formData?.gst_no)} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>PAN No</Label>
                            <Input type="text" name="pan_no" value={clean(formData?.pan_no)} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Finance Emails (comma separated)</Label>
                            <Input type="textarea" rows={2} name="finance_emails" value={formData?.finance_emails || ''} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    {docField("customer_agreement_doc", "Customer Agreement Doc")}
                    {docField("kyc_document", "KYC Document", { preview: true })}
                    <Col md={4}>
                        <FormGroup>
                            <Label>&nbsp;</Label>
                            <Label check className="flex h-9.5 items-center gap-2">
                                <Input type="checkbox" name="kyc_approved" checked={!!formData?.kyc_approved} onChange={handleChange} />
                                KYC Approved
                            </Label>
                        </FormGroup>
                    </Col>
                </Row>

                {/* KYC image preview */}
                {!!formData?.kyc_document && (
                    <Modal isOpen={modal} toggle={toggle} fullscreen="xl" size="lg" centered>
                        <ModalBody className="flex justify-center content-center">
                            {(typeof formData.kyc_document === 'string' || URL.createObjectURL(formData.kyc_document)) ? (
                                <img
                                    className="m-auto"
                                    style={{ width: "700px", height: "400px" }}
                                    alt="Document preview"
                                    src={typeof formData.kyc_document === 'string' ? formData.kyc_document : URL.createObjectURL(formData.kyc_document)}
                                />
                            ) : (
                                <div>File preview not available </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" onClick={toggle}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </Modal>
                )}
            </div>
        </div>
    )
}

export default EditUserInfo
