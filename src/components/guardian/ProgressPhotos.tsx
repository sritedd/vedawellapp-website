"use client";

import { useState } from "react";

interface ProgressPhoto {
    id: string;
    date: string;
    stage: string;
    area: string;
    description: string;
    photoUrl: string;
    tags: string[];
}

interface ProgressPhotosProps {
    projectId: string;
}

const AREAS = [
    "Exterior - Front", "Exterior - Rear", "Exterior - Side",
    "Kitchen", "Living Room", "Dining Room", "Master Bedroom", "Bedroom 2", "Bedroom 3",
    "Master Ensuite", "Bathroom 1", "Bathroom 2", "Laundry", "Garage",
    "Roof", "Driveway", "Landscaping", "Electrical", "Plumbing", "Other"
];

const STAGES = ["Site Prep", "Base/Slab", "Frame", "Lockup", "Fixing", "Practical Completion", "Handover"];

const SAMPLE_PHOTOS: ProgressPhoto[] = [
    {
        id: "1",
        date: "2025-06-15",
        stage: "Base/Slab",
        area: "Exterior - Front",
        description: "Slab pour complete - Day 1",
        photoUrl: "",
        tags: ["slab", "concrete", "milestone"],
    },
    {
        id: "2",
        date: "2025-07-20",
        stage: "Frame",
        area: "Exterior - Front",
        description: "Frame complete - Front elevation",
        photoUrl: "",
        tags: ["frame", "timber", "milestone"],
    },
    {
        id: "3",
        date: "2025-07-21",
        stage: "Frame",
        area: "Master Bedroom",
        description: "Master bedroom framing with window openings",
        photoUrl: "",
        tags: ["frame", "interior"],
    },
];

