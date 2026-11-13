// After a failed validation: scroll to the first field that shows an error and focus it.
// A field shows an error through a red border (inputs, selects) or a red message under it.
const SELECTOR = ".border-danger-500, [aria-invalid='true'], div.text-danger-500, small.text-danger-500, p.text-danger-500"

export const scrollToFirstError = (root = document) => {
    // wait for React to paint the error state
    setTimeout(() => {
        const hit = [...root.querySelectorAll(SELECTOR)].find((el) => el.matches(".border-danger-500, [aria-invalid='true']") || el.textContent.trim())
        if (!hit) return
        hit.scrollIntoView({ block: "center", behavior: "smooth" })
        // a message is not focusable: focus the input in the same group
        const target = hit.matches("input, select, textarea") ? hit : hit.closest(".mb-3, .form-group, [class*='FormGroup']")?.querySelector("input, select, textarea") || hit.parentElement?.querySelector("input, select, textarea")
        target?.focus?.({ preventScroll: true })
    }, 60)
}
