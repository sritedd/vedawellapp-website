/**
 * Assert every state's payment schedule totals exactly 100% of the contract sum.
 *
 * Why this runs in the build: the percentages used to be regex-scraped out of
 * free text like "Frame Stage (15-20%)". That took the LOW end of every range,
 * so NSW summed to 90% — the schedule silently understated what the homeowner
 * owed, and contract_value drives payment milestones, the budget dashboard,
 * variation-percentage warnings and the HBCF insurance threshold check.
 *
 * The numbers are now explicit per stage (`paymentPercentage`) plus a state-level
 * `depositPercentage` for the states whose stage milestones deliberately stop
 * short because a separate deposit is paid up front (VIC 5%, QLD 10%).
 *
 * A silent drift back to 90% is exactly the kind of thing nobody notices, so
 * this fails the build rather than warning.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "src/data/australian-build-workflows.json"), "utf8"));

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
let failed = false;

for (const code of STATES) {
    const wf = data.workflows?.new_build?.[code];
    if (!wf) {
        console.error(`[payment-pct] ${code}: no new_build workflow`);
        failed = true;
        continue;
    }

    const missing = wf.stages.filter((s) => typeof s.paymentPercentage !== "number");
    if (missing.length) {
        console.error(`[payment-pct] ${code}: ${missing.length} stage(s) missing paymentPercentage: ${missing.map((s) => s.name).join(", ")}`);
        failed = true;
        continue;
    }

    const deposit = wf.depositPercentage ?? 0;
    const stageSum = wf.stages.reduce((a, s) => a + s.paymentPercentage, 0);
    const total = stageSum + deposit;

    if (total !== 100) {
        console.error(`[payment-pct] ${code}: stages ${stageSum}% + deposit ${deposit}% = ${total}% — must be exactly 100%`);
        failed = true;
    } else {
        console.log(`[payment-pct] ${code.padEnd(3)} stages ${String(stageSum).padStart(3)}% + deposit ${String(deposit).padStart(2)}% = 100% ✓`);
    }
}

if (failed) {
    console.error("\n[payment-pct] FAILED — a payment schedule does not total 100% of the contract sum.");
    process.exit(1);
}
console.log("[payment-pct] all 8 states total 100%");
