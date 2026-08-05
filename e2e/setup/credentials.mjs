/**
 * Single source of E2E account credentials.
 *
 * SECURITY: this repo is PUBLIC and these accounts live on PRODUCTION. Passwords
 * are therefore NEVER committed — they are read from .env.local (gitignored) or
 * the environment, and we fail loudly rather than fall back to a default. A
 * committed default is a working prod login for anyone who reads the repo.
 *
 * Set these in .env.local (written automatically when passwords are rotated):
 *   E2E_PRO_EMAIL / E2E_PRO_PASSWORD
 *   E2E_FREE_EMAIL / E2E_FREE_PASSWORD
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnvLocal() {
    try {
        const raw = fs.readFileSync(path.join(__dirname, "../../.env.local"), "utf-8");
        const out = {};
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
const read = (key) => process.env[key] || fileEnv[key] || "";

function require_(key) {
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
    get email() { return read("E2E_PRO_EMAIL") || "e2e-test@vedawellapp.com"; },
    get password() { return require_("E2E_PRO_PASSWORD"); },
    tier: "guardian_pro",
};

export const FREE = {
    get email() { return read("E2E_FREE_EMAIL") || "e2e-free@vedawellapp.com"; },
    get password() { return require_("E2E_FREE_PASSWORD"); },
    tier: "free",
};

export { loadDotEnvLocal };
