"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface CheckIn {
    id: string;
    date: string;
    status: "on_track" | "minor_delay" | "major_delay" | "blocked";
    notes: string;
    weather: string;
    workers_on_site: number;
    work_completed: string;
    next_week_plan: string;
    issues: string[];
    photos_count: number;
}

interface WeeklyCheckInProps {
    projectId: string;
}

const STATUS_OPTIONS = [
    { value: "on_track", label: "On Track", color: "bg-green-500", icon: "✅" },
    { value: "minor_delay", label: "Minor Delay", color: "bg-yellow-500", icon: "⚠️" },
    { value: "major_delay", label: "Major Delay", color: "bg-orange-500", icon: "🚨" },
    { value: "blocked", label: "Blocked", color: "bg-red-500", icon: "🛑" },
];

const COMMON_ISSUES = [
    "Weather delays",
    "Material shortage",
    "Subcontractor no-show",
    "Awaiting inspection",
    "Design clarification needed",
    "Permit issues",
    "Site access problems",
];

export default function WeeklyCheckIn({ projectId }: WeeklyCheckInProps) {
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        status: "on_track" as CheckIn["status"],
        notes: "",
        weather: "sunny",
        workers_on_site: 0,
        work_completed: "",
        next_week_plan: "",
        issues: [] as string[],
    });

    useEffect(() => {
        fetchCheckIns();
    }, [projectId]);

    const fetchCheckIns = async () => {
        // Mock data for demo
        const mockCheckIns: CheckIn[] = [
            {
                id: "1",
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: "on_track",
                notes: "Good progress on frame. All inspections passed.",
                weather: "sunny",
                workers_on_site: 6,
                work_completed: "Frame complete, roof trusses installed",
                next_week_plan: "Begin roofing and external wall wrap",
                issues: [],
                photos_count: 12,
            },
            {
                id: "2",
                date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                status: "minor_delay",
                notes: "Rain caused 2-day delay. Catching up now.",
                weather: "rainy",
                workers_on_site: 4,
                work_completed: "Slab curing complete, frame started",
                next_week_plan: "Complete wall frames",
                issues: ["Weather delays"],
                photos_count: 8,
            },
        ];
        setCheckIns(mockCheckIns);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newCheckIn: CheckIn = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...formData,
            photos_count: 0,
        };
        setCheckIns([newCheckIn, ...checkIns]);
        setShowForm(false);
        setFormData({
            status: "on_track",
            notes: "",
            weather: "sunny",
            workers_on_site: 0,
            work_completed: "",
            next_week_plan: "",
            issues: [],
        });
    };

    const toggleIssue = (issue: string) => {
        setFormData((prev) => ({
            ...prev,
            issues: prev.issues.includes(issue)
                ? prev.issues.filter((i) => i !== issue)
                : [...prev.issues, issue],
        }));
    };

    const getStatusInfo = (status: CheckIn["status"]) => {
        return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-AU", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Calculate streak
    const onTrackStreak = checkIns.filter((c) => c.status === "on_track").length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">📅 Weekly Check-Ins</h2>
                    <p className="text-muted-foreground">
                        Track your builder's weekly progress and any issues.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                    {showForm ? "Cancel" : "+ New Check-In"}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <div className="text-3xl font-bold text-green-600">{onTrackStreak}</div>
                    <div className="text-sm text-green-700">On Track Weeks</div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                    <div className="text-3xl font-bold text-blue-600">{checkIns.length}</div>
                    <div className="text-sm text-blue-700">Total Check-Ins</div>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
                    <div className="text-3xl font-bold text-purple-600">
                        {checkIns.reduce((acc, c) => acc + c.photos_count, 0)}
                    </div>
                    <div className="text-sm text-purple-700">Photos Logged</div>
                </div>
            </div>

            {/* New Check-In Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="p-6 bg-card border border-border rounded-xl space-y-6">
                    <h3 className="font-bold text-lg">New Weekly Check-In</h3>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Overall Status</label>
                        <div className="flex gap-2">
                            {STATUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: opt.value as CheckIn["status"] })}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${formData.status === opt.value
                                            ? `${opt.color} text-white`
                                            : "bg-muted hover:bg-muted/80"
                                        }`}
                                >
                                    {opt.icon} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Work Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Work Completed This Week</label>
                            <textarea
                                value={formData.work_completed}
                                onChange={(e) => setFormData({ ...formData, work_completed: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg resize-none h-24"
                                placeholder="Describe what was accomplished..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Plan for Next Week</label>
                            <textarea
                                value={formData.next_week_plan}
                                onChange={(e) => setFormData({ ...formData, next_week_plan: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg resize-none h-24"
                                placeholder="What's planned for next week..."
                            />
                        </div>
                    </div>

                    {/* Site Info */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Weather</label>
                            <select
                                value={formData.weather}
                                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                            >
                                <option value="sunny">☀️ Sunny</option>
                                <option value="cloudy">☁️ Cloudy</option>
                                <option value="rainy">🌧️ Rainy</option>
                                <option value="stormy">⛈️ Stormy</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Workers on Site</label>
                            <input
                                type="number"
                                value={formData.workers_on_site}
                                onChange={(e) => setFormData({ ...formData, workers_on_site: parseInt(e.target.value) || 0 })}
                                className="w-full p-3 border border-border rounded-lg"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Notes</label>
                            <input
                                type="text"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="Additional notes..."
                            />
                        </div>
                    </div>

                    {/* Issues */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Any Issues?</label>
                        <div className="flex flex-wrap gap-2">
                            {COMMON_ISSUES.map((issue) => (
                                <button
                                    key={issue}
                                    type="button"
                                    onClick={() => toggleIssue(issue)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${formData.issues.includes(issue)
                                            ? "bg-red-100 text-red-700 border border-red-300"
                                            : "bg-muted hover:bg-muted/80"
                                        }`}
                                >
                                    {issue}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                    >
                        Submit Check-In
                    </button>
                </form>
            )}

            {/* Check-In History */}
            <div className="space-y-4">
                <h3 className="font-bold">Check-In History</h3>
                {loading ? (
                    <div className="text-center text-muted-foreground py-8">Loading...</div>
                ) : checkIns.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        No check-ins yet. Start tracking your builder's progress!
                    </div>
                ) : (
                    checkIns.map((checkIn) => {
                        const statusInfo = getStatusInfo(checkIn.status);
                        return (
                            <div
                                key={checkIn.id}
                                className="p-4 bg-card border border-border rounded-xl"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-medium">{formatDate(checkIn.date)}</div>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${statusInfo.color} text-white mt-1`}
                                        >
                                            {statusInfo.icon} {statusInfo.label}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        👷 {checkIn.workers_on_site} workers • 📷 {checkIn.photos_count} photos
                                    </div>
                                </div>

                                {checkIn.notes && (
                                    <p className="text-sm text-muted-foreground mb-2">{checkIn.notes}</p>
                                )}

                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Completed:</span> {checkIn.work_completed}
                                    </div>
                                    <div>
                                        <span className="font-medium">Next Week:</span> {checkIn.next_week_plan}
                                    </div>
                                </div>

                                {checkIn.issues.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {checkIn.issues.map((issue) => (
                                            <span
                                                key={issue}
                                                className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
                                            >
                                                {issue}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
