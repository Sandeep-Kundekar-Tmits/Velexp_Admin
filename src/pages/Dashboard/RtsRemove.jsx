import { useEffect } from "react"
import AwbHardDeleteScreen from "../../components/AwbHardDelete/AwbHardDeleteScreen"
import { BULK_HARD_DELETE_RTS_STATUS } from "../../api"

const RtsRemove = () => {
    useEffect(() => { document.title = "RTS Remove" }, [])

    return (
        <AwbHardDeleteScreen
            statusLabel="RTS"
            apiUrl={BULK_HARD_DELETE_RTS_STATUS}
            pageTitle="RTS Remove"
            pageSubtitle="Hard-delete the RTS status marking for one or more AWBs"
            employeeIdField="user_id"
        />
    )
}

export default RtsRemove
