/**
 * Email Notification Service for HomeOwner Guardian
 * Handles sending email notifications for various events
 */

export interface EmailNotification {
    to: string;
    subject: string;
    body: string;
    type: "defect_reminder" | "payment_due" | "certificate_expiry" | "weekly_checkin" | "action_required";
    projectId?: string;
    itemId?: string;
}

export interface NotificationPreferences {
    defectReminders: boolean;
    paymentAlerts: boolean;
    certificateExpiry: boolean;
    weeklyDigest: boolean;
    emailAddress: string;
}

// Email templates
const EMAIL_TEMPLATES = {
    defect_reminder: {
        subject: "🔔 Defect Reminder: {title}",
        body: `
Dear Homeowner,

This is a reminder about an outstanding defect that requires attention:

📋 **Defect:** {title}
📍 **Location:** {location}
⚠️ **Severity:** {severity}
📅 **Due Date:** {dueDate}
🔔 **Reminder #:** {reminderCount}

**Description:**
{description}

---

Please follow up with your builder to ensure this is addressed promptly.

Best regards,
HomeOwner Guardian
        `.trim(),
    },
    payment_due: {
        subject: "💳 Payment Due: {stage} Stage - {projectName}",
        body: `
Dear Homeowner,

A payment milestone is approaching for your project:

🏠 **Project:** {projectName}
🔧 **Stage:** {stage}
💰 **Amount:** {amount}
📅 **Due Date:** {dueDate}

**Before Paying:**
✅ Ensure all stage inspections are complete
✅ Verify all required certificates are received
✅ Check that all critical defects are resolved

⚠️ **Certificates Required:**
{certificates}

---

Remember: You have the right to withhold payment until all required certificates are provided.

Best regards,
HomeOwner Guardian
        `.trim(),
    },
    certificate_expiry: {
        subject: "⚠️ Certificate Expiring: {certificateName}",
        body: `
Dear Homeowner,

A certificate or document is expiring soon:

📜 **Certificate:** {certificateName}
📅 **Expiry Date:** {expiryDate}
⏰ **Days Remaining:** {daysRemaining}

**Action Required:**
Contact your builder to renew this certificate before expiry.

---

Best regards,
HomeOwner Guardian
        `.trim(),
    },
    weekly_checkin: {
        subject: "📅 Weekly Check-in Reminder - {projectName}",
        body: `
Dear Homeowner,

It's time for your weekly site check-in!

🏠 **Project:** {projectName}
📅 **Week of:** {weekDate}
🔧 **Current Stage:** {stage}

**Suggested Check-in Items:**
□ Visit the site and take progress photos
□ Note how many workers are on site
□ Check for any visible defects or issues
□ Review what work was completed this week
□ Discuss next week's planned work with supervisor

**Quick Stats:**
- Open Defects: {openDefects}
- Pending Actions: {pendingActions}
- Certificates Awaited: {pendingCertificates}

---

Log your visit in the HomeOwner Guardian app.

Best regards,
HomeOwner Guardian
        `.trim(),
    },
    action_required: {
        subject: "🚨 Action Required: {count} Items Need Your Attention",
        body: `
Dear Homeowner,

The following items require your attention for **{projectName}**:

{actionItems}

---

Log in to HomeOwner Guardian to review and take action.

Best regards,
HomeOwner Guardian
        `.trim(),
    },
};

/**
 * Generate email content from template
 */
export function generateEmail(
    type: EmailNotification["type"],
    data: Record<string, string | number>
): { subject: string; body: string } {
    const template = EMAIL_TEMPLATES[type];
    let subject = template.subject;
    let body = template.body;

    // Replace placeholders
    for (const [key, value] of Object.entries(data)) {
        const placeholder = new RegExp(`\\{${key}\\}`, "g");
        subject = subject.replace(placeholder, String(value));
        body = body.replace(placeholder, String(value));
    }

    return { subject, body };
}

/**
 * Format email as mailto: link
 */
export function createMailtoLink(
    to: string,
    subject: string,
    body: string
): string {
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Send notification (opens email client)
 */
export function sendEmailNotification(notification: EmailNotification): void {
    const mailtoUrl = createMailtoLink(
        notification.to,
        notification.subject,
        notification.body
    );
    window.open(mailtoUrl, "_blank");
}


/**
 * Generate defect reminder email
 */
export function createDefectReminderEmail(
    to: string,
    defect: {
        title: string;
        location: string;
        severity: string;
        dueDate: string;
        description: string;
        reminderCount: number;
    }
): EmailNotification {
    const { subject, body } = generateEmail("defect_reminder", defect);
    return {
        to,
        subject,
        body,
        type: "defect_reminder",
    };
}

/**
 * Generate payment due email
 */
export function createPaymentDueEmail(
    to: string,
    payment: {
        projectName: string;
        stage: string;
        amount: string;
        dueDate: string;
        certificates: string;
    }
): EmailNotification {
    const { subject, body } = generateEmail("payment_due", payment);
    return {
        to,
        subject,
        body,
        type: "payment_due",
    };
}

/**
 * Generate weekly check-in email
 */
export function createWeeklyCheckinEmail(
    to: string,
    data: {
        projectName: string;
        weekDate: string;
        stage: string;
        openDefects: number;
        pendingActions: number;
        pendingCertificates: number;
    }
): EmailNotification {
    const { subject, body } = generateEmail("weekly_checkin", {
        ...data,
        openDefects: data.openDefects.toString(),
        pendingActions: data.pendingActions.toString(),
        pendingCertificates: data.pendingCertificates.toString(),
    });
    return {
        to,
        subject,
        body,
        type: "weekly_checkin",
    };
}
