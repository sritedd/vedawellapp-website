/** Admin email allowlist — reads from ADMIN_EMAILS env var, falls back to hardcoded defaults */

const DEFAULT_ADMIN_EMAILS = [
    "sridhar.kothandam@gmail.com",
    "sridharkothandan@vedawellapp.com",
];

function getAdminEmails(): string[] {
    const envEmails = process.env.ADMIN_EMAILS;
    if (envEmails) {
        return envEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    }
    return DEFAULT_ADMIN_EMAILS;
}

export function isAdminEmail(email: string | undefined | null): boolean {
    if (!email) return false;
    return getAdminEmails().includes(email.toLowerCase());
}
