import { Button } from "@/components/ui"
import MainHeaderComp from "../../components/MainHeaderCom"
import { ArrowLeft } from "lucide-react"
import UserProfile from "../../components/UserManagement/UserProfile"
import KYCInfo from "../../components/UserManagement/KYCInfo"
import FranchiseProfile from "../../components/UserManagement/FranchiseProfile"
import { useNavigate, useParams } from "react-router-dom"
import AddressList from "../../components/UserManagement/AddressList"
import { useEffect, useState } from "react"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import { GET_USER_API } from "../../api"
import Loader from "@/Loaders/Loader";
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
    /* Header is rendered in both branches so the title and the Back button are
       there while the request is still running -- the loading state used to be
       a bare loader on an otherwise empty screen with no way out but the
       browser's own back. */
    const header = (
        <MainHeaderComp
            title="Customer Details"
            subTitle={profileData?.customer_name || profileData?.username || undefined}
            extraFields={
                <div className="flex items-center gap-2">
                    <Button
                        className="table-action-btn table-action-btn-ghost"
                        onClick={() => navigate("/user-list")}
                    >
                        <ArrowLeft aria-hidden="true" size={15} />
                        Back
                    </Button>
                    <Button
                        className="table-action-btn table-action-btn-primary"
                        onClick={() => navigate(`/edit-user/${id}`)}
                    >
                        <FaUserEdit aria-hidden="true" style={{ width: "15px", height: "15px" }} />
                        Edit User
                    </Button>
                </div>
            }
        />
    )

    if (loading) {
        return (
            <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
                {header}
                <Loader message="Loading customer details…" fullscreen={false} />
            </div>
        )
    }
    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            {header}
            <div className="container-fluid relative z-10 pb-4">
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