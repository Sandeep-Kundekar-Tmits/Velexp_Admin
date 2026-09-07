# RTO Booking Flow — Frontend Integration Guide

Covers the new CS-approval step in front of RTO booking. Three calls, in order:

1. CS flags a shipment `RTO_APPROVAL` — `POST /bulk-set-shipment-flag/`
2. Ops sees approved shipments on the RTO screen — `POST /pending_booked_rto/`
3. Ops books the RTO — `POST /corporate-bulk-booking/` (existing endpoint, now gated)

All three are on the main API host (`https://velexp.com` / `https://uat.velexp.com`), no extra path prefix.

---

## 1. CS: set or clear the shipment flag

`POST /bulk-set-shipment-flag/`

CS uses this to mark a shipment `RTO_APPROVAL` (or `RTS_PENDING` / `WRONG_AWB` / `PRIORITY` — only
one value can be active on a shipment at a time; setting a new one replaces whatever was there).

**Request**
```json
{
  "awbno_list": ["VE100123456", "VE100123457"],
  "shipment_flag": "RTO_APPROVAL",
  "remark": "Customer confirmed return via call",
  "employee_id": 42
}
```
- `awbno_list` — required. Array of AWB strings. (Also accepts `[{"awbno": "..."}]` objects, but plain strings are simplest.)
- `shipment_flag` — one of `"RTS_PENDING"`, `"RTO_APPROVAL"`, `"WRONG_AWB"`, `"PRIORITY"`. Send `null` (or omit / empty string) to **clear** the flag instead.
- `remark` — required whenever `shipment_flag` is being set (not required when clearing). Free text, shown back wherever the flag is displayed.
- `employee_id` — required. The logged-in CS user's `Employee.id` (same id used elsewhere in the app, e.g. the hard-delete-status endpoints).

**Response — 200**
```json
{
  "status": "success",
  "shipment_flag": "RTO_APPROVAL",
  "updated": ["VE100123456"],
  "not_found": [],
  "skipped": [
    { "awbno": "VE100123457", "reason": "Already delivered (SPD) -- RTO_APPROVAL not applicable" }
  ],
  "summary": {
    "requested_count": 2,
    "updated_count": 1,
    "not_found_count": 0,
    "skipped_count": 1
  }
}
```
- `updated` — AWBs that got the flag applied.
- `not_found` — AWBs with no matching booking.
- `skipped` — found, but rejected for a business reason (currently: `RTS_PENDING`/`RTO_APPROVAL` refused on an already-delivered AWB). Show `reason` to the user.

**Response — 400** (validation error, nothing applied)
```json
{ "status": "error", "message": "remark is required when setting a flag." }
```
Other 400 messages: `"employee_id is required."`, `"Employee not found."`, `"awbno_list is required"`, `"Invalid shipment_flag '...'. Must be one of [...], or null to clear."`

---

## 2. Ops: view shipments approved for RTO

`POST /pending_booked_rto/`

Existing screen/endpoint — one new key added to its response, `rto_approved`.

**Request** (unchanged)
```json
{
  "service_center": "ABN",
  "from_date": "2026-08-01",
  "to_date": "2026-08-21"
}
```
`from_date`/`to_date` are optional (default: last 7 days) and only affect `booked_rto` — they do **not** filter `pending_rto` or `rto_approved`, both of which always show everything currently outstanding.

**Response**
```json
{
  "pending_rto": [ { "awbno": "...", "status": "RTS", "status_date": "...", "RTO_awbno": null, "created_by": "..." } ],
  "booked_rto":  [ { "awbno": "...", "status_date": "...", "RTO_awbno": "VR100...", "created_by": "..." } ],
  "rto_approved": [
    {
      "awbno": "VE100123456",
      "flag_remark": "Customer confirmed return via call",
      "flag_updated_by": "EMP042",
      "flag_updated_at": "2026-09-05T10:15:00Z",
      "current_status": "SAD",
      "current_service_center": "ABN"
    }
  ]
}
```
- `rto_approved` is scoped the same way as the other two lists: only shipments *currently sitting at* the requested `service_center` are shown (matched via the shipment's latest tracking event, not the CS flag itself — CS can flag from anywhere, but it only shows up here once the shipment is physically at that SC).
- An AWB disappears from `rto_approved` automatically once RTO booking (step 3) succeeds for it — no separate "un-approve" call needed after a successful booking.

---

## 3. Ops: book the RTO

`POST /corporate-bulk-booking/`

Existing endpoint, used for both forward bulk bookings and RTO bookings — RTO bookings are
distinguished by sending a **single JSON object** (not an array) with `"RTO_booking": true`.

**Request**
```json
{
  "RTO_booking": true,
  "Awbno": "VE100123456",
  "rto_scan_awbno": "VR100987654",
  "booked_by_id": 42
}
```
- `Awbno` — the **original** forward shipment's AWB (must currently have `shipment_flag == "RTO_APPROVAL"` — see below).
- `rto_scan_awbno` — the new AWB assigned/scanned for the return leg. Must not already exist as a booking.
- `booked_by_id` — optional, the booking employee's id.

**New behavior**: this call is now rejected unless the original AWB has `shipment_flag == "RTO_APPROVAL"` set via step 1. This is the enforcement point — CS approval is mandatory before ops can book an RTO here.

**Response — success (200)**

A JSON **array** (even for a single AWB):
```json
[
  {
    "status": "success",
    "message": {
      "AWBNumber": "VR100987654",
      "Orderid": "...",
      "Status": "success",
      "Reason": "RTO Shipment Booked",
      "CustomerRefNo": "...",
      "Original_AWBNumber": "VE100123456",
      "RTO_AWBNumber": "VR100987654"
    }
  }
]
```
(A multipiece original AWB returns one array entry per piece.)

**Response — rejected, not approved (404)**
```json
{ "status": "error", "message": "AWB No. VE100123456 is not flagged RTO_APPROVAL by CS -- RTO booking not allowed." }
```
Show this verbatim (or a friendlier wrapper) and point the user back to step 1 — this is the expected error when someone tries to book an RTO before CS has approved it.

**Other pre-existing 400 errors** (unrelated to the new gate, but worth handling the same way):
- `"rto_scan_awbno is required for RTO booking"`
- `"RTO Booking already exists for this AWB No."`
- `"A booking already exists with RTO scan AWB No. <awb>"`
- `"Original booking not found for AWB No. <awb>"` (404)

---

## Suggested UI flow

1. CS-facing screen: search/select AWB(s) → "Mark for RTO" action → calls step 1 with `shipment_flag: "RTO_APPROVAL"` and a required remark field.
2. Ops "Pending/Booked RTO" screen: add a third tab/section for `rto_approved` (alongside existing Pending/Booked tabs), showing `flag_remark` / `flag_updated_by` / `flag_updated_at` / `current_status`.
3. From that `rto_approved` row, an action button ("Book RTO") opens the existing RTO-booking form (step 3), pre-filled with `Awbno` from the row. On the 404 "not flagged" error, this shouldn't normally happen from this screen — treat it as a stale-list/race condition (someone else already booked it or cleared the flag) and refresh the list.
