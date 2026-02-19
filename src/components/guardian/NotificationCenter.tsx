"use client";

import { useState } from "react";
import {
    generateEmail,
    createMailtoLink,
    createDefectReminderEmail,
    createPaymentDueEmail,
    createWeeklyCheckinEmail,
    type NotificationPreferences,
} from "@/lib/notifications/email-service";

interface NotificationCenterProps {
    projectId: string;
    projectName: string;
    builderEmail?: string;
}

interface ScheduledNotification {
    id: string;
    type: "defect" | "payment" | "certificate" | "checkin";
    title: string;
    dueDate: string;
    status: "pending" | "sent" | "snoozed";
    reminderCount: number;
}

const SAMPLE_NOTIFICATIONS: ScheduledNotification[] = [
    {
        id: "1",
        type: "defect",
        title: "Reminder: Cracked tile in Master Ensuite",
        dueDate: "2025-08-15",
        status: "pending",
        reminderCount: 2,
    },
    {
        id: "2",
        type: "payment",
        title: "Payment Due: Lockup Stage",
        dueDate: "2025-08-20",
        status: "pending",
        reminderCount: 0,
    },
    {
        id: "3",
        type: "certificate",
        title: "Certificate Expiring: Builder Public Liability",
        dueDate: "2025-09-01",
        status: "pending",
        reminderCount: 0,
    },
    {
        id: "4",
        type: "checkin",
        title: "Weekly Site Check-in Reminder",
        dueDate: "2025-08-16",
        status: "pending",
        reminderCount: 0,
    },
];

