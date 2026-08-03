import { Button, FormGroup, FormText, Input, Label, Spinner } from "@/components/ui"

const ExcleUploadFiled = ({ inputRef=null,loading = false, OnInputChange, Title = "Upload", isBtnDisabled = false, onUpload, isUploading = false }) => {
    return (
        <div className="flex">
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
            <Button onClick={onUpload} disabled={isBtnDisabled} className="flex ml-6 justify-center items-center bg-brand-500" style={{ height: "35px", marginTop: "28px" }}>{isUploading ? "Uploading..." : "Upload"}</Button>
        </div>
    )
}
export default ExcleUploadFiled