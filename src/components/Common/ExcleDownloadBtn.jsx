import { FaFileExcel } from "react-icons/fa"
import { Button } from "reactstrap"

const ExcleDownloadBtn = ({ isDisabled = false, onDownloadExcle, ExcleLoading = false, label }) => {
    return (
        <Button
            disabled={isDisabled}
            onClick={onDownloadExcle}
            className="d-flex align-items-center px-2 bg-transparent border-success text-success"
            style={{
                borderRadius: "10px",
                fontWeight: "500",
                paddingTop: "4px",
                paddingBottom: "4px",
                height: "40px"
            }}
        >
            {
                ExcleLoading ? <span className="me-2">Exporting...</span> : <span className="me-2">{label ? label : "Download Excel"}</span>
            }
            <FaFileExcel size={18} className="" />
        </Button>
    )
}
export default ExcleDownloadBtn