// Corporate customer onboarding wizard: a stepper across the top, then the step's checks on the left and a "Fix it here" panel on the right.
// Route: /customer-onboarding/:customerId   (?name=<customer name>&live=1 are set by the list screen)
// Steps 4-8 reuse the same screens as Bill Master, with the customer already chosen.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import PropTypes from "prop-types"
import { createPortal } from "react-dom"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Button, Modal, ModalBody, ModalHeader } from "@/components/ui"
import MainHeaderComp from "../../../components/MainHeaderCom"
import CustomerDocumentsModal from "../../../components/UserManagement/CustomerDocumentsModal"
import ToasterProvider from "../../../helpers/ToasterProvider"
import AddUser from "../../Dashboard/AddUser"
import UpdateUser from "../../Dashboard/UpdateUser"
import WalletManualCredit from "../../Dashboard/WalletManualCredit"
import CorporatePincodeUpload from "../CorporatePincodeUpload"
import CorporateRateUpload from "../CorporateRateUpload"
import CustomerProductConfig from "../../NewFeatures/CustomerProductConfig"
import VASConfig from "../../NewFeatures/VASConfig"
import InvoiceConfig from "../../NewFeatures/InvoiceConfig"
import { errText } from "../../NewFeatures/invoiceConfigHelpers"
import { ONBOARDING_CHECKLIST } from "../../../api"
import CheckList from "./CheckList"
import AccountExtras from "./AccountExtras"
import DefaultsPicker from "./DefaultsPicker"
import ReviewStep from "./ReviewStep"
import CompleteStep from "./CompleteStep"
import { EmailHistory, Logins, ResendCredentials } from "./ManagePanels"
import Stepper, { Node as StepIcon } from "./Stepper"
import StatusBar, { LoaderEdge } from "./StatusBar"
import { ChevronLeft, ChevronRight, Info, RefreshCw } from "lucide-react"
import { MANAGE_RAIL, RAIL, STATUS_LABEL, STEP_COLOR, callApi, highlightOf, railKeyOf, stepFrom } from "./helpers"

// checklist step key -> the key used in checklist.defaults_applied
const DEFAULT_COMPONENT = { pincodes: "pincodes", rates: "rates", product_config: "config", vas: "vas" }

// "From default" badges: where this component's data started, with a way to reset it
// "From default" badges: where this component's data started. Up to 4 show as chips; the rest are behind "+N more" (a popup).
const MAX_BADGES = 4
const badgeTitle = (info) => (info?.at ? `${info.at}${info.by ? ` by ${info.by}` : ""}` : "")
const BadgeChip = ({ product, info }) => (
    <span className="whitespace-nowrap rounded-full border border-brand-500 px-2.5 py-0.5 font-semibold text-brand-500" title={badgeTitle(info)}>
        {product}: from default{info?.result ? ` (${info.result})` : ""}
    </span>
)
BadgeChip.propTypes = { product: PropTypes.string.isRequired, info: PropTypes.object }

const DefaultBadge = ({ applied }) => {
    const [allOpen, setAllOpen] = useState(false)
    const entries = Object.entries(applied || {})
    if (!entries.length) return null
    const shown = entries.slice(0, MAX_BADGES)
    const extra = entries.length - shown.length
    return (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {shown.map(([product, info]) => <BadgeChip key={product} product={product} info={info} />)}
            {extra > 0 && (
                <button type="button" onClick={() => setAllOpen(true)} className="whitespace-nowrap rounded-full border border-white/8 bg-transparent px-2.5 py-0.5 font-semibold text-ink">
                    +{extra} more
                </button>
            )}
            <span className="text-ink-muted">Started as a copy of the default. Edit it on the right.</span>
            <Modal isOpen={allOpen} toggle={() => setAllOpen(false)} centered className="flex max-h-[85vh] flex-col">
                <ModalHeader toggle={() => setAllOpen(false)}>From default ({entries.length})</ModalHeader>
                <ModalBody className="overflow-y-auto">
                    <div className="flex flex-wrap gap-2 text-xs">
                        {entries.map(([product, info]) => <BadgeChip key={product} product={product} info={info} />)}
                    </div>
                </ModalBody>
            </Modal>
        </div>
    )
}
DefaultBadge.propTypes = { applied: PropTypes.object }

