import { Button, Container } from "reactstrap"
import UserProfile from "../../components/UserManagement/UserProfile"
import KYCInfo from "../../components/UserManagement/KYCInfo"
import FranchiseProfile from "../../components/UserManagement/FranchiseProfile"
import { useNavigate, useParams } from "react-router-dom"
import AddressList from "../../components/UserManagement/AddressList"
import { useEffect, useState } from "react"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import { GET_USER_API } from "../../api"
import { GridLoader } from "react-spinners"
import { FaUserEdit } from "react-icons/fa";


const ViewUser = () => {
    const { id } = useParams()
    const [profileData, setProfileData] = useState({})
    const { apifunc: getProfileData, data, error, loading } = useGetApiCall()
    const navigate = useNavigate()
    useEffect(() => {
        document.title = "View User";
    }, []);
    useEffect(() => {
        getProfileData(`${GET_USER_API}/${id}/`)
    }, [id])


    useEffect(() => {
        setProfileData(data)
    }, [data])
    if (loading) {
        return (
            <div style={{ height: "100vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                <GridLoader size={20} />
                <p className="mt-5 h5">Loading...</p>
            </div>
        )
    }
    return (
        <div className="page-content">
            <div className="container-fluid">
                <div className="d-flex justify-content-end">
                    <Button className="btn btn-primary mb-4 d-flex gap-2" color="primary" onClick={() => {
                        navigate(`/edit-user/${id}`)
                    }}>
                        Edit User
                        <FaUserEdit className="" style={{ width: "16px", height: "16px" }} />
                    </Button>
                </div>
                <UserProfile user={profileData} setProfileData={setProfileData} userId={id} />
                {
                    profileData?.kyc_document && <KYCInfo kyc_document={profileData?.kyc_document} />
                }
                {
                    profileData?.addresses?.length >= 1 && <AddressList addresses={profileData?.addresses} />
                }
                {
                    profileData?.franchise_profile && <FranchiseProfile profile={profileData?.franchise_profile} />
                }
            </div>

        </div>
    )
}
export default ViewUser