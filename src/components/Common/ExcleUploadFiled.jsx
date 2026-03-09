import { Button, FormGroup, FormText, Input, Label, Spinner } from "reactstrap"

const ExcleUploadFiled = ({ inputRef=null,loading = false, OnInputChange, Title = "Upload", isBtnDisabled = false, onUpload, isUploading = false }) => {
    return (
        <div className="d-flex">
            <FormGroup>
                <Label for="gstUpload">{Title}</Label>
                <Input type="file" id="gstUpload" onChange={OnInputChange}  ref={inputRef}/>
                {
                    loading && <Spinner size="sm" className="">
                        Loading...
                    </Spinner>
                }

                <FormText color="muted">Upload file if available</FormText>
            </FormGroup>
            <Button onClick={onUpload} disabled={isBtnDisabled} className="d-flex ms-4 justify-content-center align-items-center bg-primary" style={{ height: "35px", marginTop: "28px" }}>{isUploading ? "Uploading..." : "Upload"}</Button>
        </div>
    )
}
export default ExcleUploadFiled