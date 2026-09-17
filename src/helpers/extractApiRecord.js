// The backend's *-get-detail/ endpoints don't have a documented response envelope
// (no sample response in the API doc, only the request body), so unwrap defensively
// instead of assuming one fixed shape like { results: {...} }.
export const extractApiRecord = (payload, keyHints = []) => {
    const looksLikeRecord = (obj) =>
        obj && typeof obj === "object" && !Array.isArray(obj) &&
        keyHints.some((key) => obj[key] !== undefined && obj[key] !== null && obj[key] !== "");

    if (looksLikeRecord(payload)) return payload;

    const candidates = [payload?.data, payload?.result, payload?.results];
    for (const candidate of candidates) {
        if (!candidate) continue;
        if (Array.isArray(candidate)) {
            if (candidate[0]) return candidate[0];
            continue;
        }
        if (looksLikeRecord(candidate)) return candidate;
        if (candidate?.results) {
            const inner = Array.isArray(candidate.results) ? candidate.results[0] : candidate.results;
            if (inner) return inner;
        }
    }
    return payload || {};
};
