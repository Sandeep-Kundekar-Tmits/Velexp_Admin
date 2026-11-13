import React, { useMemo, useState } from 'react';
import {
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Col,
    Row,
    FormFeedback,
    Spinner,
    Alert,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@/components/ui";
import EmployeeCodePicker from '../Common/EmployeeCodePicker';
import { customStyles } from '../../helpers/CustomStyle';
import locations from "../../data/locations.json"
import Select from "react-select";
import { VERIFY_GSTIN } from '../../api/index';
import { authFetch } from "@/lib/http";
// small section heading and required / optional label markers shared by the fields below
const SectionTitle = ({ children }) => (
    <>
        <div role="separator" className="my-3 h-px w-full bg-[rgb(var(--overlay-rgb)/0.15)]" />
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{children}</div>
    </>
);
const REQ = <span className="text-danger-500"> *</span>;

// Turn a GSTIN verification result into the form's address values. The GST data has no usable city (it is often
// blank), so the city is matched from city / district / location against the app's own city list for that state.
const locationFromGst = (data) => {
    const d = data?.address_details || {};
    const up = (v) => String(v || '').trim().toUpperCase();
    const stateRow = locations.find((s) => up(s.state) === up(d.state_name));
    let city = '';
    if (stateRow) {
        for (const cand of [d.city, d.district, d.location].map(up).filter(Boolean)) {
            const exact = stateRow.cities.find((c) => up(c.name) === cand);
            // "MUMBAI SUBURBAN" -> MUMBAI: the longest listed city whose name is inside the text
            const inside = [...stateRow.cities].filter((c) => cand.includes(up(c.name))).sort((a, b) => b.name.length - a.name.length)[0];
            const hit = exact || inside;
            if (hit) { city = hit.name; break; }
        }
    }
    // the address box only accepts letters, numbers, spaces and , . - / ' and holds 200 characters
    const address = String(data?.address || '').replace(/[^a-zA-Z0-9\s,.\-/']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    const pincode = /^\d{6}$/.test(String(d.pincode || '').trim()) ? String(d.pincode).trim() : '';
    return { address, state: stateRow?.state || '', city, pincode };
};

const AddUserForm = ({ formData, setFormData, onNextButtonClick, setFrachiseeData, setAddresses, serverErrors = {}, clearServerError, embedded = false, validateRef }) => {


    // const [formData, setFormData] = useState({
    //     first_name: '',
    //     last_name: '',
    //     email: '',
    //     phone: '',
    //     username: '',
    //     password: '', // Always keep blank for security
    //     accno: '',
    //     otp: '',
    //     cust_type: '',
    //     customer_name: '',
    //     kyc_document: null,
    //     kyc_approved: false,
    //     // wallet_amount: isToUpdate ? editData?.wallet_amount : 0.0,
    //     billing_type: '',
    //     gst_no: '',
    //     pan_no: ''
    // });

    // const AllCities = locations
    //     .flatMap(state => state.cities) // Combine all cities from all states into one array
    //     .map(obj => ({
    //         value: obj.name,
    //         label: obj.name
    //     }));

    const [CustomerCharCount, setCustomerCharCount] = useState(0)
    function isNumber(input) {
        return /^-?\d*\.?\d*$/.test(input); // Allows empty string
    }

    const [selectedCity, setSelectedCity] = useState("")
    const AllCities = useMemo(() => {
        return locations
            .flatMap(state => state.cities) // Combine all cities from all states into one array
            .map(obj => ({
                value: obj.name,
                label: obj.name
            }));
    }, [])


    // const GetAllPinCodes = useMemo(() => {
    //     if (!selectedCity) return []; // ✅ Return empty array if city is not selected

    //     return locations
    //         .flatMap(state => state.cities)
    //         .filter(city => city.name === selectedCity)
    //         .map(city => ({
    //             value: city.pincode,
    //             label: city.pincode,
    //         }));
    // }, [selectedCity]);
    const [errors, setErrors] = useState({});

    // GST verification states
    const [gstVerifying, setGstVerifying] = useState(false);
    const [gstVerified, setGstVerified] = useState(false);
    const [gstVerifyData, setGstVerifyData] = useState(null);
    const [gstVerifyError, setGstVerifyError] = useState('');
    const [gstAlreadyExistsModal, setGstAlreadyExistsModal] = useState(false);
    const [gstAlreadyExistsMsg, setGstAlreadyExistsMsg] = useState('');

    const handleVerifyGST = async () => {
        const gstin = formData.gst_no?.trim();
        if (!gstin) {
            setGstVerifyError('Please enter a GST number to verify.');
            return;
        }
        setGstVerifying(true);
        setGstVerifyError('');
        setGstVerifyData(null);
        setGstVerified(false);
        try {
            const res = await authFetch(`${VERIFY_GSTIN}?gstin=${encodeURIComponent(gstin)}`);
            const json = await res.json();

            const data = json.data || null;
            // A GSTIN already in the verification logs comes back with its details (already_exists: true plus data):
            // use those, as for a fresh verification. Without details, it is the old "already exists" notice.
            const hasDetails = !!(data && (data.legal_name || data.trade_name));

            // Case 1: GST already exists in the system and there is nothing to fill in
            if (json.already_exists && !hasDetails) {
                setGstAlreadyExistsMsg(
                    json.message || `GST number "${gstin}" already exists in the system.`
                );
                setGstAlreadyExistsModal(true);
                setGstVerifying(false);
                return;
            }

            // Case 2: details found (verified now, or found in the logs) and Active: fill the form
            if ((json.success || json.already_exists) && hasDetails && (!data.status || data.status === 'Active')) {
                const name = data.legal_name || data.trade_name || '';
                // chars 3-12 of a GSTIN are the PAN
                const panFromGst = /^\d{2}[A-Z]{5}\d{4}[A-Z]/i.test(gstin) ? gstin.slice(2, 12).toUpperCase() : '';
                setGstVerified(true);
                setGstVerifyData(data);
                const loc = locationFromGst(data);
                setFormData((prev) => ({
                    ...prev,
                    customer_name: name || prev.customer_name,
                    pan_no: prev.pan_no || panFromGst,
                    // the user form's own city / pincode (the tabbed Add User page); the wizard fills them via the address
                    city: loc.city || prev.city,
                    pincode: loc.pincode || prev.pincode,
                }));
                setCustomerCharCount(name.trim().length);
                // registered address -> the Address section
                setAddresses?.((prev) => ({
                    ...prev,
                    address: loc.address || prev.address,
                    state: loc.state || prev.state,
                    city: loc.city || prev.city,
                    pincode: loc.pincode || prev.pincode,
                }));
            } else if ((json.success || json.already_exists) && hasDetails) {
                setGstVerifyError(
                    `GST is not active. Current status: "${data?.status || 'Unknown'}". Please use an active GST number.`
                );
            } else {
                setGstVerifyError(json.message || json.error || 'GST verification failed. Please try again.');
            }
        } catch (err) {
            setGstVerifyError('Network error: Unable to verify GST. Please try again.');
        } finally {
            setGstVerifying(false);
        }
    };

    // Called when user clicks "Continue Anyway" in the already-exists modal
    const handleGstAlreadyExistsContinue = () => {
        setGstVerified(true);          // mark as verified so form can proceed
        setGstAlreadyExistsModal(false);
    };


    const handleSelectDropdownChange = (name, option) => {

        if (name === "city") {
            setFormData((prev) => ({
                ...prev,
                pincode: null
            }))
        }
        setFormData((prev) => ({
            ...prev,
            [name]: option.value
        }))
    }

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        let error = {}
        if (serverErrors?.[name]) clearServerError?.(name)
        if (name === "gst_no") {
            // Reset verification whenever user edits GST
            setGstVerified(false);
            setGstVerifyData(null);
            setGstVerifyError('');
            setFrachiseeData((prev) => {
                return {
                    ...prev,
                    gst_no: value
                }
            })
        }

        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else if (type === 'file') {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            if (name === "customer_name") {
                let count = value.trim().length;
                setCustomerCharCount(count);

                // Only update formData if under 50 characters
                if (count < 50) {
                    setFormData({ ...formData, [name]: value });
                }
                else {
                    setCustomerCharCount(count);
                    setFormData({ ...formData, [name]: value.trim().substring(0, 50) });
                    error.customer_name = "Not allowed to enter more then 50 characters"
                }
                setErrors(error)
            } else {
                // For other fields, update normally
                setFormData({ ...formData, [name !== "customer_name" && name]: value });
            }
        }
    };

    // Returns true when the form is valid; shows the errors otherwise. `embedded` pages call it through validateRef.
    const validate = () => {
        const errors = {};

        // First Name validation
        if (!formData.first_name || !formData.first_name.trim()) {
            errors.first_name = 'First name is required';
        } else if (formData.first_name.length < 2) {
            errors.first_name = 'First name must be at least 2 characters';
        }

        // Last Name validation
        if (!formData.last_name || !formData.last_name.trim()) {
            errors.last_name = 'Last name is required';
        } else if (formData.last_name.length < 2) {
            errors.last_name = 'Last name must be at least 2 characters';
        }

        // Email validation
        if (!formData.email || !formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
            errors.email = 'Email is invalid';
        }

        // if (formData.cust_type === "3") {
        //     if (!formData?.gst_no) {
        //         errors.gst_no = 'GST No is required';
        //     }
        // }

        // Phone validation
        if (!formData.phone) {
            errors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phone)) {
            errors.phone = 'Phone number must be exactly 10 digits';
        }
        // Username validation
        if (!formData.username) {
            errors.username = 'Username is required';
        } else if (formData.username.length < 4) {
            errors.username = 'Username must be at least 4 characters';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        // Account number validation
        // if (!formData.accno) {
        //     errors.accno = 'Account number is required';
        // } else if (!/^\d{10,20}$/.test(formData.accno.trim())) {
        //     errors.accno = 'Account number must be 10-20 digits';
        // }

        // Customer type validation
        if (!formData.cust_type) {
            errors.cust_type = 'Customer type is required';
        }

        if (!formData.customer_name) {
            errors.customer_name = 'Customer  name is required';
        }

        //  
        if (!embedded && !formData?.city) {
            errors.city = 'City name is required';
        }

        if (!embedded && !formData?.pincode) {
            errors.pincode = 'Pincode is required';
        }
        // Every field of the form is required except the KYC Approved tick box (the backend checks that the
        // employee codes belong to an active employee).
        if (!formData.sales_head_emp_code?.trim()) errors.sales_head_emp_code = 'Sales head employee code is required';
        if (!formData.lead_generated_by_emp_code?.trim()) errors.lead_generated_by_emp_code = 'Lead generated by employee code is required';
        if (!formData.gst_no?.trim()) errors.gst_no = 'GST No is required';
        if (!formData.pan_no?.trim()) errors.pan_no = 'PAN No is required';
        if (!formData.billing_type?.trim()) errors.billing_type = 'Billing type is required';
        if (!formData.customer_potential?.trim()) errors.customer_potential = 'Customer potential is required';
        if (formData.soft_limit === '' || formData.soft_limit == null) errors.soft_limit = 'Soft limit is required';
        if (formData.expected_business === '' || formData.expected_business == null) errors.expected_business = 'Expected business is required';
        if (!formData.finance_emails?.trim()) {
            errors.finance_emails = 'Finance email is required';
        } else if (formData.finance_emails.split(',').some((m) => !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(m.trim()))) {
            errors.finance_emails = 'Enter valid email addresses separated by commas';
        }
        if (!formData.customer_agreement_doc) errors.customer_agreement_doc = 'Customer agreement document is required';
        if (!formData.kyc_document) errors.kyc_document = 'KYC document is required';
        if (!formData?.industry) {
            errors.industry = 'industry is required';
        }
        // GST is optional

        if (Object.keys(errors).length === 0) {
            setErrors(null);
            return true;
        }
        setErrors(errors);
        return false;
    };
    if (validateRef) validateRef.current = validate;

    const handleSubmit = (e) => {
        e?.preventDefault?.();
        if (validate()) onNextButtonClick(2);
    };

    return (
        <div className="mt-1">
            {/* add user form */}
            <div>
                {/* GST Validation — at top of form */}
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>GST No{REQ}</Label>
                            <div className="flex gap-2 items-start">
                                <div style={{ flex: 1 }}>
                                    <Input
                                        type="text"
                                        name="gst_no"
                                        value={formData.gst_no}
                                        onChange={handleChange}
                                        invalid={!!errors?.gst_no}
                                        placeholder="e.g. 27AAOCP7860J1ZO"
                                    />
                                    <FormFeedback>{errors?.gst_no}</FormFeedback>
                                </div>
                                <Button
                                    color={gstVerified ? 'success' : 'warning'}
                                    onClick={handleVerifyGST}
                                    disabled={gstVerifying || !formData.gst_no?.trim()}
                                    style={{ whiteSpace: 'nowrap', minWidth: '110px' }}
                                    title={gstVerified ? 'GST Verified ✓' : 'Click to validate GST'}
                                >
                                    {gstVerifying
                                        ? <><Spinner size="sm" /> Verifying…</>
                                        : gstVerified
                                        ? '✓ Verified'
                                        : 'Validate GST'
                                    }
                                </Button>
                            </div>
                        </FormGroup>
                    </Col>
                    {/* the verification result sits beside the GST input, on the same row */}
                    {(gstVerifyError || (gstVerified && gstVerifyData)) && (
                        <Col md={8}>
                            <FormGroup>
                                <Label>&nbsp;</Label>
                                {gstVerifyError && (
                                    <Alert color="danger" className="py-2 px-4 mb-0" style={{ fontSize: '0.85rem' }}>
                                        {gstVerifyError}
                                    </Alert>
                                )}
                                {gstVerified && gstVerifyData && (
                                    <Alert color="success" className="py-2 px-4 mb-0" style={{ fontSize: '0.85rem' }}>
                                        <strong>{gstVerifyData.legal_name}</strong> — Status: <strong>{gstVerifyData.status}</strong>
                                        {gstVerifyData.registration_date && ` | Reg: ${gstVerifyData.registration_date}`}
                                    </Alert>
                                )}
                            </FormGroup>
                        </Col>
                    )}
                </Row>
                <SectionTitle>Contact details</SectionTitle>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>First Name{REQ}</Label>
                            <Input type="text" name="first_name" value={formData.first_name} onChange={handleChange} invalid={!!errors?.first_name} />
                            <FormFeedback>{errors?.first_name}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Last Name{REQ}</Label>
                            <Input type="text" name="last_name" value={formData.last_name} onChange={handleChange} invalid={!!errors?.last_name} />
                            <FormFeedback>{errors?.last_name}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Email{REQ}</Label>
                            <Input type="email" name="email" value={formData.email} onChange={handleChange} invalid={!!errors?.email} />
                            <FormFeedback>{errors?.email}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Phone{REQ}</Label>
                            <Input type="text" name="phone" value={formData.phone} onChange={handleChange} invalid={!!errors?.phone} />
                            <FormFeedback>{errors?.phone}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Username{REQ}</Label>
                            <Input type="text" name="username" value={formData.username} onChange={handleChange} invalid={!!errors?.username} />
                            <FormFeedback>{errors?.username}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Password{REQ}</Label>
                            <Input type="password" name="password" value={formData.password} onChange={handleChange} invalid={!!errors?.password} />
                            <FormFeedback>{errors?.password}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>

                <SectionTitle>Customer details</SectionTitle>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Customer Type{REQ}</Label>
                            <Input type="select" name="cust_type" value={formData.cust_type} onChange={handleChange} invalid={!!errors?.cust_type}>
                                <option value="">Select Type</option>
                                <option value="2">Corporate</option>
                                {/* <option value="1">Retail</option> */}
                                <option value="3">Franchise</option>
                            </Input>
                            <FormFeedback>{errors?.cust_type}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label className="flex items-center justify-between">
                                <span>Customer Name{REQ}</span>
                                <small className="text-ink-muted">{CustomerCharCount}/50</small>
                            </Label>
                            <Input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} invalid={!!errors?.customer_name} />
                            <FormFeedback>{errors?.customer_name}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Type of Industry{REQ}</Label>
                            <Input type="text" name="industry" value={formData?.industry} placeholder="Enter Type of Industry" onChange={handleChange} invalid={!!errors?.industry} />
                            <FormFeedback>{errors?.industry}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Sales Head{REQ}</Label>
                            <EmployeeCodePicker name="sales_head_emp_code" label="sales head" value={formData.sales_head_emp_code} onChange={handleChange} invalid={!!(errors?.sales_head_emp_code || serverErrors?.sales_head_emp_code)} />
                            <small className="text-danger-500">{errors?.sales_head_emp_code || serverErrors?.sales_head_emp_code}</small>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Lead Generated By{REQ}</Label>
                            <EmployeeCodePicker name="lead_generated_by_emp_code" label="lead owner" value={formData.lead_generated_by_emp_code} onChange={handleChange} invalid={!!(errors?.lead_generated_by_emp_code || serverErrors?.lead_generated_by_emp_code)} />
                            <small className="text-danger-500">{errors?.lead_generated_by_emp_code || serverErrors?.lead_generated_by_emp_code}</small>
                        </FormGroup>
                    </Col>
                    {/* on the single page the Address section below already asks for city and pincode */}
                    {!embedded && (
                        <>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>City{REQ}</Label>
                                    <Select
                                        options={AllCities}
                                        onChange={(option) => {
                                            handleSelectDropdownChange("city", option)
                                            setSelectedCity(option.value)
                                        }}
                                        value={{
                                            value: formData.city,
                                            label: formData.city,
                                        }}
                                        placeholder="Select Cities"
                                        styles={customStyles}
                                    />
                                    <small className="text-danger-500">{errors?.city}</small>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Pincode{REQ}</Label>
                                    <Input type="text" name="pincode" value={formData.pincode} onChange={(e) => { isNumber(e.target.value) && handleChange(e) }} invalid={!!errors?.pincode} />
                                    <FormFeedback>{errors?.pincode}</FormFeedback>
                                </FormGroup>
                            </Col>
                        </>
                    )}
                </Row>

                <SectionTitle>Other details</SectionTitle>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Soft Limit{REQ}</Label>
                            <Input type="number" name="soft_limit" value={formData.soft_limit} placeholder="Enter Soft Limit" invalid={!!errors?.soft_limit} onChange={handleChange} />
                            <FormFeedback>{errors?.soft_limit}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Customer Potential{REQ}</Label>
                            <Input type="text" name="customer_potential" value={formData.customer_potential} placeholder="Enter Potential" invalid={!!errors?.customer_potential} onChange={handleChange} />
                            <FormFeedback>{errors?.customer_potential}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Expected Business{REQ}</Label>
                            <Input type="number" name="expected_business" value={formData.expected_business} placeholder="Expected Business" invalid={!!errors?.expected_business} onChange={handleChange} />
                            <FormFeedback>{errors?.expected_business}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Billing Type{REQ}</Label>
                            <Input type="text" name="billing_type" value={formData.billing_type} invalid={!!errors?.billing_type} onChange={handleChange} />
                            <FormFeedback>{errors?.billing_type}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>PAN No{REQ}</Label>
                            <Input type="text" name="pan_no" value={formData.pan_no} invalid={!!errors?.pan_no} onChange={handleChange} />
                            <FormFeedback>{errors?.pan_no}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Finance Emails (comma separated){REQ}</Label>
                            <Input type="text" name="finance_emails" value={formData.finance_emails} placeholder="email1@example.com, email2@example.com" invalid={!!errors?.finance_emails} onChange={handleChange} />
                            <FormFeedback>{errors?.finance_emails}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Customer Agreement Document{REQ}</Label>
                            <Input type="file" name="customer_agreement_doc" invalid={!!errors?.customer_agreement_doc} onChange={handleChange} />
                            <FormFeedback>{errors?.customer_agreement_doc}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>KYC Document{REQ}</Label>
                            <Input type="file" name="kyc_document" invalid={!!errors?.kyc_document} onChange={handleChange} />
                            <FormFeedback>{errors?.kyc_document}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            {/* a blank label keeps the checkbox level with the inputs beside it */}
                            <Label>&nbsp;</Label>
                            <Label check className="flex h-9.5 items-center gap-2">
                                <Input type="checkbox" name="kyc_approved" checked={formData.kyc_approved} onChange={handleChange} />
                                KYC Approved
                            </Label>
                        </FormGroup>
                    </Col>
                </Row>
            </div>



            {!embedded && (
                <div className='flex gap-4 mt-4 justify-end'>
                    <Button color="primary" className='px-6 py-2' onClick={handleSubmit}>Next</Button>
                </div>
            )}

            {/* GST Already Exists Modal */}
            <Modal isOpen={gstAlreadyExistsModal} toggle={() => setGstAlreadyExistsModal(false)} centered>
                <ModalHeader toggle={() => setGstAlreadyExistsModal(false)} className="bg-warning-500 text-ink">
                    ⚠️ GST Number Already Exists
                </ModalHeader>
                <ModalBody>
                    <p className="mb-2">{gstAlreadyExistsMsg || 'This GST number is already registered in the system.'}</p>
                    <p className="mb-0 text-ink-muted" style={{ fontSize: '0.9rem' }}>
                        You can still continue adding this customer if needed. Click <strong>Continue Anyway</strong> to proceed.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={() => setGstAlreadyExistsModal(false)}>
                        Cancel
                    </Button>
                    <Button color="warning" onClick={handleGstAlreadyExistsContinue}>
                        Continue Anyway
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default AddUserForm;