export default function ProgressPhotos({ projectId }: ProgressPhotosProps) {
    const [photos, setPhotos] = useState<ProgressPhoto[]>(SAMPLE_PHOTOS);
    const [showForm, setShowForm] = useState(false);
    const [filterStage, setFilterStage] = useState<string>("all");
    const [filterArea, setFilterArea] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"grid" | "timeline">("timeline");

    const [newPhoto, setNewPhoto] = useState({
        stage: "Frame",
        area: "Exterior - Front",
        description: "",
        tags: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const photo: ProgressPhoto = {
            id: Date.now().toString(),
            date: new Date().toISOString().split("T")[0],
            stage: newPhoto.stage,
            area: newPhoto.area,
            description: newPhoto.description,
            photoUrl: "", // Would be set by file upload
            tags: newPhoto.tags.split(",").map(t => t.trim()).filter(Boolean),
        };
        setPhotos([photo, ...photos]);
        setShowForm(false);
        setNewPhoto({ stage: "Frame", area: "Exterior - Front", description: "", tags: "" });
    };

    const filteredPhotos = photos.filter(p => {
        if (filterStage !== "all" && p.stage !== filterStage) return false;
        if (filterArea !== "all" && p.area !== filterArea) return false;
        return true;
    });

    // Group by date for timeline view
    const photosByDate = filteredPhotos.reduce((acc, photo) => {
        if (!acc[photo.date]) acc[photo.date] = [];
        acc[photo.date].push(photo);
        return acc;
    }, {} as Record<string, ProgressPhoto[]>);

    const sortedDates = Object.keys(photosByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">📸 Progress Photos</h2>
                    <p className="text-muted-foreground">
                        Document your build progress with photos ({photos.length} photos)
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                    {showForm ? "Cancel" : "+ Add Photo"}
                </button>
            </div>

            {/* Stats by Stage */}
            <div className="flex flex-wrap gap-2">
                {STAGES.map(stage => {
                    const count = photos.filter(p => p.stage === stage).length;
                    return (
                        <div key={stage} className="px-3 py-2 bg-muted rounded-lg text-sm">
                            <span className="font-medium">{stage}:</span> {count}
                        </div>
                    );
                })}
            </div>

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="p-6 bg-card border border-border rounded-xl space-y-4">
                    <h3 className="font-bold">Add Progress Photo</h3>

                    <div className="p-8 border-2 border-dashed border-border rounded-xl text-center bg-muted/30">
                        <span className="text-4xl block mb-2">📷</span>
                        <p className="text-muted-foreground mb-2">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="photo-upload"
                        />
                        <label
                            htmlFor="photo-upload"
                            className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90"
                        >
                            Select Photo
                        </label>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Stage</label>
                            <select
                                value={newPhoto.stage}
                                onChange={(e) => setNewPhoto({ ...newPhoto, stage: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                            >
                                {STAGES.map(stage => (
                                    <option key={stage} value={stage}>{stage}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Area</label>
                            <select
                                value={newPhoto.area}
                                onChange={(e) => setNewPhoto({ ...newPhoto, area: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                            >
                                {AREAS.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <input
                                type="text"
                                value={newPhoto.description}
                                onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="What does this photo show?"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={newPhoto.tags}
                                onChange={(e) => setNewPhoto({ ...newPhoto, tags: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="e.g., milestone, defect, inspection"
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
                        Add Photo
                    </button>
                </form>
            )}

            {/* Filters & View Toggle */}
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <select
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value)}
                        className="p-2 border border-border rounded-lg text-sm"
                    >
                        <option value="all">All Stages</option>
                        {STAGES.map(stage => (
                            <option key={stage} value={stage}>{stage}</option>
                        ))}
                    </select>
                    <select
                        value={filterArea}
                        onChange={(e) => setFilterArea(e.target.value)}
                        className="p-2 border border-border rounded-lg text-sm"
                    >
                        <option value="all">All Areas</option>
                        {AREAS.map(area => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode("timeline")}
                        className={`px-3 py-1.5 rounded text-sm ${viewMode === "timeline" ? "bg-primary text-white" : "bg-muted"}`}
                    >
                        📅 Timeline
                    </button>
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`px-3 py-1.5 rounded text-sm ${viewMode === "grid" ? "bg-primary text-white" : "bg-muted"}`}
                    >
                        🔲 Grid
                    </button>
                </div>
            </div>

            {/* Photo Display */}
            {filteredPhotos.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-border rounded-xl">
                    <span className="text-4xl block mb-2">📷</span>
                    <p className="text-muted-foreground">No photos yet. Start documenting your build!</p>
                </div>
            ) : viewMode === "timeline" ? (
                <div className="space-y-6">
                    {sortedDates.map(date => (
                        <div key={date}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-3 h-3 bg-primary rounded-full" />
                                <h3 className="font-medium">
                                    {new Date(date).toLocaleDateString("en-AU", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                    })}
                                </h3>
                            </div>
                            <div className="ml-6 pl-6 border-l-2 border-muted space-y-3">
                                {photosByDate[date].map(photo => (
                                    <div key={photo.id} className="p-4 bg-card border border-border rounded-xl flex gap-4">
                                        <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                                            📷
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium">{photo.description}</h4>
                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                    {photo.stage}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">📍 {photo.area}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {photo.tags.map(tag => (
                                                    <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredPhotos.map(photo => (
                        <div key={photo.id} className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="aspect-square bg-muted flex items-center justify-center text-4xl">
                                📷
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-medium truncate">{photo.description}</p>
                                <p className="text-xs text-muted-foreground">{photo.area}</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(photo.date).toLocaleDateString("en-AU")}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tips */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">📸 Photo Tips for Home Builders</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Take photos at the same angle on different dates to show progress</li>
                    <li>Always document before plaster/cladding covers work (pipes, wires, insulation)</li>
                    <li>Capture all four corners of each room for complete coverage</li>
                    <li>Include date/time stamps when possible</li>
                </ul>
            </div>
        </div>
    );
}
