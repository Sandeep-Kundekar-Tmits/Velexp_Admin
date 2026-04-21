import React, { useEffect, useState } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    CardHeader,
    CardBody,
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Alert,
    Modal,
    ModalHeader,
    ModalFooter,
    ModalBody,
    Spinner,
    ListGroup,
    ListGroupItem
} from 'reactstrap';
import EditUserInfo from '../../components/UserManagement/UpdateUser/EditUserInfo';
import EditAddress from '../../components/UserManagement/UpdateUser/EditAddress';
import EditFranchisee from '../../components/UserManagement/UpdateUser/EditFranchisee';
import { getModifiedFields, renderUpdatedDataJSX } from '../../helpers/formHelper';
import { useGetApiCall } from '../../hooks/useGetApiCall';
import { useNavigate, useParams } from 'react-router-dom';
import { GET_USER_API, UPDATE_USER_API } from '../../api';
import { usePutApiCall } from '../../hooks/usePutApuCall';

const UpdateUser = () => {
    useEffect(() => {
        document.title = "Edit User";
    }, []);

    const userUpdateSuccessMessage = "User updated successfully";
    const { apifunc, data: selectedUserData, loading: selectedUserLoading } = useGetApiCall();
    const navigate = useNavigate();
    const [modal, setModal] = useState(false);
    const [isUpdated, setIsUpdated] = useState(false);
    const toggle = () => setModal(!modal);
    const { apifunc: updateUserFunc, loading: updateUserLoading, error: updateErrors } = usePutApiCall(userUpdateSuccessMessage, toggle);
    const { id } = useParams();

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
            if (Array.isArray(initialData.finance_emails)) {
                initialData.finance_emails = initialData.finance_emails.join(', ');
            }
            setUpdatedData(initialData);
            const addressData = selectedUserData?.addresses?.[0] || initialAddressState;
            setAddresses(addressData);
        }
    }, [selectedUserData]);

    const prepareFormData = (data) => {
        const formDataToSend = new FormData();

        // Append basic user info
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'addresses' && key !== 'franchise_profile' && key !== 'kyc_document' && key !== 'customer_agreement_doc' && key !== 'finance_emails') {
                formDataToSend.append(key, value || '');
            }
        });

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
            formDataToSend.append('franchise_profile_input', JSON.stringify(data.franchise_profile));
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
                navigate(`/user/${id}`);
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

    if (selectedUserLoading) {
        return (
            <div className='position-fixed top-0 z-3 start-0 w-100 h-100 d-flex justify-content-center align-content-center'>
                <Spinner>Loading...</Spinner>
            </div>
        );
    }

    return (
        <div className="page-content">
            <Row>
                <Col>
                    <h2 className="mb-4">Update Franchise Profile</h2>
                    <div>
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

                        <div className="d-flex justify-content-end mb-4">
                            <Button color="primary" size="lg" type="button" onClick={toggle}>
                                Update Profile
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            <Modal isOpen={modal} toggle={toggle} size='lg'>
                <ModalHeader toggle={toggle}>Confirm Changes</ModalHeader>
                <ModalBody>
                    {selectedUserData && renderUpdatedDataJSX(
                        getModifiedFields(selectedUserData, updatedData)
                    )}
                </ModalBody>
                <ModalFooter>
                    {isUpdated && (
                        <Button
                            className='d-flex justify-content-center align-content-center'
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

export default UpdateUser;