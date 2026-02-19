"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Habit {
    id: string;
    name: string;
    icon: string;
    color: string;
    completedDates: string[];
    createdAt: string;
}

const ICONS = ["💪", "📚", "🧘", "💧", "🏃", "😴", "🥗", "💊", "✍️", "🎯", "🧠", "🌅"];
const COLORS = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
    "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
    "bg-cyan-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500",
];

export default function HabitTracker() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [newHabit, setNewHabit] = useState({ name: "", icon: "💪", color: "bg-blue-500" });
    const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("habitTracker");
        if (saved) {
            try {
                setHabits(JSON.parse(saved));
            } catch {
                console.error("Failed to load habits");
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (habits.length > 0 || localStorage.getItem("habitTracker")) {
            localStorage.setItem("habitTracker", JSON.stringify(habits));
        }
    }, [habits]);

    // Get week dates
    const getWeekDates = (weekOffset: number) => {
        const today = new Date();
        const currentDay = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - currentDay + 1 + weekOffset * 7);

        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const weekDates = getWeekDates(selectedWeek);
    const today = new Date().toISOString().split("T")[0];

    const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

    const isToday = (date: Date) => formatDateKey(date) === today;

    const toggleHabit = (habitId: string, date: Date) => {
        const dateKey = formatDateKey(date);
        // Don't allow future dates
        if (new Date(dateKey) > new Date(today)) return;

        setHabits(habits.map(habit => {
            if (habit.id !== habitId) return habit;

            const completed = habit.completedDates.includes(dateKey);
            return {
                ...habit,
                completedDates: completed
                    ? habit.completedDates.filter(d => d !== dateKey)
                    : [...habit.completedDates, dateKey],
            };
        }));
    };

    const addHabit = () => {
        if (!newHabit.name.trim()) return;

        const habit: Habit = {
            id: Date.now().toString(),
            name: newHabit.name.trim(),
            icon: newHabit.icon,
            color: newHabit.color,
            completedDates: [],
            createdAt: today,
        };

        setHabits([...habits, habit]);
        setNewHabit({ name: "", icon: "💪", color: "bg-blue-500" });
        setShowForm(false);
    };

    const deleteHabit = (id: string) => {
        if (confirm("Delete this habit? All progress will be lost.")) {
            setHabits(habits.filter(h => h.id !== id));
        }
    };

    const getStreak = (habit: Habit): number => {
        let streak = 0;
        const sortedDates = [...habit.completedDates].sort().reverse();
        const checkDate = new Date(today);

        for (let i = 0; i < 365; i++) {
            const dateKey = formatDateKey(checkDate);
            if (sortedDates.includes(dateKey)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (i > 0) {
                break; // Allow today to be incomplete
            } else {
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }
        return streak;
    };

    const getWeekProgress = (habit: Habit): number => {
        const completed = weekDates.filter(date =>
            habit.completedDates.includes(formatDateKey(date)) &&
            new Date(formatDateKey(date)) <= new Date(today)
        ).length;
        const total = weekDates.filter(date =>
            new Date(formatDateKey(date)) <= new Date(today)
        ).length;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900">
            {/* Header */}
            <nav className="border-b border-emerald-800/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-emerald-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>📊</span>
                            Habit Tracker
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                    >
                        + New Habit
                    </button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6">
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setSelectedWeek(w => w - 1)}
                        className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                    >
                        ← Previous
                    </button>
                    <div className="text-center">
                        <div className="text-white font-medium">
                            {weekDates[0].toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                            {" - "}
                            {weekDates[6].toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        {selectedWeek === 0 && (
                            <div className="text-emerald-400 text-sm">This Week</div>
                        )}
                    </div>
                    <button
                        onClick={() => setSelectedWeek(w => Math.min(0, w + 1))}
                        disabled={selectedWeek >= 0}
                        className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next →
                    </button>
                </div>

                {/* Habits Grid */}
                {habits.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🎯</div>
                        <h2 className="text-2xl font-bold text-white mb-2">No habits yet</h2>
                        <p className="text-slate-400 mb-6">Start tracking your daily habits!</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                        >
                            Add Your First Habit
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 gap-2 px-4">
                            <div className="col-span-4"></div>
                            {dayNames.map((day, i) => (
                                <div
                                    key={day}
                                    className={`text-center text-sm ${isToday(weekDates[i]) ? "text-emerald-400 font-bold" : "text-slate-400"
                                        }`}
                                >
                                    {day}
                                    <div className={`text-xs ${isToday(weekDates[i]) ? "text-emerald-400" : "text-slate-500"}`}>
                                        {weekDates[i].getDate()}
                                    </div>
                                </div>
                            ))}
                            <div className="text-center text-xs text-slate-400">🔥</div>
                        </div>

                        {/* Habit Rows */}
                        {habits.map(habit => (
                            <div
                                key={habit.id}
                                className="grid grid-cols-12 gap-2 items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
                            >
                                {/* Habit Name */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className={`w-10 h-10 ${habit.color} rounded-lg flex items-center justify-center text-xl`}>
                                        {habit.icon}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium truncate">{habit.name}</div>
                                        <div className="text-xs text-slate-400">{getWeekProgress(habit)}% this week</div>
                                    </div>
                                </div>

                                {/* Day Checkboxes */}
                                {weekDates.map((date, i) => {
                                    const dateKey = formatDateKey(date);
                                    const isComplete = habit.completedDates.includes(dateKey);
                                    const isFuture = new Date(dateKey) > new Date(today);

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => toggleHabit(habit.id, date)}
                                            disabled={isFuture}
                                            className={`aspect-square rounded-lg flex items-center justify-center text-lg transition-all ${isFuture
                                                    ? "bg-slate-700/30 cursor-not-allowed"
                                                    : isComplete
                                                        ? `${habit.color} text-white`
                                                        : "bg-slate-700 hover:bg-slate-600"
                                                }`}
                                        >
                                            {isComplete && "✓"}
                                        </button>
                                    );
                                })}

                                {/* Streak */}
                                <div className="text-center">
                                    <div className="text-lg font-bold text-orange-400">{getStreak(habit)}</div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => deleteHabit(habit.id)}
                                    className="absolute right-2 top-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Habit Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
                            <h2 className="text-xl font-bold text-white mb-6">Add New Habit</h2>

                            <div className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Habit Name</label>
                                    <input
                                        type="text"
                                        value={newHabit.name}
                                        onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                                        placeholder="e.g., Drink 8 glasses of water"
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                                        autoFocus
                                    />
                                </div>

                                {/* Icon */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Icon</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {ICONS.map(icon => (
                                            <button
                                                key={icon}
                                                onClick={() => setNewHabit({ ...newHabit, icon })}
                                                className={`p-3 text-2xl rounded-lg ${newHabit.icon === icon
                                                        ? "bg-emerald-600"
                                                        : "bg-slate-700 hover:bg-slate-600"
                                                    }`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Color</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setNewHabit({ ...newHabit, color })}
                                                className={`h-10 rounded-lg ${color} ${newHabit.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800" : ""
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addHabit}
                                    disabled={!newHabit.name.trim()}
                                    className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    Add Habit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
