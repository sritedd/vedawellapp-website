/**
 * Client-side rate limiting for login attempts.
 * Uses sessionStorage to track failed attempts and enforce progressive delays.
 */

const STORAGE_KEY = "auth_rate_limit";
const MAX_ATTEMPTS_BEFORE_DELAY = 3;
const DELAY_SCHEDULE_MS = [5000, 15000, 30000, 60000]; // 5s, 15s, 30s, 60s

interface RateLimitState {
    failedAttempts: number;
    lockedUntil: number | null;
}

function getState(): RateLimitState {
    if (typeof window === "undefined") {
        return { failedAttempts: 0, lockedUntil: null };
    }
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch {
        // sessionStorage may be unavailable
    }
    return { failedAttempts: 0, lockedUntil: null };
}

function setState(state: RateLimitState): void {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // sessionStorage may be unavailable
    }
}

/**
 * Check if the user is currently rate-limited.
 * Returns the number of seconds remaining, or 0 if not limited.
 */
export function getRateLimitSecondsRemaining(): number {
    const state = getState();
    if (!state.lockedUntil) return 0;
    const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    if (remaining <= 0) {
        // Lock has expired
        setState({ ...state, lockedUntil: null });
        return 0;
    }
    return remaining;
}

/**
 * Record a failed login attempt.
 * Returns the number of seconds the user must wait before trying again, or 0 if not yet limited.
 */
export function recordFailedAttempt(): number {
    const state = getState();
    const newAttempts = state.failedAttempts + 1;

    if (newAttempts >= MAX_ATTEMPTS_BEFORE_DELAY) {
        const delayIndex = Math.min(
            newAttempts - MAX_ATTEMPTS_BEFORE_DELAY,
            DELAY_SCHEDULE_MS.length - 1
        );
        const delayMs = DELAY_SCHEDULE_MS[delayIndex];
        const lockedUntil = Date.now() + delayMs;
        setState({ failedAttempts: newAttempts, lockedUntil });
        return Math.ceil(delayMs / 1000);
    }

    setState({ failedAttempts: newAttempts, lockedUntil: null });
    return 0;
}

/**
 * Reset the rate limit state (e.g., on successful login).
 */
export function resetRateLimit(): void {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // sessionStorage may be unavailable
    }
}
