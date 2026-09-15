import { useEffect } from "react"
import AwbHardDeleteScreen from "../../components/AwbHardDelete/AwbHardDeleteScreen"
import { BULK_HARD_DELETE_SPD_STATUS } from "../../api"

const SpdRemove = () => {
    useEffect(() => { document.title = "SPD Remove" }, [])

    return (
        <AwbHardDeleteScreen
            statusLabel="SPD"
            apiUrl={BULK_HARD_DELETE_SPD_STATUS}
            pageTitle="SPD Remove"
            pageSubtitle="Hard-delete the SPD status marking for one or more AWBs"
            employeeIdField="user_id"
        />
    )
}

export default SpdRemove
