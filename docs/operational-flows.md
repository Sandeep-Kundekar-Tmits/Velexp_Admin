# Operational Flows

Step-by-step reference for multi-screen setup tasks in the admin panel —
things that need several pages done in a specific order to produce usable
data (a new service centre that actually has pincodes and staff, not just an
empty row in a list).

Written to be run by hand in the UI. Each flow lists the exact menu path,
button labels and required fields as they exist in the code today; if a
screen changes, update the flow here in the same change so it never drifts
out of sync with what's actually on screen.

New flows get their own `##` section below, in the same step-by-step format.

---

## Flow: Onboard a new Service Centre

Creates a service centre, gives it a pincode coverage area, and assigns an
employee to it. Each step depends on the one before it — do them in order.

**Menu path for every step below:** sidebar → **Ops Master**

### 1. Create the Service Centre

1. Ops Master → **Service Centres** (`/service-centres`).
2. Click **+ Add Service Centre** (top right).
3. Fill in the required fields (marked `*` on the form) — plus **Pincode**:
   - Service Centre Code
   - Company Name
   - City
   - State
   - Phone
   - **Pincode** — the form doesn't mark this `*`, but the backend rejects
     creation without it (confirmed live against UAT). Fill it in anyway.
   - (Everything else on the form — address, geo, operational sub-details —
     is genuinely optional at creation.)
4. Save. You're returned to the Service Centres list, where the new row now
   appears.

### 2. Assign pincodes to that Service Centre

1. Still on the Service Centres list, find the row for the centre you just
   created.
2. Click **Pincodes** on that row → opens `/service-centres/pincodes?sc=<code>`
   with that centre pre-selected. (You can also reach this page directly from
   the list without a row — it just starts with no centre selected.)
3. This page shows the pincodes *currently* assigned to the selected centre
   (empty for a brand-new one) and lets you assign more:
   - **Download** the template, fill in a `pincode` column, and **Upload** it,
     or
   - Pick **Add** mode to upsert the pincodes you upload without touching
     anything already assigned, or **Replace** mode to make the upload the
     complete new list (deactivates any pincode not in the file — confirm
     when prompted).
4. Submit. The table below refreshes to show the centre's active pincodes.

### 3. Create an employee assigned to that Service Centre

1. Ops Master → **Employee** (`/employees`).
2. Click **+ Add Employee** (top right).
3. Step through the 4-tab wizard:
   - **Employee Info** — required: Employee Code, First Name, Email, Status,
     Designation, and **Service Centre** (select the one from step 1 — this
     is what links the employee to that centre; it's multi-select, so one
     employee can belong to more than one centre). Also required here only
     when *adding* (not editing later): Username and Password.
   - **KYC** — optional at creation, can be filled in later via Edit Employee.
   - **Bank Details** and **Vehicles** — the wizard's own step components
     don't mark these required, but the backend does: confirmed live against
     UAT (`scripts/createTestServiceCentreAndEmployee.js`), creation fails
     without `bank_name`, `account_holder_name`, `account_number`,
     `ifsc_code`, `account_type` and `vehicle_number`, `vehicle_type`. Fill
     these in even though the UI doesn't flag them with `*`.
4. Save on the final (Vehicles) tab. You're returned to the Employee list,
   where the new employee now appears with the Service Centre from step 1.

**Result:** a service centre with a defined pincode coverage area and at
least one employee staffed to it — the minimum for it to be usable
end-to-end, not just a record that exists.

---

## Flow: Full setup — Service Centre, Corporate Pincode Coverage, and Rider Route

Everything in the flow above, plus two more capabilities that get set up
separately: a corporate customer's pincode serviceability, and a rider's
delivery route. Steps 4 and 5 are **independent** of steps 1–3 — they don't
require each other to exist first — but are grouped here because they're
commonly done together when bringing up a new area end-to-end.

### 1–3. Create the Service Centre, assign it pincodes, create an employee

Exactly the **Onboard a new Service Centre** flow above — do all three of
its steps first.

### 4. Assign pincodes in Corporate Pincode Upload

This is a **different kind of pincode assignment** than step 2 — step 2
sets which pincodes a *service centre* covers; this sets which pincodes a
*corporate customer* can ship to, per product, with per-pincode service
flags (pickup/deliver/COD/ODA/etc.). It isn't tied to the service centre
created in step 1.

1. Customers → **Corporate Pincode Upload** (`/corporate-pincode-upload`).
2. **Select Corporate Customer** (searchable dropdown — only customers whose
   type is Corporate or Franchise appear here).
3. Either:
   - **Download Template**, fill it in, then **File Upload (.xlsx)** it and
     click **Start Import**. Required columns: `pincode`, `city`, `state`,
     `region`, `legacy_zone`, `is_metro`, `zone_tag`, `service_provider`
     (`SELF` or `DELHIVERY`), `product` (must match one of the customer's
     existing products by name), `active`, `pickup`, `deliver`, `reverse`,
     `cod`, `pop`, `oda`. A pincode can repeat across rows to add multiple
     products to it — only the first row for a given pincode needs
     city/state/etc. filled in.
   - Or click **Add Pincode** on the existing-pincodes table below to add
     one pincode (and its product services) by hand, without a file.
4. The table below the upload form shows every pincode currently assigned
   to that customer, with **View**, **Edit** and **Delete** per row (or
   select several and **Delete Selected**).

### 5. Assign the employee's delivery route

Gives the employee created in step 3 an ordered list of stores to deliver
to out of a dark store — a different concept from "which service centre is
this employee staffed to" (step 3's Service Centre field). "Dark store" and
"store" here are both service centre codes (there's no separate dark-store
master); the employee acting as the rider does not need to be staffed to
either one specifically.

1. Ops Master → **Rider Store Routes** (`/rider-store-routes`).
2. **Rider** — search for and select the employee from step 3 (by employee
   code or name).
3. **Dark Store** — select the service centre the rider's route originates
   from (can be the one from step 1, or any other).
4. Click **View Route** to load whatever route already exists for that
   rider/dark-store pair (empty for a new rider).
5. Build the route: for each stop, pick a **Store** and its delivery
   **Sequence** number, using **+ Add Store** to add more rows or **Remove**
   to drop one. **Clear** resets the builder back to one blank row;
   **Load Current Route** re-populates it from what's already assigned
   (useful before replacing).
6. Choose **Mode**:
   - **Add** — upserts only the stores listed, leaves the rest of the
     rider's existing route at this dark store untouched.
   - **Replace** — also deactivates any store on their route not listed
     here (asks for confirmation first).
7. Click **Assign Route**. The table below refreshes to show the rider's
   active route at that dark store.

**Result:** a service centre with pincode coverage and staff (steps 1–3), a
corporate customer with defined pincode serviceability (step 4), and a
rider with an assigned delivery route (step 5) — the full set of setup
pieces this admin panel currently exposes for standing up a new area.
