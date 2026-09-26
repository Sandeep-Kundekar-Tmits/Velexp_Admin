// Fixes employee_code on the 3 employees created by createKochiEmployees.js
// to the real codes from the user's own reference sheet (Code/Name image),
// leaving every other field (user_name, service centre, bank details,
// vehicle, etc.) untouched.
//
// UPDATE_EMPLOYEE is a PATCH, but this app's own EditEmployee.jsx always
// resubmits the complete record (fetched via get-detail, flattened, then
// rebuilt as the full multipart form) rather than a single changed field --
// mirrored here for the same reason: partial-field PATCHes haven't been
// confirmed safe against this backend's validation.
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/fixKochiEmployeeCodes.js
//
// Optional override:
//   BASE_URL=https://uat.velexp.com   (default -- targets UAT, not production)

const BASE_URL = process.env.BASE_URL || "https://uat.velexp.com";
const USERNAME = process.env.VELEXP_USER;
const PASSWORD = process.env.VELEXP_PASS;

if (!USERNAME || !PASSWORD) {
    console.error("Set VELEXP_USER and VELEXP_PASS environment variables before running this script.");
    process.exit(1);
}

// employee_code the create script used -> the real code from the user's sheet
const CODE_FIXES = [
    { currentCode: "awints", newCode: "D01525" },
    { currentCode: "ashiquevs", newCode: "D01526" },
    { currentCode: "muhammedyasin", newCode: "D00010" },
];

async function login() {
    const res = await fetch(`${BASE_URL}/api_login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });
    const data = await res.json();
    if (!res.ok || !data.access) throw new Error(`Login failed: ${JSON.stringify(data)}`);
    return data.access;
}

async function findEmployeeByCode(token, code) {
    const res = await fetch(`${BASE_URL}/api/employee/employees/get-list/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ search: code }),
    });
    const data = await res.json();
    // Double-nested envelope per this endpoint's own documented shape:
    // {results: {message, results: [...]}}
    const list = data?.results?.results || data?.results || (Array.isArray(data) ? data : []);
    return list.find((e) => e.employee_code === code) || null;
}

async function getDetail(token, id) {
    const res = await fetch(`${BASE_URL}/api/employee/employees/get-detail/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to load detail: ${JSON.stringify(data)}`);
    return data.result ?? data.data ?? data.results ?? data;
}

async function updateEmployeeCode(token, id, record, newCode) {
    const kyc = record.kyc || {};
    const bank = (Array.isArray(record.bank_details) && record.bank_details[0]) || {};
    const vehicle = (Array.isArray(record.vehicles) && record.vehicles[0]) || {};
    const serviceCenters = record.service_center ?? record.service_centers ?? [];

    const form = new FormData();
    form.append("employee_code", newCode);
    form.append("first_name", record.first_name || "");
    form.append("last_name", record.last_name || "");
    form.append("email", record.email || "");
    form.append("mobile_no", record.mobile_no || record.phone || "");
    form.append("status", record.status || "active");
    if (record.designation) form.append("designation", record.designation);
    form.append("user_name", record.user_name || "");
    form.append("is_active", record.is_active ?? true);
    form.append("ai_flag", !!record.ai_flag);
    form.append("service_center", JSON.stringify(Array.isArray(serviceCenters) ? serviceCenters : [serviceCenters].filter(Boolean)));
    form.append("kyc", JSON.stringify({
        aadhar_number: kyc.aadhar_number || "",
        pan_number: kyc.pan_number || "",
        kyc_status: kyc.kyc_status || "pending",
        is_active: kyc.is_active ?? true,
    }));
    form.append("bank_details", JSON.stringify([{
        bank_name: bank.bank_name || "",
        account_holder_name: bank.account_holder_name || "",
        account_number: bank.account_number || "",
        ifsc_code: bank.ifsc_code || "",
        bank_branch: bank.bank_branch || "",
        account_type: bank.account_type || "",
        is_default: !!bank.is_default,
    }]));
    form.append("vehicles", JSON.stringify([{
        vehicle_number: vehicle.vehicle_number || "",
        vehicle_type: vehicle.vehicle_type || "",
        is_active: vehicle.is_active ?? true,
    }]));

    const res = await fetch(`${BASE_URL}/api/employee/employees/${id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    const token = await login();
    console.log("Logged in.\n");

    let fixed = 0, failed = 0;
    for (const { currentCode, newCode } of CODE_FIXES) {
        try {
            const emp = await findEmployeeByCode(token, currentCode);
            if (!emp) throw new Error(`employee with code "${currentCode}" not found`);
            const detail = await getDetail(token, emp.id);
            await updateEmployeeCode(token, emp.id, detail, newCode);
            console.log(`✓ "${currentCode}" (id=${emp.id}) -> employee_code="${newCode}"`);
            fixed++;
        } catch (err) {
            console.error(`✗ "${currentCode}": ${err.message}`);
            failed++;
        }
    }

    console.log(`\nDone. ${fixed} fixed, ${failed} failed.`);
    if (failed > 0) process.exitCode = 1;
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
