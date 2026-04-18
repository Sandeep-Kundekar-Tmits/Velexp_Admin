---
phase: manual-review
reviewed: 2026-04-15T08:02:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/pages/NewFeatures/InvoiceFlow.jsx
  - src/components/Common/SearchableDropdown.jsx
  - src/hooks/useDeleteApiCall.jsx
  - src/pages/NewFeatures/CorporateBilling.jsx
findings:
  critical: 0
  warning: 8
  info: 7
  total: 15
status: issues_found
---

# Code Review Report

**Reviewed:** 2026-04-15T08:02:00Z  
**Depth:** standard  
**Files Reviewed:** 4  
**Status:** issues_found

---

## Summary

Reviewed four files covering the corporate billing / invoice feature area.
No critical security holes (no SQL injection, no hardcoded secrets, no eval / dangerouslySetInnerHTML).
The main concerns are:

1. **Unhandled async errors** — several `axios` & API calls lack try/catch, which will surface as unhandled promise rejections in the browser.
2. **Stale-closure / direct array mutation** — inline item-edit handlers mutate a spread copy while reading stale `item.*` values from the outer closure instead of `newItems[idx].*`.
3. **`setError` used on an undeclared identifier** — in `CorporateBilling.jsx` the `error` identifier is the hook-returned state value, calling `setError()` on it is a no-op at best and a runtime crash at worst.
4. Several debug `console.log` calls and commented-out code blocks remain in production code.

---

## Warnings

### WR-01: Unhandled promise rejection in `handleEditInvoice`

**File:** `src/pages/NewFeatures/InvoiceFlow.jsx:189-197`  
**Issue:** `apiGet(...)` is awaited but not wrapped in try/catch. A network error will crash silently (unhandled rejection) and the spinner will stay stuck at `editLoading = true` if the finally pattern is ever adjusted.  
**Fix:**
```js
const handleEditInvoice = async (invoice) => {
    setEditLoading(true)
    try {
        const result = await apiGet(`${CORPORATE_INVOICE_BASE}${invoice.id}/`)
        if (result) {
            setCurrentInvoice(result)
            setIsEditModalOpen(true)
        }
    } catch (err) {
        ErrorToaster("Failed to load invoice details")
    } finally {
        setEditLoading(false)
    }
}
```

---

### WR-02: Unhandled promise rejection in `handleUpdateInvoice`

**File:** `src/pages/NewFeatures/InvoiceFlow.jsx:199-207`  
**Issue:** `axios.patch(...)` has no try/catch. Any network or 4xx/5xx error will surface as an unhandled rejection; the user gets no feedback.  
**Fix:**
```js
const handleUpdateInvoice = async () => {
    if (!currentInvoice) return
    try {
        const result = await axios.patch(
            `${CORPORATE_INVOICE_BASE}${currentInvoice.id}/update/`,
            currentInvoice
        )
        if (result.data) {
            SuccessToaster("Invoice updated")
            setIsEditModalOpen(false)
            loadInvoices()
        }
    } catch (err) {
        ErrorToaster(err.response?.data?.message || "Failed to update invoice")
    }
}
```

---

### WR-03: Unhandled promise rejection in `handleDeleteItem`

**File:** `src/pages/NewFeatures/InvoiceFlow.jsx:209-219`  
**Issue:** Both `axios.delete(...)` and `apiGet(...)` are called without try/catch inside an async function.  
**Fix:** Wrap the entire body in try/catch and call `ErrorToaster` in the catch block, similar to WR-01 above.

---

### WR-04: Stale-closure bug in item-row total recalculation

**File:** `src/pages/NewFeatures/InvoiceFlow.jsx:835-884` (freight/cgst/sgst/igst onChange handlers)  
**Issue:** The total for a row is recalculated using **stale closure values** from `item.*` (the prop at render-time) instead of the newly mutated `newItems[idx].*`. This means editing freight while also having edited cgst won't see the updated cgst.  
**Fix:** Always read from `newItems[idx]` after applying the current field's update:
```js
// Inside freight onChange:
const newItems = [...currentInvoice.items]
newItems[idx] = { ...newItems[idx] }          // shallow-clone the row first
newItems[idx].freight = parseFloat(e.target.value) || 0
newItems[idx].total = newItems[idx].freight + (newItems[idx].cgst || 0)
                    + (newItems[idx].sgst || 0) + (newItems[idx].igst || 0)
setCurrentInvoice({ ...currentInvoice, items: newItems })
```
Also note: the spread `[...currentInvoice.items]` gives a new array but the **objects inside are still shared references**. Mutating `newItems[idx].origin = ...` directly mutates the original object. Always shallow-clone the row object first (`newItems[idx] = { ...newItems[idx] }`).

---

### WR-05: `setError` called on wrong identifier in `CorporateBilling`

