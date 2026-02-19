"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    calculateTotalBudgeted,
    calculateTotalActual,
    calculateBudgetVariance,
    calculateContingencyPercent,
    BudgetCategory as UtilBudgetCategory,
} from "@/lib/guardian/calculations";

interface BudgetCategory {
    id: string;
    name: string;
    icon: string;
    budgeted: number;
    actual: number;
}

interface BudgetDashboardProps {
    projectId: string;
    contractValue: number;
}

const DEFAULT_CATEGORIES: Omit<BudgetCategory, "id" | "budgeted" | "actual">[] = [
    { name: "Contract Base", icon: "🏠" },
    { name: "Variations", icon: "📝" },
    { name: "PC Items (Upgrades)", icon: "✨" },
    { name: "Landscaping", icon: "🌳" },
    { name: "Fencing", icon: "🏗️" },
    { name: "Driveway/Paths", icon: "🛤️" },
    { name: "Window Treatments", icon: "🪟" },
    { name: "Floor Coverings", icon: "🏠" },
    { name: "Site Costs", icon: "🚜" },
    { name: "Council Fees", icon: "📋" },
    { name: "Legal/Conveyancing", icon: "⚖️" },
    { name: "Contingency", icon: "🛡️" },
];

export default function BudgetDashboard({
    projectId,
    contractValue,
}: BudgetDashboardProps) {
    const [categories, setCategories] = useState<BudgetCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [newExpense, setNewExpense] = useState({
        category: "",
        amount: "",
        description: "",
    });

    useEffect(() => {
        // Initialize with default categories
        const defaultBudget: BudgetCategory[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
            id: `cat-${idx}`,
            ...cat,
            budgeted: idx === 0
                ? contractValue
                : idx === 11
                    ? contractValue * 0.1 // 10% contingency
                    : 0,
            actual: idx === 0 ? contractValue : 0,
        }));
        setCategories(defaultBudget);
        setLoading(false);
    }, [contractValue]);

    const updateActual = (categoryId: string, amount: number) => {
        setCategories(cats =>
            cats.map(c =>
                c.id === categoryId ? { ...c, actual: c.actual + amount } : c
            )
        );
    };

    const handleAddExpense = () => {
        if (newExpense.category && newExpense.amount) {
            updateActual(newExpense.category, parseFloat(newExpense.amount));
            setNewExpense({ category: "", amount: "", description: "" });
            setShowAddExpense(false);
        }
    };

    // Calculate using tested utility functions
    const totalBudgeted = calculateTotalBudgeted(categories as UtilBudgetCategory[]);
    const totalActual = calculateTotalActual(categories as UtilBudgetCategory[]);
    const variance = calculateBudgetVariance(totalActual, totalBudgeted);
    const variancePercent = totalBudgeted > 0 ? (variance / totalBudgeted) * 100 : 0;

    const contingencyUsed = categories.find(c => c.name === "Contingency");
    const contingencyPercent = contingencyUsed
        ? calculateContingencyPercent(contingencyUsed.actual, contingencyUsed.budgeted)
        : 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">📊 Budget Dashboard</h2>
                    <p className="text-muted-foreground">
                        Track your actual spending vs budget in real-time.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddExpense(true)}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-medium"
                >
                    + Add Expense
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-card border border-border rounded-xl">
                    <div className="text-sm text-muted-foreground">Total Budget</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</div>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl">
                    <div className="text-sm text-muted-foreground">Total Spent</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalActual)}</div>
                </div>
                <div
                    className={`p-4 rounded-xl border ${variance > 0
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                        }`}
                >
                    <div className={`text-sm ${variance > 0 ? "text-red-700" : "text-green-700"}`}>
                        Variance
                    </div>
                    <div
                        className={`text-2xl font-bold ${variance > 0 ? "text-red-800" : "text-green-800"
                            }`}
                    >
                        {variance > 0 ? "+" : ""}{formatCurrency(variance)}
                    </div>
                    <div className={`text-xs ${variance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {variancePercent > 0 ? "+" : ""}{variancePercent.toFixed(1)}% of budget
                    </div>
                </div>
                <div
                    className={`p-4 rounded-xl border ${contingencyPercent > 80
                        ? "bg-red-50 border-red-200"
                        : contingencyPercent > 50
                            ? "bg-amber-50 border-amber-200"
                            : "bg-green-50 border-green-200"
                        }`}
                >
                    <div className="text-sm text-muted-foreground">Contingency Used</div>
                    <div className="text-2xl font-bold">{contingencyPercent.toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground">
                        {formatCurrency(contingencyUsed?.actual || 0)} of {formatCurrency(contingencyUsed?.budgeted || 0)}
                    </div>
                </div>
            </div>

            {/* Variance Alert */}
            {variancePercent > 10 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <h3 className="font-bold text-red-800 mb-1">
                        ⚠️ Budget Overrun Alert
                    </h3>
                    <p className="text-sm text-red-700">
                        Your actual spending is {variancePercent.toFixed(1)}% over budget.
                        Review your variations and consider pausing non-essential upgrades.
                    </p>
                </div>
            )}

            {/* Add Expense Form */}
            {showAddExpense && (
                <div className="p-6 bg-card border border-border rounded-xl">
                    <h3 className="font-bold mb-4">Add Expense</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <select
                            value={newExpense.category}
                            onChange={(e) =>
                                setNewExpense({ ...newExpense, category: e.target.value })
                            }
                            className="px-4 py-2 border border-border rounded-lg bg-background"
                        >
                            <option value="">Select category...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={newExpense.amount}
                            onChange={(e) =>
                                setNewExpense({ ...newExpense, amount: e.target.value })
                            }
                            placeholder="Amount"
                            className="px-4 py-2 border border-border rounded-lg bg-background"
                        />
                        <input
                            type="text"
                            value={newExpense.description}
                            onChange={(e) =>
                                setNewExpense({ ...newExpense, description: e.target.value })
                            }
                            placeholder="Description"
                            className="px-4 py-2 border border-border rounded-lg bg-background"
                        />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleAddExpense}
                            className="px-6 py-2 bg-primary text-white rounded-lg"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setShowAddExpense(false)}
                            className="px-6 py-2 bg-muted/20 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Category Breakdown */}
            <div className="space-y-3">
                {categories.map((category) => {
                    const variance = category.actual - category.budgeted;
                    const percentUsed = category.budgeted > 0
                        ? (category.actual / category.budgeted) * 100
                        : category.actual > 0
                            ? 100
                            : 0;

                    return (
                        <div
                            key={category.id}
                            className="p-4 bg-card border border-border rounded-xl"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{category.icon}</span>
                                    <span className="font-medium">{category.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">
                                        {formatCurrency(category.actual)}
                                    </div>
                                    {category.budgeted > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            of {formatCurrency(category.budgeted)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress bar */}
                            {category.budgeted > 0 && (
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${percentUsed > 100
                                            ? "bg-red-500"
                                            : percentUsed > 80
                                                ? "bg-amber-500"
                                                : "bg-green-500"
                                            }`}
                                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                    />
                                </div>
                            )}

                            {variance !== 0 && category.budgeted > 0 && (
                                <div
                                    className={`text-xs mt-1 ${variance > 0 ? "text-red-600" : "text-green-600"
                                        }`}
                                >
                                    {variance > 0 ? "+" : ""}{formatCurrency(variance)} (
                                    {variance > 0 ? "over" : "under"} budget)
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
