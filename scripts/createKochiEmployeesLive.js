// PRODUCTION: creates 2 of the 3 planned employees (Awin T.S, Ashique V.S)
// against LKST2567. Muhammed Yasin is deliberately excluded -- his planned
// code D00010 belongs to a real, pre-existing employee (Yaseen) on UAT, and
// that conflict was never resolved, so he's left out of this run entirely
// pending a decision on that.
//
// Differs from createKochiEmployees.js (the UAT version) in exactly one way,
// per instruction: user_name is now the SAME as employee_code (D01525 /
// D01526), not a separate lowercase-name string. Everything else (email,
// mobile, password, service centre, bank/vehicle dummy data) is unchanged
// from the plan already confirmed and run on UAT.
//
// !! THIS TARGETS PRODUCTION (velexp.com) BY DEFAULT !!
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/createKochiEmployeesLive.js
//
// Optional override (e.g. to dry-run against UAT):
//   BASE_URL=https://uat.velexp.com VELEXP_USER=... VELEXP_PASS=... node scripts/createKochiEmployeesLive.js

const BASE_URL = process.env.BASE_URL || "https://velexp.com";
const USERNAME = process.env.VELEXP_USER;
const PASSWORD = process.env.VELEXP_PASS;
const SERVICE_CENTRE_CODE = "LKST2567";
const EMPLOYEE_PASSWORD = "velexp@123";

if (!USERNAME || !PASSWORD) {
    console.error("Set VELEXP_USER and VELEXP_PASS environment variables before running this script.");
    process.exit(1);
}

const EMPLOYEES = [
    { code: "D01525", first_name: "Awin", last_name: "T.S", email: "awin.ts@example.com", mobile_no: "9999999901", account_number: "000111222901" },
    { code: "D01526", first_name: "Ashique", last_name: "V.S", email: "ashique.vs@example.com", mobile_no: "9999999902", account_number: "000111222902" },
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

async function findServiceCentreByCode(token, code) {
    const res = await fetch(`${BASE_URL}/service-centers/get-list/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
    });
    const data = await res.json();
    const list = data?.results?.results || data?.results || (Array.isArray(data) ? data : []);
    return list.find((sc) => sc.service_center_code === code) || null;
}

async function getFirstDesignationId(token) {
    const res = await fetch(`${BASE_URL}/designations/get-list/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to load designations: ${JSON.stringify(data)}`);
    const list = Array.isArray(data) ? data
        : Array.isArray(data?.results?.results) ? data.results.results
        : Array.isArray(data?.results) ? data.results
        : Array.isArray(data?.data) ? data.data
        : [];
    if (!list.length) throw new Error("No designations found.");
    return list[0].id;
}

async function findEmployeeByCode(token, code) {
    const res = await fetch(`${BASE_URL}/api/employee/employees/get-list/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ search: code }),
    });
    const data = await res.json();
    const list = data?.results?.results || data?.results || (Array.isArray(data) ? data : []);
    return list.find((e) => e.employee_code === code) || null;
}

async function createEmployee(token, serviceCentreId, designationId, emp) {
    const form = new FormData();
    form.append("employee_code", emp.code);
    form.append("first_name", emp.first_name);
    form.append("last_name", emp.last_name);
    form.append("email", emp.email);
    form.append("mobile_no", emp.mobile_no);
    form.append("status", "active");
    form.append("designation", designationId);
    form.append("user_name", emp.code);
    form.append("user_password", EMPLOYEE_PASSWORD);
    form.append("is_active", true);
    form.append("ai_flag", false);
    form.append("service_center", JSON.stringify([serviceCentreId]));
    form.append("kyc", JSON.stringify({ kyc_status: "pending", is_active: true }));
    form.append("bank_details", JSON.stringify([{
        account_holder_name: `${emp.first_name} ${emp.last_name}`,
        bank_name: "Test Bank",
        account_number: emp.account_number,
        ifsc_code: "TEST0000001",
        account_type: "savings",
        is_default: true,
    }]));
    form.append("vehicles", JSON.stringify([{
        vehicle_number: `TESTV${emp.mobile_no.slice(-3)}`,
        vehicle_type: "two-wheeler",
        is_active: true,
    }]));

    const res = await fetch(`${BASE_URL}/api/employee/employees/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    if (BASE_URL.includes("velexp.com") && !BASE_URL.includes("uat")) {
        console.log("*** PRODUCTION *** -- these will be real, permanent records.\n");
    }
    const token = await login();
    console.log("Logged in.\n");

    const sc = await findServiceCentreByCode(token, SERVICE_CENTRE_CODE);
    if (!sc) throw new Error(`Service centre "${SERVICE_CENTRE_CODE}" not found.`);
    console.log(`Using service centre "${SERVICE_CENTRE_CODE}" (id=${sc.id})`);

    const designationId = await getFirstDesignationId(token);
    console.log(`Using designation id=${designationId}\n`);

    let created = 0, failed = 0;
    for (const emp of EMPLOYEES) {
        const existing = await findEmployeeByCode(token, emp.code);
        if (existing) {
            console.log(`= "${emp.code}" already exists (id=${existing.id}), skipping`);
            continue;
        }
        try {
            const result = await createEmployee(token, sc.id, designationId, emp);
            console.log(`✓ Created "${emp.first_name} ${emp.last_name}" (employee_code=${emp.code}, user_name=${emp.code}, id=${result.id ?? result.data?.id})`);
            created++;
        } catch (err) {
            console.error(`✗ Failed "${emp.first_name} ${emp.last_name}" (employee_code=${emp.code}): ${err.message}`);
            failed++;
        }
    }

    console.log(`\nDone. ${created} created, ${failed} failed.`);
    if (failed > 0) process.exitCode = 1;
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
