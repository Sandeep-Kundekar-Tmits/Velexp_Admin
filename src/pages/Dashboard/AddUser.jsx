import { useEffect, useRef, useState } from "react"
import TabProvider from "../../components/Table/TabProvider"
import AddFranchiseeForm from "../../components/UserManagement/AddFranchiseeForm"
import AddUserForm from "../../components/UserManagement/AddUserForm"
import CustomerDocumentsForm, { newRow } from "../../components/UserManagement/CustomerDocumentsForm"
import { scrollToFirstError } from "../../helpers/scrollToError"
import MultipleAddressForm from "../../components/UserManagement/MultipleAddressForm"
import MisConfigFields, { EMPTY_MIS, validateMis } from "../../components/UserManagement/MisConfigFields"
import CustomerServicePicker from "../../components/Common/CustomerServicePicker"
import BillingAddressFields, { EMPTY_BILLING, billingBody, validateBilling } from "../../components/UserManagement/BillingAddressFields"
import usePostFileApicall from "../../hooks/usePostFileApicall"
import { Alert, Button, Col, FormGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "@/components/ui"
import { POST_USER_API, CUSTOMER_DOCUMENTS_UPLOAD } from "../../api"
import Loader from "@/Loaders/Loader";
import { useNavigate } from "react-router-dom"
import usePostApiCall from "../../hooks/usePostApiCall"
import ToasterProvider from "../../helpers/ToasterProvider"


const CODE_FIELDS = ['sales_head_emp_code', 'lead_generated_by_emp_code', 'accno']

// onCreated(id, name): used by the onboarding wizard, which hosts this form as its first step
const AddUser = ({ onCreated } = {}) => {
    useEffect(() => {
        if (!onCreated) document.title = "Add New User";
    }, []);
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const [Errors, setErrors] = useState({})
    const [showError, setShowError] = useState(false)
    // Corporate customers also need a billing address (sent as billing_addresses)
    const [billing, setBilling] = useState(EMPTY_BILLING)
    const [billingErrors, setBillingErrors] = useState({})
    // Corporate also needs a customer service user and the daily MIS settings
    const [customerService, setCustomerService] = useState('')
    const [mis, setMis] = useState(EMPTY_MIS)
    const [misErrors, setMisErrors] = useState({})
    const [fieldErrors, setFieldErrors] = useState({}) // server messages for the employee-code inputs
    const { apifunc: addNewUserWithFile, data: FormUserData, error: FormDataError, loading: FormDataLoading } = usePostFileApicall()
    // const { apifunc: addNewJsonUser, data: JsonUserData, error: JsonDataError, loading: JsonDataLoading } = usePostApiCall()
    const { apifunc: uploadCustomerDocs } = usePostFileApicall()
    const navigate = useNavigate()
    // single-page mode (onboarding wizard): each section validates itself through these
    const userValidate = useRef(null)
    const addressValidate = useRef(null)
    const [documents, setDocuments] = useState(() => [newRow()])
    const [documentRemarks, setDocumentRemarks] = useState("")
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        username: '',
        password: '', // Always keep blank for security
        accno: '',
        // otp: '',
        cust_type: '',
        customer_name: '',
        kyc_document: null,
        kyc_approved: false,
        // wallet_amount: isToUpdate ? editData?.wallet_amount : 0.0,
        billing_type: '',
        gst_no: '',
        pan_no: '',
        city: '',
        pincode: '',
        sales_head_emp_code: '',
        lead_generated_by_emp_code: '',
        industry: '',
        soft_limit: '',
        customer_potential: '',
        expected_business: '',
        finance_emails: '',
        customer_agreement_doc: null
    });

    // state
    const [addresses, setAddresses] = useState({
        address: '',
        city: '',
        state: '',
        country: "India",
        pincode: '',
        landmark: '',
    });

    const [frachiseeData, setFrachiseeData] = useState({
        postpaid_payment: false,
        franchise_name: '',
        contact_person: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: 'India',
        landmark: '',
        pincode: '',
        telephone1: '',
        telephone2: '',
        alt_mobile: '',
        customer_billing_state: '',
        branch: '',
        start_date: '',
        status: 'false',
        origin: '',
        origin_code: '',
        gst_no: formData?.gst_no || '',
        pan_no: '',
        tan_no: '',
        // billing_type: '',
        credit_days: null,
        credit_percent: null,
        unbilled_amount: null,
        volume_discount: null,
        contact_origin: '',
        iec_no: '',
        bank_ad_code: '',
        bank_account: '',
        bank_ifsc: '',
        lut_no: '',
        lut_issue_date: null,
        lut_till_date: null,
        shipper_type: '',
        customer_msg: '',
        account_email: '',
        geolocation: '',
        disable_customer_origin: false,
        email_booking_info: false,
        sms_booking_info: false,
        email_forwarding_info: false,
        email_on_progress: false,
        email_pod_info: false,
        sms_pod_info: false,
        e_invoice: false,
        whatsapp_booking_info: false,
        whatsapp_delivery_info: false,
        velexp_address: '',
    });

    // reset the form
    const formRest = () => {
        setDocuments([newRow()])
        setDocumentRemarks("")
        setBilling(EMPTY_BILLING)
        setBillingErrors({})
        setCustomerService('')
        setMis(EMPTY_MIS)
        setMisErrors({})
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            username: '',
            password: '', // Always keep blank for security
            accno: '',
            // otp: '',
            cust_type: '',
            customer_name: '',
            kyc_document: null,
            kyc_approved: false,
            // wallet_amount: isToUpdate ? editData?.wallet_amount : 0.0,
            billing_type: '',
            gst_no: '',
            pan_no: '',
            city: '',
            pincode: '',
            sales_head_emp_code: '',
            lead_generated_by_emp_code: '',
            industry: '',
            soft_limit: '',
            customer_potential: '',
            expected_business: '',
            finance_emails: '',
            customer_agreement_doc: null
        })

        setAddresses({
            address: '',
            city: '',
            state: '',
            country: "India",
            pincode: '',
            landmark: '',
        })

        setFrachiseeData({
            postpaid_payment: false,
            franchise_name: '',
            contact_person: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            country: 'India',
            landmark: '',
            pincode: '',
            telephone1: '',
            telephone2: '',
            alt_mobile: '',
            customer_billing_state: '',
            branch: '',
            start_date: '',
            status: 'Active',
            origin: '',
            origin_code: '',
            gst_no: '',
            pan_no: '',
            tan_no: '',
            // billing_type: '',
            credit_days: null,
            credit_percent: null,
            unbilled_amount: null,
            volume_discount: null,
            contact_origin: '',
            iec_no: '',
            bank_ad_code: '',
            bank_account: '',
            bank_ifsc: '',
            lut_no: '',
            lut_issue_date: null,
            lut_till_date: null,
            shipper_type: '',
            customer_msg: '',
            account_email: '',
            geolocation: '',
            disable_customer_origin: false,
            email_booking_info: false,
            sms_booking_info: false,
            email_forwarding_info: false,
            email_on_progress: false,
            email_pod_info: false,
            sms_pod_info: false,
            e_invoice: false,
            whatsapp_booking_info: false,
            whatsapp_delivery_info: false,
            velexp_address: '',
        })
    }

    const [activeTab, setActiveTab] = useState(1);

    // tab toggle
    const toggle = (tabId) => {
        if (activeTab !== tabId) {
            setActiveTab(tabId);
        }
    };


    const PostData = (data) => {
        const formDataToSend = new FormData();

        // Append all fields
        formDataToSend.append('first_name', data.first_name);
        formDataToSend.append('last_name', data.last_name);
        formDataToSend.append('email', data.email);
        formDataToSend.append('username', data.username);
        formDataToSend.append('password', data.password);
        // formDataToSend.append('otp', data.otp);
        // Corporate accounts get their account number (VELO + timestamp) and secret code from the backend; don't send one
        formDataToSend.append('accno', String(data.accno || '').trim());
        formDataToSend.append('phone', data.phone);
        formDataToSend.append('cust_type', data.cust_type);
        formDataToSend.append('customer_name', data.customer_name);
        formDataToSend.append('kyc_approved', data.kyc_approved);
        formDataToSend.append('billing_type', data.billing_type);
        formDataToSend.append('gst_no', data.gst_no);
        formDataToSend.append('pan_no', data.pan_no);
        formDataToSend.append('city', data.city || data.addresses?.city || '');
        formDataToSend.append('pincode', data.pincode || data.addresses?.pincode || '');
        formDataToSend.append('payment_mode', "COD");
        // Employee codes only: the backend fills the names in from the employee master
        formDataToSend.append('sales_head_emp_code', (data.sales_head_emp_code || '').trim());
        formDataToSend.append('lead_generated_by_emp_code', (data.lead_generated_by_emp_code || '').trim());
        formDataToSend.append('industry', data.industry);


        // Append file
        if (data.kyc_document) {
            formDataToSend.append('kyc_document', data.kyc_document);
        }

        if (data.customer_agreement_doc) {
            formDataToSend.append('customer_agreement_doc', data.customer_agreement_doc);
        }

        // New fields
        formDataToSend.append('soft_limit', data.soft_limit || 0);
        formDataToSend.append('customer_potential', data.customer_potential || '');
        formDataToSend.append('expected_business', data.expected_business || 0);

        // Handle finance_emails (JSONField in backend, expect array/list)
        if (data.finance_emails) {
            const emailArray = data.finance_emails.split(',').map(email => email.trim());
            formDataToSend.append('finance_emails', JSON.stringify(emailArray));
        }

        // Append nested JSON as strings
        if (data?.addresses) {
            formDataToSend.append('addresses', JSON.stringify(data.addresses));
        }
        if (data?.customer_service_user) formDataToSend.append('customer_service_user', String(data.customer_service_user))
        if (data?.mis_config) formDataToSend.append('mis_config', JSON.stringify(data.mis_config))
        if (data?.billing_addresses) {
            formDataToSend.append('billing_addresses', JSON.stringify(data.billing_addresses))
        }
        if (data?.franchise_profile) {
            formDataToSend.append('franchise_profile', JSON.stringify(data.franchise_profile));
        }
        formDataToSend.append("user_id", JSON.parse(localStorage.getItem("authUser"))?.user?.id)

        return {
            isFormData: true,
            body: formDataToSend,
        };


    };



    // Queued documents go up once the customer exists; the upload API needs its id.
    const uploadQueuedDocuments = async (created) => {
        const queued = documents.filter((d) => d.file)
        if (!queued.length) return
        if (queued.some((d) => !d.type.trim())) {
            ErrorToaster("User added, but documents were not uploaded: every file needs a document type")
            return
        }
        const customerId = created?.id ?? created?.customer_id ?? created?.customer?.id ?? created?.user?.id ?? created?.data?.id
        if (!customerId) {
            ErrorToaster("User added, but documents were not uploaded: customer id missing in the response")
            return
        }
        const body = new FormData()
        body.append("customer_id", customerId)
        queued.forEach((d) => {
            body.append("files", d.file)
            body.append("document_types", d.type.trim())
        })
        if (documentRemarks.trim()) body.append("remarks", documentRemarks.trim())
        const res = await uploadCustomerDocs(CUSTOMER_DOCUMENTS_UPLOAD, body)
        if (res?.status) SucceesToaster(`${queued.length} document(s) uploaded`)
        else ErrorToaster("User added, but document upload failed")
    }

    // Backend 400s name fields: the two employee-code messages go under their own inputs on the first tab,
    // anything else stays in the error popup.
    const handleCreateError = (data) => {
        const all = data && typeof data === 'object' ? data : {}
        const own = {}
        const rest = {}
        Object.entries(all).forEach(([k, v]) => {
            if (k === 'customer_service_user') {
                own.customer_service_user = Array.isArray(v) ? v.join(' ') : String(v)
                return
            }
            if (k === 'mis_config') {
                setMisErrors(v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([f, m]) => [f, Array.isArray(m) ? m.join(' ') : String(m)])) : { emails: String(v) })
                return
            }
            if (k === 'billing_addresses') {
                const first = Array.isArray(v) ? (v.find((x) => x && typeof x === 'object' && Object.keys(x).length) || {}) : { _: String(v) }
                setBillingErrors(Object.fromEntries(Object.entries(first).map(([f, m]) => [f, Array.isArray(m) ? m.join(' ') : String(m)])))
                return
            }
            if (CODE_FIELDS.includes(k)) own[k] = Array.isArray(v) ? v.join(' ') : String(v)
            else rest[k] = v
        })
        setFieldErrors(own)
        if (Object.keys(own).length) setActiveTab(1)
        setErrors(rest)
        setShowError(Object.keys(rest).length > 0)
        scrollToFirstError()
        ErrorToaster(Object.keys(own).length && !Object.keys(rest).length
            ? "Fix the employee codes and submit again"
            : "User Failed To Add Check All Credentials")
    }

    //  api call
    const SumitAddUserForm = async () => {
        if (formData.cust_type !== "3") {
            const data = { ...formData, addresses: addresses, ...(formData.cust_type === "2" ? { billing_addresses: [{ ...billingBody(billing), is_default: true }], customer_service_user: customerService, mis_config: { emails: mis.emails, schedule_time: mis.schedule_time } } : {}) }
            let formatedData = PostData(data)

            if (formatedData.isFormData) {
                let isSucces = await addNewUserWithFile(POST_USER_API, formatedData.body)
                if (isSucces.status) {
                    SucceesToaster("User Added Successfully")
                    await uploadQueuedDocuments(isSucces.data)
                    // a new Corporate customer is created inactive: carry on with its onboarding wizard
                    const d = isSucces.data
                    const createdId = d?.id ?? d?.customer_id ?? d?.customer?.id ?? d?.user?.id ?? d?.data?.id
                    const customerName = formData.customer_name
                    const isCorporate = formData.cust_type === "2"
                    formRest()
                    setActiveTab(1)
                    if (isCorporate && createdId) {
                        if (onCreated) onCreated(createdId, customerName)
                        else navigate(`/customer-onboarding/${createdId}?name=${encodeURIComponent(customerName || "")}`)
                    }
                }
                else {
                    handleCreateError(isSucces.data)
                }
            }

        } else {
            let data = { ...formData, addresses: addresses, franchise_profile: frachiseeData }
            let formatedData = PostData(data)
            if (formatedData.isFormData) {
                let isSucces = await addNewUserWithFile(POST_USER_API, formatedData.body)
                console.log(isSucces, "isSucces")
                if (isSucces.status) {

                    SucceesToaster("User Added Successfully")
                    await uploadQueuedDocuments(isSucces.data)
                    formRest()
                    setActiveTab(1)
                }
                else {
                    handleCreateError(isSucces.data)
                }
            }
        }
    }
    const baseTabs = [
        {
            id: 1,
            title: 'Add New User',
            content: <AddUserForm
                formData={formData}
                setFormData={setFormData}
                setFrachiseeData={setFrachiseeData}
                setAddresses={setAddresses}
                serverErrors={fieldErrors}
                clearServerError={(k) => setFieldErrors((prev) => ({ ...prev, [k]: undefined }))}
                onNextButtonClick={(id) => toggle(id)} />
        },
        {
            id: 2,
            title: 'Add Addresses',
            content: <MultipleAddressForm
                addresses={addresses}
                setAddresses={setAddresses}
                cust_type={formData.cust_type}
                onNextButtonClick={(id) => toggle(id)}
                onPreButtonClick={(id) => toggle(id)}
                SubmiteForm={SumitAddUserForm}
            />
        },

    ]

    const franchiseTab = {
        id: 3,
        title: 'Add Franchisee',
        content: <AddFranchiseeForm
            formData={frachiseeData}
            setFormData={setFrachiseeData}
            onPreButtonClick={(id) => toggle(id)}
            SubmitForm={SumitAddUserForm}
        />
    };





    const documentsTab = {
        id: 4,
        title: 'Customer Documents',
        content: <CustomerDocumentsForm
            documents={documents}
            setDocuments={setDocuments}
            remarks={documentRemarks}
            setRemarks={setDocumentRemarks}
        />
    };

    // Combine tabs based on condition
    // inside the onboarding wizard (onCreated) documents are their own step, so this tab is left out there
    const docTabs = onCreated ? [] : [documentsTab];
    const tabs = formData.cust_type === "3"
        ? [...baseTabs, franchiseTab, ...docTabs]
        : [...baseTabs, ...docTabs];



    // Both sections are checked on every Submit so every error shows at once.
    const validateAll = () => {
        const userOk = userValidate.current ? userValidate.current() : true
        const addressOk = addressValidate.current ? addressValidate.current() : true
        let billingOk = true
        if (formData.cust_type === "2") {
            const e = validateBilling(billing)
            setBillingErrors(e)
            const m = validateMis(mis)
            setMisErrors(m)
            if (!customerService) setFieldErrors((prev) => ({ ...prev, customer_service_user: 'Customer service user is required.' }))
            billingOk = Object.keys(e).length === 0 && Object.keys(m).length === 0 && !!customerService
        }
        const all = userOk && addressOk && billingOk
        if (!all) scrollToFirstError()
        return all
    }
    const submitSinglePage = () => { if (validateAll()) SumitAddUserForm() }

    const isFranchise = formData.cust_type === "3"
    const singlePage = (
        <div>
            <AddUserForm
                embedded
                validateRef={userValidate}
                formData={formData}
                setFormData={setFormData}
                setFrachiseeData={setFrachiseeData}
                setAddresses={setAddresses}
                serverErrors={fieldErrors}
                clearServerError={(k) => setFieldErrors((prev) => ({ ...prev, [k]: undefined }))}
                onNextButtonClick={() => {}} />
            <MultipleAddressForm
                embedded
                validateRef={addressValidate}
                addresses={addresses}
                setAddresses={setAddresses}
                cust_type={formData.cust_type} />
            {formData.cust_type === "2" && (
                <div>
                    <div role="separator" className="my-3 h-px w-full bg-[rgb(var(--overlay-rgb)/0.15)]" />
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Billing address</div>
                        <Button size="sm" color="secondary" onClick={() => setBilling((b) => ({ ...b, address: addresses.address || "", city: addresses.city || "", state: addresses.state || "", pincode: addresses.pincode || "", gst_no: formData.gst_no || b.gst_no, legal_name: formData.customer_name || b.legal_name }))}>Same as account address</Button>
                    </div>
                    {billingErrors._ && <p className="text-sm text-danger-500">{billingErrors._}</p>}
                    <BillingAddressFields value={billing} onChange={(p) => { setBilling((b) => ({ ...b, ...p })); setBillingErrors({}) }} errors={billingErrors} />

                    <div role="separator" className="my-3 h-px w-full bg-[rgb(var(--overlay-rgb)/0.15)]" />
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Customer service</div>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Customer service user<span className="text-danger-500"> *</span></Label>
                                <CustomerServicePicker
                                    value={customerService}
                                    invalid={!!fieldErrors.customer_service_user}
                                    onChange={(id) => { setCustomerService(id); setFieldErrors((prev) => ({ ...prev, customer_service_user: undefined })) }}
                                />
                                {fieldErrors.customer_service_user && <div className="mt-1 text-xs text-danger-500">{fieldErrors.customer_service_user}</div>}
                            </FormGroup>
                        </Col>
                    </Row>

                    <div role="separator" className="my-3 h-px w-full bg-[rgb(var(--overlay-rgb)/0.15)]" />
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Daily MIS</div>
                    <MisConfigFields value={mis} onChange={(p) => { setMis((m) => ({ ...m, ...p })); setMisErrors({}) }} errors={misErrors} />
                </div>
            )}
            {isFranchise ? (
                <AddFranchiseeForm
                    hidePrev
                    formData={frachiseeData}
                    setFormData={setFrachiseeData}
                    SubmitForm={submitSinglePage} />
            ) : (
                <div className="mt-4 flex justify-end">
                    <Button color="primary" className="px-6 py-2" onClick={submitSinglePage}>Submit</Button>
                </div>
            )}
        </div>
    )

    return (
        <>
            {onCreated ? singlePage : <TabProvider tabs={tabs} toggle={toggle} activeTab={activeTab} />}
            <Modal isOpen={FormDataLoading} >
                <ModalBody>
                    {/* compact, so it sizes to the modal instead of stretching
                        to the bottom of the window. */}
                    <Loader message="Loading..." fullscreen={false} compact />
                </ModalBody>
            </Modal>
            {
                Object.keys(Errors).length >= 1 &&
                <Modal isOpen={showError}>
                    <ModalBody>
                        <div className="error-messages">
                            {Object.entries(Errors).map(([field, messages]) => (
                                <div key={field}>
                                    {Array.isArray(messages) ? (
                                        messages.map((message, index) => (
                                            <Alert color="danger" key={`${field}-${index}`}>
                                                {message}
                                            </Alert>
                                        ))
                                    ) : (
                                        <Alert color="danger">{messages}</Alert>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={() => setErrors(false)}>Cancel</Button>
                    </ModalFooter>
                </Modal>

            }
        </>

    )
}
export default AddUser