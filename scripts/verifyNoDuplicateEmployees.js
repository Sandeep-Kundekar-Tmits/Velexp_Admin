// Verifies the 100 employees created by createEmployeesFromExcel.js were each
// created exactly once (not 3x, despite the create script being invoked 3
// times -- the first 2 invocations failed validation on every row before
// anything was saved; only the 3rd succeeded). For each of the 100, searches
// live by mobile number and confirms exactly 1 matching record exists.
//
// Usage (credentials via env vars only -- never pass them as CLI args,
// they'd end up in shell history):
//   VELEXP_USER=youruser VELEXP_PASS=yourpass node scripts/verifyNoDuplicateEmployees.js

const BASE_URL = process.env.BASE_URL || "https://velexp.com";
const USERNAME = process.env.VELEXP_USER;
const PASSWORD = process.env.VELEXP_PASS;

if (!USERNAME || !PASSWORD) {
    console.error("Set VELEXP_USER and VELEXP_PASS environment variables before running this script.");
    process.exit(1);
}

// code -> id, straight from the successful creation run's "✓ Created" lines.
const EMPLOYEES = [
    { code: "D01527", id: 2181 }, { code: "D01528", id: 2182 }, { code: "D01529", id: 2183 },
    { code: "D01530", id: 2184 }, { code: "D01531", id: 2185 }, { code: "D01532", id: 2186 },
    { code: "D01533", id: 2187 }, { code: "D01534", id: 2188 }, { code: "D01535", id: 2189 },
    { code: "D01536", id: 2190 }, { code: "D01539", id: 2191 }, { code: "D01540", id: 2192 },
    { code: "D01541", id: 2193 }, { code: "D01542", id: 2194 }, { code: "D01543", id: 2195 },
    { code: "D01544", id: 2196 }, { code: "D01545", id: 2197 }, { code: "D01546", id: 2198 },
    { code: "D01547", id: 2199 }, { code: "D01548", id: 2200 }, { code: "D01549", id: 2201 },
    { code: "D01550", id: 2202 }, { code: "D01551", id: 2203 }, { code: "D01552", id: 2204 },
    { code: "D01553", id: 2205 }, { code: "D01554", id: 2206 }, { code: "D01555", id: 2207 },
    { code: "D01556", id: 2208 }, { code: "D01557", id: 2209 }, { code: "D01558", id: 2210 },
    { code: "D01559", id: 2211 }, { code: "D01560", id: 2212 }, { code: "D01561", id: 2213 },
    { code: "D01562", id: 2214 }, { code: "D01563", id: 2215 }, { code: "D01564", id: 2216 },
    { code: "D01565", id: 2217 }, { code: "D01566", id: 2218 }, { code: "D01567", id: 2219 },
    { code: "D01568", id: 2220 }, { code: "D01569", id: 2221 }, { code: "D01570", id: 2222 },
    { code: "D01571", id: 2223 }, { code: "D01572", id: 2224 }, { code: "D01573", id: 2225 },
    { code: "D01574", id: 2226 }, { code: "D01575", id: 2227 }, { code: "D01576", id: 2228 },
    { code: "D01577", id: 2229 }, { code: "D01578", id: 2230 }, { code: "D01582", id: 2231 },
    { code: "D01583", id: 2232 }, { code: "D01584", id: 2233 }, { code: "D01585", id: 2234 },
    { code: "D01586", id: 2235 }, { code: "DV0502", id: 2236 }, { code: "DV0503", id: 2237 },
    { code: "DV0504", id: 2238 }, { code: "DV0505", id: 2239 }, { code: "DV0508", id: 2240 },
    { code: "DV0509", id: 2241 }, { code: "DV0510", id: 2242 }, { code: "DV0511", id: 2243 },
    { code: "DV0512", id: 2244 }, { code: "DV0513", id: 2245 }, { code: "DV0514", id: 2246 },
    { code: "DV0515", id: 2247 }, { code: "DV0516", id: 2248 }, { code: "DV0517", id: 2249 },
    { code: "DV0518", id: 2250 }, { code: "DV0519", id: 2251 }, { code: "DV0520", id: 2252 },
    { code: "DV0521", id: 2253 }, { code: "DV0522", id: 2254 }, { code: "DV0523", id: 2255 },
    { code: "DV0524", id: 2256 }, { code: "DV0525", id: 2257 }, { code: "DV0526", id: 2258 },
    { code: "DV0527", id: 2259 }, { code: "DV0528", id: 2260 }, { code: "DV0529", id: 2261 },
    { code: "DV0530", id: 2262 }, { code: "DV0531", id: 2263 }, { code: "DV0532", id: 2264 },
    { code: "DV0533", id: 2265 }, { code: "DV0534", id: 2266 }, { code: "DV0535", id: 2267 },
    { code: "DV0537", id: 2268 }, { code: "V00349", id: 2269 }, { code: "V00350", id: 2270 },
    { code: "V00351", id: 2271 }, { code: "V00352", id: 2272 }, { code: "V00353", id: 2273 },
    { code: "V00354", id: 2274 }, { code: "V00355", id: 2275 }, { code: "V00356", id: 2276 },
    { code: "V00357", id: 2277 }, { code: "V00358", id: 2278 }, { code: "V00359", id: 2279 },
    { code: "V00360", id: 2280 },
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

async function searchByUserName(token, code) {
    const res = await fetch(`${BASE_URL}/api/employee/employees/get-list/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ search: code }),
    });
    const data = await res.json();
    const list = data?.results?.results || data?.results || (Array.isArray(data) ? data : []);
    return list.filter((e) => String(e.user_name || "").trim().toUpperCase() === code.toUpperCase());
}

async function run() {
    console.log(`Target: ${BASE_URL}`);
    const token = await login();
    console.log(`Logged in. Checking all ${EMPLOYEES.length} codes for duplicate records...\n`);

    let clean = 0;
    const problems = [];

    for (const emp of EMPLOYEES) {
        const matches = await searchByUserName(token, emp.code);
        if (matches.length === 1 && matches[0].id === emp.id) {
            clean++;
        } else {
            console.log(`! ${emp.code}: expected 1 record (id=${emp.id}), found ${matches.length}: [${matches.map((m) => m.id).join(", ")}]`);
            problems.push({ ...emp, found: matches.map((m) => m.id) });
        }
    }

    console.log(`\nDone. ${clean}/${EMPLOYEES.length} confirmed exactly one record each.`);
    if (problems.length) {
        console.log(`${problems.length} problem(s) found -- see above.`);
        process.exitCode = 1;
    } else {
        console.log("No duplicates found.");
    }
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
