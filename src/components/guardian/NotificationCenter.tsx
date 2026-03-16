"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    generateEmail,
    createMailtoLink,
    type NotificationPreferences,
} from "@/lib/notifications/email-service";

interface NotificationCenterProps {
    projectId: string;
    projectName: string;
    builderEmail?: string;
}

interface ComputedNotification {
    id: string;
    type: "defect" | "payment" | "certificate" | "checkin" | "warranty" | "followup";
    title: string;
    dueDate: string;
    status: "pending" | "sent" | "snoozed";
}

export default function NotificationCenter({ projectId, projectName, builderEmail }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<ComputedNotification[]>([]);
    const [loading, setLoading] = useState(true);

    // Load preferences from localStorage
    const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
        if (typeof window === "undefined") return { defectReminders: true, paymentAlerts: true, certificateExpiry: true, weeklyDigest: true, emailAddress: builderEmail || "" };
        try {
            const saved = localStorage.getItem(`guardian_notif_prefs_${projectId}`);
            return saved ? JSON.parse(saved) : { defectReminders: true, paymentAlerts: true, certificateExpiry: true, weeklyDigest: true, emailAddress: builderEmail || "" };
        } catch { return { defectReminders: true, paymentAlerts: true, certificateExpiry: true, weeklyDigest: true, emailAddress: builderEmail || "" }; }
    });
    const [showSettings, setShowSettings] = useState(false);

    // Load snoozed/sent IDs from localStorage
    const [snoozedIds, setSnoozedIds] = useState<Set<string>>(() => {
        if (typeof window === "undefined") return new Set();
        try {
            const saved = localStorage.getItem(`guardian_snoozed_${projectId}`);
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch { return new Set(); }
    });
    const [sentIds, setSentIds] = useState<Set<string>>(() => {
        if (typeof window === "undefined") return new Set();
        try {
            const saved = localStorage.getItem(`guardian_sent_${projectId}`);
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch { return new Set(); }
    });

    // Persist to localStorage on change
    useEffect(() => {
        try { localStorage.setItem(`guardian_notif_prefs_${projectId}`, JSON.stringify(preferences)); } catch { }
    }, [preferences, projectId]);
    useEffect(() => {
        try { localStorage.setItem(`guardian_snoozed_${projectId}`, JSON.stringify([...snoozedIds])); } catch { }
    }, [snoozedIds, projectId]);
    useEffect(() => {
        try { localStorage.setItem(`guardian_sent_${projectId}`, JSON.stringify([...sentIds])); } catch { }
    }, [sentIds, projectId]);

    // Compute notifications from real project data
    useEffect(() => {
        const computeNotifications = async () => {
            const supabase = createClient();
            const alerts: ComputedNotification[] = [];

            // 1. Overdue defects
            const { data: defects } = await supabase
                .from("defects")
                .select("id, title, due_date, status")
                .eq("project_id", projectId)
                .not("status", "in", "(verified,rectified)");

            if (defects) {
                for (const d of defects) {
                    if (d.due_date) {
                        const daysUntil = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000);
                        if (daysUntil <= 7) {
                            alerts.push({
                                id: `defect-${d.id}`,
                                type: "defect",
                                title: `${daysUntil < 0 ? "OVERDUE" : "Due soon"}: ${d.title}`,
                                dueDate: d.due_date,
                                status: "pending",
                            });
                        }
                    }
                }
            }

            // 2. Expiring certifications
            const { data: certs } = await supabase
                .from("certifications")
                .select("id, type, expiry_date")
                .eq("project_id", projectId)
                .not("expiry_date", "is", null);

            if (certs) {
                for (const c of certs) {
                    if (c.expiry_date) {
                        const daysUntil = Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / 86400000);
                        if (daysUntil <= 30 && daysUntil > -7) {
                            alerts.push({
                                id: `cert-${c.id}`,
                                type: "certificate",
                                title: `Certificate expiring: ${c.type}`,
                                dueDate: c.expiry_date,
                                status: "pending",
                            });
                        }
                    }
                }
            }

            // 3. Follow-up reminders from communication log
            const { data: comms } = await supabase
                .from("communication_log")
                .select("id, summary, follow_up_date")
                .eq("project_id", projectId)
                .eq("follow_up_required", true)
                .not("follow_up_date", "is", null);

            if (comms) {
                for (const c of comms) {
                    if (c.follow_up_date) {
                        const daysUntil = Math.ceil((new Date(c.follow_up_date).getTime() - Date.now()) / 86400000);
                        if (daysUntil <= 3) {
                            alerts.push({
                                id: `followup-${c.id}`,
                                type: "followup",
                                title: `Follow up: ${c.summary}`,
                                dueDate: c.follow_up_date,
                                status: "pending",
                            });
                        }
                    }
                }
            }

            // 4. Insurance expiry from project
            const { data: project } = await supabase
                .from("projects")
                .select("insurance_expiry_date, handover_date")
                .eq("id", projectId)
                .single();

            if (project?.insurance_expiry_date) {
                const daysUntil = Math.ceil((new Date(project.insurance_expiry_date).getTime() - Date.now()) / 86400000);
                if (daysUntil <= 30 && daysUntil > -7) {
                    alerts.push({
                        id: "insurance-expiry",
                        type: "certificate",
                        title: "Builder insurance expiring soon",
                        dueDate: project.insurance_expiry_date,
                        status: "pending",
                    });
                }
            }

            // 5. Warranty milestones (if handover date exists)
            if (project?.handover_date) {
                const handover = new Date(project.handover_date);
                const warrantyDates = [
                    { days: 90, label: "90-day defect warranty deadline" },
                    { days: 730, label: "2-year non-structural warranty deadline" },
                    { days: 2190, label: "6-year structural warranty deadline" },
                ];
                for (const w of warrantyDates) {
                    const deadline = new Date(handover.getTime() + w.days * 86400000);
                    const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
                    if (daysUntil > 0 && daysUntil <= 30) {
                        alerts.push({
                            id: `warranty-${w.days}`,
                            type: "warranty",
                            title: w.label,
                            dueDate: deadline.toISOString().split("T")[0],
                            status: "pending",
                        });
                    }
                }
            }

            // Sort by due date (most urgent first)
            alerts.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

            setNotifications(alerts);
            setLoading(false);
        };

        computeNotifications();
    }, [projectId]);

    const getTypeConfig = (type: ComputedNotification["type"]) => {
        switch (type) {
            case "defect":
                return { icon: "🛠️", color: "bg-red-50 border-red-200", label: "Defect" };
            case "payment":
                return { icon: "💳", color: "bg-blue-50 border-blue-200", label: "Payment" };
            case "certificate":
                return { icon: "📜", color: "bg-amber-50 border-amber-200", label: "Certificate" };
            case "checkin":
                return { icon: "📅", color: "bg-green-50 border-green-200", label: "Check-in" };
            case "warranty":
                return { icon: "🛡️", color: "bg-purple-50 border-purple-200", label: "Warranty" };
            case "followup":
                return { icon: "📞", color: "bg-cyan-50 border-cyan-200", label: "Follow-up" };
        }
    };

    const getEffectiveStatus = (n: ComputedNotification) => {
        if (snoozedIds.has(n.id)) return "snoozed";
        if (sentIds.has(n.id)) return "sent";
        return n.status;
    };

    const sendReminder = (notification: ComputedNotification) => {
        const { subject, body } = generateEmail("defect_reminder", {
            title: notification.title,
            location: "See project details",
            severity: "Medium",
            dueDate: new Date(notification.dueDate).toLocaleDateString("en-AU"),
            description: `Action required for: ${notification.title}`,
            reminderCount: 1,
        });
        const mailtoUrl = createMailtoLink(preferences.emailAddress || builderEmail || "", subject, body);
        window.open(mailtoUrl, "_blank");
        setSentIds(new Set([...sentIds, notification.id]));
    };

    const snoozeNotification = (id: string) => {
        setSnoozedIds(new Set([...snoozedIds, id]));
    };

    const pendingCount = notifications.filter(n => getEffectiveStatus(n) === "pending").length;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Alerts &amp; Reminders</h2>
                    <p className="text-muted-foreground">
                        Computed from your project data — defects, certificates, warranties
                    </p>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80"
                >
                    Settings
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-red-600">{pendingCount}</div>
                    <div className="text-xs text-red-700">Need Attention</div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-600">{sentIds.size}</div>
                    <div className="text-xs text-green-700">Actioned</div>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-gray-600">{snoozedIds.size}</div>
                    <div className="text-xs text-gray-700">Snoozed</div>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="p-6 bg-card border border-border rounded-xl space-y-4">
                    <h3 className="font-bold">Notification Preferences</h3>
                    <div>
                        <label className="block text-sm font-medium mb-1">Builder Email Address</label>
                        <input
                            type="email"
                            value={preferences.emailAddress}
                            onChange={(e) => setPreferences({ ...preferences, emailAddress: e.target.value })}
                            className="w-full p-3 border border-border rounded-lg"
                            placeholder="builder@example.com"
                        />
                    </div>
                </div>
            )}

            {/* Notification List */}
            <div className="space-y-3">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-xl">
                        <span className="text-3xl block mb-2">✨</span>
                        <p className="text-muted-foreground">No alerts right now. Everything looks good!</p>
                    </div>
                ) : (
                    notifications.map((notification) => {
                        const config = getTypeConfig(notification.type);
                        const daysUntil = Math.ceil((new Date(notification.dueDate).getTime() - Date.now()) / 86400000);
                        const isOverdue = daysUntil < 0;
                        const effectiveStatus = getEffectiveStatus(notification);

                        return (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-xl border-2 ${config.color} ${effectiveStatus === "snoozed" ? "opacity-50" : ""}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{config.icon}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{notification.title}</span>
                                                {effectiveStatus === "sent" && (
                                                    <span className="text-xs px-2 py-0.5 bg-green-200 text-green-700 rounded">Sent</span>
                                                )}
                                                {effectiveStatus === "snoozed" && (
                                                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">Snoozed</span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {isOverdue
                                                    ? `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""}`
                                                    : `Due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`}
                                                <span className="ml-2 text-xs text-gray-400">
                                                    {new Date(notification.dueDate).toLocaleDateString("en-AU")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {effectiveStatus === "pending" && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => snoozeNotification(notification.id)}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                                            >
                                                Snooze
                                            </button>
                                            <button
                                                onClick={() => sendReminder(notification)}
                                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                            >
                                                Email
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">How Alerts Work</p>
                <p>
                    Alerts are computed automatically from your project data: overdue defects, expiring
                    certificates, warranty deadlines, and follow-up reminders. Click &quot;Email&quot; to
                    send a pre-filled message to your builder.
                </p>
            </div>
        </div>
    );
}
