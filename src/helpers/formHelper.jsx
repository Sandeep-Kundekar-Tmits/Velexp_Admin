export function getModifiedFields(original, updated, path = '') {
    const changes = {};

    // Get all keys from both objects
    const allKeys = new Set([
        ...Object.keys(original || {}),
        ...Object.keys(updated || {})
    ]);

    for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;

        // Handle cases where original or updated might be null/undefined
        const originalVal = original ? original[key] : undefined;
        const updatedVal = updated ? updated[key] : undefined;

        // If both values are objects and not null, recurse
        if (typeof originalVal === 'object' && originalVal !== null &&
            typeof updatedVal === 'object' && updatedVal !== null &&
            !(originalVal instanceof File) && !(updatedVal instanceof File)) {
            const nestedChanges = getModifiedFields(originalVal, updatedVal, currentPath);
            if (Object.keys(nestedChanges).length > 0) {
                changes[key] = nestedChanges;
            }
        }
        // Primitive values or objects being replaced with non-objects
        else if (!deepEqual(originalVal, updatedVal)) {
            changes[key] = updatedVal;
        }
    }

    return changes;
}

// Helper function for deep equality check
function deepEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return a === b;

    // Handle Date comparison
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
            return false;
        }
    }

    return true;
}

// Confirm-changes list: one flat table, one row per changed field (old value struck through, new value after).
// Nested changes (addresses, franchise profile) are flattened into "Group / field" labels.
const labelOf = (key) => String(key).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const isFileLike = (v) => v instanceof File || (v && typeof v === 'object' && v.name && v.size !== undefined && v.type !== undefined);

const showValue = (v) => {
    if (v === null || v === undefined || v === '' || v === 'null') return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (isFileLike(v)) return `${v.name} (${(v.size / 1024).toFixed(1)} KB)`;
    if (typeof v === 'object') return v.name || v.label || v.type_of_cust || JSON.stringify(v);
    return String(v);
};

const flattenChanges = (changes, original, trail = []) => {
    const rows = [];
    Object.entries(changes || {}).forEach(([key, value]) => {
        const oldVal = original ? original[key] : undefined;
        const plainObject = value && typeof value === 'object' && !Array.isArray(value) && !isFileLike(value);
        // arrays index their items ("0"): that level adds nothing to the label
        const label = /^\d+$/.test(key) ? trail : [...trail, labelOf(key)];
        if (plainObject) {
            rows.push(...flattenChanges(value, oldVal && typeof oldVal === 'object' ? oldVal : null, label));
        } else {
            rows.push({ label: label.join(' / '), oldVal, newVal: value });
        }
    });
    return rows;
};

export function renderUpdatedDataJSX(updatedData, original) {
    const rows = flattenChanges(updatedData, original);
    if (rows.length === 0) {
        return <p className="m-0 py-3 text-center text-sm text-ink-muted">No changes yet.</p>;
    }
    return (
        <div className="max-h-[55vh] overflow-y-auto">
            <p className="mb-2 mt-0 text-xs text-ink-muted">{rows.length} field{rows.length === 1 ? '' : 's'} will be updated.</p>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs text-ink-muted">
                        <th className="w-1/3 pb-1 pr-3 font-semibold">Field</th>
                        <th className="pb-1 font-semibold">Change</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={`${r.label}-${i}`} className="border-t border-white/8 align-top">
                            <td className="py-1.5 pr-3 font-semibold">{r.label}</td>
                            <td className="break-words py-1.5">
                                {r.oldVal !== undefined && showValue(r.oldVal) !== showValue(r.newVal) && (
                                    <><span className="text-ink-muted line-through">{showValue(r.oldVal)}</span><span className="mx-1.5 text-ink-muted" aria-hidden="true">&rarr;</span></>
                                )}
                                <span className="font-semibold text-brand-300">{showValue(r.newVal)}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
