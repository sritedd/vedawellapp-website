"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MobilePhotoCaptureProps {
  projectId: string;
  stage?: string;
  onPhotoSaved?: (url: string) => void;
  onClose: () => void;
}

type Severity = "critical" | "major" | "minor" | "cosmetic";

const LOCATIONS = [
  "Kitchen",
  "Bathroom",
  "Bedroom 1",
  "Bedroom 2",
  "Living",
  "Garage",
  "External",
  "Roof",
  "Other",
] as const;

const DEFAULT_STAGES = [
  "Site Prep",
  "Base/Slab",
  "Frame",
  "Lockup",
  "Fixing",
  "Practical Completion",
  "Handover",
];

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; border: string; bg: string }
> = {
  critical: {
    label: "Critical",
    color: "bg-red-600 text-white",
    border: "border-red-600",
    bg: "bg-red-50",
  },
  major: {
    label: "Major",
    color: "bg-orange-500 text-white",
    border: "border-orange-500",
    bg: "bg-orange-50",
  },
  minor: {
    label: "Minor",
    color: "bg-yellow-500 text-white",
    border: "border-yellow-500",
    bg: "bg-yellow-50",
  },
  cosmetic: {
    label: "Cosmetic",
    color: "bg-blue-500 text-white",
    border: "border-blue-500",
    bg: "bg-blue-50",
  },
};

