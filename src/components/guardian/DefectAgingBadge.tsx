"use client";

interface DefectAgingBadgeProps {
    reportedAt: string;
    status: string;
    escalationLevel?: string;
}

export default function DefectAgingBadge({ reportedAt, status, escalationLevel }: DefectAgingBadgeProps) {
    // Closed defects get a grey badge
    if (status === "verified" || status === "rectified") {
        return (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                Closed
            </span>
        );
    }

    const now = new Date();
    const reported = new Date(reportedAt);
    const diffMs = now.getTime() - reported.getTime();
    const daysOpen = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Color coding based on age
    let colorClasses: string;
    if (daysOpen < 7) {
        colorClasses = "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400";
    } else if (daysOpen < 14) {
        colorClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400";
    } else if (daysOpen < 30) {
        colorClasses = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400";
    } else {
        colorClasses = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400";
    }

    const hasEscalation = escalationLevel && escalationLevel !== "none";

    return (
        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${colorClasses}`}>
            {daysOpen}d
            {hasEscalation && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70" title={`Escalation: ${escalationLevel}`} />
            )}
        </span>
    );
}
