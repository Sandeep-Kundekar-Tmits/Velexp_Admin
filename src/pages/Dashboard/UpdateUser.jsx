import React, { useEffect, useRef, useState } from 'react';
import {
    Button,
    Alert,
    Modal,
    ModalHeader,
    ModalFooter,
    ModalBody,
    Spinner,
    ListGroup,
} from "@/components/ui";
import EditUserInfo from '../../components/UserManagement/UpdateUser/EditUserInfo';
import EditAddress from '../../components/UserManagement/UpdateUser/EditAddress';
import EditFranchisee from '../../components/UserManagement/UpdateUser/EditFranchisee';
import { getModifiedFields, renderUpdatedDataJSX } from '../../helpers/formHelper';
import { useGetApiCall } from '../../hooks/useGetApiCall';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
import { GET_USER_API, UPDATE_USER_API } from '../../api';
import { usePutApiCall } from '../../hooks/usePutApuCall';
import MainHeaderComp from '../../components/MainHeaderCom';
import Loader from '@/Loaders/Loader';
import { ArrowLeft } from 'lucide-react';

// Props are for the onboarding wizard, which hosts this form inside a step: customerId replaces the route id,
// embedded hides the page header, onSaved replaces the redirect to the customer page.
// highlight {fields, color}: field names (input name attributes) to ring, for checks that point at them.
// showPostpaid: adds a "Postpaid payment" checkbox (the onboarding Payment mode step) that is sent as postpaid_payment.
const UpdateUser = ({ customerId, embedded = false, onSaved, highlight, showPostpaid = false } = {}) => {
    const wrapRef = useRef(null);
    useEffect(() => {
        if (!embedded) document.title = "Edit User";
    }, []);

    const userUpdateSuccessMessage = "User updated successfully";
    const { apifunc, data: selectedUserData, loading: selectedUserLoading } = useGetApiCall();
    const navigate = useNavigate();
    const [modal, setModal] = useState(false);
    const [isUpdated, setIsUpdated] = useState(false);
    const toggle = () => setModal(!modal);
    const { apifunc: updateUserFunc, loading: updateUserLoading, error: updateErrors } = usePutApiCall(userUpdateSuccessMessage, toggle);
    const params = useParams();
    const id = customerId ?? params.id;

    const initialAddressState = {
        address: '',
        city: '',
        state: '',
        country: "India",
        pincode: '',
        landmark: '',
    };

    const [Addresses, setAddresses] = useState(initialAddressState);
    const [updatedData, setUpdatedData] = useState({
        franchise_profile: {}
    });

    useEffect(() => {
        if (id) {
            apifunc(`${GET_USER_API}/${id}/`);
        }
    }, [id]);

    useEffect(() => {
        if (selectedUserData) {
            const initialData = { ...selectedUserData };
            if (showPostpaid) {
                initialData.postpaid_payment = !!(initialData.postpaid_payment ?? initialData.franchise_profile?.postpaid_payment);
            }
            if (Array.isArray(initialData.finance_emails)) {
                initialData.finance_emails = initialData.finance_emails.join(', ');
            }
            setUpdatedData(initialData);
            const addressData = selectedUserData?.addresses?.[0] || initialAddressState;
            setAddresses(addressData);
        }
    }, [selectedUserData]);

    // what the customer looked like when loaded (with the postpaid flag filled in, so only a real change shows in Confirm)
    const baseline = showPostpaid && selectedUserData
        ? { ...selectedUserData, postpaid_payment: !!(selectedUserData.postpaid_payment ?? selectedUserData.franchise_profile?.postpaid_payment) }
        : selectedUserData;

    const hlFields = highlight?.fields || [];
    const hlKey = hlFields.join(',');
    // bring the first highlighted field into view once the customer has loaded
    useEffect(() => {
        if (!hlFields.length || !selectedUserData || selectedUserLoading) return;
        const t = setTimeout(() => {
            const el = wrapRef.current?.querySelector(hlFields.map((f) => `[name="${f}"]`).join(','));
            el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
        }, 150);
        return () => clearTimeout(t);
    }, [hlKey, selectedUserData, selectedUserLoading]);

    const prepareFormData = (data) => {
        const formDataToSend = new FormData();

        // Append basic user info
        Object.entries(data).forEach(([key, value]) => {
            // the *_name fields are read-only (the backend fills them from the employee master)
            if (key !== 'sales_head_name' && key !== 'lead_generated_by_name' && key !== 'addresses' && key !== 'franchise_profile' && key !== 'kyc_document' && key !== 'customer_agreement_doc' && key !== 'finance_emails' && !(showPostpaid && key === 'postpaid_payment')) {
                formDataToSend.append(key, value || '');
            }
        });

        // Postpaid flag: always sent as the words true / false (the generic loop above would turn false into an empty string)
        if (showPostpaid) {
            formDataToSend.append('postpaid_payment', data?.postpaid_payment ? 'true' : 'false');
        }

        // Append file if it exists
        if (data?.kyc_document instanceof File) {
            formDataToSend.append('kyc_document', data.kyc_document);
        }

        if (data?.customer_agreement_doc instanceof File || (data?.customer_agreement_doc && typeof data.customer_agreement_doc === 'object' && data.customer_agreement_doc.name)) {
            formDataToSend.append('customer_agreement_doc', data.customer_agreement_doc);
        }

        // Handle finance_emails
        if (typeof data?.finance_emails === 'string') {
            const emails = data.finance_emails.split(',').map(e => e.trim()).filter(Boolean);
            formDataToSend.append('finance_emails', JSON.stringify(emails));
        }

        // Append nested objects as JSON strings
        if (data?.addresses) {
            formDataToSend.append('address_input', JSON.stringify(data.addresses));
        }

        if (data?.franchise_profile) {
            // a franchise keeps the same flag inside its profile: keep both in step
            const profile = showPostpaid && Object.keys(data.franchise_profile).length
                ? { ...data.franchise_profile, postpaid_payment: !!data.postpaid_payment }
                : data.franchise_profile;
            formDataToSend.append('franchise_profile_input', JSON.stringify(profile));
        }

        return {
            isFormData: true,
            body: formDataToSend,
        };
    };

    const updateUserInfo = async () => {
        if (Object.keys(updatedData).length >= 1) {
            const data = {
                ...updatedData,
                addresses: [{ ...Addresses }]
            };
            const formatedData = prepareFormData(data);
            const updatedValue = await updateUserFunc(
                `${UPDATE_USER_API}/${id}/`,
                formatedData.body,
                true
            );

            if (updatedValue) {
                setIsUpdated(false);
                if (onSaved) onSaved(); else navigate(`/user/${id}`);
            }
        }
        console.log(selectedUserData, updatedData)
    };

    const handleChange = (e, newType = null) => {
        setIsUpdated(true);
        const { name, type, value, checked, files } = e.target;

        switch (newType) {
            case "address":
                setAddresses(prev => ({ ...prev, [name]: value }));
                setUpdatedData((prev) => {
                    return {
                        ...prev,
                        addresses: [{
                            ...prev?.addresses[0],
                            [name]: value
                        }]
                    }
                })
                break;

            case "franchisee":
                setUpdatedData(prev => ({
                    ...prev,
                    franchise_profile: {
                        ...prev.franchise_profile,
                        [name]: type === "checkbox" ? checked : value
                    }
                }));
                break;

            case "info":
                if (type === "checkbox") {
                    setUpdatedData(prev => ({ ...prev, [name]: checked }));
                } else if (type === "file") {
                    setUpdatedData(prev => ({ ...prev, [name]: files[0] }));
                } else {
                    setUpdatedData(prev => ({ ...prev, [name]: value }));
                }
                break;

            default:
                setUpdatedData(prev => ({ ...prev, [name]: value }));
        }
    };

    /* Rendered in both branches: the loading state was a bare fixed-position
       spinner over an empty screen, with no title and no way back to the list
       except the browser's own button. */
    const header = embedded ? null : (
        <MainHeaderComp
            title="Update Franchise Profile"
            subTitle={selectedUserData?.customer_name || selectedUserData?.username || undefined}
            extraFields={
                <div className="flex items-center gap-2">
                    <Button
                        className="table-action-btn table-action-btn-ghost"
                        onClick={() => navigate("/user-list")}
                    >
                        <ArrowLeft aria-hidden="true" size={15} />
                        Back to List
                    </Button>
                </div>
            }
        />
    );

    if (selectedUserLoading) {
        return (
            <div className={embedded ? "relative overflow-x-hidden antialiased" : "page-content relative min-h-full overflow-x-hidden py-0 antialiased"}>
                {header}
                <Loader message="Loading customer…" fullscreen={false} />
            </div>
        );
    }

    return (
        <div ref={wrapRef} className={embedded ? "relative overflow-x-hidden antialiased" : "page-content relative min-h-full overflow-x-hidden py-0 antialiased"}>
            {hlFields.length > 0 && (
                <style>{hlFields.map((f) => `[name="${f}"]`).join(',') + ` { border-color: ${highlight.color} !important; box-shadow: 0 0 0 3px ${highlight.color}55 !important; }`}</style>
            )}
            {header}
            <div className={embedded ? "container-fluid relative z-10 px-0 pb-2" : "container-fluid relative z-10 pb-4"}>
                <div>
                    <div>
                        {showPostpaid && (
                            <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-md border border-white/8 p-3 text-sm font-semibold">
                                <input
                                    type="checkbox"
                                    name="postpaid_payment"
                                    checked={!!updatedData.postpaid_payment}
                                    onChange={(e) => { setIsUpdated(true); setUpdatedData((prev) => ({ ...prev, postpaid_payment: e.target.checked })); }}
                                />
                                Postpaid payment
                                <span className="font-normal text-ink-muted">(bill later; no wallet balance needed)</span>
                            </label>
                        )}
                        <EditUserInfo
                            formData={updatedData}
                            handleChange={(e) => handleChange(e, "info")}
                            setUpdatedData={setUpdatedData}
                            setIsUpdated={setIsUpdated}
                        />

                        <EditAddress
                            formData={Addresses}
                            onInputChange={(e) => handleChange(e, "address")}
                            onSelectChange={(key, option) => {
                                setIsUpdated(true);
                                if (key === "state") {
                                    setAddresses(prev => ({
                                        ...prev,
                                        city: null
                                    }));
                                }
                                //  update the address state
                                setAddresses(prev => ({
                                    ...prev,
                                    [key]: option.label
                                }));

                                //  update the main state 
                                setUpdatedData((prev) => {
                                    return {
                                        ...prev,
                                        addresses: [{
                                            ...prev?.addresses[0],
                                            [key]: option?.label
                                        }]
                                    }
                                })
                            }}
                        />

                        {selectedUserData?.cust_type?.type_of_cust === "Franchise" && (
                            <EditFranchisee
                                formData={updatedData}
                                handleChange={(e) => handleChange(e, "franchisee")}
                            />
                        )}

                        {updateErrors && (
                            <div>
                                <h5 className="alert-heading">Please fix the following errors:</h5>
                                <ListGroup flush>
                                    {Object.entries(updateErrors).map(([field, messages]) => (
                                        <Alert key={field} color="danger">
                                            <strong>{field.replace(/_/g, ' ')}:</strong> {messages.join(', ')}
                                        </Alert>
                                    ))}
                                </ListGroup>
                            </div>
                        )}

                        <div className="flex justify-end mb-6">
                            <Button color="primary" size="lg" type="button" onClick={toggle}>
                                Update Profile
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={modal} toggle={toggle} size='lg'>
                <ModalHeader toggle={toggle}>Confirm Changes</ModalHeader>
                <ModalBody>
                    {selectedUserData && renderUpdatedDataJSX(
                        getModifiedFields(baseline, updatedData),
                        baseline
                    )}
                </ModalBody>
                <ModalFooter>
                    {isUpdated && (
                        <Button
                            className='flex justify-center content-center'
                            color="primary"
                            onClick={updateUserInfo}
                        >
                            {updateUserLoading ? (
                                <Spinner size="sm">Loading...</Spinner>
                            ) : "Confirm Changes"}
                        </Button>
                    )}
                    <Button color="secondary" onClick={toggle}>
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

UpdateUser.propTypes = {
    customerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    embedded: PropTypes.bool,
    onSaved: PropTypes.func,
    showPostpaid: PropTypes.bool,
    highlight: PropTypes.shape({ fields: PropTypes.array, color: PropTypes.string }),
};

export default UpdateUser;