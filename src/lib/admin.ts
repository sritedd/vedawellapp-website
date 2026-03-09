/** Admin email allowlist — single source of truth */
export const ADMIN_EMAILS = [
    "sridhar.kothandam@gmail.com",
    "sridharkothandan@vedawellapp.com",
];

export function isAdminEmail(email: string | undefined | null): boolean {
    return !!email && ADMIN_EMAILS.includes(email);
}
