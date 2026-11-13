// A "+" next to a product dropdown: opens a small box to add a new product to the system.
// POST /corporate-billing/onboarding/products/ { name }
//   201 created, 200 reactivated, 400 bad name, 409 already exists (can_reactivate: true when it is switched off)
// onAdded({ id, name }) lets the screen add the product to its dropdown right away.
import { useState } from "react"
import PropTypes from "prop-types"
import { FaPlus } from "react-icons/fa"
import { Button, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import ToasterProvider from "../../helpers/ToasterProvider"
import { ONBOARDING_PRODUCTS } from "../../api"

const NAME_OK = /^[A-Za-z0-9][A-Za-z0-9 _-]*$/

const AddProductButton = ({ onAdded, className = "" }) => {
    const { SucceesToaster } = ToasterProvider()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [error, setError] = useState("")
    const [canReactivate, setCanReactivate] = useState(false)
    const [saving, setSaving] = useState(false)

    const close = () => { setOpen(false); setName(""); setError(""); setCanReactivate(false) }

    const save = async (reactivate = false) => {
        const clean = name.trim().replace(/\s+/g, " ")
        if (!clean) { setError("Enter the product name"); return }
        if (!NAME_OK.test(clean)) { setError("Use letters, numbers, spaces, - and _ only, starting with a letter or number"); return }
        setSaving(true)
        setError("")
        const { ok, data } = await rawRequest(ONBOARDING_PRODUCTS, { method: "POST", body: reactivate ? { name: clean, reactivate: true } : { name: clean } })
        setSaving(false)
        if (!ok) {
            setError(data?.message || data?.detail || "Could not add the product")
            setCanReactivate(!!data?.can_reactivate)
            return
        }
        const product = data?.product || {}
        SucceesToaster(data?.message || `${product.name || clean} added`)
        onAdded?.({ id: product.id, name: product.name || clean })
        close()
    }

    return (
        <>
            <Button type="button" size="sm" color="primary" outline className={`shrink-0 ${className}`} title="Add a new product" aria-label="Add a new product" onClick={() => setOpen(true)}>
                <FaPlus />
            </Button>
            <Modal isOpen={open} toggle={close} centered>
                <ModalHeader toggle={close}>Add product</ModalHeader>
                <ModalBody>
                    <Label>Product name</Label>
                    <Input
                        type="text"
                        autoFocus
                        value={name}
                        invalid={!!error}
                        placeholder="e.g. VELO SKY EXPRESS"
                        onChange={(e) => { setName(e.target.value); setError(""); setCanReactivate(false) }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save() } }}
                    />
                    {error && <div className="mt-1 text-xs text-danger-500">{error}</div>}
                    <p className="mb-0 mt-2 text-xs text-ink-muted">A new product is not in the default setup: upload its pincodes, rates and config for the customer after adding it.</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={close} disabled={saving}>Cancel</Button>
                    {canReactivate && <Button color="warning" onClick={() => save(true)} disabled={saving}>Switch on again</Button>}
                    <Button color="primary" onClick={() => save()} disabled={saving || !name.trim()}>
                        {saving ? <><Spinner size="sm" /> Adding...</> : "Add product"}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    )
}

AddProductButton.propTypes = { onAdded: PropTypes.func, className: PropTypes.string }

export default AddProductButton
