import { Button, FormText, Input, Label, Spinner } from "@/components/ui"

/**
 * File picker with its upload action beside it.
 *
 * The button used to carry `marginTop: 28px` -- a hand-picked stand-in for the
 * height of the label above the input, correct at one font size and wrong at
 * any other. `items-end` on the row aligns it to the input's baseline at every
 * width instead, which also means it stays aligned once the row wraps on a
 * phone.
 */
const ExcleUploadFiled = ({
    inputRef = null,
    loading = false,
    OnInputChange,
    Title = "Upload",
    isBtnDisabled = false,
    onUpload,
    isUploading = false,
}) => {
    return (
        <div>
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex w-full flex-col gap-1.5 sm:w-64">
                    <Label for="gstUpload" className="form-label m-0 font-bold text-ink-muted">
                        {Title}
                    </Label>
                    <Input type="file" id="gstUpload" onChange={OnInputChange} ref={inputRef} />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={onUpload}
                        disabled={isBtnDisabled}
                        className="table-action-btn table-action-btn-primary"
                    >
                        {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                    {loading && <Spinner size="sm">Loading...</Spinner>}
                </div>
            </div>

            {/* Below the row, not inside the field: a hint under the input
                would be the lowest thing in the group, so items-end would
                align the button to the hint rather than to the input. */}
            <FormText color="muted" className="mt-1.5 block">Upload file if available</FormText>
        </div>
    )
}
export default ExcleUploadFiled
