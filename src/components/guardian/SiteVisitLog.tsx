"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOfflineSync } from "@/lib/offline/useOfflineSync";

interface SiteVisit {
    id: string;
    date: string;
    time: string;
    duration: string;
    purpose: string;
    attendees: string[];
    observations: string;
    concerns: string[];
    follow_up_actions: string[];
    weather_conditions: string;
    workers_on_site: number;
    photos_taken: number;
}

interface SiteVisitLogProps {
    projectId: string;
}

const VISIT_PURPOSES = [
    "Weekly Progress Check",
    "Scheduled Inspection",
    "Defect Inspection",
    "Pre-Handover Walk",
    "Handover",
    "Warranty Inspection",
    "Unscheduled Visit",
    "Meeting with Builder",
];

export default function SiteVisitLog({ projectId }: SiteVisitLogProps) {
    const [visits, setVisits] = useState<SiteVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const {
        isOnline,
        pendingCount,
        syncing,
        syncNow,
        offlineInsert,
        failedMutations,
        discardFailed,
        retryFailed,
    } = useOfflineSync();

    const [newVisit, setNewVisit] = useState({
        date: new Date().toISOString().split("T")[0],
        time: "10:00",
        duration: "30 mins",
        purpose: "Weekly Progress Check",
        attendees: "",
        observations: "",
        concerns: "",
        followUpActions: "",
        weatherConditions: "Sunny",
        workersOnSite: 0,
        photosTaken: 0,
    });

    useEffect(() => {
        fetchVisits();
    }, [projectId]);

    const fetchVisits = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("site_visits")
            .select("*")
            .eq("project_id", projectId)
            .order("date", { ascending: false });

        if (data) {
            setVisits(data.map((v: Record<string, unknown>) => ({
                id: v.id as string,
                date: v.date as string,
                time: (v.time as string) || "",
                duration: (v.duration as string) || "",
                purpose: (v.purpose as string) || "",
                attendees: (v.attendees as string[]) || [],
                observations: (v.observations as string) || "",
                concerns: (v.concerns as string[]) || [],
                follow_up_actions: (v.follow_up_actions as string[]) || [],
                weather_conditions: (v.weather_conditions as string) || "",
                workers_on_site: (v.workers_on_site as number) || 0,
                photos_taken: (v.photos_taken as number) || 0,
            })));
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const row = {
            project_id: projectId,
            date: newVisit.date,
            time: newVisit.time,
            duration: newVisit.duration,
            purpose: newVisit.purpose,
            attendees: newVisit.attendees.split(",").map(a => a.trim()).filter(Boolean),
            observations: newVisit.observations,
            concerns: newVisit.concerns.split("\n").map(c => c.trim()).filter(Boolean),
            follow_up_actions: newVisit.followUpActions.split("\n").map(a => a.trim()).filter(Boolean),
            weather_conditions: newVisit.weatherConditions,
            workers_on_site: newVisit.workersOnSite,
            photos_taken: newVisit.photosTaken,
        };

        const success = await offlineInsert("site_visits", row);

        if (success) {
            // Optimistic: add to local list if offline
            if (!isOnline) {
                setVisits((prev) => [{
                    id: `offline-${Date.now()}`,
                    date: row.date,
                    time: row.time,
                    duration: row.duration,
                    purpose: row.purpose,
                    attendees: row.attendees,
                    observations: row.observations,
                    concerns: row.concerns,
                    follow_up_actions: row.follow_up_actions,
                    weather_conditions: row.weather_conditions,
                    workers_on_site: row.workers_on_site,
                    photos_taken: row.photos_taken,
                }, ...prev]);
            } else {
                fetchVisits();
            }

            setShowForm(false);
            setNewVisit({
                date: new Date().toISOString().split("T")[0],
                time: "10:00", duration: "30 mins", purpose: "Weekly Progress Check",
                attendees: "", observations: "", concerns: "", followUpActions: "",
                weatherConditions: "Sunny", workersOnSite: 0, photosTaken: 0,
            });
        }
    };

    const totalVisits = visits.length;
    const totalPhotos = visits.reduce((acc, v) => acc + v.photos_taken, 0);
    const openConcerns = visits.flatMap(v => v.concerns).length;
    const pendingActions = visits.flatMap(v => v.follow_up_actions).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Offline banner */}
            {!isOnline && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 dark:bg-amber-950/30 dark:border-amber-800">
                    <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                            You&apos;re offline — visits will be saved locally and synced when you reconnect.
                        </p>
                    </div>
                </div>
            )}

            {/* Pending sync banner */}
            {isOnline && pendingCount > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between dark:bg-blue-950/30 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        {pendingCount} visit{pendingCount === 1 ? "" : "s"} saved offline — ready to sync.
                    </p>
                    <button
                        onClick={async () => { await syncNow(); fetchVisits(); }}
                        disabled={syncing}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-50"
                    >
                        {syncing ? "Syncing..." : "Sync Now"}
                    </button>
                </div>
            )}

            {/* Failed sync banner — mutations that exhausted retries */}
            {failedMutations.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/30 dark:border-red-800">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                        ⚠️ {failedMutations.length} offline write{failedMutations.length === 1 ? "" : "s"} failed after repeated retries.
                    </p>
                    <ul className="space-y-2">
                        {failedMutations.map((m) => (
                            <li key={m.id} className="flex items-start justify-between gap-3 text-xs bg-white/60 dark:bg-red-950/40 p-2 rounded">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-red-900 dark:text-red-200">
                                        {m.operation} on {m.table}
                                    </div>
                                    {m.lastError && (
                                        <div className="text-red-700 dark:text-red-400 truncate" title={m.lastError}>
                                            {m.lastError}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    {m.id !== undefined && (
                                        <>
                                            <button
                                                onClick={async () => { await retryFailed(m.id!); fetchVisits(); }}
                                                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                            >
                                                Retry
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm("Discard this failed write? The data will be lost.")) {
                                                        discardFailed(m.id!);
                                                    }
                                                }}
                                                className="px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-100"
                                            >
                                                Discard
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Site Visit Log</h2>
                    <p className="text-muted-foreground">
                        Document your site visits and observations
                        {!isOnline && " (offline mode)"}
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                    {showForm ? "Cancel" : "+ Log Visit"}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalVisits}</div>
                    <div className="text-xs text-blue-700">Total Visits</div>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-purple-600">{totalPhotos}</div>
                    <div className="text-xs text-purple-700">Photos Taken</div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-600">{openConcerns}</div>
                    <div className="text-xs text-amber-700">Concerns Raised</div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-600">{pendingActions}</div>
                    <div className="text-xs text-green-700">Follow-ups</div>
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="p-6 bg-card border border-border rounded-xl space-y-4">
                    <h3 className="font-bold">Log New Site Visit</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Date</label>
                            <input type="date" value={newVisit.date} onChange={(e) => setNewVisit({ ...newVisit, date: e.target.value })} className="w-full p-3 border border-border rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Time</label>
                            <input type="time" value={newVisit.time} onChange={(e) => setNewVisit({ ...newVisit, time: e.target.value })} className="w-full p-3 border border-border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Duration</label>
                            <select value={newVisit.duration} onChange={(e) => setNewVisit({ ...newVisit, duration: e.target.value })} className="w-full p-3 border border-border rounded-lg">
                                <option>15 mins</option><option>30 mins</option><option>45 mins</option>
                                <option>1 hour</option><option>1.5 hours</option><option>2+ hours</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Purpose</label>
                            <select value={newVisit.purpose} onChange={(e) => setNewVisit({ ...newVisit, purpose: e.target.value })} className="w-full p-3 border border-border rounded-lg">
                                {VISIT_PURPOSES.map(p => (<option key={p} value={p}>{p}</option>))}
                            </select>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Weather</label>
                            <input type="text" value={newVisit.weatherConditions} onChange={(e) => setNewVisit({ ...newVisit, weatherConditions: e.target.value })} className="w-full p-3 border border-border rounded-lg" placeholder="e.g., Sunny, 22C" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Workers on Site</label>
                            <input type="number" value={newVisit.workersOnSite} onChange={(e) => setNewVisit({ ...newVisit, workersOnSite: parseInt(e.target.value) || 0 })} className="w-full p-3 border border-border rounded-lg" min="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Photos Taken</label>
                            <input type="number" value={newVisit.photosTaken} onChange={(e) => setNewVisit({ ...newVisit, photosTaken: parseInt(e.target.value) || 0 })} className="w-full p-3 border border-border rounded-lg" min="0" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Who was on site?</label>
                        <input type="text" value={newVisit.attendees} onChange={(e) => setNewVisit({ ...newVisit, attendees: e.target.value })} className="w-full p-3 border border-border rounded-lg" placeholder="e.g., Site Supervisor, Electrician (comma separated)" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Observations</label>
                        <textarea value={newVisit.observations} onChange={(e) => setNewVisit({ ...newVisit, observations: e.target.value })} className="w-full p-3 border border-border rounded-lg resize-none h-24" placeholder="What did you observe?" required />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Concerns (one per line)</label>
                            <textarea value={newVisit.concerns} onChange={(e) => setNewVisit({ ...newVisit, concerns: e.target.value })} className="w-full p-3 border border-border rounded-lg resize-none h-24" placeholder="Any issues or concerns?" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Follow-up Actions (one per line)</label>
                            <textarea value={newVisit.followUpActions} onChange={(e) => setNewVisit({ ...newVisit, followUpActions: e.target.value })} className="w-full p-3 border border-border rounded-lg resize-none h-24" placeholder="What needs to be followed up?" />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
                        Log Site Visit
                    </button>
                </form>
            )}

            {/* Visit List */}
            <div className="space-y-4">
                {visits.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-border rounded-xl">
                        <p className="text-muted-foreground">No site visits logged yet. Log your first visit above.</p>
                    </div>
                ) : (
                    visits.map((visit) => (
                        <div key={visit.id} className="p-5 bg-card border border-border rounded-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg">{visit.purpose}</h3>
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{visit.duration}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(visit.date).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                        {visit.time && ` at ${visit.time}`}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                    {visit.weather_conditions && <div>{visit.weather_conditions}</div>}
                                    <div>{visit.workers_on_site} workers</div>
                                    <div>{visit.photos_taken} photos</div>
                                </div>
                            </div>
                            {visit.attendees.length > 0 && (
                                <div className="mb-3">
                                    <span className="text-sm font-medium">On site: </span>
                                    <span className="text-sm text-muted-foreground">{visit.attendees.join(", ")}</span>
                                </div>
                            )}
                            <div className="p-3 bg-muted/30 rounded-lg mb-3">
                                <p className="text-sm">{visit.observations}</p>
                            </div>
                            {visit.concerns.length > 0 && (
                                <div className="mb-3">
                                    <h4 className="text-sm font-medium text-amber-700 mb-1">Concerns:</h4>
                                    <ul className="list-disc list-inside text-sm text-amber-600">
                                        {visit.concerns.map((c, i) => (<li key={i}>{c}</li>))}
                                    </ul>
                                </div>
                            )}
                            {visit.follow_up_actions.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-blue-700 mb-1">Follow-up:</h4>
                                    <ul className="list-disc list-inside text-sm text-blue-600">
                                        {visit.follow_up_actions.map((a, i) => (<li key={i}>{a}</li>))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Tips */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                <p className="font-medium mb-1">Site Visit Best Practices</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Visit regularly (weekly during active construction)</li>
                    <li>Take photos from the same spots each visit to show progress</li>
                    <li>Document who was on site and what trades were working</li>
                    <li>Follow up on any concerns in writing (email)</li>
                </ul>
            </div>
        </div>
    );
}
