"use client";

import { useState } from "react";

interface SiteVisit {
    id: string;
    date: string;
    time: string;
    duration: string;
    purpose: string;
    attendees: string[];
    observations: string;
    concerns: string[];
    followUpActions: string[];
    weatherConditions: string;
    workersOnSite: number;
    photosTaken: number;
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

const SAMPLE_VISITS: SiteVisit[] = [
    {
        id: "1",
        date: "2025-08-05",
        time: "10:00",
        duration: "45 mins",
        purpose: "Weekly Progress Check",
        attendees: ["Site Supervisor", "Electrician"],
        observations: "Frame complete, roof trusses being installed. Good progress on external walls.",
        concerns: ["Window frames not yet delivered"],
        followUpActions: ["Confirm window delivery date with supplier"],
        weatherConditions: "Sunny, 22°C",
        workersOnSite: 6,
        photosTaken: 15,
    },
    {
        id: "2",
        date: "2025-07-28",
        time: "14:30",
        duration: "1 hour",
        purpose: "Scheduled Inspection",
        attendees: ["Site Supervisor", "Private Certifier"],
        observations: "Frame inspection passed. All tie-downs and bracing correct.",
        concerns: [],
        followUpActions: ["Collect frame certificate"],
        weatherConditions: "Cloudy, 18°C",
        workersOnSite: 4,
        photosTaken: 22,
    },
];

export default function SiteVisitLog({ projectId }: SiteVisitLogProps) {
    const [visits, setVisits] = useState<SiteVisit[]>(SAMPLE_VISITS);
    const [showForm, setShowForm] = useState(false);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const visit: SiteVisit = {
            id: Date.now().toString(),
            date: newVisit.date,
            time: newVisit.time,
            duration: newVisit.duration,
            purpose: newVisit.purpose,
            attendees: newVisit.attendees.split(",").map(a => a.trim()).filter(Boolean),
            observations: newVisit.observations,
            concerns: newVisit.concerns.split("\n").map(c => c.trim()).filter(Boolean),
            followUpActions: newVisit.followUpActions.split("\n").map(a => a.trim()).filter(Boolean),
            weatherConditions: newVisit.weatherConditions,
            workersOnSite: newVisit.workersOnSite,
            photosTaken: newVisit.photosTaken,
        };
        setVisits([visit, ...visits]);
        setShowForm(false);
        setNewVisit({
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
    };

    const totalVisits = visits.length;
    const totalPhotos = visits.reduce((acc, v) => acc + v.photosTaken, 0);
    const openConcerns = visits.flatMap(v => v.concerns).length;
    const pendingActions = visits.flatMap(v => v.followUpActions).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">🏗️ Site Visit Log</h2>
                    <p className="text-muted-foreground">
                        Document your site visits and observations
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
                            <input
                                type="date"
                                value={newVisit.date}
                                onChange={(e) => setNewVisit({ ...newVisit, date: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Time</label>
                            <input
                                type="time"
                                value={newVisit.time}
                                onChange={(e) => setNewVisit({ ...newVisit, time: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Duration</label>
                            <select
                                value={newVisit.duration}
                                onChange={(e) => setNewVisit({ ...newVisit, duration: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                            >
                                <option>15 mins</option>
                                <option>30 mins</option>
                                <option>45 mins</option>
                                <option>1 hour</option>
                                <option>1.5 hours</option>
                                <option>2+ hours</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Purpose</label>
                            <select
                                value={newVisit.purpose}
                                onChange={(e) => setNewVisit({ ...newVisit, purpose: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                            >
                                {VISIT_PURPOSES.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Weather</label>
                            <input
                                type="text"
                                value={newVisit.weatherConditions}
                                onChange={(e) => setNewVisit({ ...newVisit, weatherConditions: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="e.g., Sunny, 22°C"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Workers on Site</label>
                            <input
                                type="number"
                                value={newVisit.workersOnSite}
                                onChange={(e) => setNewVisit({ ...newVisit, workersOnSite: parseInt(e.target.value) || 0 })}
                                className="w-full p-3 border border-border rounded-lg"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Photos Taken</label>
                            <input
                                type="number"
                                value={newVisit.photosTaken}
                                onChange={(e) => setNewVisit({ ...newVisit, photosTaken: parseInt(e.target.value) || 0 })}
                                className="w-full p-3 border border-border rounded-lg"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Who was on site?</label>
                        <input
                            type="text"
                            value={newVisit.attendees}
                            onChange={(e) => setNewVisit({ ...newVisit, attendees: e.target.value })}
                            className="w-full p-3 border border-border rounded-lg"
                            placeholder="e.g., Site Supervisor, Electrician, Plumber (comma separated)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Observations</label>
                        <textarea
                            value={newVisit.observations}
                            onChange={(e) => setNewVisit({ ...newVisit, observations: e.target.value })}
                            className="w-full p-3 border border-border rounded-lg resize-none h-24"
                            placeholder="What did you observe? What progress was made?"
                            required
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Concerns (one per line)</label>
                            <textarea
                                value={newVisit.concerns}
                                onChange={(e) => setNewVisit({ ...newVisit, concerns: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg resize-none h-24"
                                placeholder="Any issues or concerns noticed?"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Follow-up Actions (one per line)</label>
                            <textarea
                                value={newVisit.followUpActions}
                                onChange={(e) => setNewVisit({ ...newVisit, followUpActions: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg resize-none h-24"
                                placeholder="What needs to be followed up?"
                            />
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
                        <span className="text-4xl block mb-2">🏗️</span>
                        <p className="text-muted-foreground">No site visits logged yet.</p>
                    </div>
                ) : (
                    visits.map((visit) => (
                        <div key={visit.id} className="p-5 bg-card border border-border rounded-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg">{visit.purpose}</h3>
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                            {visit.duration}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        📅 {new Date(visit.date).toLocaleDateString("en-AU", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric"
                                        })} at {visit.time}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                    <div>☀️ {visit.weatherConditions}</div>
                                    <div>👷 {visit.workersOnSite} workers</div>
                                    <div>📷 {visit.photosTaken} photos</div>
                                </div>
                            </div>

                            {visit.attendees.length > 0 && (
                                <div className="mb-3">
                                    <span className="text-sm font-medium">On site: </span>
                                    <span className="text-sm text-muted-foreground">
                                        {visit.attendees.join(", ")}
                                    </span>
                                </div>
                            )}

                            <div className="p-3 bg-muted/30 rounded-lg mb-3">
                                <p className="text-sm">{visit.observations}</p>
                            </div>

                            {visit.concerns.length > 0 && (
                                <div className="mb-3">
                                    <h4 className="text-sm font-medium text-amber-700 mb-1">⚠️ Concerns:</h4>
                                    <ul className="list-disc list-inside text-sm text-amber-600">
                                        {visit.concerns.map((c, i) => (
                                            <li key={i}>{c}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {visit.followUpActions.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-blue-700 mb-1">📋 Follow-up:</h4>
                                    <ul className="list-disc list-inside text-sm text-blue-600">
                                        {visit.followUpActions.map((a, i) => (
                                            <li key={i}>{a}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Tips */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                <p className="font-medium mb-1">💡 Site Visit Best Practices</p>
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