export default function NotificationCenter({ projectId, projectName, builderEmail }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<ScheduledNotification[]>(SAMPLE_NOTIFICATIONS);
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        defectReminders: true,
        paymentAlerts: true,
        certificateExpiry: true,
        weeklyDigest: true,
        emailAddress: builderEmail || "",
    });
    const [showSettings, setShowSettings] = useState(false);

    const getTypeConfig = (type: ScheduledNotification["type"]) => {
        switch (type) {
            case "defect":
                return { icon: "🛠️", color: "bg-red-50 border-red-200", label: "Defect Reminder" };
            case "payment":
                return { icon: "💳", color: "bg-blue-50 border-blue-200", label: "Payment Alert" };
            case "certificate":
                return { icon: "📜", color: "bg-amber-50 border-amber-200", label: "Certificate Expiry" };
            case "checkin":
                return { icon: "📅", color: "bg-green-50 border-green-200", label: "Weekly Check-in" };
        }
    };

    const sendReminder = (notification: ScheduledNotification) => {
        let emailData: { subject: string; body: string };

        switch (notification.type) {
            case "defect":
                emailData = generateEmail("defect_reminder", {
                    title: notification.title.replace("Reminder: ", ""),
                    location: "See defect details",
                    severity: "Medium",
                    dueDate: new Date(notification.dueDate).toLocaleDateString("en-AU"),
                    description: "Please address this defect at your earliest convenience.",
                    reminderCount: notification.reminderCount + 1,
                });
                break;
            case "payment":
                emailData = generateEmail("payment_due", {
                    projectName,
                    stage: "Lockup",
                    amount: "$50,000",
                    dueDate: new Date(notification.dueDate).toLocaleDateString("en-AU"),
                    certificates: "- Waterproofing Certificate\n- Electrical Rough-in Certificate",
                });
                break;
            case "certificate":
                emailData = generateEmail("certificate_expiry", {
                    certificateName: notification.title.replace("Certificate Expiring: ", ""),
                    expiryDate: new Date(notification.dueDate).toLocaleDateString("en-AU"),
                    daysRemaining: Math.ceil((new Date(notification.dueDate).getTime() - Date.now()) / 86400000),
                });
                break;
            case "checkin":
                emailData = generateEmail("weekly_checkin", {
                    projectName,
                    weekDate: new Date().toLocaleDateString("en-AU"),
                    stage: "Lockup",
                    openDefects: "3",
                    pendingActions: "5",
                    pendingCertificates: "2",
                });
                break;
        }

        const mailtoUrl = createMailtoLink(preferences.emailAddress || builderEmail || "", emailData.subject, emailData.body);
        window.open(mailtoUrl, "_blank");

        // Update notification
        setNotifications(notifications.map(n =>
            n.id === notification.id
                ? { ...n, status: "sent" as const, reminderCount: n.reminderCount + 1 }
                : n
        ));
    };

    const snoozeNotification = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, status: "snoozed" as const } : n
        ));
    };

    const pendingCount = notifications.filter(n => n.status === "pending").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">🔔 Notification Center</h2>
                    <p className="text-muted-foreground">
                        Email reminders and alerts for your project
                    </p>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80"
                >
                    ⚙️ Settings
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
                    <div className="text-xs text-blue-700">Pending</div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {notifications.filter(n => n.status === "sent").length}
                    </div>
                    <div className="text-xs text-green-700">Sent</div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-600">
                        {notifications.filter(n => n.status === "snoozed").length}
                    </div>
                    <div className="text-xs text-amber-700">Snoozed</div>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-purple-600">
                        {notifications.reduce((sum, n) => sum + n.reminderCount, 0)}
                    </div>
                    <div className="text-xs text-purple-700">Total Sent</div>
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

                    <div className="space-y-3">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={preferences.defectReminders}
                                onChange={(e) => setPreferences({ ...preferences, defectReminders: e.target.checked })}
                                className="w-5 h-5"
                            />
                            <span>🛠️ Defect Reminders</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={preferences.paymentAlerts}
                                onChange={(e) => setPreferences({ ...preferences, paymentAlerts: e.target.checked })}
                                className="w-5 h-5"
                            />
                            <span>💳 Payment Due Alerts</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={preferences.certificateExpiry}
                                onChange={(e) => setPreferences({ ...preferences, certificateExpiry: e.target.checked })}
                                className="w-5 h-5"
                            />
                            <span>📜 Certificate Expiry Warnings</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={preferences.weeklyDigest}
                                onChange={(e) => setPreferences({ ...preferences, weeklyDigest: e.target.checked })}
                                className="w-5 h-5"
                            />
                            <span>📅 Weekly Check-in Prompts</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Notification List */}
            <div className="space-y-3">
                <h3 className="font-bold">Upcoming Notifications</h3>

                {notifications.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-xl">
                        <span className="text-3xl block mb-2">✨</span>
                        <p className="text-muted-foreground">No pending notifications</p>
                    </div>
                ) : (
                    notifications.map((notification) => {
                        const config = getTypeConfig(notification.type);
                        const daysUntil = Math.ceil((new Date(notification.dueDate).getTime() - Date.now()) / 86400000);
                        const isOverdue = daysUntil < 0;

                        return (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-xl border-2 ${config.color} ${notification.status === "snoozed" ? "opacity-50" : ""}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{config.icon}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{notification.title}</span>
                                                {notification.status === "sent" && (
                                                    <span className="text-xs px-2 py-0.5 bg-green-200 text-green-700 rounded">
                                                        Sent
                                                    </span>
                                                )}
                                                {notification.status === "snoozed" && (
                                                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                                                        Snoozed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                <span className="mr-4">
                                                    📅 {isOverdue ? "Overdue by" : "Due in"} {Math.abs(daysUntil)} day{Math.abs(daysUntil) !== 1 && "s"}
                                                </span>
                                                {notification.reminderCount > 0 && (
                                                    <span className="text-orange-600">
                                                        🔔 {notification.reminderCount} reminder{notification.reminderCount !== 1 && "s"} sent
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {notification.status === "pending" && (
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
                                                📧 Send
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Quick Actions */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="font-bold mb-3">⚡ Quick Send</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => {
                            const email = createWeeklyCheckinEmail(preferences.emailAddress, {
                                projectName,
                                weekDate: new Date().toLocaleDateString("en-AU"),
                                stage: "Lockup",
                                openDefects: 3,
                                pendingActions: 5,
                                pendingCertificates: 2,
                            });
                            const mailtoUrl = createMailtoLink(email.to, email.subject, email.body);
                            window.open(mailtoUrl, "_blank");
                        }}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                        📅 Weekly Digest
                    </button>
                    <button
                        onClick={() => {
                            const { subject, body } = generateEmail("action_required", {
                                projectName,
                                count: "5",
                                actionItems: "1. Fix cracked tile\n2. Provide waterproofing cert\n3. Schedule frame inspection",
                            });
                            const mailtoUrl = createMailtoLink(preferences.emailAddress, subject, body);
                            window.open(mailtoUrl, "_blank");
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                    >
                        🚨 Action Required
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">📧 How Email Notifications Work</p>
                <p>
                    Clicking "Send" opens your default email app with a pre-filled message.
                    This creates a paper trail of all communications with your builder.
                    All emails are sent from YOUR email address, keeping you in control.
                </p>
            </div>
        </div>
    );
}
