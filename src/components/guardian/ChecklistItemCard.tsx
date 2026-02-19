"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChecklistItemCardProps {
    item: {
        id: string;
        description: string;
        is_completed: boolean;
        is_critical?: boolean;
        requires_photo?: boolean;
        evidence_url?: string;
    };
    onUpdate?: () => void;
}

export default function ChecklistItemCard({ item, onUpdate }: ChecklistItemCardProps) {
    const [isCompleted, setIsCompleted] = useState(item.is_completed);
    const [evidenceUrl, setEvidenceUrl] = useState(item.evidence_url || "");
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);

    const handleToggle = async () => {
        // If requires photo and no evidence, don't allow completion
        if (!isCompleted && item.requires_photo && !evidenceUrl) {
            setShowUpload(true);
            return;
        }

        const supabase = createClient();
        const newStatus = !isCompleted;

        const { error } = await supabase
            .from("checklist_items")
            .update({
                is_completed: newStatus,
                completed_at: newStatus ? new Date().toISOString() : null,
            })
            .eq("id", item.id);

        if (!error) {
            setIsCompleted(newStatus);
            onUpdate?.();
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const supabase = createClient();

        // Compress and upload
        const fileName = `checklist/${item.id}/${Date.now()}_${file.name}`;

        const { data, error: uploadError } = await supabase.storage
            .from("evidence")
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            setUploading(false);
            return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("evidence")
            .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Update item with evidence URL
        const { error: updateError } = await supabase
            .from("checklist_items")
            .update({ evidence_url: publicUrl })
            .eq("id", item.id);

        if (!updateError) {
            setEvidenceUrl(publicUrl);
            setShowUpload(false);
        }

        setUploading(false);
    };

    return (
        <div
            className={`p-4 rounded-lg border transition-all ${isCompleted
                    ? "bg-green-50 border-green-200"
                    : item.is_critical
                        ? "bg-red-50 border-red-200"
                        : "bg-card border-border"
                }`}
        >
            <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                    onClick={handleToggle}
                    className={`w-6 h-6 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-primary"
                        }`}
                >
                    {isCompleted && <span className="text-sm">✓</span>}
                </button>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span
                            className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""
                                }`}
                        >
                            {item.description}
                        </span>
                        {item.is_critical && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-bold">
                                CRITICAL
                            </span>
                        )}
                        {item.requires_photo && !evidenceUrl && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                                📷 Photo Required
                            </span>
                        )}
                    </div>

                    {/* Evidence */}
                    {evidenceUrl && (
                        <div className="mt-2 flex items-center gap-2">
                            <a
                                href={evidenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                                📷 View Evidence Photo
                            </a>
                            <span className="text-xs text-green-600">✓ Uploaded</span>
                        </div>
                    )}

                    {/* Upload Section */}
                    {showUpload && !evidenceUrl && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800 mb-2">
                                ⚠️ This item requires photographic evidence before completion.
                            </p>
                            <label className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm rounded cursor-pointer hover:opacity-90">
                                {uploading ? "Uploading..." : "📷 Upload Photo"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    )}

                    {/* Manual upload trigger if no photo yet */}
                    {!evidenceUrl && !showUpload && (
                        <button
                            onClick={() => setShowUpload(true)}
                            className="mt-2 text-xs text-muted-foreground hover:text-primary"
                        >
                            + Add photo evidence
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
