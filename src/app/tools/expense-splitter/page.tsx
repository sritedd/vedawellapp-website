"use client";

import { useState } from "react";
import Link from "next/link";

interface Person {
    id: string;
    name: string;
}

interface Expense {
    id: string;
    description: string;
    amount: number;
    paidBy: string;
    splitBetween: string[];
}

interface Settlement {
    from: string;
    to: string;
    amount: number;
}

export default function ExpenseSplitter() {
    const [people, setPeople] = useState<Person[]>([
        { id: "1", name: "Person 1" },
        { id: "2", name: "Person 2" },
    ]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [newExpense, setNewExpense] = useState({
        description: "",
        amount: "",
        paidBy: "",
        splitBetween: [] as string[],
    });

    const addPerson = () => {
        const person: Person = {
            id: Date.now().toString(),
            name: `Person ${people.length + 1}`,
        };
        setPeople([...people, person]);
    };

    const updatePersonName = (id: string, name: string) => {
        setPeople(people.map(p => (p.id === id ? { ...p, name } : p)));
    };

    const removePerson = (id: string) => {
        if (people.length <= 2) return;
        setPeople(people.filter(p => p.id !== id));
        setExpenses(expenses.filter(e => e.paidBy !== id && !e.splitBetween.includes(id)));
    };

    const addExpense = () => {
        if (!newExpense.description || !newExpense.amount || !newExpense.paidBy) return;
        if (newExpense.splitBetween.length === 0) return;

        const expense: Expense = {
            id: Date.now().toString(),
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            paidBy: newExpense.paidBy,
            splitBetween: newExpense.splitBetween,
        };

        setExpenses([...expenses, expense]);
        setNewExpense({ description: "", amount: "", paidBy: "", splitBetween: [] });
    };

    const removeExpense = (id: string) => {
        setExpenses(expenses.filter(e => e.id !== id));
    };

    const toggleSplitPerson = (personId: string) => {
        if (newExpense.splitBetween.includes(personId)) {
            setNewExpense({
                ...newExpense,
                splitBetween: newExpense.splitBetween.filter(id => id !== personId),
            });
        } else {
            setNewExpense({
                ...newExpense,
                splitBetween: [...newExpense.splitBetween, personId],
            });
        }
    };

    const selectAllForSplit = () => {
        setNewExpense({ ...newExpense, splitBetween: people.map(p => p.id) });
    };

    // Calculate balances
    const calculateBalances = (): Map<string, number> => {
        const balances = new Map<string, number>();
        people.forEach(p => balances.set(p.id, 0));

        expenses.forEach(expense => {
            const splitAmount = expense.amount / expense.splitBetween.length;

            // Payer gets credit
            balances.set(expense.paidBy, (balances.get(expense.paidBy) || 0) + expense.amount);

            // Everyone who needs to pay
            expense.splitBetween.forEach(personId => {
                balances.set(personId, (balances.get(personId) || 0) - splitAmount);
            });
        });

        return balances;
    };

    // Calculate settlements (who pays whom)
    const calculateSettlements = (): Settlement[] => {
        const balances = calculateBalances();
        const settlements: Settlement[] = [];

        // Separate into creditors (positive balance) and debtors (negative balance)
        const creditors: { id: string; amount: number }[] = [];
        const debtors: { id: string; amount: number }[] = [];

        balances.forEach((amount, id) => {
            if (amount > 0.01) {
                creditors.push({ id, amount });
            } else if (amount < -0.01) {
                debtors.push({ id, amount: Math.abs(amount) });
            }
        });

        // Sort by amount descending
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);

        // Match debtors with creditors
        let ci = 0, di = 0;
        while (ci < creditors.length && di < debtors.length) {
            const creditor = creditors[ci];
            const debtor = debtors[di];
            const amount = Math.min(creditor.amount, debtor.amount);

            if (amount > 0.01) {
                settlements.push({
                    from: debtor.id,
                    to: creditor.id,
                    amount: Math.round(amount * 100) / 100,
                });
            }

            creditor.amount -= amount;
            debtor.amount -= amount;

            if (creditor.amount < 0.01) ci++;
            if (debtor.amount < 0.01) di++;
        }

        return settlements;
    };

    const balances = calculateBalances();
    const settlements = calculateSettlements();
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const getPersonName = (id: string) => people.find(p => p.id === id)?.name || "Unknown";

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-slate-900 to-slate-900">
            {/* Header */}
            <nav className="border-b border-amber-800/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-amber-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>💰</span>
                            Expense Splitter
                        </h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left - People & Expenses */}
                    <div className="space-y-6">
                        {/* People */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-800/30">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium text-white">People</h2>
                                <button
                                    onClick={addPerson}
                                    className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
                                >
                                    + Add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {people.map(person => (
                                    <div key={person.id} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={person.name}
                                            onChange={(e) => updatePersonName(person.id, e.target.value)}
                                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => removePerson(person.id)}
                                            disabled={people.length <= 2}
                                            className="text-red-400 hover:text-red-300 disabled:opacity-30"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Add Expense */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Add Expense</h2>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    placeholder="What was it for?"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                                />
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs text-slate-400 mb-1">Amount</label>
                                        <input
                                            type="number"
                                            value={newExpense.amount}
                                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-slate-400 mb-1">Paid by</label>
                                        <select
                                            value={newExpense.paidBy}
                                            onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                                        >
                                            <option value="">Select...</option>
                                            {people.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs text-slate-400">Split between</label>
                                        <button
                                            onClick={selectAllForSplit}
                                            className="text-xs text-amber-400 hover:text-amber-300"
                                        >
                                            Select All
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {people.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => toggleSplitPerson(p.id)}
                                                className={`px-3 py-1.5 rounded-lg text-sm ${newExpense.splitBetween.includes(p.id)
                                                        ? "bg-amber-600 text-white"
                                                        : "bg-slate-700 text-slate-300"
                                                    }`}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={addExpense}
                                    disabled={!newExpense.description || !newExpense.amount || !newExpense.paidBy || newExpense.splitBetween.length === 0}
                                    className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
                                >
                                    Add Expense
                                </button>
                            </div>
                        </div>

                        {/* Expenses List */}
                        {expenses.length > 0 && (
                            <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-800/30">
                                <h2 className="text-lg font-medium text-white mb-4">Expenses</h2>
                                <div className="space-y-2">
                                    {expenses.map(expense => (
                                        <div key={expense.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                                            <div>
                                                <div className="text-white font-medium">{expense.description}</div>
                                                <div className="text-xs text-slate-400">
                                                    Paid by {getPersonName(expense.paidBy)} • Split {expense.splitBetween.length} ways
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-amber-400 font-mono">${expense.amount.toFixed(2)}</span>
                                                <button
                                                    onClick={() => removeExpense(expense.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right - Summary & Settlements */}
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Summary</h2>
                            <div className="text-center mb-6">
                                <div className="text-4xl font-bold text-amber-400">
                                    ${totalExpenses.toFixed(2)}
                                </div>
                                <div className="text-slate-400 text-sm">Total Expenses</div>
                            </div>
                            <div className="space-y-2">
                                {people.map(person => {
                                    const balance = balances.get(person.id) || 0;
                                    return (
                                        <div key={person.id} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                                            <span className="text-white">{person.name}</span>
                                            <span className={`font-mono ${balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                                                {balance >= 0 ? "+" : ""}${balance.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Settlements */}
                        {settlements.length > 0 && (
                            <div className="bg-slate-800/50 rounded-xl p-6 border border-green-800/30">
                                <h2 className="text-lg font-medium text-white mb-4">💸 Who Pays Whom</h2>
                                <div className="space-y-3">
                                    {settlements.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">{getPersonName(s.from)}</span>
                                                <span className="text-slate-400">→</span>
                                                <span className="text-white font-medium">{getPersonName(s.to)}</span>
                                            </div>
                                            <span className="text-green-400 font-bold text-lg">
                                                ${s.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
