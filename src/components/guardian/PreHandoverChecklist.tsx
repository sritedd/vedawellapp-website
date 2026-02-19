"use client";

import { useState } from "react";
import checklistData from "@/data/homeowner-checklists.json";

interface PreHandoverChecklistProps {
    onComplete?: (checkedItems: string[], issues: Issue[]) => void;
}

interface Issue {
    itemId: string;
    description: string;
    severity: "minor" | "major" | "critical";
}

export default function PreHandoverChecklist({
    onComplete,
}: PreHandoverChecklistProps) {
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    const [issues, setIssues] = useState<Issue[]>([]);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [showIssueForm, setShowIssueForm] = useState<string | null>(null);
    const [newIssue, setNewIssue] = useState({ description: "", severity: "minor" as Issue["severity"] });

    const toggleItem = (id: string, hasIssue: boolean = false) => {
        const newChecked = new Set(checkedItems);
        if (newChecked.has(id)) {
            newChecked.delete(id);
        } else {
            newChecked.add(id);
        }
        setCheckedItems(newChecked);

        if (hasIssue) {
            setShowIssueForm(id);
        } else {
            onComplete?.(Array.from(newChecked), issues);
        }
    };

    const addIssue = (itemId: string) => {
        if (newIssue.description) {
            const issue: Issue = {
                itemId,
                description: newIssue.description,
                severity: newIssue.severity,
            };
            const newIssues = [...issues, issue];
            setIssues(newIssues);
            setNewIssue({ description: "", severity: "minor" });
            setShowIssueForm(null);
            onComplete?.(Array.from(checkedItems), newIssues);
        }
    };

    const totalItems = checklistData.preHandoverChecklist.reduce(
        (acc, cat) => acc + cat.items.length,
        0
    );

    const completionPercent = Math.round((checkedItems.size / totalItems) * 100);

    const generateSnagList = () => {
        let report = `PRE-HANDOVER INSPECTION - SNAGGING LIST\n`;
        report += `${"=".repeat(50)}\n`;
        report += `Generated: ${new Date().toLocaleDateString()}\n`;
        report += `Items inspected: ${checkedItems.size}/${totalItems}\n`;
        report += `Issues found: ${issues.length}\n\n`;

        if (issues.length > 0) {
            report += `DEFECTS/ISSUES IDENTIFIED\n`;
            report += `${"-".repeat(50)}\n\n`;

            issues.forEach((issue, idx) => {
                const item = checklistData.preHandoverChecklist
                    .flatMap((c) => c.items)
                    .find((i) => i.id === issue.itemId);
                report += `${idx + 1}. [${issue.severity.toUpperCase()}] ${item?.text || "Unknown item"}\n`;
                report += `   Issue: ${issue.description}\n\n`;
            });
        }

        report += `\nNOTES FOR BUILDER:\n`;
        report += `All above items require rectification before final handover.\n`;

        const blob = new Blob([report], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `snagging_list_${new Date().toISOString().split("T")[0]}.txt`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">🔍 Pre-Handover Inspection</h2>
                    <p className="text-muted-foreground">
                        100+ point checklist for your final walkthrough.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-2xl font-bold">{completionPercent}%</div>
                        <div className="text-sm text-muted-foreground">
                            {checkedItems.size}/{totalItems} checked
                        </div>
                    </div>
                    {issues.length > 0 && (
                        <button
                            onClick={generateSnagList}
                            className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
                        >
                            📥 Download Snag List
                        </button>
                    )}
                </div>
            </div>

            {/* Issues Summary */}
            {issues.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <h3 className="font-bold text-amber-800 mb-2">
                        🔧 {issues.length} Issue{issues.length > 1 ? "s" : ""} Found
                    </h3>
                    <div className="flex gap-4 text-sm">
                        <span className="text-red-700">
                            Critical: {issues.filter((i) => i.severity === "critical").length}
                        </span>
                        <span className="text-orange-700">
                            Major: {issues.filter((i) => i.severity === "major").length}
                        </span>
                        <span className="text-yellow-700">
                            Minor: {issues.filter((i) => i.severity === "minor").length}
                        </span>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all ${completionPercent === 100 ? "bg-green-500" : "bg-primary"
                        }`}
                    style={{ width: `${completionPercent}%` }}
                />
            </div>

            {/* Categories */}
            <div className="space-y-3">
                {checklistData.preHandoverChecklist.map((category) => {
                    const categoryChecked = category.items.filter((i) =>
                        checkedItems.has(i.id)
                    ).length;
                    const categoryIssues = issues.filter((i) =>
                        category.items.some((item) => item.id === i.itemId)
                    ).length;
                    const isExpanded = expandedCategory === category.category;

                    return (
                        <div
                            key={category.category}
                            className="border border-border rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() =>
                                    setExpandedCategory(isExpanded ? null : category.category)
                                }
                                className="w-full p-4 flex items-center justify-between bg-card hover:bg-muted/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-bold">{category.category}</span>
                                    <span className="text-sm text-muted-foreground">
                                        ({categoryChecked}/{category.items.length})
                                    </span>
                                    {categoryIssues > 0 && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                            {categoryIssues} issues
                                        </span>
                                    )}
                                </div>
                                <span>{isExpanded ? "▲" : "▼"}</span>
                            </button>

                            {isExpanded && (
                                <div className="p-4 pt-0 space-y-2">
                                    {category.items.map((item) => {
                                        const itemIssues = issues.filter(
                                            (i) => i.itemId === item.id
                                        );

                                        return (
                                            <div
                                                key={item.id}
                                                className={`p-3 rounded-lg ${itemIssues.length > 0
                                                        ? "bg-red-50"
                                                        : checkedItems.has(item.id)
                                                            ? "bg-green-50"
                                                            : "bg-muted/10"
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={checkedItems.has(item.id)}
                                                        onChange={() => toggleItem(item.id)}
                                                        className="w-5 h-5 mt-0.5"
                                                    />
                                                    <div className="flex-1">
                                                        <span className={checkedItems.has(item.id) && itemIssues.length === 0 ? "line-through text-muted-foreground" : ""}>
                                                            {item.text}
                                                        </span>

                                                        {/* Issue display */}
                                                        {itemIssues.map((issue, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="mt-2 p-2 bg-red-100 rounded text-sm"
                                                            >
                                                                <span className={`font-bold ${issue.severity === "critical" ? "text-red-700" :
                                                                        issue.severity === "major" ? "text-orange-700" : "text-yellow-700"
                                                                    }`}>
                                                                    [{issue.severity.toUpperCase()}]
                                                                </span>{" "}
                                                                {issue.description}
                                                            </div>
                                                        ))}:

                                                        {/* Report Issue button */}
                                                        {!showIssueForm && checkedItems.has(item.id) && (
                                                            <button
                                                                onClick={() => setShowIssueForm(item.id)}
                                                                className="mt-2 text-xs text-red-600 hover:underline"
                                                            >
                                                                + Report Issue
                                                            </button>
                                                        )}

                                                        {/* Issue form */}
                                                        {showIssueForm === item.id && (
                                                            <div className="mt-3 p-3 bg-white border border-border rounded-lg">
                                                                <input
                                                                    type="text"
                                                                    value={newIssue.description}
                                                                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                                                                    placeholder="Describe the issue..."
                                                                    className="w-full px-3 py-2 border border-border rounded mb-2"
                                                                />
                                                                <div className="flex gap-2 items-center">
                                                                    <select
                                                                        value={newIssue.severity}
                                                                        onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value as any })}
                                                                        className="px-3 py-2 border border-border rounded"
                                                                    >
                                                                        <option value="minor">Minor</option>
                                                                        <option value="major">Major</option>
                                                                        <option value="critical">Critical</option>
                                                                    </select>
                                                                    <button
                                                                        onClick={() => addIssue(item.id)}
                                                                        className="px-4 py-2 bg-red-600 text-white rounded text-sm"
                                                                    >
                                                                        Add Issue
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setShowIssueForm(null)}
                                                                        className="px-4 py-2 bg-muted/20 rounded text-sm"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
