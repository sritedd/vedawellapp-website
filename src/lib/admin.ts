/** Admin email allowlist — reads from ADMIN_EMAILS env var (required) */

function getAdminEmails(): string[] {
    const envEmails = process.env.ADMIN_EMAILS;
    if (!envEmails) {
        console.error("[Admin] ADMIN_EMAILS env var is not set — no admin access possible");
        return [];
    }
    return envEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null): boolean {
    if (!email) return false;
    return getAdminEmails().includes(email.toLowerCase());
}
