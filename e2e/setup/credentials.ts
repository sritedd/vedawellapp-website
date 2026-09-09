/**
 * E2E account credentials — for Playwright specs (TypeScript).
 *
 * This is the TS twin of `credentials.mjs`, which serves the plain-Node scripts
 * (`prod-accounts.mjs`, `make-fixture.mjs`). Two files exist because Playwright
 * transpiles specs to CommonJS and cannot `require` an ES module, while plain
 * Node cannot import a `.ts` file without flags. Both read the SAME four keys
 * from the SAME `.env.local`; keep them in lock-step.
 *
 * SECURITY: this repo is PUBLIC and these accounts live on PRODUCTION. Passwords
 * are therefore NEVER committed — they are read from .env.local (gitignored) or
 * the environment, and we fail loudly rather than fall back to a default. A
 * committed default is a working prod login for anyone who reads the repo.
 *
 * Resolved LAZILY: the getters throw at first use, not at module load, so
 * `playwright test --list` and specs that never need a password keep working.
 */
import fs from "fs";
import path from "path";

function loadDotEnvLocal(): Record<string, string> {
    try {
        const raw = fs.readFileSync(path.join(__dirname, "../../.env.local"), "utf-8");
        const out: Record<string, string> = {};
        for (const line of raw.split("\n")) {
            const t = line.trim();
            if (!t || t.startsWith("#")) continue;
            const i = t.indexOf("=");
            if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
        }
        return out;
    } catch {
        return {};
    }
}

const fileEnv = loadDotEnvLocal();
const read = (key: string): string => process.env[key] || fileEnv[key] || "";

function require_(key: string): string {
    const v = read(key);
    if (!v) {
        throw new Error(
            `${key} is not set. E2E account passwords are never committed — ` +
            `set ${key} in .env.local or the environment. ` +
            `Run: node e2e/setup/prod-accounts.mjs --rotate to mint new ones.`
        );
    }
    return v;
}

export const PRO = {
    get email(): string { return read("E2E_PRO_EMAIL") || "e2e-test@vedawellapp.com"; },
    get password(): string { return require_("E2E_PRO_PASSWORD"); },
    tier: "guardian_pro" as const,
};

export const FREE = {
    get email(): string { return read("E2E_FREE_EMAIL") || "e2e-free@vedawellapp.com"; },
    get password(): string { return require_("E2E_FREE_PASSWORD"); },
    tier: "free" as const,
};

export { loadDotEnvLocal };
