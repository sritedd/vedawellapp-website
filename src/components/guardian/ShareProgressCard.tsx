"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ShareProgressCardProps {
    projectId: string;
    projectName: string;
}

interface ProgressData {
    completedStages: number;
    totalStages: number;
    currentStageName: string;
    totalDefects: number;
    resolvedDefects: number;
    checkinCount: number;
}

export default function ShareProgressCard({ projectId, projectName }: ShareProgressCardProps) {
    const [data, setData] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();

            // Fetch stages
            const { data: stages } = await supabase
                .from("stages")
                .select("name, status")
                .eq("project_id", projectId)
                .order("created_at", { ascending: true });

            const totalStages = stages?.length || 0;
            const completedStages = stages?.filter((s: { status: string }) => s.status === "completed").length || 0;
            const activeStage = stages?.find((s: { status: string }) => s.status !== "completed");
            const currentStageName = activeStage?.name || (totalStages > 0 ? "Complete" : "Not started");

            // Fetch defects
            const { data: defects } = await supabase
                .from("defects")
                .select("id, status")
                .eq("project_id", projectId);

            const totalDefects = defects?.length || 0;
            const resolvedDefects = defects?.filter((d: { status: string }) => d.status === "resolved" || d.status === "closed").length || 0;

            // Fetch weekly check-ins
            const { count: checkinCount } = await supabase
                .from("weekly_checkins")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectId);

            setData({
                completedStages,
                totalStages,
                currentStageName,
                totalDefects,
                resolvedDefects,
                checkinCount: checkinCount || 0,
            });
            setLoading(false);
        }

        fetchData();
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) return null;

    const progress = data.totalStages > 0 ? Math.round((data.completedStages / data.totalStages) * 100) : 0;
    const displayName = projectName.length > 30 ? projectName.slice(0, 30) + "..." : projectName;
    const generatedDate = new Date().toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const shareMessage = `My home build is ${progress}% complete! ${data.completedStages}/${data.totalStages} stages done, ${data.resolvedDefects} defects resolved. Tracking everything with HomeOwner Guardian \u{1F3D7}\u{FE0F}`;
    const shareUrl = "https://vedawellapp.com/guardian?ref=SHARE";

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textarea = document.createElement("textarea");
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareMessage + "\n\n" + shareUrl)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "My Build Progress",
                    text: shareMessage,
                    url: shareUrl,
                });
            } catch {
                // User cancelled or share failed — no action needed
            }
        }
    };

    return (
        <div className="max-w-md mx-auto">
            {/* Progress Card */}
            <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-card">
                {/* Teal Header */}
                <div className="bg-teal-600 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span className="text-white font-bold text-lg">VedaWell Guardian</span>
                    </div>
                </div>

                {/* Card Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Project Name */}
                    <h3 className="text-xl font-bold text-foreground">{displayName}</h3>

                    {/* Progress Bar */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                            <span className="text-sm font-bold text-teal-600">{progress}%</span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        {data.currentStageName !== "Complete" && (
                            <p className="text-xs text-muted-foreground mt-1.5">
                                Current stage: <span className="font-medium text-foreground">{data.currentStageName}</span>
                            </p>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted/50 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-foreground">
                                {data.completedStages}/{data.totalStages}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">Stages</div>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-foreground">
                                {data.resolvedDefects}/{data.totalDefects}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">Defects Resolved</div>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-foreground">{data.checkinCount}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">Check-ins</div>
                        </div>
                    </div>

                    {/* Watermark + Date */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-[10px] text-muted-foreground">
                            Tracked with HomeOwner Guardian
                        </span>
                        <span className="text-[10px] text-muted-foreground">{generatedDate}</span>
                    </div>
                </div>
            </div>

            {/* Share Buttons */}
            <div className="mt-6 space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Share your progress</h4>

                <div className="grid grid-cols-2 gap-3">
                    {/* Copy Link */}
                    <button
                        onClick={handleCopyLink}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        {copied ? "Copied!" : "Copy Link"}
                    </button>

                    {/* WhatsApp */}
                    <button
                        onClick={handleWhatsApp}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors text-sm font-medium"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                    </button>

                    {/* X/Twitter */}
                    <button
                        onClick={handleTwitter}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black hover:bg-gray-800 text-white transition-colors text-sm font-medium"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        X / Twitter
                    </button>

                    {/* Native Share */}
                    {typeof navigator !== "undefined" && "share" in navigator && (
                        <button
                            onClick={handleNativeShare}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-primary text-primary hover:bg-primary/5 transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                <polyline points="16 6 12 2 8 6" />
                                <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                            Share
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
