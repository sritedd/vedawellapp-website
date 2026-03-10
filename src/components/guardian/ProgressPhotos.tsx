"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProgressPhoto {
    id: string;
    project_id: string;
    stage: string;
    area: string;
    description: string;
    photo_url: string;
    tags: string[];
    created_at: string;
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

export default function ProgressPhotos({ projectId }: ProgressPhotosProps) {
    const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [filterStage, setFilterStage] = useState<string>("all");
    const [filterArea, setFilterArea] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"grid" | "timeline">("timeline");
    const [error, setError] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [newPhoto, setNewPhoto] = useState({
        stage: "Frame",
        area: "Exterior - Front",
        description: "",
        tags: "",
    });

    // Fetch photos from database
    useEffect(() => {
        const fetchPhotos = async () => {
            const supabase = createClient();
            const { data, error: fetchError } = await supabase
                .from("progress_photos")
                .select("*")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false });

            if (fetchError) {
                console.error("Error fetching photos:", fetchError);
            } else {
                setPhotos(data || []);
            }
            setLoading(false);
        };
        fetchPhotos();
    }, [projectId]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file (JPG, PNG)");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("Image must be under 10MB");
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setError("Please select a photo to upload");
            return;
        }
        if (!newPhoto.description.trim()) {
            setError("Please add a description");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const supabase = createClient();

            // Upload to Supabase Storage
            const timestamp = Date.now();
            const ext = selectedFile.name.split(".").pop() || "jpg";
            const filePath = `${projectId}/photos/${timestamp}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("evidence")
                .upload(filePath, selectedFile);

            if (uploadError) {
                setError(`Upload failed: ${uploadError.message}`);
                setUploading(false);
                return;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("evidence")
                .getPublicUrl(filePath);

            const photoUrl = urlData.publicUrl;

            // Save to database
            const tags = newPhoto.tags.split(",").map(t => t.trim()).filter(Boolean);
            const { data: insertedPhoto, error: insertError } = await supabase
                .from("progress_photos")
                .insert({
                    project_id: projectId,
                    stage: newPhoto.stage,
                    area: newPhoto.area,
                    description: newPhoto.description.trim(),
                    photo_url: photoUrl,
                    tags,
                })
                .select()
                .single();

            if (insertError) {
                setError(`Save failed: ${insertError.message}`);
                setUploading(false);
                return;
            }

            setPhotos([insertedPhoto, ...photos]);
            setShowForm(false);
            setSelectedFile(null);
            setPreviewUrl("");
            setNewPhoto({ stage: "Frame", area: "Exterior - Front", description: "", tags: "" });
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch {
            setError("Something went wrong. Please try again.");
        }

        setUploading(false);
    };

    const handleDelete = async (photo: ProgressPhoto) => {
        if (!confirm("Delete this photo? This cannot be undone.")) return;

        const supabase = createClient();

        // Delete from storage
        const urlParts = photo.photo_url.split("/evidence/");
        if (urlParts[1]) {
            await supabase.storage.from("evidence").remove([urlParts[1]]);
        }

        await supabase.from("progress_photos").delete().eq("id", photo.id);
        setPhotos(photos.filter(p => p.id !== photo.id));
    };

    const filteredPhotos = photos.filter(p => {
        if (filterStage !== "all" && p.stage !== filterStage) return false;
        if (filterArea !== "all" && p.area !== filterArea) return false;
        return true;
    });

    // Group by date for timeline view
    const photosByDate = filteredPhotos.reduce((acc, photo) => {
        const date = photo.created_at.split("T")[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(photo);
        return acc;
    }, {} as Record<string, ProgressPhoto[]>);

    const sortedDates = Object.keys(photosByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Progress Photos</h2>
                    <p className="text-muted-foreground">
                        Document your build progress with photos ({photos.length} photo{photos.length !== 1 ? "s" : ""})
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

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="p-6 bg-card border border-border rounded-xl space-y-4">
                    <h3 className="font-bold">Add Progress Photo</h3>

                    <div
                        className="p-8 border-2 border-dashed border-border rounded-xl text-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            <div className="space-y-2">
                                <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                                <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                        setPreviewUrl("");
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="text-sm text-red-500 hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="text-4xl block mb-2">📷</span>
                                <p className="text-muted-foreground mb-2">Click to select photo or take a picture</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
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

                    <button
                        type="submit"
                        disabled={uploading || !selectedFile}
                        className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? "Uploading..." : "Add Photo"}
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
                        Timeline
                    </button>
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`px-3 py-1.5 rounded text-sm ${viewMode === "grid" ? "bg-primary text-white" : "bg-muted"}`}
                    >
                        Grid
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
                                        <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                                            <img
                                                src={photo.photo_url}
                                                alt={photo.description}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium truncate">{photo.description}</h4>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                        {photo.stage}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDelete(photo)}
                                                        className="text-xs text-red-400 hover:text-red-600"
                                                        title="Delete photo"
                                                    >
                                                        &#10005;
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{photo.area}</p>
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
                        <div key={photo.id} className="bg-card border border-border rounded-xl overflow-hidden group relative">
                            <div className="aspect-square overflow-hidden">
                                <img
                                    src={photo.photo_url}
                                    alt={photo.description}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                onClick={() => handleDelete(photo)}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete"
                            >
                                &#10005;
                            </button>
                            <div className="p-3">
                                <p className="text-sm font-medium truncate">{photo.description}</p>
                                <p className="text-xs text-muted-foreground">{photo.area}</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(photo.created_at).toLocaleDateString("en-AU")}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tips */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">Photo Tips for Home Builders</p>
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
