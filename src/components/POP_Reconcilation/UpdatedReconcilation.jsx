import { useState } from "react";
import { Button, Input, Label, Modal, ModalBody } from "@/components/ui";
import usePostApiCall from "../../hooks/usePostApiCall";
import { POP_RECONCILATION_PAYMENT_CONFIRMATION } from "../../api";

const Inputfiled = ({ title = "Title", name = "", value = "", onChange = null, placeholder, type = "text", errorMessage }) => {
    return (
        <div className='w-full mb-4'>
            <Label>{title}</Label>
            <div className="flex  rounded-3" style={{ border: "solid #D3D3D3 1px", }}>
                <Input type={type} step="0.01" className="border-0" placeholder={placeholder} name={name} value={value} onChange={onChange} />
            </div>
            <small className="font-bold text-danger-500">{errorMessage}</small>
        </div>
    )
}
const UpdatedReconcilation = ({ show = false, onCloseClick, onUpdate, loading }) => {



    const [UpdateReconcilationData, setupdateReconcilationData] = useState({
        transaction_id: "",
        total_amount: 0
    })
    const [AwbNumbers, setAwbNumbers] = useState("")
    const [Errors, setErrors] = useState({})

    const onInputChange = (key, value) => {
        setupdateReconcilationData({
            ...UpdateReconcilationData,
            [key]: value
        })
    }

    const OnUpdate = async () => {
        let errors = {}
        if (!UpdateReconcilationData.transaction_id || UpdateReconcilationData.transaction_id === "") {
            errors.transaction_id = "Transaction Id is Required"
        }
        if (UpdateReconcilationData.total_amount === 0) {
            errors.total_amount = "Total Amount is Required"
        }
        if (AwbNumbers.length === 0 || AwbNumbers === "") {
            errors.AwbNumbers = "Awb numbers are Required"
        }
        setErrors(errors)

        if (Object.keys(errors).length === 0) {
            let paylod = {
                ...UpdateReconcilationData,
                "awb_list": AwbNumbers?.trim()?.split(","),
            }
            console.log(paylod, "payload")
            onUpdate(paylod)
        }
    }
    return (
        <Modal size="md" isOpen={show} centered={true} className="auth-modal">
            <div className="modal-content border-0">
                <ModalBody className="px-2 py-2 ">
                    <button
                        type="button"
                        onClick={onCloseClick}
                        className="btn-close absolute end-0 top-0 m-2"
                        aria-label="Close"
                    ></button>

                    <h4 className="">Update POP Status</h4>
                    <div className="border-top px-4 pt-2">
                        <Inputfiled
                            placeholder={"Transaction Id"}
                            title="Transaction Id"
                            type="text"
                            value={UpdateReconcilationData?.transaction_id}
                            name="transaction_id"
                            onChange={(e) => onInputChange("transaction_id", e.target.value)}
                            errorMessage={Errors?.transaction_id}
                        />
                        <Inputfiled
                            placeholder={"Total Amount"}
                            title="Total Amount"
                            type="number"
                            value={UpdateReconcilationData?.total_amount}
                            name="total_amount"
                            onChange={(e) => onInputChange("total_amount", e.target.value)}
                            errorMessage={Errors?.total_amount}
                        />
                        <div className="mb-4">
                            <Inputfiled
                                placeholder={"VE100078610,..."}
                                title="AWB Numbers"
                                type="textarea"
                                value={AwbNumbers}
                                onChange={(e) => setAwbNumbers(e.target.value)}
                                rows={3}
                                errorMessage={Errors?.AwbNumbers}
                            />
                            <small className="text-ink-muted mt-1 block">
                                Enter AWB numbers separated by commas
                            </small>
                        </div>

                        <Button className="bg-brand-500 float-end" onClick={OnUpdate}>{loading ? "Updating..." : "Update"}</Button>
                    </div>
                </ModalBody>
            </div>
        </Modal>
    )
}
export default UpdatedReconcilation