"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface CommunicationEntry {
    id: string;
    project_id: string;
    type: "call" | "email" | "sms" | "site_visit" | "meeting";
    date: string;
    summary: string;
    details: string;
    builder_response: string;
    follow_up_required: boolean;
    follow_up_date: string | null;
    created_at: string;
}

interface CommunicationLogProps {
    projectId: string;
}

const COMM_TYPES = [
    { id: "call", label: "Phone Call", icon: "📞" },
    { id: "email", label: "Email", icon: "📧" },
    { id: "sms", label: "SMS/Text", icon: "💬" },
    { id: "site_visit", label: "Site Visit", icon: "🏗️" },
    { id: "meeting", label: "Meeting", icon: "🤝" },
];

export default function CommunicationLog({ projectId }: CommunicationLogProps) {
    const [entries, setEntries] = useState<CommunicationEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        type: "call" as CommunicationEntry["type"],
        date: new Date().toISOString().split("T")[0],
        summary: "",
        details: "",
        builder_response: "",
        follow_up_required: false,
        follow_up_date: "",
    });

    useEffect(() => {
        fetchEntries();
    }, [projectId]);

    const fetchEntries = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("communication_log")
            .select("*")
            .eq("project_id", projectId)
            .order("date", { ascending: false });

        if (!error && data) {
            setEntries(data);
        } else {
            // Mock data for development
            setEntries([
                {
                    id: "1",
                    project_id: projectId,
                    type: "call",
                    date: "2026-01-08",
                    summary: "Weekly progress update call",
                    details: "Discussed frame stage timeline. Builder confirmed frame inspection for next week.",
                    builder_response: "Will send inspection booking confirmation by email.",
                    follow_up_required: true,
                    follow_up_date: "2026-01-10",
                    created_at: new Date().toISOString(),
                },
                {
                    id: "2",
                    project_id: projectId,
                    type: "email",
                    date: "2026-01-05",
                    summary: "Variation request for upgraded tiles",
                    details: "Builder sent variation for $3,500 to upgrade floor tiles in living area.",
                    builder_response: "",
                    follow_up_required: true,
                    follow_up_date: "2026-01-07",
                    created_at: new Date().toISOString(),
                },
            ]);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();

        const { error } = await supabase.from("communication_log").insert({
            project_id: projectId,
            ...formData,
            follow_up_date: formData.follow_up_required ? formData.follow_up_date : null,
        });

        if (!error) {
            setShowForm(false);
            setFormData({
                type: "call",
                date: new Date().toISOString().split("T")[0],
                summary: "",
                details: "",
                builder_response: "",
                follow_up_required: false,
                follow_up_date: "",
            });
            fetchEntries();
        }
    };

    const filteredEntries = filter
        ? entries.filter((e) => e.type === filter)
        : entries;

    const followUpsDue = entries.filter(
        (e) =>
            e.follow_up_required &&
            e.follow_up_date &&
            new Date(e.follow_up_date) <= new Date()
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">📝 Communication Log</h2>
                    <p className="text-muted-foreground">
                        Track every conversation with your builder.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-medium"
                >
                    + Log Communication
                </button>
            </div>

            {/* Follow-ups Alert */}
            {followUpsDue.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <h3 className="font-bold text-amber-800 mb-2">
                        ⏰ {followUpsDue.length} Follow-up{followUpsDue.length > 1 ? "s" : ""} Due
                    </h3>
                    <ul className="text-sm text-amber-700 space-y-1">
                        {followUpsDue.map((entry) => (
                            <li key={entry.id}>
                                • {entry.summary} (due {entry.follow_up_date})
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Filter */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilter(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${filter === null ? "bg-primary text-white" : "bg-muted/20"
                        }`}
                >
                    All ({entries.length})
                </button>
                {COMM_TYPES.map((type) => {
                    const count = entries.filter((e) => e.type === type.id).length;
                    return (
                        <button
                            key={type.id}
                            onClick={() => setFilter(type.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm ${filter === type.id ? "bg-primary text-white" : "bg-muted/20"
                                }`}
                        >
                            {type.icon} {type.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Entry Form */}
            {showForm && (
                <div className="p-6 bg-card border border-border rounded-xl">
                    <h3 className="font-bold mb-4">Log New Communication</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, type: e.target.value as any })
                                    }
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                                >
                                    {COMM_TYPES.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, date: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Summary</label>
                            <input
                                type="text"
                                value={formData.summary}
                                onChange={(e) =>
                                    setFormData({ ...formData, summary: e.target.value })
                                }
                                placeholder="Brief description of the communication"
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Detailed Notes
                            </label>
                            <textarea
                                value={formData.details}
                                onChange={(e) =>
                                    setFormData({ ...formData, details: e.target.value })
                                }
                                placeholder="What was discussed? Any commitments made?"
                                rows={3}
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Builder's Response/Promise
                            </label>
                            <textarea
                                value={formData.builder_response}
                                onChange={(e) =>
                                    setFormData({ ...formData, builder_response: e.target.value })
                                }
                                placeholder="What did the builder commit to?"
                                rows={2}
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.follow_up_required}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            follow_up_required: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Follow-up required</span>
                            </label>
                            {formData.follow_up_required && (
                                <input
                                    type="date"
                                    value={formData.follow_up_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, follow_up_date: e.target.value })
                                    }
                                    className="px-4 py-2 border border-border rounded-lg bg-background"
                                />
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-primary text-white rounded-lg font-medium"
                            >
                                Save Entry
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2 bg-muted/20 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Entries List */}
            <div className="space-y-4">
                {filteredEntries.map((entry) => {
                    const typeInfo = COMM_TYPES.find((t) => t.id === entry.type);
                    return (
                        <div
                            key={entry.id}
                            className="p-4 bg-card border border-border rounded-xl"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{typeInfo?.icon}</span>
                                    <div>
                                        <h4 className="font-bold">{entry.summary}</h4>
                                        <span className="text-sm text-muted-foreground">
                                            {entry.date} • {typeInfo?.label}
                                        </span>
                                    </div>
                                </div>
                                {entry.follow_up_required && (
                                    <span
                                        className={`px-2 py-1 text-xs rounded ${entry.follow_up_date &&
                                                new Date(entry.follow_up_date) <= new Date()
                                                ? "bg-red-100 text-red-700"
                                                : "bg-amber-100 text-amber-700"
                                            }`}
                                    >
                                        Follow-up: {entry.follow_up_date}
                                    </span>
                                )}
                            </div>

                            {entry.details && (
                                <p className="text-sm text-muted-foreground mb-2">
                                    {entry.details}
                                </p>
                            )}

                            {entry.builder_response && (
                                <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <span className="text-xs font-bold text-blue-700">
                                        Builder's Response:
                                    </span>
                                    <p className="text-sm text-blue-800">{entry.builder_response}</p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredEntries.length === 0 && !loading && (
                    <div className="text-center py-12 text-muted-foreground">
                        No communication entries yet. Start logging to build your evidence trail.
                    </div>
                )}
            </div>
        </div>
    );
}