**File:** `src/pages/NewFeatures/CorporateBilling.jsx:471`  
**Issue:** 
```js
const { apifunc: GetCorporateBilling, data: CoprorateBilling, loading: CorporateBillingLoading, error } = usePostApiCall()
```
`error` here is the state **value** returned by the hook (not a setter). Calling `setError(CorporateBillings)` on line 471 references `setError` which is **not declared anywhere in this component**, causing a `ReferenceError` at runtime on the failure path.  
**Fix:** Remove the erroneous `setError` call. If error display is needed, use the `error` state from the hook directly in the JSX, or show an `ErrorToaster`:
```js
// Remove line 471: setError(CorporateBillings)
// Replace with:
ErrorToaster("Failed to load billing data")
setBilling([])
```

---

### WR-06: Missing validation guard — date range not enforced before API call

**File:** `src/pages/NewFeatures/CorporateBilling.jsx:450-452`  
**Issue:** The `alert("select the data range")` on line 451 does **not have a `return` statement**, so execution continues and the API is called with `null` dates.
```js
if (!selectedRange.startDate || !selectedRange.endDate) {
    alert("select the data range")
    // ← missing return here
}
```
**Fix:**
```js
if (!selectedRange.startDate || !selectedRange.endDate) {
    alert("select the data range")
    return   // ← add this
}
```

---

### WR-07: `handleClickOutside` recreated on every render — stale ref risk

**File:** `src/components/Common/SearchableDropdown.jsx:16-27`  
**Issue:** `handleClickOutside` is defined as a plain function inside the component body. The `useEffect` at line 22 registers it once (empty dep array) but captures the initial function reference. While functional here (it only reads `dropdownRef.current` which is stable), this pattern is fragile and can break if the function ever reads other state. The function also isn't memoised.  
**Fix:** Move the handler into the `useEffect` so the registered closure is always fresh, or wrap with `useCallback`:
```js
useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowInputDropdown(false)
        }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])
```

---

### WR-08: `loadInvoices` used in `useEffect` without being in dependency array

**File:** `src/pages/NewFeatures/InvoiceFlow.jsx:76-85`  
**Issue:**
```js
useEffect(() => {
    if (activeTab === "2") {
        loadInvoices()
    }
}, [activeTab, selectedCustomer])  // loadInvoices missing
```
`loadInvoices` is declared inside the component and closes over `fetchInvoices` / `selectedCustomer`. React's exhaustive-deps rule requires it in the array. In practice this works now, but if `loadInvoices` ever captures other state it will silently use stale values.  
**Fix:** Either include `loadInvoices` in the dep array and wrap it with `useCallback`, or inline the logic.

---

## Info

### IN-01: Multiple debug `console.log` calls in production code

**File:** `src/pages/NewFeatures/CorporateBilling.jsx:297, 317, 359, 360, 366, 454`  
**Issue:** Six `console.log` calls remain (some even duplicated: lines 359 & 360 are identical). These leak internal payload data to the browser console.  
**Fix:** Remove all `console.log` calls, or replace with a project-level debug utility that can be disabled in production.

---

### IN-02: Commented-out code blocks

**File:** `src/pages/NewFeatures/CorporateBilling.jsx:237, 255-260, 302-315, 319`  
**Issue:** Multiple large commented-out blocks remain. They increase cognitive noise and suggest dead code.  
**Fix:** Delete commented-out code; version control (git) preserves history.

---

### IN-03: Duplicate `requiredPayload` log

**File:** `src/pages/NewFeatures/CorporateBilling.jsx:359-360`  
**Issue:** `console.log(requiredPayload, "requiredPayload")` is duplicated on two consecutive lines.  
**Fix:** Delete both lines.

---

### IN-04: Variable shadowing — `value` inside `onClick`

**File:** `src/components/Common/SearchableDropdown.jsx:115`  
**Issue:** Inside the `onClick` of each dropdown item, a local `const value = info.name` shadows the outer `value` prop. Although harmless here (the outer `value` prop is still readable via closure), it is confusing naming.  
**Fix:** Rename the local variable: `const selectedName = info.name`.

---

### IN-05: Array index used as `key` in list

**File:** `src/components/Common/SearchableDropdown.jsx:111`  
**Issue:** `key={idx}` is used for list items. If the list order changes (e.g., after search filtering), React may reuse DOM nodes incorrectly.  
**Fix:** Use a stable unique identifier: `key={info.id ?? info.name}`.

---

### IN-06: `ToasterProvider()` called as a plain function inside component body

**File:** `src/pages/NewFeatures/InvoiceFlow.jsx:25` and `CorporateBilling.jsx:30`  
**Issue:** `ToasterProvider()` is called directly in the component body without `useContext` or a hook pattern. If this is a custom hook it should be named `useToasterProvider` per the Rules of Hooks convention. If it internally calls React hooks, calling it like a plain function works but is fragile and can suppress lint warnings.  
**Fix:** Rename to `useToasterProvider` and document it as a hook.

---

### IN-07: `usePDF` timeout option is non-standard

**File:** `src/pages/NewFeatures/CorporateBilling.jsx:26-28`  
**Issue:** `timeout: 30000` is passed inside the `page` option of `usePDF`. The `react-to-pdf` library's `page` option does not accept a `timeout` field — it will be silently ignored.  
**Fix:** Remove the `timeout` field, or check the library's actual API for controlling render delay.

---

_Reviewed: 2026-04-15T08:02:00Z_  
_Reviewer: gsd-code-reviewer (Antigravity)_  
_Depth: standard_
