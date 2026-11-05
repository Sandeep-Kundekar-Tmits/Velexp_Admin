// Customer dropdown, the same one as the Bill Master header: the corporate / franchise customer list,
// shown as "Customer Name - username", with a search box inside the dropdown.
// Value is { value: <user id>, label: "Customer Name - username" }.
import { useEffect, useMemo, useState } from "react"
import PropTypes from "prop-types"
import SearchableDropdown from "../../../components/Common/SearchableDropdown"
import { loadCustomers } from "./customers"

const CustomerSelect = ({ value, onChange, placeholder = "Select Customer" }) => {
    const [options, setOptions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        loadCustomers().then((list) => {
            if (cancelled) return
            setOptions(list)
            setLoading(false)
        })
        return () => { cancelled = true }
    }, [])

    const display = useMemo(() => (value ? value.label : "select"), [value])

    return (
        <SearchableDropdown
            locations={options}
            value={display}
            onChange={(opt) => onChange(opt ? { value: opt.id, label: opt.label } : null)}
            placeholder={loading ? "Loading..." : placeholder}
        />
    )
}

CustomerSelect.propTypes = {
    value: PropTypes.shape({ value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), label: PropTypes.string }),
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
}

export default CustomerSelect
