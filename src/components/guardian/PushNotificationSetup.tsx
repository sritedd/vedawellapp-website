"use client";

import { useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PushNotificationSetupProps {
    projectId: string;
    projectName: string;
}

interface NotificationPreferences {
    warrantyReminders: boolean;
    paymentMilestones: boolean;
    weeklyCheckInReminders: boolean;
    insuranceExpiryWarnings: boolean;
    coolingOffCountdown: boolean;
    defectResponseOverdue: boolean;
}

interface UpcomingNotification {
    label: string;
    detail: string;
    daysAway: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_PREFS: NotificationPreferences = {
    warrantyReminders: true,
    paymentMilestones: true,
    weeklyCheckInReminders: true,
    insuranceExpiryWarnings: true,
    coolingOffCountdown: false,
    defectResponseOverdue: true,
};

const PREF_ITEMS: {
    key: keyof NotificationPreferences;
    title: string;
    description: string;
}[] = [
    {
        key: "warrantyReminders",
        title: "Warranty deadline reminders",
        description: "Alerts at 30, 14, and 7 days before warranty expiry",
    },
    {
        key: "paymentMilestones",
        title: "Payment milestone due dates",
        description: "Notified when stage payments are approaching",
    },
    {
        key: "weeklyCheckInReminders",
        title: "Weekly check-in reminders",
        description: "Reminder every Monday to log your site visit",
    },
    {
        key: "insuranceExpiryWarnings",
        title: "Insurance expiry warnings",
        description: "Alerts when builder insurance is close to lapsing",
    },
    {
        key: "coolingOffCountdown",
        title: "Cooling-off period countdown",
        description: "Daily countdown during the statutory cooling-off window",
    },
    {
        key: "defectResponseOverdue",
        title: "Defect response overdue",
        description:
            "Alert when your builder has not responded to a defect within 7 days",
    },
];

/* ------------------------------------------------------------------ */
/*  SVG Icons                                                          */
/* ------------------------------------------------------------------ */

function BellIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

function AlertTriangleIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function storageKey(projectId: string): string {
    return `push-prefs-${projectId}`;
}

function loadPrefs(projectId: string): NotificationPreferences {
    if (typeof window === "undefined") return DEFAULT_PREFS;
    try {
        const raw = localStorage.getItem(storageKey(projectId));
        if (!raw) return DEFAULT_PREFS;
        return { ...DEFAULT_PREFS, ...JSON.parse(raw) } as NotificationPreferences;
    } catch {
        return DEFAULT_PREFS;
    }
}

function savePrefs(projectId: string, prefs: NotificationPreferences): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey(projectId), JSON.stringify(prefs));
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function daysFromNow(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
}

function buildUpcomingNotifications(
    prefs: NotificationPreferences
): UpcomingNotification[] {
    const items: UpcomingNotification[] = [];

    if (prefs.warrantyReminders) {
        const days = 14;
        items.push({
            label: "Warranty reminder",
            detail: `Structural warranty check \u2014 ${formatDate(daysFromNow(days))}`,
            daysAway: days,
        });
    }

    if (prefs.paymentMilestones) {
        const days = 5;
        items.push({
            label: "Payment due",
            detail: `Frame Stage payment \u2014 in ${days} days`,
            daysAway: days,
        });
    }

    if (prefs.weeklyCheckInReminders) {
        // Next Monday
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek;
        items.push({
            label: "Weekly check-in",
            detail: `Monday site visit reminder \u2014 ${formatDate(daysFromNow(daysUntilMonday))}`,
            daysAway: daysUntilMonday,
        });
    }

    if (prefs.insuranceExpiryWarnings) {
        const days = 21;
        items.push({
            label: "Insurance expiry",
            detail: `Builder insurance renewal \u2014 ${formatDate(daysFromNow(days))}`,
            daysAway: days,
        });
    }

    if (prefs.defectResponseOverdue) {
        const days = 2;
        items.push({
            label: "Defect follow-up",
            detail: `Builder response overdue in ${days} days`,
            daysAway: days,
        });
    }

    items.sort((a, b) => a.daysAway - b.daysAway);
    return items;
}

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                      */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (val: boolean) => void;
    label: string;
}) {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                aria-label={label}
            />
            <div
                className={
                    "w-11 h-6 rounded-full transition-colors duration-200 " +
                    "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 " +
                    (checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600")
                }
            >
                <div
                    className={
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 " +
                        (checked ? "translate-x-5" : "translate-x-0")
                    }
                />
            </div>
        </label>
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PushNotificationSetup({
    projectId,
    projectName,
}: PushNotificationSetupProps) {
    const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
        "default"
    );
    const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
    const [testSent, setTestSent] = useState(false);

    /* --- Initialise ------------------------------------------------ */
    useEffect(() => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            setPermission("unsupported");
            return;
        }
        setPermission(Notification.permission);
        setPrefs(loadPrefs(projectId));
    }, [projectId]);

    /* --- Request permission ---------------------------------------- */
    const requestPermission = useCallback(async () => {
        if (!("Notification" in window)) return;
        const result = await Notification.requestPermission();
        setPermission(result);
    }, []);

    /* --- Toggle a preference --------------------------------------- */
    const togglePref = useCallback(
        (key: keyof NotificationPreferences, value: boolean) => {
            setPrefs((prev) => {
                const next = { ...prev, [key]: value };
                savePrefs(projectId, next);
                return next;
            });
        },
        [projectId]
    );

    /* --- Send test notification ------------------------------------ */
    const sendTest = useCallback(() => {
        if (permission !== "granted") return;
        new Notification("Guardian Alert", {
            body: "Test notification from HomeOwner Guardian",
            icon: "/icon-192.png",
        });
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
    }, [permission]);

    /* --- Upcoming schedule ----------------------------------------- */
    const upcoming = buildUpcomingNotifications(prefs);

    /* ================================================================ */
    /*  Render                                                          */
    /* ================================================================ */

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <BellIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Notification Preferences</h2>
                    <p className="text-sm text-muted-foreground">
                        {projectName}
                    </p>
                </div>
            </div>

            {/* MVP note */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
                <strong>How it works:</strong> Notifications are checked when you open
                the app. Real-time push delivery will be available in a future update.
            </div>

            {/* -------------------------------------------------------------- */}
            {/*  Unsupported browser                                           */}
            {/* -------------------------------------------------------------- */}
            {permission === "unsupported" && (
                <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
                    <AlertTriangleIcon className="mx-auto text-amber-500" />
                    <p className="font-medium">
                        Your browser does not support notifications
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Try using Chrome, Edge, or Firefox on desktop for the best
                        experience.
                    </p>
                </div>
            )}

            {/* -------------------------------------------------------------- */}
            {/*  Permission: default - ask user to enable                      */}
            {/* -------------------------------------------------------------- */}
            {permission === "default" && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                    <h3 className="text-lg font-semibold">
                        Stay on top of your build
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-2">
                            <CheckCircleIcon className="text-green-500 shrink-0 mt-0.5" />
                            <span>
                                Get alerts when warranty deadlines approach
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircleIcon className="text-green-500 shrink-0 mt-0.5" />
                            <span>
                                Know when payment milestones are due
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircleIcon className="text-green-500 shrink-0 mt-0.5" />
                            <span>
                                Never miss an inspection booking window
                            </span>
                        </li>
                    </ul>
                    <button
                        onClick={requestPermission}
                        className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-base"
                    >
                        Enable Notifications
                    </button>
                </div>
            )}

            {/* -------------------------------------------------------------- */}
            {/*  Permission: denied                                            */}
            {/* -------------------------------------------------------------- */}
            {permission === "denied" && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangleIcon />
                        <h3 className="font-semibold">
                            Notifications are blocked
                        </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        You previously blocked notifications for this site. To
                        re-enable them:
                    </p>
                    <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                        <li>
                            Click the lock (or tune) icon in your browser address bar
                        </li>
                        <li>
                            Find <strong>Notifications</strong> and change it to{" "}
                            <strong>Allow</strong>
                        </li>
                        <li>Refresh this page</li>
                    </ol>
                </div>
            )}

            {/* -------------------------------------------------------------- */}
            {/*  Permission: granted - show toggles                            */}
            {/* -------------------------------------------------------------- */}
            {permission === "granted" && (
                <>
                    {/* Preference toggles */}
                    <div className="bg-card border border-border rounded-xl divide-y divide-border">
                        {PREF_ITEMS.map((item) => (
                            <div
                                key={item.key}
                                className="flex items-center justify-between gap-4 px-5 py-4"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-sm">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {item.description}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={prefs[item.key]}
                                    onChange={(val) => togglePref(item.key, val)}
                                    label={item.title}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Test notification */}
                    <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
                        <div>
                            <p className="font-medium text-sm">
                                Test notification
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Send a sample alert to verify everything works
                            </p>
                        </div>
                        <button
                            onClick={sendTest}
                            className={
                                "px-4 py-2 text-sm font-medium rounded-lg transition-colors " +
                                (testSent
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-blue-600 hover:bg-blue-700 text-white")
                            }
                        >
                            {testSent ? "Sent!" : "Send Test"}
                        </button>
                    </div>

                    {/* Upcoming schedule */}
                    {upcoming.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <CalendarIcon className="text-muted-foreground" />
                                Upcoming notifications
                            </h3>
                            <ul className="space-y-3">
                                {upcoming.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-3 text-sm"
                                    >
                                        <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-blue-500" />
                                        <div>
                                            <p className="font-medium">
                                                {item.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.detail}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
