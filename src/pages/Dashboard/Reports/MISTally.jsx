import { useEffect, useState } from "react"
import MisAuthModel from "../../../components/MisTally/MisAuthModel"
import MisTallyComponent from "../../../components/MisTally/MisTallyComponent"
import { useLocation, useNavigate } from "react-router-dom"
import CryptoJS from 'crypto-js';
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { GET_ALL_ACTIVE_PASSWORDS, SECRET_KEY } from "../../../api";
// import InvoiceTable from "../../PdfComponents/InvoiceTable";

const MISTally = () => {
    //  defining the get password api
    const { apifunc: GetAllPasswords, data: Password } = useGetApiCall()
    const [ShowPasswordModel, setShowPasswordModel] = useState(true)
    const location = useLocation();
    const navigate = useNavigate()
    useEffect(() => {
        GetAllPasswords(GET_ALL_ACTIVE_PASSWORDS)
    }, [])

    useEffect(() => {
        if (Password) {
            //  first check the password in the session storage
            let password = sessionStorage.getItem("MIS_Password")
            if (password) {
                // decrypt the password and check with the active password
                const bytes = CryptoJS.AES.decrypt(password, SECRET_KEY);
                const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
                let isPasswordValid = Password?.find((ele => ele?.code === decryptedData))
                if (isPasswordValid) {
                    //  hide the ask password popup
                    setShowPasswordModel(false)
                }
                else {
                    //  show the ask password popup
                    setShowPasswordModel(true)
                }
            }

        }

    }, [Password])

    const onAuthSuccess = (password) => {
        //  api call and authorization
        let isPasswordValid = Password?.find((ele => ele?.code === password))
        if (isPasswordValid) {
            //  Encrypt the incomming password and store in to the session storage
            let EntryptedPassword = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
            sessionStorage.setItem("MIS_Password", EntryptedPassword)
            setShowPasswordModel(false)
        }
        else {
            alert("Wrong password")
        }
    }

    return (
        <div className='page-content  bg-white'>

            {
                ShowPasswordModel && <MisAuthModel show={true} onAuthSuccess={onAuthSuccess} onCloseClick={() => {
                    navigate("/revenue-report", {  // need to update
                        state: {
                            from: location.pathname
                        }
                    });

                }} />
            }

            {/* if the password is correct then show diffrent page */}
            {
                !ShowPasswordModel && <MisTallyComponent />
            }

        </div>
    )
}
export default MISTally