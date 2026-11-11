// Choose, per product and component (Pincodes, Rates, Config, VAS), what to copy from the default account
// (corporatedefault) into this customer. Used for step 3 "Setup source" (replace = false: own data is kept)
// and for "Reset to default" after go-live (replace = true: the customer's data is overwritten).
import { useCallback, useEffect, useState } from "react"
import PropTypes from "prop-types"
import { Button, Spinner } from "@/components/ui"
import SimpleModal from "../../../components/SimpleModal"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { errText } from "../../NewFeatures/invoiceConfigHelpers"
import { ONBOARDING_APPLY_DEFAULTS, ONBOARDING_DEFAULTS } from "../../../api"
import { PRODUCT_COMPONENTS, callApi } from "./helpers"

const RESULT_TONE = { copied: "text-success-500", kept: "text-warning-500", not_in_default: "text-danger-500", needs_config: "text-danger-500" }
const RESULT_TEXT = {
    copied: "Copied",
    kept: "Kept (own data exists)",
    not_in_default: "Not in default - upload own",
    needs_config: "Needs config first",
}

// `only`: show just one component ("rates", "pincodes", "config", "vas"), for use inside that step
// stickyActions: pin the button row to the bottom of the scrolling area (used inside the popup, as its footer)
const DefaultsPicker = ({ customerId, replace = false, only, onDone, stickyActions = false }) => {
    const comps = only ? PRODUCT_COMPONENTS.filter((c) => c.key === only) : PRODUCT_COMPONENTS
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const [defaults, setDefaults] = useState(null)
    const [loading, setLoading] = useState(false)
    const [sel, setSel] = useState({}) // { product: { pincodes: bool, rates: bool, config: bool, vas: bool } }
    const [busy, setBusy] = useState(false)
    const [results, setResults] = useState(null) // { product: { component: result } }
    const [confirmOpen, setConfirmOpen] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        const { ok, status, data } = await callApi(ONBOARDING_DEFAULTS)
        setLoading(false)
        if (!ok) {
            ErrorToaster(status === 409 ? "There is no default (corporatedefault) account on this server" : errText(data, "Could not load the default setup"))
            setDefaults({ products: [] })
            return
        }
        const products = Array.isArray(data?.products) ? data.products : []
        setDefaults({ ...data, products })
        // "Use default" starts ticked for every product the default has complete data for
        const next = {}
        products.forEach((p) => {
            next[p.product] = Object.fromEntries(comps.map((c) => [c.key, !!p.complete && !replace]))
        })
        setSel(next)
    }, [replace, only])

    useEffect(() => { load() }, [load])

    const toggle = (product, comp) => setSel((prev) => ({ ...prev, [product]: { ...prev[product], [comp]: !prev[product]?.[comp] } }))

    // tick / untick one component for every product the default has complete data for
    const toggleColumn = (comp) => {
        const eligible = (defaults?.products || []).filter((p) => p.complete)
        const allOn = eligible.length > 0 && eligible.every((p) => sel[p.product]?.[comp])
        setSel((prev) => {
            const next = { ...prev }
            eligible.forEach((p) => { next[p.product] = { ...next[p.product], [comp]: !allOn } })
            return next
        })
    }
    const selectedCount = Object.values(sel).reduce((n, comps) => n + Object.values(comps || {}).filter(Boolean).length, 0)

    // The API takes one product list and one component list per call, so products that picked different
    // components go in separate calls.
    const groups = () => {
        const byKey = new Map()
        const comps_ = only ? PRODUCT_COMPONENTS.filter((c) => c.key === only) : PRODUCT_COMPONENTS
        Object.entries(sel).forEach(([product, comps]) => {
            const chosen = comps_.map((c) => c.key).filter((k) => comps[k])
            if (!chosen.length) return
            const key = chosen.join(",")
            byKey.set(key, { components: chosen, products: [...(byKey.get(key)?.products || []), product] })
        })
        return [...byKey.values()]
    }

    const apply = async () => {
        const list = groups()
        if (!list.length) { ErrorToaster("Tick at least one component to copy"); return }
        setBusy(true)
        const merged = {}
        let failed = false
        for (const g of list) {
            const { ok, data } = await callApi(ONBOARDING_APPLY_DEFAULTS, {
                method: "POST",
                body: { customer_id: Number(customerId), products: g.products, components: g.components, replace },
            })
            if (!ok) {
                ErrorToaster(errText(data, "Could not copy the defaults"))
                failed = true
                break
            }
            Object.entries(data?.result || {}).forEach(([comp, perProduct]) => {
                Object.entries(perProduct || {}).forEach(([product, res]) => {
                    merged[product] = { ...(merged[product] || {}), [comp]: res }
                })
            })
        }
        setBusy(false)
        setConfirmOpen(false)
        if (Object.keys(merged).length) {
            setResults(merged)
            if (!failed) SucceesToaster(replace ? "Reset to default done" : "Defaults copied")
            onDone?.()
        }
    }

    if (loading || !defaults) return <div className="py-4"><Spinner size="sm" /> Loading the default setup...</div>

    const eligibleCount = defaults.products.filter((p) => p.complete).length
    const actionsCls = stickyActions
        ? "sticky bottom-0 z-10 -mx-5 mt-3 flex items-center justify-between gap-2 border-t border-white/10 bg-surface px-5 py-3"
        : "mt-3 flex items-center justify-between gap-2"

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="m-0 text-sm text-ink-muted">
                    {replace
                        ? "Replaces the customer's own data for the ticked items with the default."
                        : "Tick what should start as a copy of the default. Data the customer already has is kept; anything unticked is added on the next steps."}
                </p>
                {defaults.default_customer?.username && (
                    <span className="whitespace-nowrap text-xs text-ink-muted">Default account: <strong className="text-ink">{defaults.default_customer.username}</strong></span>
                )}
            </div>

            {defaults.products.length === 0 ? (
                <p className="text-sm text-danger-500">The default account has no product data. Upload own data for this customer.</p>
            ) : (
                <div className="overflow-x-auto rounded-md border border-white/8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[rgb(var(--overlay-rgb)/0.05)] text-left text-xs text-ink-muted">
                                <th className="px-3 py-2 font-semibold">Product</th>
                                {comps.map((c) => {
                                    const allOn = eligibleCount > 0 && defaults.products.filter((p) => p.complete).every((p) => sel[p.product]?.[c.key])
                                    return (
                                        <th key={c.key} className="px-3 py-2 text-center font-semibold">
                                            <label className="inline-flex cursor-pointer items-center gap-1.5">
                                                <input type="checkbox" checked={allOn} disabled={busy || eligibleCount === 0} onChange={() => toggleColumn(c.key)} aria-label={`Use default ${c.label} for every product`} />
                                                {c.label}
                                            </label>
                                        </th>
                                    )
                                })}
                                <th className="px-3 py-2 font-semibold">In the default</th>
                            </tr>
                        </thead>
                        <tbody>
                            {defaults.products.map((p) => (
                                <tr key={p.product} className="border-t border-white/8 align-top">
                                    <td className="px-3 py-2">
                                        <div className="font-semibold">{p.product}</div>
                                        {!p.complete && <div className="text-xs text-danger-500">Default incomplete: upload own data</div>}
                                    </td>
                                    {comps.map((c) => (
                                        <td key={c.key} className="px-3 py-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={!!sel[p.product]?.[c.key]}
                                                disabled={!p.complete || busy}
                                                onChange={() => toggle(p.product, c.key)}
                                                aria-label={`Use default ${c.label} for ${p.product}`}
                                            />
                                            {results?.[p.product]?.[c.key] && (
                                                <div className={`mt-0.5 text-xs font-semibold ${RESULT_TONE[results[p.product][c.key]] || ""}`}>
                                                    {RESULT_TEXT[results[p.product][c.key]] || results[p.product][c.key]}
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-3 py-2 text-xs text-ink-muted">
                                        <div>{p.pickup_pincodes ?? 0} pickup / {p.delivery_pincodes ?? 0} delivery / {p.cod_pincodes ?? 0} COD pincodes</div>
                                        <div>{p.rate_slabs ?? 0} rate slabs, {(p.vas || []).length} VAS</div>
                                        {Array.isArray(p.zones) && p.zones.length > 0 && <div>Zones: {p.zones.join(", ")}</div>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className={actionsCls}>
                <span className="text-xs text-ink-muted">{selectedCount} selected</span>
                <Button
                    color={replace ? "danger" : "primary"}
                    disabled={busy || defaults.products.length === 0 || selectedCount === 0}
                    onClick={() => (replace ? setConfirmOpen(true) : apply())}
                >
                    {busy ? <><Spinner size="sm" /> Copying...</> : replace ? "Reset to default" : "Copy selected defaults"}
                </Button>
            </div>

            <SimpleModal
                isOpen={confirmOpen}
                setIsOpen={setConfirmOpen}
                onCancel={() => setConfirmOpen(false)}
                successButtonName={busy ? "Resetting..." : "Reset"}
                onSuccess={apply}
            >
                <p className="m-0 font-semibold text-danger-500">
                    This replaces the customer&apos;s own data for the ticked products and components with the default. It cannot be undone. Continue?
                </p>
            </SimpleModal>
        </div>
    )
}

DefaultsPicker.propTypes = {
    customerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    replace: PropTypes.bool,
    only: PropTypes.string,
    stickyActions: PropTypes.bool,
    onDone: PropTypes.func,
}

export default DefaultsPicker
