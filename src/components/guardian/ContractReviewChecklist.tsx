"use client";

import { useState } from "react";
import checklistData from "@/data/homeowner-checklists.json";

interface ContractReviewChecklistProps {
    onComplete?: (checkedItems: string[]) => void;
}

export default function ContractReviewChecklist({
    onComplete,
}: ContractReviewChecklistProps) {
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    const [expandedCategory, setExpandedCategory] = useState<string | null>(
        "Builder Details"
    );

    const toggleItem = (id: string) => {
        const newChecked = new Set(checkedItems);
        if (newChecked.has(id)) {
            newChecked.delete(id);
        } else {
            newChecked.add(id);
        }
        setCheckedItems(newChecked);
        onComplete?.(Array.from(newChecked));
    };

    const totalItems = checklistData.contractChecklist.reduce(
        (acc, cat) => acc + cat.items.length,
        0
    );
    const criticalItems = checklistData.contractChecklist.reduce(
        (acc, cat) => acc + cat.items.filter((i) => i.critical).length,
        0
    );
    const checkedCritical = checklistData.contractChecklist.reduce(
        (acc, cat) =>
            acc + cat.items.filter((i) => i.critical && checkedItems.has(i.id)).length,
        0
    );

    const completionPercent = Math.round((checkedItems.size / totalItems) * 100);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">📝 Contract Review Checklist</h2>
                    <p className="text-muted-foreground">
                        Check these items before signing your building contract.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold">{completionPercent}%</div>
                    <div className="text-sm text-muted-foreground">
                        {checkedItems.size}/{totalItems} items
                    </div>
                </div>
            </div>

            {/* Critical Items Warning */}
            {checkedCritical < criticalItems && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <h3 className="font-bold text-red-800 mb-1">
                        ⚠️ {criticalItems - checkedCritical} Critical Items Unchecked
                    </h3>
                    <p className="text-sm text-red-700">
                        These items are essential before signing. Do not proceed until all
                        critical items are verified.
                    </p>
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
                {checklistData.contractChecklist.map((category) => {
                    const categoryChecked = category.items.filter((i) =>
                        checkedItems.has(i.id)
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
                                </div>
                                <span>{isExpanded ? "▲" : "▼"}</span>
                            </button>

                            {isExpanded && (
                                <div className="p-4 pt-0 space-y-2">
                                    {category.items.map((item) => (
                                        <label
                                            key={item.id}
                                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${checkedItems.has(item.id)
                                                    ? "bg-green-50"
                                                    : item.critical
                                                        ? "bg-red-50"
                                                        : "bg-muted/10"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checkedItems.has(item.id)}
                                                onChange={() => toggleItem(item.id)}
                                                className="w-5 h-5 mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <span
                                                    className={
                                                        checkedItems.has(item.id)
                                                            ? "line-through text-muted-foreground"
                                                            : ""
                                                    }
                                                >
                                                    {item.text}
                                                </span>
                                                {item.critical && (
                                                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-bold">
                                                        CRITICAL
                                                    </span>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Ready to Sign */}
            {completionPercent === 100 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <h3 className="font-bold text-green-800 mb-1">
                        ✅ All Items Checked!
                    </h3>
                    <p className="text-sm text-green-700">
                        You've verified all items. Remember, you still have a 5-day cooling
                        off period after signing (NSW).
                    </p>
                </div>
            )}
        </div>
    );
}