/* ------------------------------------------------------------------ */
/*  SVG Icons (no emoji)                                               */
/* ------------------------------------------------------------------ */

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function MobilePhotoCapture({
  projectId,
  stage,
  onPhotoSaved,
  onClose,
}: MobilePhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const translateY = useRef(0);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [captureTime, setCaptureTime] = useState<Date | null>(null);

  // Annotation state
  const [location, setLocation] = useState<string>("Kitchen");
  const [otherLocation, setOtherLocation] = useState("");
  const [severity, setSeverity] = useState<Severity>("minor");
  const [notes, setNotes] = useState("");
  const [selectedStage, setSelectedStage] = useState(stage || "Frame");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedUrl, setSavedUrl] = useState("");

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* ---- Swipe-to-dismiss ---- */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start swipe from the top bar area
    const target = e.target as HTMLElement;
    if (target.closest("[data-swipe-handle]")) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      translateY.current = deltaY;
      if (overlayRef.current) {
        overlayRef.current.style.transform = `translateY(${deltaY}px)`;
        overlayRef.current.style.opacity = `${Math.max(0.3, 1 - deltaY / 400)}`;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartY.current === null) return;
    if (translateY.current > 150) {
      onClose();
    } else if (overlayRef.current) {
      overlayRef.current.style.transform = "translateY(0)";
      overlayRef.current.style.opacity = "1";
    }
    touchStartY.current = null;
    translateY.current = 0;
  }, [onClose]);

  /* ---- File handling ---- */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, HEIC)");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Image must be under 15 MB");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCaptureTime(new Date());
    setError("");
    setSaved(false);
    setSavedUrl("");
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  /* ---- Upload to Supabase ---- */
  const uploadPhoto = async (): Promise<string | null> => {
    if (!selectedFile) {
      setError("No photo selected");
      return null;
    }

    setUploading(true);
    setUploadProgress(10);
    setError("");

    try {
      const supabase = createClient();
      const timestamp = Date.now();
      const randomSuffix = generateId();
      const filePath = `${projectId}/${timestamp}-${randomSuffix}.jpg`;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(filePath, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        setUploading(false);
        setUploadProgress(0);
        return null;
      }

      setUploadProgress(60);

      const { data: urlData } = supabase.storage
        .from("evidence")
        .getPublicUrl(filePath);

      const photoUrl = urlData.publicUrl;
      setUploadProgress(80);

      // Save record to progress_photos
      const resolvedLocation = location === "Other" ? otherLocation.trim() || "Other" : location;
      const combinedDescription = [resolvedLocation, notes.trim()].filter(Boolean).join(" - ");

      const { error: insertError } = await supabase
        .from("progress_photos")
        .insert({
          project_id: projectId,
          stage: selectedStage,
          photo_url: photoUrl,
          area: resolvedLocation,
          description: combinedDescription,
        });

      if (insertError) {
        setError(`Save failed: ${insertError.message}`);
        setUploading(false);
        setUploadProgress(0);
        return null;
      }

      setUploadProgress(100);
      setSaved(true);
      setSavedUrl(photoUrl);

      onPhotoSaved?.(photoUrl);

      return photoUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Upload error: ${msg}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  /* ---- Save as defect ---- */
  const handleLogDefect = async () => {
    setUploading(true);
    setError("");

    try {
      // Upload photo first if not already saved
      let photoUrl = savedUrl;
      if (!photoUrl) {
        photoUrl = (await uploadPhoto()) || "";
        if (!photoUrl) return; // error already set
      }

      const supabase = createClient();
      const resolvedLocation = location === "Other" ? otherLocation.trim() || "Other" : location;

      const { error: defectError } = await supabase.from("defects").insert({
        project_id: projectId,
        title: `${severity.charAt(0).toUpperCase() + severity.slice(1)} defect - ${resolvedLocation}`,
        description: notes.trim() || `Defect found at ${resolvedLocation}`,
        location: resolvedLocation,
        stage: selectedStage,
        severity,
        status: "open",
        reported_date: new Date().toISOString().split("T")[0],
        image_url: photoUrl,
        homeowner_notes: notes.trim() || null,
        reminder_count: 0,
      });

      if (defectError) {
        setError(`Defect save failed: ${defectError.message}`);
        return;
      }

      setSaved(true);
      setSavedUrl(photoUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Defect error: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  /* ---- Save photo only ---- */
  const handleSavePhoto = async () => {
    await uploadPhoto();
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        ref={overlayRef}
        className="flex flex-col h-full w-full bg-gray-900 transition-transform duration-200"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ---- Top Bar (swipe handle) ---- */}
        <div
          data-swipe-handle
          className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700 flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <CameraIcon className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-base">Photo Capture</span>
          </div>
          {/* Swipe indicator */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-10 h-1 rounded-full bg-gray-600" />
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-700 active:bg-gray-600 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* ---- Scrollable Content ---- */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Photo area */}
          {!previewUrl ? (
            /* Capture prompt */
            <div className="flex flex-col items-center justify-center px-6 py-12 gap-6">
              <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg">
                <CameraIcon className="w-12 h-12 text-white" />
              </div>
              <p className="text-gray-300 text-center text-base max-w-xs">
                Take a photo of the construction area you want to document.
              </p>
              <button
                onClick={openCamera}
                className="w-full max-w-xs py-4 rounded-xl bg-emerald-600 text-white font-semibold text-lg
                           active:bg-emerald-700 transition-colors shadow-lg"
                style={{ minHeight: "56px" }}
              >
                Open Camera
              </button>
              <button
                onClick={openCamera}
                className="text-emerald-400 underline text-sm"
              >
                or choose from gallery
              </button>
            </div>
          ) : (
            <>
              {/* Photo preview with pinch-to-zoom */}
              <div
                className="relative w-full bg-black"
                style={{ touchAction: "pinch-zoom" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Captured photo"
                  className="w-full max-h-[45vh] object-contain"
                />
                {/* Timestamp overlay */}
                {captureTime && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatTimestamp(captureTime)}
                  </div>
                )}
                {/* Retake button */}
                <button
                  onClick={openCamera}
                  className="absolute top-2 left-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full
                             active:bg-black/80 transition-colors"
                  style={{ minHeight: "36px" }}
                >
                  Retake
                </button>
              </div>

              {/* Annotation form */}
              <div className="px-4 py-4 space-y-4">
                {/* Location */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5">
                    Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-3 text-base
                               focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                    style={{ minHeight: "48px" }}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  {location === "Other" && (
                    <input
                      type="text"
                      value={otherLocation}
                      onChange={(e) => setOtherLocation(e.target.value)}
                      placeholder="Specify location..."
                      className="mt-2 w-full bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-3
                                 text-base placeholder-gray-500 focus:ring-2 focus:ring-emerald-500
                                 focus:border-emerald-500"
                      style={{ minHeight: "48px" }}
                    />
                  )}
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5">
                    Severity
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(SEVERITY_CONFIG) as [Severity, typeof SEVERITY_CONFIG[Severity]][]).map(
                      ([key, config]) => (
                        <button
                          key={key}
                          onClick={() => setSeverity(key)}
                          className={`py-3 px-1 rounded-xl text-sm font-semibold text-center transition-all
                                     border-2 ${
                                       severity === key
                                         ? `${config.color} ${config.border} ring-2 ring-offset-1 ring-offset-gray-900 ring-white/30`
                                         : `bg-gray-800 text-gray-300 border-gray-600 active:border-gray-400`
                                     }`}
                          style={{ minHeight: "48px" }}
                        >
                          {config.label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Stage (only if not passed as prop) */}
                {!stage && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1.5">
                      Stage
                    </label>
                    <select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="w-full bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-3 text-base
                                 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                      style={{ minHeight: "48px" }}
                    >
                      {DEFAULT_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe what you see..."
                    rows={3}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-3 text-base
                               placeholder-gray-500 resize-none focus:ring-2 focus:ring-emerald-500
                               focus:border-emerald-500"
                    style={{ minHeight: "80px" }}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-900/50 border border-red-700 rounded-xl">
                    <AlertIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                {/* Upload progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Uploading...</span>
                      <span className="text-emerald-400 font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success message */}
                {saved && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-900/50 border border-emerald-700 rounded-xl">
                    <CheckIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-emerald-300 text-sm">Photo saved successfully</p>
                  </div>
                )}

                {/* Spacer for bottom action bar */}
                <div className="h-28" />
              </div>
            </>
          )}
        </div>

        {/* ---- Bottom Action Bar ---- */}
        {previewUrl && (
          <div
            className="flex-shrink-0 bg-gray-900 border-t border-gray-700 px-4 py-3 space-y-2"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          >
            <div className="flex gap-3">
              {/* Save Photo */}
              <button
                onClick={handleSavePhoto}
                disabled={uploading || saved}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-base
                           transition-colors ${
                             saved
                               ? "bg-emerald-800 text-emerald-200 cursor-default"
                               : uploading
                               ? "bg-gray-700 text-gray-400 cursor-wait"
                               : "bg-emerald-600 text-white active:bg-emerald-700"
                           }`}
                style={{ minHeight: "52px" }}
              >
                {saved ? (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    Saved
                  </>
                ) : uploading ? (
                  <>
                    <UploadIcon className="w-5 h-5 animate-pulse" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-5 h-5" />
                    Save Photo
                  </>
                )}
              </button>

              {/* Log as Defect */}
              <button
                onClick={handleLogDefect}
                disabled={uploading}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-base
                           transition-colors border-2 ${
                             uploading
                               ? "bg-gray-800 text-gray-500 border-gray-700 cursor-wait"
                               : "bg-gray-800 text-red-400 border-red-500/50 active:bg-red-900/30"
                           }`}
                style={{ minHeight: "52px" }}
              >
                <AlertIcon className="w-5 h-5" />
                Log Defect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating Action Button                                             */
/* ------------------------------------------------------------------ */

export function PhotoFAB({ onClick }: { onClick: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed z-50" style={{ bottom: "max(24px, env(safe-area-inset-bottom, 24px))", right: "16px" }}>
      {/* Speed-dial options — shown when expanded */}
      {expanded && (
        <div className="absolute bottom-16 right-0 flex flex-col items-end gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <button
            onClick={() => { setExpanded(false); onClick(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 text-white shadow-lg text-sm font-medium whitespace-nowrap hover:bg-emerald-500 active:scale-95 transition-all"
          >
            <CameraIcon className="w-5 h-5" />
            Report Defect
          </button>
          <button
            onClick={() => { setExpanded(false); onClick(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 text-white shadow-lg text-sm font-medium whitespace-nowrap hover:bg-blue-500 active:scale-95 transition-all"
          >
            <CameraIcon className="w-5 h-5" />
            Progress Photo
          </button>
        </div>
      )}
      {/* Main FAB */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-14 h-14 rounded-full text-white
                   shadow-lg shadow-emerald-900/40 flex items-center justify-center
                   hover:bg-emerald-500 active:scale-95
                   transition-all duration-150 ${expanded ? "bg-gray-700 rotate-45" : "bg-emerald-600"}`}
        aria-label={expanded ? "Close menu" : "Capture photo or report defect"}
      >
        {expanded ? (
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        ) : (
          <CameraIcon className="w-7 h-7" />
        )}
      </button>
      {/* Backdrop to close */}
      {expanded && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setExpanded(false)} />
      )}
    </div>
  );
}
