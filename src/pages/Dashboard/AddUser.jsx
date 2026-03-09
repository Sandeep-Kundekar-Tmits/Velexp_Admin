import { useEffect, useState } from "react"
import TabProvider from "../../components/Table/TabProvider"
import AddFranchiseeForm from "../../components/UserManagement/AddFranchiseeForm"
import AddUserForm from "../../components/UserManagement/AddUserForm"
import MultipleAddressForm from "../../components/UserManagement/MultipleAddressForm"
import usePostFileApicall from "../../hooks/usePostFileApicall"
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap"
import { POST_USER_API } from "../../api"
import { GridLoader } from "react-spinners"
import { useNavigate } from "react-router-dom"
import usePostApiCall from "../../hooks/usePostApiCall"
import ToasterProvider from "../../helpers/ToasterProvider"


const AddUser = () => {
    useEffect(() => {
        document.title = "Add New User";
    }, []);
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const [Errors, setErrors] = useState({})
    const [showError, setShowError] = useState(false)
    const { apifunc: addNewUserWithFile, data: FormUserData, error: FormDataError, loading: FormDataLoading } = usePostFileApicall()
    // const { apifunc: addNewJsonUser, data: JsonUserData, error: JsonDataError, loading: JsonDataLoading } = usePostApiCall()
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        username: '',
        password: '', // Always keep blank for security
        // accno: '',
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
        referred_by: '',
        industry: ''
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
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            username: '',
            password: '', // Always keep blank for security
            // accno: '',
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
            referred_by: '',
            industry: ''
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
        formDataToSend.append('accno', "123456789");
        formDataToSend.append('phone', data.phone);
        formDataToSend.append('cust_type', data.cust_type);
        formDataToSend.append('customer_name', data.customer_name);
        formDataToSend.append('kyc_approved', data.kyc_approved);
        formDataToSend.append('billing_type', data.billing_type);
        formDataToSend.append('gst_no', data.gst_no);
        formDataToSend.append('pan_no', data.pan_no);
        formDataToSend.append('city', data.city);
        formDataToSend.append('pincode', data.pincode);
        formDataToSend.append('payment_mode', "COD");
        formDataToSend.append('referred_by', data.referred_by);
        formDataToSend.append('industry', data.industry);


        // Append file
        if (data.kyc_document) {
            formDataToSend.append('kyc_document', data.kyc_document);
        }

        // Append nested JSON as strings
        if (data?.addresses) {
            formDataToSend.append('addresses', JSON.stringify(data.addresses));
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



    //  api call
    const SumitAddUserForm = async () => {
        if (formData.cust_type !== "3") {
            const data = { ...formData, addresses: addresses }
            let formatedData = PostData(data)

            if (formatedData.isFormData) {
                let isSucces = await addNewUserWithFile(POST_USER_API, formatedData.body)
                if (isSucces.status) {
                    SucceesToaster("User Added Successfully")
                    formRest()
                    setActiveTab(1)
                }
                else {
                    setShowError(true)
                    setErrors(isSucces.data)
                    ErrorToaster("User Failed To Add Check All Credentials")
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
                    formRest()
                    setActiveTab(1)
                }
                else {
                    setShowError(true)
                    setErrors(isSucces.data)
                    ErrorToaster("User Failed To Add Check All Credentials")
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





    // Combine tabs based on condition
    const tabs = formData.cust_type === "3"
        ? [...baseTabs, franchiseTab]
        : baseTabs;



    return (
        <>
            <TabProvider tabs={tabs} toggle={toggle} activeTab={activeTab} />
            <Modal isOpen={FormDataLoading} >
                <ModalBody className="d-flex justify-content-center flex-column align-items-center">
                    <GridLoader size={20} />
                    <p className="mt-5 h5">Loading...</p>
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