const LEGEND = [
    ["done", "Done"],
    ["blocked", "Blocked"],
    ["attention", "Needs attention"],
    ["optional", "Optional"],
]

// The "!" legend. The popup is drawn in document.body at a fixed position, so no card's overflow can clip it and it
// always sits above everything else on the page.
const LegendTip = () => {
    const btnRef = useRef(null)
    const [pos, setPos] = useState(null) // { top, right } in viewport px, or null when closed
    const show = () => {
        const r = btnRef.current?.getBoundingClientRect()
        if (r) setPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
    const hide = () => setPos(null)
    return (
        <>
            <button
                ref={btnRef}
                type="button"
                aria-label="What the step icons mean"
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                className="flex h-6 w-6 items-center justify-center rounded-full border-0 bg-[rgb(var(--overlay-rgb)/0.08)] text-ink-muted"
            >
                <Info size={15} aria-hidden="true" />
            </button>
            {pos && createPortal(
                <div
                    role="tooltip"
                    className="pointer-events-none fixed z-[9999] flex w-max flex-col gap-1.5 rounded-md border border-white/8 bg-surface px-3 py-2 text-xs text-ink shadow-lg"
                    style={{ top: pos.top, right: pos.right }}
                >
                    {LEGEND.map(([status, text]) => (
                        <span key={status} className="flex items-center gap-2">
                            <StepIcon status={status} size={18} />{text}
                        </span>
                    ))}
                </div>,
                document.body,
            )}
        </>
    )
}

const Wizard = () => {
    const { customerId } = useParams()
    const [search] = useSearchParams()
    const navigate = useNavigate()
    // /customer-onboarding/new: no customer yet. Same rail, step 1 is the Add User form, the rest wait for it.
    const isNew = customerId === "new"
    const name = isNew ? "New customer" : search.get("name") || `Customer #${customerId}`
    const { ErrorToaster } = ToasterProvider()

    const [live, setLive] = useState(search.get("live") === "1")
    const [active, setActive] = useState("account")
    const [checklist, setChecklist] = useState(null)
    const [loading, setLoading] = useState(false)
    const [routes, setRoutes] = useState([])
    const [weight, setWeight] = useState(1)
    const [reset, setReset] = useState(null) // popup: reset to default; { only } (only: one component key, or "" for all)
    const [defaultsOpen, setDefaultsOpen] = useState(false) // popup: copy this step's data from the default setup
    const [creditSignal, setCreditSignal] = useState(0) // bumps to open the wallet's Add Credit popup
    const [checksHidden, setChecksHidden] = useState(false) // minimise the Checks card: the working panel takes the whole width
    const [payPanel, setPayPanel] = useState(null) // payment step: "edit" | "wallet" shown under the checklist
    const opened = useRef(false)
    const activeRef = useRef("account")
    const [notice, setNotice] = useState(null) // { phase: loading | success | warning | error, text }

    useEffect(() => { document.title = "Customer Onboarding" }, [])
    useEffect(() => { setDefaultsOpen(false) }, [active])

    // the customer, in the shape the embedded Bill Master screens expect
    const customer = useMemo(() => ({ id: Number(customerId), name, label: name, value: name }), [customerId, name])

    const docCustomer = useMemo(() => ({ id: Number(customerId), customer_name: name, name }), [customerId, name])

    const cleanRoutes = useMemo(
        () => routes
            .filter((r) => r.from_pincode.trim() && r.to_pincode.trim())
            .map((r) => ({ from_pincode: r.from_pincode.trim(), to_pincode: r.to_pincode.trim() })),
        [routes],
    )

    // What the checklist says about the step the user is on, as a notice for the bar under the checks.
    const outcomeOf = (data, label) => {
        const item = RAIL.find((r) => r.key === activeRef.current)
        const step = stepFrom(data, item?.check)
        const prefix = label ? `${label}. ` : ""
        if (!step) return { phase: "success", text: `${prefix}Checklist updated.` }
        const checks = step.checks || []
        const blockers = checks.filter((c) => c.state === "blocker").length
        const warnings = checks.filter((c) => c.state === "warning").length
        if (blockers) return { phase: "error", text: `${prefix}${blockers} blocker${blockers === 1 ? "" : "s"} left on this step.` }
        if (warnings) return { phase: "warning", text: `${prefix}${warnings} warning${warnings === 1 ? "" : "s"} left on this step.` }
        return { phase: "success", text: `${prefix}All checks passed on this step.` }
    }

    // Runs every check (and a real test booking per product). `jump` opens the wizard at the first blocked step.
    // `label` names the action that led here ("Customer updated"); it is shown in the bar with the result.
    const runChecklist = useCallback(async ({ jump = false, label = "" } = {}) => {
        setLoading(true)
        setNotice({ phase: "loading", text: label ? `${label}. Checking the result...` : "Checking..." })
        const body = { customer_id: Number(customerId) }
        if (cleanRoutes.length) body.test_routes = cleanRoutes
        if (Number(weight) > 0) body.test_weight_kg = Number(weight)
        const { ok, status, data } = await callApi(ONBOARDING_CHECKLIST, { method: "POST", body })
        setLoading(false)
        if (!ok) {
            const msg = status === 403 ? "Only an admin-panel user can use customer onboarding" : errText(data, "Could not run the checklist")
            ErrorToaster(msg)
            setNotice({ phase: "error", text: label ? `${label}, but the checklist failed: ${msg}` : msg })
            return
        }
        setChecklist(data)
        if (jump) {
            activeRef.current = railKeyOf(data?.current_step)
            setActive(activeRef.current)
        }
        setNotice(outcomeOf(data, label))
    }, [customerId, cleanRoutes, weight])

    // when the wizard opens, or moves from /new to the customer just created: run the checklist, open at the first open step
    useEffect(() => {
        if (isNew) { opened.current = false; setChecklist(null); setActive("account"); return }
        if (opened.current) return
        opened.current = true
        runChecklist({ jump: !live })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId])

    const stepOf = (checkKey) => stepFrom(checklist, checkKey)
    const railStatus = (item) => {
        if (item.check) return stepOf(item.check)?.status
        if (item.key === "source") return Object.keys(checklist?.defaults_applied || {}).length ? "done" : undefined
        if (item.key === "complete") return live ? "done" : undefined
        return undefined
    }

    activeRef.current = active
    const activeItem = [...RAIL, ...MANAGE_RAIL].find((r) => r.key === active) || RAIL[0]
    const activeIndex = RAIL.findIndex((r) => r.key === active)
    const activeStatus = railStatus(activeItem)
    const embedded = { hideHeader: true }

    // Each step answers with { checks, fix } (two cards: what the checks say, and where to fix it)
    // or { full } (one wide card, for steps that are a screen of their own).
    // opens the popup that copies this step's data from the default setup
    const copyButton = <Button size="sm" color="secondary" title="Copy this from the default setup" onClick={() => setDefaultsOpen(true)} className="flex items-center gap-1 whitespace-nowrap">Copy default</Button>

    const panel = () => {
        if (isNew) {
            if (active === "account") {
                return { full: <AddUser onCreated={(id, nm) => navigate(`/customer-onboarding/${id}?name=${encodeURIComponent(nm || "")}`, { replace: true })} /> }
            }
            return { full: <p className="m-0 text-sm text-ink-muted">Create the customer in Account details first. This step opens once the customer exists.</p> }
        }
        switch (active) {
            case "account":
                return {
                    checks: <CheckList step={stepOf("account")} hideHead />,
                    // the customer's own edit form, filled in; fields the checks complain about are ringed
                    fix: <UpdateUser customerId={customerId} embedded highlight={highlightOf(stepOf("account"))} onSaved={() => runChecklist({ label: "Customer updated" })} extra={<AccountExtras customerId={customerId} onChanged={(m) => runChecklist({ label: m })} />} />,
                }
            case "documents":
                return {
                    checks: <CheckList step={stepOf("documents")} hideHead />,
                    // the documents list and uploader, open straight away (no popup)
                    fix: <CustomerDocumentsModal inline customer={docCustomer} onChanged={() => runChecklist({ label: "Documents updated" })} />,
                }
            case "source":
                return { full: <DefaultsPicker fill customerId={customerId} onDone={() => runChecklist()} /> }
            case "pincodes":
            case "rates":
            case "product_config":
            case "vas":
            case "invoice_config": {
                const comp = DEFAULT_COMPONENT[active]
                return {
                    checks: (
                        <div className="flex flex-col gap-3">
                            {comp && <DefaultBadge applied={checklist?.defaults_applied?.[comp]} />}
                            <CheckList step={stepOf(active)} hideHead />
                        </div>
                    ),
                    // top right of the Checks card, only when this component started from the default
                    checksAction: comp && Object.keys(checklist?.defaults_applied?.[comp] || {}).length > 0
                        ? <Button size="sm" color="secondary" className="whitespace-nowrap" onClick={() => setReset({ only: comp })}>Reset to default</Button>
                        : null,
                    fix: (
                        <div className="flex min-h-0 flex-1 flex-col gap-1">
                            {comp && active !== "pincodes" && active !== "rates" && active !== "product_config" && active !== "vas" && <div>{copyButton}</div>}
                            {active === "pincodes" && <CorporatePincodeUpload externalCustomer={customer} {...embedded} extraActions={copyButton} onChanged={(m) => runChecklist({ label: m })} />}
                            {active === "rates" && <CorporateRateUpload externalCustomer={customer} {...embedded} extraActions={copyButton} onChanged={(m) => runChecklist({ label: m })} />}
                            {active === "product_config" && <CustomerProductConfig externalCustomerId={customer.id} externalCustomerName={customer.name} {...embedded} extraActions={copyButton} onChanged={(m) => runChecklist({ label: m })} />}
                            {active === "vas" && <VASConfig externalCustomerId={customer.id} externalCustomerName={customer.name} {...embedded} extraActions={copyButton} onChanged={(m) => runChecklist({ label: m })} />}
                            {active === "invoice_config" && <InvoiceConfig externalCustomer={customer} customerOptions={[customer]} {...embedded} onChanged={(m) => runChecklist({ label: m })} />}
                        </div>
                    ),
                }
            }
            case "payment":
                return {
                    checks: (
                        <div className="flex flex-col gap-3">
                            <CheckList step={stepOf("payment")} hideHead />
                            <p className="m-0 text-sm text-ink-muted">Postpaid, or prepaid with a wallet balance above 0.</p>
                        </div>
                    ),
                    fix: (
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" color={payPanel === "edit" ? "primary" : "secondary"} className="whitespace-nowrap" onClick={() => setPayPanel(payPanel === "edit" ? null : "edit")}>Edit customer (postpaid)</Button>
                                <Button size="sm" color={payPanel === "wallet" ? "primary" : "secondary"} className="whitespace-nowrap" onClick={() => { setCreditSignal(0); setPayPanel(payPanel === "wallet" ? null : "wallet") }}>Wallet top-up</Button>
                                {payPanel === "wallet" && <Button size="sm" color="primary" className="whitespace-nowrap" onClick={() => setCreditSignal((n) => n + 1)}>+ Add Credit</Button>}
                            </div>
                            {payPanel === "edit" && <UpdateUser customerId={customerId} embedded showPostpaid onSaved={() => { setPayPanel(null); runChecklist({ label: "Payment mode updated" }) }} />}
                            {payPanel === "wallet" && <WalletManualCredit externalCustomer={customer} openAddSignal={creditSignal} onChanged={() => runChecklist({ label: "Credit added" })} />}
                        </div>
                    ),
                }
            case "review":
                return {
                    full: (
                        <ReviewStep
                            customerId={customerId}
                            checklist={checklist}
                            loading={loading}
                            routes={routes}
                            setRoutes={setRoutes}
                            weight={weight}
                            setWeight={setWeight}
                            onRun={() => runChecklist()}
                        />
                    ),
                }
            case "complete":
                return {
                    full: (
                        <CompleteStep
                            customerId={customerId}
                            checklist={checklist}
                            testRoutes={cleanRoutes}
                            testWeight={weight}
                            onChecklist={setChecklist}
                            onLive={() => setLive(true)}
                        />
                    ),
                }
            case "credentials":
                return { full: <ResendCredentials customerId={customerId} /> }
            case "history":
                return { full: <EmailHistory customerId={customerId} /> }
            case "logins":
                return { full: <Logins customerId={customerId} /> }
            default:
                return { full: null }
        }
    }

    const body = panel()
    // on desktop the stepper, title and checks stay put and each card scrolls on its own; on small screens the page scrolls
    const cardCls = "min-w-0 rounded-md border border-white/8 bg-surface p-4 lg:min-h-0 lg:overflow-y-auto"

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title={isNew ? "New Customer" : "Customer Onboarding"}
                subTitle={isNew ? "Fill in the account details, then continue with the checklist." : `${name}${live ? " - live" : ""}`}
                extraFields={(
                    <div className="flex items-center gap-2">
                        {!isNew && (
                            <Button size="sm" color="primary" onClick={() => runChecklist()} disabled={loading} title="Refresh checklist" aria-label="Refresh checklist">
                                <RefreshCw size={15} aria-hidden="true" className={loading ? "animate-spin" : ""} />
                            </Button>
                        )}
                        <Link to="/customer-onboarding" className="btn btn-sm btn-primary">All customers</Link>
                    </div>
                )}
            />

            <div className="page-fit-body relative z-10 flex flex-col gap-2 overflow-y-auto pb-1 lg:overflow-hidden">
                <div className="relative shrink-0 overflow-hidden rounded-md border border-white/8 bg-surface px-3 pb-3 pt-4">
                    <Stepper items={RAIL} active={active} statusOf={railStatus} onSelect={setActive} locked={isNew} />
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 lg:flex-nowrap">
                        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                            <h6 className="m-0 text-sm font-bold">{activeIndex >= 0 ? `${activeIndex + 1}. ` : ""}{activeItem.title}</h6>
                            {activeStatus && (
                                <span className="rounded-full border px-2 py-0.5 text-xs font-semibold" style={{ color: STEP_COLOR[activeStatus], borderColor: STEP_COLOR[activeStatus] }}>
                                    {STATUS_LABEL[activeStatus] || activeStatus}
                                </span>
                            )}
                        </div>
                        {/* after go-live: the manage buttons share the title's line, pushed to the right */}
                        {live && (
                            <div className="flex flex-wrap items-center gap-2 border-l border-white/8 pl-4 lg:ml-auto lg:flex-nowrap">
                                <span className="whitespace-nowrap text-xs font-semibold text-ink-muted">After go-live</span>
                                {MANAGE_RAIL.filter((r) => r.key !== "reset").map((r) => (
                                    <Button key={r.key} size="sm" className="whitespace-nowrap" color={active === r.key ? "primary" : "secondary"} onClick={() => (r.key === "reset" ? setReset({ only: "" }) : setActive(r.key))}>{r.short}</Button>
                                ))}
                            </div>
                        )}
                        {/* legend: a "!" icon; hover or focus it to see what each step icon means */}
                        <span className={live ? "" : "lg:ml-auto"}><LegendTip /></span>
                    </div>
                    {!isNew && <LoaderEdge notice={notice} />}
                </div>

                {body.full !== undefined ? (
                    // Setup source: the card itself must not scroll; the table inside does (fixed header)
                    <section className={`${cardCls} lg:flex-1 ${active === "source" && !isNew ? "lg:flex lg:flex-col lg:overflow-y-hidden !p-0" : ""}`}>{body.full}</section>
                ) : (
                    <div className={`grid grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 ${checksHidden ? "lg:grid-cols-[2.5rem_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)]"} lg:grid-rows-[minmax(0,1fr)]`}>
                        {checksHidden ? (
                            <section className={`${cardCls} flex items-start justify-center !px-0 !py-2`}>
                                <button type="button" title="Show checks" aria-label="Show checks" onClick={() => setChecksHidden(false)} className="flex flex-col items-center gap-2 border-0 bg-transparent p-1 text-ink-muted hover:text-ink">
                                    <ChevronRight size={16} aria-hidden="true" />
                                    <span className="text-xs font-semibold [writing-mode:vertical-rl]">Checks</span>
                                </button>
                            </section>
                        ) : (
                        <section className={cardCls}>
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <h6 className="m-0 text-sm font-bold">Checks</h6>
                                <div className="flex items-center gap-2">
                                    {body.checksAction}
                                    <button type="button" title="Hide checks" aria-label="Hide checks" onClick={() => setChecksHidden(true)} className="inline-flex h-6 w-6 items-center justify-center rounded border-0 bg-transparent p-0 text-ink-muted hover:text-ink">
                                        <ChevronLeft size={16} aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                            {body.checks}
                            {!isNew && <StatusBar notice={notice} />}
                        </section>
                        )}
                        {/* Pincodes / Rates / Config / VAS: the card doesn't scroll and has no padding; only the table does */}
                        <section className={`${cardCls} ${DEFAULT_COMPONENT[active] ? "lg:flex lg:flex-col lg:overflow-y-hidden !p-0" : "!pt-2"}`}>
                            {body.fix}
                        </section>
                    </div>
                )}

                {/* Footer on every screen: Previous / Next move through the rail steps. Next waits until the
                    customer exists (/new has only the account form). */}
                <div className="flex shrink-0 items-center justify-between gap-2">
                    <Button
                        size="sm"
                        color="secondary"
                        outline
                        disabled={isNew || (activeIndex <= 0 && activeIndex !== -1)}
                        onClick={() => setActive(activeIndex === -1 ? "complete" : RAIL[activeIndex - 1].key)}
                    >
                        <ChevronLeft size={14} aria-hidden="true" />Previous
                    </Button>
                    <span className="text-xs text-ink-muted">
                        {activeIndex >= 0 ? `Step ${activeIndex + 1} of ${RAIL.length}` : activeItem.short}
                    </span>
                    <Button
                        size="sm"
                        color="primary"
                        disabled={isNew || activeIndex === -1 || activeIndex >= RAIL.length - 1}
                        onClick={() => setActive(RAIL[activeIndex + 1].key)}
                    >
                        Next<ChevronRight size={14} aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <Modal isOpen={!!reset} toggle={() => setReset(null)} size="lg" centered className="flex max-h-[85vh] flex-col">
                <ModalHeader toggle={() => setReset(null)}>Reset to default{reset?.only ? ` (${reset.only})` : ""}</ModalHeader>
                <ModalBody className="overflow-y-auto !pb-0">
                    {reset && (
                        <DefaultsPicker
                            customerId={customerId}
                            replace
                            only={reset.only || undefined}
                            stickyActions
                            onDone={() => { setReset(null); runChecklist({ label: "Reset to default done" }) }}
                        />
                    )}
                </ModalBody>
            </Modal>

            <Modal isOpen={defaultsOpen && !!DEFAULT_COMPONENT[active]} toggle={() => setDefaultsOpen(false)} size="lg" centered className="flex max-h-[85vh] flex-col">
                <ModalHeader toggle={() => setDefaultsOpen(false)}>Copy {activeItem.short?.toLowerCase()} from the default setup</ModalHeader>
                <ModalBody className="overflow-y-auto !pb-0">
                    <DefaultsPicker
                        key={active}
                        customerId={customerId}
                        only={DEFAULT_COMPONENT[active]}
                        stickyActions
                        onDone={() => { setDefaultsOpen(false); runChecklist({ label: "Defaults copied" }) }}
                    />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default Wizard
