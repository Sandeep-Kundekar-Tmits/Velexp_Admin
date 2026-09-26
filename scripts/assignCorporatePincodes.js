// Registers pincodes 000001..000020 (matching the 20 Kochi service
// centres' own sequential pincodes) as serviceable for corporate
// customer_id=46, via the single-pincode "Add Pincode" endpoint from the
// Corporate Pincode Upload feature (customer-pincode-service/). One POST
// per pincode; everything except `pincode` is the fixed template the user
// provided.
//
// Usage (token via env var only -- never as a CLI arg, it'd end up in
// shell history):
//   TOKEN=eyJ... node scripts/assignCorporatePincodes.js
//
// Optional override:
//   BASE_URL=https://uat.velexp.com   (default)
//   CUSTOMER_ID=46
//   COUNT=20

const BASE_URL = process.env.BASE_URL || "https://uat.velexp.com";
const TOKEN = process.env.TOKEN;
const CUSTOMER_ID = Number(process.env.CUSTOMER_ID || 46);
const COUNT = Number(process.env.COUNT || 20);

if (!TOKEN) {
    console.error("Set TOKEN environment variable before running this script.");
    process.exit(1);
}

function buildPayload(pincode) {
    return {
        customer_id: CUSTOMER_ID,
        pincode,
        city: "Kochi",
        state: "Kerala",
        region: "South",
        legacy_zone: "KERALA",
        zone_tag: "A",
        is_metro: false,
        service_provider: "SELF",
        products: [{
            product: 3,
            is_active: true,
            can_pickup: true,
            can_deliver: true,
            is_reverse_serviceable: false,
            has_cod: true,
            has_pop: false,
            is_oda: false,
        }],
    };
}

async function addPincode(pincode) {
    const res = await fetch(`${BASE_URL}/corporate-billing/customer-pincode-service/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify(buildPayload(pincode)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
}

async function run() {
    console.log(`Target: ${BASE_URL}, customer_id=${CUSTOMER_ID}`);
    console.log(`Assigning pincodes 000001..${String(COUNT).padStart(6, "0")}...\n`);

    let created = 0, failed = 0;
    for (let i = 1; i <= COUNT; i++) {
        const pincode = String(i).padStart(6, "0");
        try {
            const result = await addPincode(pincode);
            console.log(`✓ [${i}/${COUNT}] Added pincode ${pincode} (id=${result.id ?? result.result?.id})`);
            created++;
        } catch (err) {
            console.error(`✗ [${i}/${COUNT}] Failed pincode ${pincode}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\nDone. ${created} added, ${failed} failed.`);
    if (failed > 0) process.exitCode = 1;
}

run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
