// Search box for the customer service user of a Corporate customer. Types, waits ~300 ms, then asks
// GET /api/admin-panel/customer-service-users/lookup/?q=&limit=20 (matches username, name or customer name).
// Picking a row sets the user id (sent as customer_service_user).
import { useEffect, useRef, useState } from "react"
import PropTypes from "prop-types"
import { Input, Spinner } from "@/components/ui"
import { authFetch } from "@/lib/http"
import { CUSTOMER_SERVICE_LOOKUP } from "../../api"

const DEBOUNCE_MS = 300

// savedName: the name already stored for `value` (edit form), shown until someone else is picked
const CustomerServicePicker = ({ value, onChange, invalid, savedName }) => {
    const [picked, setPicked] = useState(null)
    const [text, setText] = useState("")
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState([])
    const [failed, setFailed] = useState("")
    const box = useRef(null)
    const seq = useRef(0)

    // the form was reset from outside
    useEffect(() => { if (!value) { setPicked(null); setText("") } }, [value])

    useEffect(() => {
        if (!open) return undefined
        const id = ++seq.current
        const t = setTimeout(async () => {
            setLoading(true)
            setFailed("")
            try {
                const q = text.trim()
                const res = await authFetch(`${CUSTOMER_SERVICE_LOOKUP}?limit=20${q ? `&q=${encodeURIComponent(q)}` : ""}`)
                const data = await res.json().catch(() => ({}))
                if (id !== seq.current) return
                if (!res.ok) {
                    setResults([])
                    setFailed(res.status === 403 ? "You do not have access to search customer service users" : "Could not load customer service users")
                } else {
                    setResults(Array.isArray(data?.results) ? data.results : [])
                }
            } catch {
                if (id === seq.current) { setResults([]); setFailed("Could not load customer service users") }
            } finally {
                if (id === seq.current) setLoading(false)
            }
        }, DEBOUNCE_MS)
        return () => clearTimeout(t)
    }, [text, open])

    useEffect(() => {
        const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
        document.addEventListener("mousedown", close)
        return () => document.removeEventListener("mousedown", close)
    }, [])

    const pick = (u) => {
        setPicked(u)
        setText(`${u.username} - ${u.name}`)
        onChange(u.id)
        setOpen(false)
    }

    return (
        <div ref={box} className="relative">
            <Input
                type="text"
                autoComplete="off"
                value={text}
                invalid={invalid}
                placeholder="Search by employee code or name"
                onFocus={() => setOpen(true)}
                onChange={(e) => {
                    setText(e.target.value)
                    setPicked(null)
                    setOpen(true)
                    onChange("") // typed but not picked: nobody is chosen yet
                }}
            />
            {value && !picked && savedName && <div className="mt-1 text-xs text-success-500">✓ {savedName}</div>}
            {value && picked && <div className="mt-1 text-xs text-success-500">✓ {picked.name}{picked.email ? ` (${picked.email})` : ""}</div>}
            {!value && text.trim() && !open && <div className="mt-1 text-xs text-warning-500">Pick a person from the list to select them</div>}
            {open && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-white/10 bg-surface shadow-lg">
                    {loading && <div className="px-3 py-2 text-sm text-ink-muted"><Spinner size="sm" /> Searching...</div>}
                    {!loading && failed && <div className="px-3 py-2 text-sm text-danger-500">{failed}</div>}
                    {!loading && !failed && results.length === 0 && <div className="px-3 py-2 text-sm text-ink-muted">No matching customer service user</div>}
                    {!loading && results.map((u) => (
                        <button type="button" key={u.id} className="block w-full px-3 py-2 text-left text-sm hover:bg-white/5" onClick={() => pick(u)}>
                            {u.username} – {u.name}{u.email ? ` (${u.email})` : ""}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

CustomerServicePicker.propTypes = {
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onChange: PropTypes.func.isRequired,
    invalid: PropTypes.bool,
    savedName: PropTypes.string,
}

export default CustomerServicePicker
